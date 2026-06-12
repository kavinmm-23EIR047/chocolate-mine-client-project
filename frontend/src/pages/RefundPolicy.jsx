import React from 'react';

const RefundPolicy = () => {
  return (
    <div className="responsive-container py-20 min-h-[60vh] max-w-4xl mx-auto">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-6" style={{ color: 'var(--heading)' }}>Refund & Cancellation Policy</h1>
      <div className="prose prose-sm sm:prose lg:prose-lg text-muted">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">
          This is a placeholder for the Refund Policy. You can update this section later with your official cancellation window, refund processing times, and conditions for returns.
        </p>
        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">1. Cancellations</h2>
        <p className="mb-4">Dummy content for cancellation rules before order preparation begins.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">2. Refunds & Returns</h2>
        <p className="mb-4">Dummy content explaining the timeline and process for receiving a refund for an eligible canceled order.</p>
      </div>
    </div>
  );
};

export default RefundPolicy;
