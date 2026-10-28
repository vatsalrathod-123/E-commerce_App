import crypto from "crypto";
import getLLM from "../config/llm.js";
import productModel from "../models/productModel.js";
import chatModel from "../models/chatModel.js";

const RETENTION_MS = 15 * 24 * 60 * 60 * 1000; // 15 days
const MAX_MESSAGES_PER_CHAT = 200;
const GUEST_ID_REGEX = /^[a-zA-Z0-9-]{8,64}$/;

// Hide emails and long digit runs (phone / card numbers) before saving to the database
const maskSensitive = (text) =>
  text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email hidden]")
    .replace(/\b\d{10,16}\b/g, "[number hidden]")
    .slice(0, 1000);

// Logged-in users are identified by their token, guests by a browser-generated guestId
const getOwnerKey = (req, guestId) => {
  if (req.userId) return `user:${req.userId}`;
  if (typeof guestId === "string" && GUEST_ID_REGEX.test(guestId)) {
    return `guest:${guestId}`;
  }
  return null;
};

// Saves the user message and the bot reply. Returns the conversationId.
const saveExchange = async (ownerKey, conversationId, userText, botReply) => {
  const now = new Date();
  const newMessages = [
    { role: "user", content: maskSensitive(userText), createdAt: now },
    { role: "assistant", content: botReply, createdAt: now },
  ];
  const expiresAt = new Date(now.getTime() + RETENTION_MS);

  if (conversationId) {
    const updated = await chatModel.findOneAndUpdate(
      { conversationId, ownerKey },
      {
        $push: {
          messages: {
            $each: newMessages,
            $slice: -MAX_MESSAGES_PER_CHAT,
          },
        },
        $set: { expiresAt },
      },
    );
    if (updated) return conversationId;
  }

  const newConversationId = crypto.randomUUID();
  await chatModel.create({
    conversationId: newConversationId,
    ownerKey,
    messages: newMessages,
    expiresAt,
  });
  return newConversationId;
};

const chatWithAssistant = async (req, res) => {
  try {
    const { message, history = [], conversationId, guestId } = req.body;

    if (!message || typeof message !== "string") {
      return res.json({ success: false, message: "Message is required" });
    }

    // Pull a limited set of products to give the LLM context
    const products = await productModel
      .find({})
      .select("name price category subCategory sizes bestseller")
      .limit(30)
      .lean();

    const productContext = products
      .map(
        (p) =>
          `${p.name} | ₹${p.price} | ${p.category}/${p.subCategory} | sizes: ${p.sizes?.join(",")}`,
      )
      .join("\n");

    const systemPrompt = `You are a friendly shopping assistant for our online store.
Only recommend products from the list below. If something isn't listed, say we don't have it.
If the shopper hasn't said whether they want men's, women's, or kids' items, ask first.
Never mix categories in one outfit unless asked.

How to handle messages:
- Greetings (hi, hey, hello, hii, good morning): reply warmly and ask what they are looking for.
- Thanks or goodbye: reply politely and briefly.
- Shopping questions (products, sizes, prices, outfits, categories): answer using the product list.
- Gibberish or random letters (like "akcdaic" or "oihf"): reply only "Sorry, I didn't understand that. What are you looking for today?"
- Anything unrelated to shopping: politely say you can only help with our store's products.
Never invent a request the shopper didn't make.

Use plain text only, no markdown or asterisks. Keep answers short.

PRODUCTS:
${productContext}`;

    // Keep only the last 6 messages and sanitize roles
    const safeHistory = history
      .slice(-6)
      .filter(
        (m) =>
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string",
      );

    const completion = await getLLM().chat.completions.create({
      model: process.env.LLM_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...safeHistory,
        { role: "user", content: message },
      ],
      temperature: 0.6,
    });

    const reply = completion.choices[0].message.content;

    // Saving must never break the chat: if it fails, the reply is still sent
    let savedConversationId = null;
    try {
      const ownerKey = getOwnerKey(req, guestId);
      if (ownerKey) {
        const validConversationId =
          typeof conversationId === "string" ? conversationId : null;
        savedConversationId = await saveExchange(
          ownerKey,
          validConversationId,
          message,
          reply,
        );
      }
    } catch (saveError) {
      console.log("CHAT SAVE ERROR:", saveError.message);
    }

    res.json({ success: true, reply, conversationId: savedConversationId });
  } catch (error) {
    console.log("LLM ERROR:", error.status, error.message);
    const rateLimited = error.status === 429;
    res.json({
      success: false,
      message: rateLimited
        ? "Assistant is busy, please try again in a minute."
        : "Assistant is unavailable right now.",
    });
  }
};

// Returns the latest saved conversation for this user or guest
const getChatHistory = async (req, res) => {
  try {
    const ownerKey = getOwnerKey(req, req.query.guestId);
    if (!ownerKey) {
      return res.json({ success: true, conversationId: null, messages: [] });
    }

    const chat = await chatModel
      .findOne({ ownerKey })
      .sort({ updatedAt: -1 })
      .lean();

    if (!chat) {
      return res.json({ success: true, conversationId: null, messages: [] });
    }

    res.json({
      success: true,
      conversationId: chat.conversationId,
      messages: chat.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  } catch (error) {
    console.log("CHAT HISTORY ERROR:", error.message);
    res.json({ success: false, message: "Could not load chat history." });
  }
};

// Logged-in users can delete all of their own saved conversations
const clearChatHistory = async (req, res) => {
  try {
    await chatModel.deleteMany({ ownerKey: `user:${req.body.userId}` });
    res.json({ success: true, message: "Chat history deleted" });
  } catch (error) {
    console.log("CHAT CLEAR ERROR:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export { chatWithAssistant, getChatHistory, clearChatHistory };
