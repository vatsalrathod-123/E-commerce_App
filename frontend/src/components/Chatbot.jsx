import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import { ShopContext } from "../context/ShopContext";
import { VscClose, VscComment } from "react-icons/vsc";

const WELCOME =
  "Hi! I'm your shopping assistant. Ask me about our products, sizes or outfit ideas.";

const easeOutSoft = [0.22, 1, 0.36, 1];

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
      const { data } = await axios.delete(backendUrl + "/api/chat/clear", {
        headers: { token },
      });
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
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ duration: 0.25, ease: easeOutSoft }}
            style={{ transformOrigin: "bottom right" }}
            className="w-[calc(100vw-2rem)] sm:w-80 h-[28rem] max-h-[75vh] bg-white border border-gray-200 shadow-xl flex flex-col mb-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#c586a5] text-white">
              <p className="text-sm font-medium">Shopping Assistant</p>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={startNewChat}
                  className="text-xs underline cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  New chat
                </motion.button>
                <motion.button
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center cursor-pointer"
                  aria-label="Close chat"
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <VscClose size={20} />
                </motion.button>
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
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="self-start max-w-[85%] bg-gray-100 text-gray-700 px-3 py-2 whitespace-pre-wrap"
              >
                {WELCOME}
              </motion.div>

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: easeOutSoft }}
                  className={`max-w-[85%] px-3 py-2 whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "self-end bg-[#c586a5] text-white"
                      : "self-start bg-gray-100 text-gray-700"
                  }`}
                >
                  {m.content}
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="self-start bg-gray-100 text-gray-400 px-3 py-2 flex items-center gap-1"
                >
                  <span>Typing</span>
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="inline-block w-1 h-1 rounded-full bg-gray-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 p-2 border-t border-gray-200">
              <input
                className="flex-1 border border-gray-300 px-2 py-2 text-sm outline-none transition-colors duration-300 focus:border-[#c586a5]"
                value={input}
                maxLength={500}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask about products..."
              />
              <motion.button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-[#c586a5] text-white px-4 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Send
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="bg-[#c586a5] text-white w-12 h-12 rounded-full shadow-lg cursor-pointer flex items-center justify-center"
        aria-label="Toggle chat"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            {open ? <VscClose size={22} /> : <VscComment size={22} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default Chatbot;
