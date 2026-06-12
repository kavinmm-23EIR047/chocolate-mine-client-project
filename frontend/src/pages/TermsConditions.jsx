import React from 'react';

const TermsConditions = () => {
  return (
    <div className="responsive-container py-20 min-h-[60vh] max-w-4xl mx-auto">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-6" style={{ color: 'var(--heading)' }}>Terms & Conditions</h1>
      <div className="prose prose-sm sm:prose lg:prose-lg text-muted">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">
          This is a placeholder for the Terms & Conditions. You can update this section later with your official terms of service, user agreements, and legal disclaimers.
        </p>
        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">1. General Conditions</h2>
        <p className="mb-4">Dummy content for general terms and conditions of using the website and ordering products.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">2. Ordering & Delivery</h2>
        <p className="mb-4">Dummy content explaining the terms regarding cake delivery, modifications, and fulfillment.</p>
      </div>
    </div>
  );
};

export default TermsConditions;
