import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="responsive-container py-20 min-h-[60vh] max-w-4xl mx-auto">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-6" style={{ color: 'var(--heading)' }}>Privacy Policy</h1>
      <div className="prose prose-sm sm:prose lg:prose-lg text-muted">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <p className="mb-4">
          This is a placeholder for the Privacy Policy. You can update this section later with your official privacy policy details regarding how you collect, use, and handle customer data.
        </p>
        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">1. Information Collection</h2>
        <p className="mb-4">Dummy content for information collection policies.</p>
        
        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">2. Data Usage</h2>
        <p className="mb-4">Dummy content explaining how user data is utilized to provide a better shopping experience.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
