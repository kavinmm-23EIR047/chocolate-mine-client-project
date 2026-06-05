import React from 'react';
import { FaWhatsapp as Whatsapp } from 'react-icons/fa';

const WhatsAppButton = () => {
  const whatsappNumber = "919363265477";
  const message = "Hi Chocolate Mine, I would like to know more about your cakes.";
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      aria-label="Chat with us on WhatsApp"
    >
      <Whatsapp size={32} className="group-hover:animate-bounce" />
      <span className="absolute inset-0 rounded-full border-2 border-[#25D366] opacity-0 group-hover:animate-ping" />
    </a>
  );
};

export default WhatsAppButton;
