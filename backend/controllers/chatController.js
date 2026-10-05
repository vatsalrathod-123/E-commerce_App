import getLLM from "../config/llm.js";
import productModel from "../models/productModel.js";

const chatWithAssistant = async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    // console.log(
    //   "BASE:",
    //   process.env.LLM_BASE_URL,
    //   "| MODEL:",
    //   process.env.LLM_MODEL,
    // );

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

    res.json({ success: true, reply: completion.choices[0].message.content });
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

export { chatWithAssistant };
