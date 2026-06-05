import React, { useState, useRef, useEffect } from 'react';
import { FaWhatsapp as Whatsapp, FaTimes, FaPaperPlane } from 'react-icons/fa';

const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const whatsappNumber = "919363265477";

  // Predefined quick replies
  const quickReplies = [
    { text: "🍰 Custom cake order", msg: "I'd like to order a custom cake. Can you help?" },
    { text: "📦 Track my order", msg: "Can you help me track my order?" },
    { text: "🚚 Delivery info", msg: "What are your delivery charges and timings?" },
    { text: "🎂 Today's special", msg: "What's your best-selling cake today?" },
    { text: "💝 Gift recommendation", msg: "I need a gift suggestion for anniversary" },
  ];

  // Auto-open chat on first visit (only once per session)
  useEffect(() => {
    // Check sessionStorage to avoid re-opening on every page navigation
    const hasOpened = sessionStorage.getItem('whatsappChatOpened');
    if (!hasOpened) {
      // Small delay to let page load smoothly
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('whatsappChatOpened', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setShowQuickReplies(true);
    }
  }, [isOpen]);

  const sendToWhatsApp = (text) => {
    if (!text.trim()) return;
    const fullMessage = text.trim();
    const encodedMessage = encodeURIComponent(fullMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    setMessage('');
  };

  const handleSend = () => {
    if (message.trim()) {
      sendToWhatsApp(message);
    }
  };

  const handleQuickReply = (replyMsg) => {
    setMessage(replyMsg);
    setShowQuickReplies(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-[110] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[90vw] sm:w-[380px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#25D366] px-4 py-3 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Whatsapp size={20} />
              <span className="font-semibold text-sm">Chat with us</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-full transition"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Body - Quick Replies + Input */}
          <div className="flex-1 p-4 space-y-4">
            {/* Welcome Message */}
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 max-w-[85%]">
                <p className="text-sm text-gray-800 dark:text-gray-200">
                  👋 Hey there! Type your message below and we'll redirect you to WhatsApp.
                  Our team will reply ASAP.
                </p>
              </div>
            </div>

            {/* Quick Replies (only if no custom message typed) */}
            {showQuickReplies && !message && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Quick replies:</p>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickReply(reply.msg)}
                      className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full transition border border-gray-200 dark:border-gray-700"
                    >
                      {reply.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows="2"
                  className="flex-1 resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] dark:bg-gray-800 dark:text-white text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="bg-[#25D366] text-white p-2.5 rounded-xl hover:bg-[#20b859] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane size={18} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                You'll be redirected to WhatsApp to continue the conversation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
          aria-label="Chat with us on WhatsApp"
        >
          <Whatsapp size={28} className="group-hover:animate-bounce" />
          <span className="absolute inset-0 rounded-full border-2 border-[#25D366] opacity-0 group-hover:animate-ping" />
        </button>
      )}
    </div>
  );
};

export default WhatsAppButton;