import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import { VscClose, VscComment } from "react-icons/vsc";
import { TbMessageChatbotFilled } from "react-icons/tb";

const WELCOME =
  "Hi! I'm your shopping assistant. Ask me about our products, sizes or outfit ideas.";

// A random ID stored in the browser so guests get their own saved chats
const getGuestId = () => {
  let guestId = localStorage.getItem("chatGuestId");
  if (!guestId) {
    guestId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("chatGuestId", guestId);
  }
  return guestId;
};

const Chatbot = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const historyLoaded = useRef(false);

  const authHeaders = token ? { token } : {};

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  // When the user logs in or out, the saved chat belongs to someone else, so reload it
  useEffect(() => {
    historyLoaded.current = false;
    setMessages([]);
    setConversationId(null);
  }, [token]);

  // Restore the saved conversation the first time the chat is opened
  useEffect(() => {
    if (!open || historyLoaded.current) return;
    historyLoaded.current = true;

    const loadHistory = async () => {
      try {
        const { data } = await axios.get(backendUrl + "/api/chat/history", {
          params: { guestId: getGuestId() },
          headers: authHeaders,
        });
        if (data.success && data.messages.length > 0) {
          setMessages(data.messages);
          setConversationId(data.conversationId);
        }
      } catch (error) {
        console.log(error);
      }
    };
    loadHistory();
  }, [open, token]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Send only the last few messages (the backend also trims to 6)
    const history = messages.slice(-6);

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(
        backendUrl + "/api/chat",
        {
          message: text,
          history,
          conversationId,
          guestId: getGuestId(),
        },
        { headers: authHeaders },
      );
      const reply = data.success ? data.reply : data.message;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (data.success && data.conversationId) {
        setConversationId(data.conversationId);
      }
    } catch (error) {
      // Covers network errors and the 429 from express-rate-limit
      const msg =
        error.response?.data?.message || "Network error. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  // Starts a fresh conversation. The old one stays saved until it expires.
  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setInput("");
  };

  // Logged-in users can delete all of their saved chats
  const deleteHistory = async () => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/chat/clear",
        {},
        { headers: { token } },
      );
      if (data.success) {
        startNewChat();
        toast.success("Chat history deleted");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="w-[calc(100vw-2rem)] sm:w-80 h-[28rem] max-h-[75vh] bg-white border border-gray-200 shadow-xl flex flex-col mb-3">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#c586a5] text-white">
            <p className="text-sm font-medium">Shopping Assistant</p>
            <div className="flex items-center gap-3">
              <button
                onClick={startNewChat}
                className="text-xs underline cursor-pointer"
              >
                New chat
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center cursor-pointer"
                aria-label="Close chat"
              >
                <VscClose size={20} />
              </button>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="px-4 py-1.5 text-[11px] text-gray-500 border-b border-gray-200 flex items-center justify-between">
            <span>Conversations are saved for 15 days.</span>
            {token && (
              <button
                onClick={deleteHistory}
                className="underline cursor-pointer"
              >
                Delete history
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 text-sm">
            <div className="self-start max-w-[85%] bg-gray-100 text-gray-700 px-3 py-2 whitespace-pre-wrap">
              {WELCOME}
            </div>

            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 whitespace-pre-wrap break-words ${
                  m.role === "user"
                    ? "self-end bg-[#c586a5] text-white"
                    : "self-start bg-gray-100 text-gray-700"
                }`}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="self-start bg-gray-100 text-gray-400 px-3 py-2">
                Typing...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-2 border-t border-gray-200">
            <input
              className="flex-1 border border-gray-300 px-2 py-2 text-sm outline-none"
              value={input}
              maxLength={500}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about products..."
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-[#c586a5] text-white px-4 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-[#c586a5] text-white w-12 h-12 rounded-full shadow-lg cursor-pointer flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Toggle chat"
      >
        {open ? <VscClose size={22} /> : <TbMessageChatbotFilled size={22} />}
      </button>
    </div>
  );
};

export default Chatbot;
