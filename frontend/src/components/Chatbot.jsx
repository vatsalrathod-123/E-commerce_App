import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";

const WELCOME =
  "Hi! I'm your shopping assistant. Ask me about our products, sizes or outfit ideas.";

const Chatbot = () => {
  const { backendUrl } = useContext(ShopContext);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Send only the last few messages (the backend also trims to 6)
    const history = messages.slice(-6);

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(backendUrl + "/api/chat", {
        message: text,
        history,
      });
      const reply = data.success ? data.reply : data.message;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      // Covers network errors and the 429 from express-rate-limit
      const msg =
        error.response?.data?.message || "Network error. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-50 flex flex-col items-end">
      {open && (
        <div className="w-[calc(100vw-2rem)] sm:w-80 h-[28rem] max-h-[75vh] bg-white border border-gray-200 shadow-xl flex flex-col mb-3">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#c586a5] text-white">
            <p className="text-sm font-medium">Shopping Assistant</p>
            <button
              onClick={() => setOpen(false)}
              className="text-lg leading-none cursor-pointer"
              aria-label="Close chat"
            >
              ✕
            </button>
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
                    ? "self-end bg-black text-white"
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
        className="bg-[#c586a5] text-[#262626] w-12 h-12 rounded-full text-xl shadow-lg cursor-pointer"
        aria-label="Toggle chat"
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
};

export default Chatbot;
