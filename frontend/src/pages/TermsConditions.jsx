import React from 'react';
import { Link } from 'react-router-dom';

const TermsConditions = () => {
  return (
    <div className="responsive-container py-20 min-h-[60vh] max-w-4xl mx-auto">
      <h1 className="text-4xl font-black uppercase tracking-widest mb-8" style={{ color: 'var(--heading)' }}>Terms & Conditions</h1>
      
      <div className="prose prose-sm sm:prose lg:prose-lg text-muted space-y-6">
        <p className="font-semibold">Last updated: {new Date().toLocaleDateString()}</p>
        
        <p>
          Welcome to <strong>The Chocolate Mine</strong>! These terms and conditions outline the rules and regulations for the use of our website and services.
        </p>
        <p>
          By accessing this website, we assume you accept these terms and conditions. Do not continue to use The Chocolate Mine if you do not agree to take all of the terms and conditions stated on this page.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">1. Accounts and Registration</h2>
        <p>
          When you create an account with us, including through third-party authentication services like Google, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
        </p>
        <p>
          You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password, whether your password is with our service or a third-party service.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">2. Products and Orders</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Product Descriptions:</strong> We strive to ensure that all details, descriptions, and prices of products appearing on the website are accurate. However, errors may occur.</li>
          <li><strong>Custom Orders:</strong> For custom cakes and specific chocolate arrangements, we require accurate specifications. Modifications may not be possible once an order has entered production.</li>
          <li><strong>Availability:</strong> All orders are subject to availability and confirmation of the order price.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">3. Intellectual Property Rights</h2>
        <p>
          Unless otherwise stated, The Chocolate Mine and/or its licensors own the intellectual property rights for all material on the platform. All intellectual property rights are reserved. You may access this from The Chocolate Mine for your own personal use subjected to restrictions set in these terms and conditions.
        </p>
        <p>You must not:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Republish material from The Chocolate Mine.</li>
          <li>Sell, rent, or sub-license material from The Chocolate Mine.</li>
          <li>Reproduce, duplicate or copy material from The Chocolate Mine.</li>
          <li>Redistribute content from The Chocolate Mine.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">4. User Content and Reviews</h2>
        <p>
          Parts of this website offer an opportunity for users to post and exchange opinions and information (e.g., product reviews). The Chocolate Mine does not filter, edit, publish or review comments prior to their presence on the website. Comments do not reflect the views and opinions of The Chocolate Mine, its agents, and/or affiliates.
        </p>
        <p>
          We reserve the right to monitor all comments and to remove any comments which can be considered inappropriate, offensive, or causes a breach of these Terms and Conditions.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">5. Limitation of Liability</h2>
        <p>
          In no event shall The Chocolate Mine, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this website whether such liability is under contract. The Chocolate Mine, including its officers, directors, and employees shall not be held liable for any indirect, consequential, or special liability arising out of or in any way related to your use of this website.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">6. Governing Law</h2>
        <p>
          These Terms will be governed by and interpreted in accordance with the laws of our jurisdiction, and you submit to the non-exclusive jurisdiction of the state and federal courts located in for the resolution of any disputes.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">7. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please <Link to="/contact" className="text-primary hover:underline font-medium">contact us</Link>.
        </p>
      </div>
    </div>
  );
};

export default TermsConditions;
