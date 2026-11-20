import React from 'react';
import { Mail, Phone, MapPin, MessageSquare } from 'lucide-react';
import useSEO from '../hooks/useSEO';

const Contact = () => {
  useSEO({
    title: 'Contact The Chocolate Mine | Best Cake Shop in Coimbatore',
    description: 'Contact The Chocolate Mine in Coimbatore for custom cake orders, bulk corporate gifting, birthday orders & party enquiries. Located in Race Course, Coimbatore.',
    keywords: 'contact cake shop coimbatore, order custom cakes coimbatore, the chocolate mine phone number, bakery race course coimbatore',
    canonical: 'https://thechocolatemine.in/contact'
  });

  return (
    <div className="responsive-container py-16 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="max-w-xl mx-auto mb-10">
        <h1 className="text-3xl font-black uppercase tracking-widest mb-3" style={{ color: 'var(--heading)' }}>
          Contact Us
        </h1>
        <p className="text-muted text-sm sm:text-base leading-relaxed">
          Have a question about custom cakes, delivery, or looking to plan a special celebration in Coimbatore? Reach out to us directly!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
        <div className="p-6 rounded-2xl flex flex-col items-center gap-3 border transition-all hover:border-primary" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <Phone size={24} />
          </div>
          <h3 className="font-bold text-heading">Phone / WhatsApp</h3>
          <a href="tel:+919150670077" className="text-sm font-semibold text-primary hover:underline">
            +91 91506 70077
          </a>
          <span className="text-[11px] text-muted">Sun: 10 AM – 10 PM | Mon–Sat: 10 AM – 10:30 PM</span>
        </div>

        <div className="p-6 rounded-2xl flex flex-col items-center gap-3 border transition-all hover:border-primary" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <Mail size={24} />
          </div>
          <h3 className="font-bold text-heading">Email</h3>
          <a href="mailto:chocolatemine.care@gmail.com" className="text-sm font-semibold text-primary hover:underline break-all">
            chocolatemine.care@gmail.com
          </a>
          <span className="text-[11px] text-muted">24/7 online support</span>
        </div>

        <div className="p-6 rounded-2xl flex flex-col items-center gap-3 border transition-all hover:border-primary" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <MapPin size={24} />
          </div>
          <h3 className="font-bold text-heading">Store Location</h3>
          <p className="text-xs text-center text-muted leading-relaxed">
            No.7, 3, Race Course Rd, Gopalapuram,<br />
            Coimbatore, Tamil Nadu 641018
          </p>
          <a
            href="https://maps.app.goo.gl/1aPW7FVjAmLBnwxc7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-primary hover:underline mt-1"
          >
            Get Directions →
          </a>
        </div>
      </div>

      <a
        href="https://wa.me/919150670077?text=Hi%20The%20Chocolate%20Mine,%20I%20would%20like%20to%20order%20a%20cake."
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-md transition-all"
      >
        <MessageSquare size={16} />
        Chat with us on WhatsApp
      </a>
    </div>
  );
};

export default Contact;
