import React, { useState, useRef, useEffect } from 'react';
import { FaWhatsapp as Whatsapp, FaTimes, FaPaperPlane } from 'react-icons/fa';

const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const inputRef = useRef(null);

  const whatsappNumber = "919363265477";

  const quickReplies = [
    { text: "🍰 Custom cake order", msg: "I'd like to order a custom cake. Can you help?" },
    { text: "📦 Track my order", msg: "Can you help me track my order?" },
    { text: "🚚 Delivery info", msg: "What are your delivery charges and timings?" },
    { text: "🎂 Today's special", msg: "What's your best-selling cake today?" },
    { text: "💝 Gift recommendation", msg: "I need a gift suggestion for anniversary" },
  ];

  // Injected CSS for the rotating border animation
  useEffect(() => {
    const styleId = 'whatsapp-btn-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes spin-border {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-border {
          animation: spin-border 3s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const sendToWhatsApp = (text) => {
    if (!text.trim()) return;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text.trim())}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    setMessage('');
  };

  return (
    /* Increased bottom margin (bottom-28) to clear the mobile nav bar */
    <div className="fixed bottom-28 md:bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[90vw] sm:w-[380px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-[#25D366] px-4 py-3 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Whatsapp size={20} />
              <span className="font-semibold text-sm">Chat with us</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">
              <FaTimes size={16} />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 max-w-[85%]">
              <p className="text-sm text-gray-800 dark:text-gray-200">👋 Hey! How can we help you today?</p>
            </div>

            {showQuickReplies && !message && (
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setMessage(reply.msg); setShowQuickReplies(false); }}
                    className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full transition border border-gray-200 dark:border-gray-700"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows="2"
                  className="flex-1 resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] dark:bg-gray-800 dark:text-white text-sm"
                />
                <button
                  onClick={() => sendToWhatsApp(message)}
                  disabled={!message.trim()}
                  className="bg-[#25D366] text-white p-2.5 rounded-xl hover:bg-[#20b859] transition disabled:opacity-50"
                >
                  <FaPaperPlane size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button with Rotating Gradient Border */}
      {!isOpen && (
        <div className="relative p-[3px] rounded-full overflow-hidden cursor-pointer">
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#25D366_0deg,#ffffff_180deg,#25D366_360deg)] animate-spin-border"></div>
          <button
            onClick={() => setIsOpen(true)}
            className="relative bg-[#25D366] text-white p-4 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all duration-300"
            aria-label="Chat with us"
          >
            <Whatsapp size={28} />
          </button>
        </div>
      )}
    </div>
  );
};

export default WhatsAppButton;