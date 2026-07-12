import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="responsive-container py-20 min-h-[60vh] max-w-4xl mx-auto">
      <h1 className="text-4xl font-black uppercase tracking-widest mb-8" style={{ color: 'var(--heading)' }}>Privacy Policy</h1>
      
      <div className="prose prose-sm sm:prose lg:prose-lg text-muted space-y-6">
        <p className="font-semibold">Last updated: {new Date().toLocaleDateString()}</p>
        
        <p>
          At <strong>The Chocolate Mine</strong>, accessible from our website, one of our main priorities is the privacy of our visitors and customers. This Privacy Policy document contains types of information that is collected and recorded by The Chocolate Mine and how we use it.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">1. Information We Collect</h2>
        <p>
          We collect information to provide better services to all our users. The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Account Information:</strong> When you register for an Account (including via third-party services like Google OAuth), we may ask for your contact information, including items such as name, email address, profile picture, and telephone number.</li>
          <li><strong>Order Details:</strong> When you make a purchase, we collect billing and shipping addresses, and payment details to fulfill your order.</li>
          <li><strong>Communication Data:</strong> If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">2. How We Use Your Information</h2>
        <p>We use the information we collect in various ways, including to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide, operate, and maintain our website.</li>
          <li>Improve, personalize, and expand our website and product offerings.</li>
          <li>Process transactions and fulfill your orders (e.g., custom cakes, chocolates).</li>
          <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website.</li>
          <li>Send you emails regarding your orders or account status.</li>
          <li>Find and prevent fraud and ensure platform security.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">3. Third-Party Authentication (Google)</h2>
        <p>
          Our application allows you to create an account and log in using third-party services, specifically Google. If you choose to link your Google account with our service, we will collect your name, email address, and profile picture provided by Google. This data is strictly used for authentication, profile creation, and communication purposes within The Chocolate Mine platform. We do not sell or share this data with unauthorized third parties.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">4. Cookies and Web Beacons</h2>
        <p>
          Like any other website, The Chocolate Mine uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">5. Third-Party Privacy Policies</h2>
        <p>
          The Chocolate Mine's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
        </p>

        <h2 className="text-2xl font-bold mt-10 mb-4 text-foreground border-b border-border pb-2">6. Contact Us</h2>
        <p>
          If you have additional questions or require more information about our Privacy Policy, do not hesitate to <Link to="/contact" className="text-primary hover:underline font-medium">contact us</Link>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
