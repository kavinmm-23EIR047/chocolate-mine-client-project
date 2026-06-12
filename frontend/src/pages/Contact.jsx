import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  return (
    <div className="responsive-container py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-6" style={{ color: 'var(--heading)' }}>Contact Us</h1>
      <p className="text-muted max-w-lg mb-10">We'd love to hear from you! Reach out to us for any custom cake orders, queries, or feedback.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="p-6 rounded-2xl flex flex-col items-center gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <Phone size={24} />
          </div>
          <h3 className="font-bold">Phone</h3>
          <p className="text-sm text-muted">+91 98765 43210</p>
        </div>
        
        <div className="p-6 rounded-2xl flex flex-col items-center gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <Mail size={24} />
          </div>
          <h3 className="font-bold">Email</h3>
          <p className="text-sm text-muted">hello@thechocolatemine.com</p>
        </div>
        
        <div className="p-6 rounded-2xl flex flex-col items-center gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <MapPin size={24} />
          </div>
          <h3 className="font-bold">Head Office</h3>
          <p className="text-sm text-center text-muted">123 Bakery Street, Coimbatore, Tamil Nadu</p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
