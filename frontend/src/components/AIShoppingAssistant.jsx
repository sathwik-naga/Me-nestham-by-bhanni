import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { aiService } from "../services/ai";
import { MessageSquare, X, Send, Bot, ExternalLink, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIShoppingAssistant() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste! I'm Bhanni AI 🛍️ your personal shopping assistant. I can help you find products, check gifting suggestions, track orders, or answer support queries. How can I help you today?",
      recommendedProducts: []
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // WhatsApp helper
  const getWhatsAppLink = (text) => {
    const phone = "919999999999"; // Placeholder contact
    const encodedText = encodeURIComponent(text || "Hello Bhanni Support, I need help with my shopping journey.");
    return `https://wa.me/${phone}?text=${encodedText}`;
  };

  const handleSend = async (textToSend) => {
    const userText = textToSend || input;
    if (!userText.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    // Context from current route
    const pageContext = {};
    if (location.pathname.startsWith("/products/")) {
      pageContext.slug = location.pathname.split("/").pop();
    } else if (location.pathname.startsWith("/categories/")) {
      pageContext.slug = location.pathname.split("/").pop();
    }

    try {
      const response = await aiService.chat(newMessages, pageContext);
      
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.text,
        recommendedProducts: response.recommendedProducts || []
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm experiencing a minor connection delay, but I'm still here to help! Please let me know how I can guide you, or connect directly on WhatsApp.",
        recommendedProducts: []
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Convert markdown links [Name](/url) to JSX links
  const renderMessageContent = (content) => {
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const matchIndex = match.index;
      // Add plain text before match
      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }

      const linkText = match[1];
      const linkUrl = match[2];

      parts.push(
        <Link 
          key={matchIndex} 
          to={linkUrl} 
          onClick={() => { if (linkUrl.startsWith("/")) setIsOpen(false); }}
          className="text-brand-accent underline font-semibold hover:text-brand-primary"
        >
          {linkText}
        </Link>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const quickReplies = [
    "🎁 Find me items under ₹500",
    "📦 How do I track my order?",
    "🌸 Show me foam flowers & beads",
    "🔥 What are the active coupons?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-accent hidden sm:block">
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-brand-primary hover:bg-brand-accent text-white rounded-full flex items-center justify-center shadow-2xl z-50 cursor-pointer relative"
        aria-label="Ask Bhanni AI Assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
              <MessageSquare size={24} />
              <span className="absolute -top-1 -right-1 bg-brand-accent w-3 h-3 rounded-full border-2 border-brand-primary animate-ping" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-brand-modal border border-brand-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-primary p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-full">
                  <Bot size={20} />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm">Bhanni AI</h4>
                  <p className="text-[10px] text-white/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online Shopping Companion
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full text-white/85 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-brand-bg/50">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-brand-primary text-white rounded-tr-none shadow-sm" 
                      : "bg-brand-card border border-brand-border text-brand-text rounded-tl-none shadow-sm"
                  }`}>
                    {msg.role === "assistant" ? renderMessageContent(msg.content) : msg.content}
                  </div>

                  {/* Render Product Cards if recommended by assistant */}
                  {msg.role === "assistant" && msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-2.5 flex flex-col gap-2 w-full max-w-[85%]">
                      {msg.recommendedProducts.map((p) => (
                        <Link 
                          key={p.id} 
                          to={`/products/${p.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 p-2 bg-brand-card border border-brand-card-border rounded-xl hover:border-brand-primary shadow-sm hover:shadow-md transition-all group"
                        >
                          <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-md" />
                          <div className="flex-1 text-[11px] overflow-hidden">
                            <p className="font-bold text-brand-text group-hover:text-brand-primary truncate">{p.name}</p>
                            <p className="font-mono text-brand-primary font-bold">₹{p.price}</p>
                          </div>
                          <ExternalLink size={12} className="text-brand-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-brand-text-muted text-xs pl-1">
                  <Bot size={14} className="animate-bounce" />
                  <span>Bhanni AI is finding products...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Chips */}
            {messages.length === 1 && (
              <div className="px-4 py-2 border-t border-brand-border bg-brand-card flex flex-wrap gap-2">
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(reply.substring(2))} // strip emojis
                    className="text-[10px] font-semibold bg-brand-secondary text-brand-text hover:text-white hover:bg-brand-primary border border-brand-border rounded-full px-3 py-1.5 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form and Escalation */}
            <div className="p-3 border-t border-brand-border bg-brand-card flex flex-col gap-2">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask about materials, orders, coupons..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-brand-secondary text-brand-text px-4 py-2.5 rounded-xl border border-brand-border focus:border-brand-primary outline-none text-xs"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2.5 bg-brand-primary hover:bg-brand-accent text-white rounded-xl disabled:opacity-50 disabled:hover:bg-brand-primary transition-colors cursor-pointer"
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </form>

              {/* WhatsApp Support Link */}
              <div className="flex items-center justify-between text-[10px] text-brand-text-muted mt-1 px-1 border-t border-brand-border/60 pt-2">
                <span className="flex items-center gap-1">
                  <HelpCircle size={12} /> Need human assistance?
                </span>
                <a 
                  href={getWhatsAppLink(`Hi! I was chatting with Bhanni AI but need help resolving an issue.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-success font-bold hover:underline flex items-center gap-0.5"
                >
                  💬 Chat on WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
