import React from 'react';
import { HelpCircle, FileText, ShieldQuestion } from 'lucide-react';

const Help = () => {
  return (
    <div className="responsive-container py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-6" style={{ color: 'var(--heading)' }}>Help & FAQ</h1>
      <p className="text-muted max-w-lg mb-10">Find answers to common questions about our products, delivery, and policies.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <div className="p-6 rounded-2xl flex flex-col items-center gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <HelpCircle size={24} />
          </div>
          <h3 className="font-bold">FAQs</h3>
          <p className="text-sm text-muted">Answers to your most frequent queries.</p>
        </div>
        
        <div className="p-6 rounded-2xl flex flex-col items-center gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <FileText size={24} />
          </div>
          <h3 className="font-bold">Shipping Policy</h3>
          <p className="text-sm text-muted">Details on delivery zones and timelines.</p>
        </div>
        
        <div className="p-6 rounded-2xl flex flex-col items-center gap-3 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary">
            <ShieldQuestion size={24} />
          </div>
          <h3 className="font-bold">Refunds</h3>
          <p className="text-sm text-center text-muted">Our cancellation and refund policies.</p>
        </div>
      </div>
    </div>
  );
};

export default Help;
