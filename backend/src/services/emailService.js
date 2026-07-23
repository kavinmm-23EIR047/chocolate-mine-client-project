const nodemailer = require('nodemailer');
const dns = require('dns');
const axios = require('axios');
const logger = require('../utils/logger');

// Force Node.js to resolve IPv4 addresses first for all DNS lookups (fixes Gmail SMTP IPv6 ENETUNREACH in cloud/production)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  family: 4,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

transporter.verify((error, success) => {
  if (error) {
    if (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) {
      logger.info('HTTP Email Provider API Key detected (bypassing SMTP)');
    } else {
      logger.warn('SMTP Connection Error (Render free tier blocks SMTP port 587/465. Use BREVO_API_KEY for free HTTP API):', error.message);
    }
  } else {
    logger.info('SMTP Server is ready');
  }
});

// Helper for conflict-free dynamic styling (Receipt-Style Voucher Design - Single Brand Theme for Light & Dark)
const getThemeStyles = () => `
  <style>
    :root { color-scheme: light only; supported-color-schemes: light only; }
    body { background-color: #F5F2EF !important; color: #2C1A16 !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important; -webkit-font-smoothing: antialiased; margin: 0; padding: 24px 12px; }
    .receipt-container { background-color: #FFFFFF !important; color: #2C1A16 !important; border: 1px solid #D8CFC8 !important; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px !important; box-shadow: 0 4px 16px rgba(60,27,19,0.05); }
    .receipt-header { border-bottom: 2px solid #3C1B13; padding-bottom: 12px; margin-bottom: 24px; font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase; letter-spacing: 0.5px; }
    .title-text { color: #3C1B13 !important; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin: 12px 0 20px 0; }
    .action-button { background-color: #3C1B13 !important; color: #FFFFFF !important; display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 0px !important; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; text-align: center; border: none; }
    .error-alert { background-color: #FFF5F5 !important; border: 1px solid #E53E3E !important; color: #C53030 !important; padding: 16px; border-radius: 0px !important; margin: 24px 0; font-size: 13px; font-weight: 600; }
    .otp-display { color: #3C1B13 !important; background-color: #F8F5F2 !important; border: 2px solid #3C1B13 !important; letter-spacing: 8px; font-size: 32px; font-weight: 900; padding: 14px 28px; border-radius: 0px !important; display: inline-block; text-align: center; }
  </style>
`;

// Generates a responsive block logo for receipt top
const getLogoMarkup = () => {
  const { getFrontendUrl } = require('../utils/urlUtils');
  const frontendUrl = getFrontendUrl();
  return `
    <div style="text-align: center; margin-bottom: 20px; user-select: none;">
      <a href="${frontendUrl}" style="text-decoration: none; display: inline-block;">
        <div style="font-family: 'Arial Black', 'Impact', sans-serif; text-transform: uppercase; width: 200px; margin: 0 auto; overflow: visible;">
          <div style="color: #3C1B13; font-size: 11px; font-weight: 900; letter-spacing: 4.8px; text-align: justify; text-justify: inter-character; display: block; width: 100%; line-height: 1.2; text-align-last: justify; padding-left: 2px; font-family: sans-serif;">THE CHOCOLATE</div>
          <div style="color: #3C1B13; font-size: 76px; font-weight: 900; letter-spacing: -5px; line-height: 0.8; display: block; width: 100%; text-align: center; transform: scaleX(0.78); transform-origin: center top;">MINE</div>
        </div>
      </a>
    </div>
  `;
};

// Generates clean receipt footer markup at bottom
const getReceiptBarcodeMarkup = () => `
  <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px dashed #D8CFC8; font-size: 11px; font-weight: 700; color: #7A6B65;">
    Thank you for choosing The Chocolate Mine!
  </div>
`;

// =============================================================================
// HTTP Email Sending Providers (For Render Free Tier compatibility - Port 443)
// =============================================================================

const sendViaBrevo = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SMTP_EMAIL || process.env.SENDER_EMAIL || 'akwebflairtechnologies@gmail.com';
  
  const payload = {
    sender: { name: 'The Chocolate Mine', email: senderEmail },
    to: [{ email: options.to }],
    subject: options.subject,
    htmlContent: options.html || '<p></p>',
  };

  if (options.bcc) {
    payload.bcc = Array.isArray(options.bcc) 
      ? options.bcc.map(b => typeof b === 'string' ? { email: b } : b)
      : [{ email: options.bcc }];
  }

  if (options.text) payload.textContent = options.text;

  if (options.attachments && Array.isArray(options.attachments) && options.attachments.length > 0) {
    payload.attachment = options.attachments.map(att => ({
      name: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : Buffer.from(att.content).toString('base64')
    }));
  }

  const res = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  logger.info(`Email sent via Brevo HTTP API to ${options.to}`);
  return res.data;
};

const sendViaResend = async (options) => {
  const apiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const payload = {
    from: `The Chocolate Mine <${senderEmail}>`,
    to: [options.to],
    subject: options.subject,
    html: options.html,
  };

  if (options.bcc) {
    payload.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
  }

  if (options.text) payload.text = options.text;

  if (options.attachments && Array.isArray(options.attachments) && options.attachments.length > 0) {
    payload.attachments = options.attachments.map(att => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : Buffer.from(att.content).toString('base64')
    }));
  }

  const res = await axios.post('https://api.resend.com/emails', payload, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  logger.info(`Email sent via Resend HTTP API to ${options.to}`);
  return res.data;
};

const sendMail = async (options) => {
  try {
    if (process.env.BREVO_API_KEY) {
      return await sendViaBrevo(options);
    }
    if (process.env.RESEND_API_KEY) {
      return await sendViaResend(options);
    }

    // Fallback to Nodemailer SMTP
    const info = await transporter.sendMail({
      from: `"The Chocolate Mine" <${process.env.SMTP_EMAIL}>`,
      to: options.to,
      bcc: options.bcc,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
    logger.info(`Email sent via SMTP to ${options.to}: ${info.messageId}`);
    return info;
  } catch (err) {
    const errorDetails = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    logger.error('Email Delivery Failed:', errorDetails);
    throw new Error(`Email delivery failed: ${errorDetails}`);
  }
};

// =============================================================================
// Helper: Resolve dynamic display flavor for order items
// =============================================================================
const getDisplayFlavor = (item) => {
  if (!item) return 'Standard';
  if (item.isCustomCake) return item.selectedFlavor || 'Custom';
  const flavor = item.selectedFlavor;
  if (!flavor || flavor.toLowerCase() === 'standard') {
    const cat = Array.isArray(item.category) ? item.category.join(' ').toLowerCase() : String(item.category || '').toLowerCase();
    const name = String(item.name || '').toLowerCase();
    if (cat.includes('chocolate') || name.includes('chocolate') || name.includes('forest') || name.includes('fudge') || name.includes('truffle') || name.includes('oreo') || name.includes('caramel')) return 'Chocolate';
    if (cat.includes('vanilla') || name.includes('vanilla') || name.includes('pineapple') || name.includes('butterscotch') || name.includes('strawberry') || name.includes('blueberry') || name.includes('biscoff') || name.includes('jamun') || name.includes('gulkand') || name.includes('rasmalai') || name.includes('honey') || name.includes('almond') || name.includes('lychee') || name.includes('rose')) return 'Vanilla';
    if (cat.includes('red-velvet') || cat.includes('red velvet') || name.includes('red-velvet') || name.includes('red velvet')) return 'Red Velvet';
    if (cat.includes('bento') || name.includes('bento')) return 'Bento';
    return 'Standard';
  }
  return flavor;
};

const emailService = {
  sendAdminNewOrderAlert: async (adminEmail, order) => {
    const { getFrontendUrl } = require('../utils/urlUtils');
    const frontendUrl = getFrontendUrl();
    const adminDashboardLink = `${frontendUrl}/admin/orders`;
    const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Build items table rows
    const itemsRows = (order.items || []).map(item => {
      const resolvedFlavor = getDisplayFlavor(item);
      const showFlavor = item.selectedFlavor || resolvedFlavor !== 'Standard';
      const weight = item.selectedWeight || (item.isCustomCake && item.customDetails?.weight) || '';
      const flavorDisplay = item.isCustomCake
        ? (item.customDetails?.flavour || resolvedFlavor)
        : (showFlavor ? resolvedFlavor : '');
      const finalUnitPrice = Number(item.finalPrice ?? item.price ?? 0);
      
      const subtagParts = [flavorDisplay, weight];
      let subtag = subtagParts.filter(Boolean).join(' · ');
      
      let addonTotal = 0;
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        const addonList = item.addons.map(a => `+ ${a.name} (x${a.qty || 1}) - ₹${(a.price * (a.qty || 1)).toFixed(2)}`).join('<br/>');
        subtag = subtag ? `${subtag}<br/><span style="color: #7A6B65;">${addonList}</span>` : `<span style="color: #7A6B65;">${addonList}</span>`;
        addonTotal = item.addons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0);
      }
      
      const lineTotal = (finalUnitPrice * Number(item.qty || 1)) + (addonTotal * Number(item.qty || 1));

      return `
        <tr>
          <td style="padding: 12px 4px; border-bottom: 1px solid #EAE3DE; font-size: 13px; font-weight: 700; color: #2C1A16;">
            ${item.name}${subtag ? `<br/><span style="font-size: 11px; font-weight: 500; color: #7A6B65;">${subtag}</span>` : ''}
          </td>
          <td style="padding: 12px 4px; border-bottom: 1px solid #EAE3DE; text-align: center; font-size: 13px; font-weight: 800; color: #2C1A16;">${item.qty}</td>
          <td style="padding: 12px 4px; border-bottom: 1px solid #EAE3DE; text-align: right; font-size: 13px; font-weight: 800; color: #2C1A16;">₹${lineTotal.toFixed(2)}</td>
        </tr>`;
    }).join('');

    return await sendMail({
      to: adminEmail,
      subject: `🚨 NEW ORDER RECEIVED! #${order.orderNumber} - ₹${order.total}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px;">
              
              <!-- Header Bar -->
              <table width="100%" cellpadding="0" cellspacing="0" class="receipt-header" style="border-bottom: 2px solid #3C1B13; padding-bottom: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">ADMIN NOTIFICATION • #${order.orderNumber}</td>
                  <td style="text-align: right; font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">${formattedDate}</td>
                </tr>
              </table>

              ${getLogoMarkup()}
              <h2 class="title-text" style="color: #3C1B13; font-size: 20px; font-weight: 900; text-transform: uppercase; text-align: center; margin: 12px 0 20px 0;">New Order Alert!</h2>
              
              <!-- Customer Details Section -->
              <div style="background-color: #F8F5F2; border: 1px solid #EAE3DE; padding: 18px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 900; color: #3C1B13; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #3C1B13; padding-bottom: 4px;">CUSTOMER & DELIVERY DETAILS</div>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #2C1A16; line-height: 1.6;">
                  <tr>
                    <td style="font-weight: 700; color: #7A6B65; width: 38%;">Customer Name:</td>
                    <td style="font-weight: 800; color: #2C1A16;">${order.address?.fullName || order.userId?.name || 'Walk-in Customer'}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #7A6B65;">Phone Number:</td>
                    <td style="font-weight: 800; color: #2C1A16;">${order.address?.phone || order.userId?.phone || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #7A6B65;">Delivery Address:</td>
                    <td style="font-weight: 800; color: #2C1A16;">${[order.address?.street, order.address?.city, order.address?.pincode].filter(Boolean).join(', ') || 'Counter Order'}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700; color: #7A6B65;">Payment Info:</td>
                    <td style="font-weight: 900; color: ${order.paymentStatus === 'paid' ? '#2E7D32' : '#C53030'}; text-transform: uppercase;">${(order.paymentStatus || 'PENDING').toUpperCase()} (${(order.paymentMethod || 'ONLINE').toUpperCase()})</td>
                  </tr>
                </table>
              </div>

              <!-- Ordered Items Summary Table -->
              <div style="font-size: 11px; font-weight: 900; color: #3C1B13; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1.5px solid #3C1B13; padding-bottom: 6px;">
                ORDERED ITEMS BREAKDOWN
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 8px 4px; border-bottom: 1.5px solid #3C1B13; font-size: 10px; font-weight: 900; color: #7A6B65; text-transform: uppercase; letter-spacing: 0.5px; width: 55%;">ITEMS</th>
                    <th style="text-align: center; padding: 8px 4px; border-bottom: 1.5px solid #3C1B13; font-size: 10px; font-weight: 900; color: #7A6B65; text-transform: uppercase; letter-spacing: 0.5px; width: 15%;">QTY</th>
                    <th style="text-align: right; padding: 8px 4px; border-bottom: 1.5px solid #3C1B13; font-size: 10px; font-weight: 900; color: #7A6B65; text-transform: uppercase; letter-spacing: 0.5px; width: 30%;">PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 10px 4px 6px 4px; text-align: left; font-size: 12px; font-weight: 700; color: #7A6B65;">Subtotal</td>
                    <td style="padding: 10px 4px 6px 4px; text-align: right; font-size: 13px; font-weight: 800; color: #2C1A16;">₹${Number(order.subtotal || 0).toFixed(2)}</td>
                  </tr>
                  ${Number(order.discount || 0) > 0 ? `
                  <tr>
                    <td colspan="2" style="padding: 6px 4px; text-align: left; font-size: 12px; font-weight: 700; color: #2E7D32;">Discount</td>
                    <td style="padding: 6px 4px; text-align: right; font-size: 13px; font-weight: 800; color: #2E7D32;">-₹${Number(order.discount).toFixed(2)}</td>
                  </tr>` : ''}
                  <tr>
                    <td colspan="2" style="padding: 6px 4px; text-align: left; font-size: 12px; font-weight: 700; color: #7A6B65;">Delivery Charge</td>
                    <td style="padding: 6px 4px; text-align: right; font-size: 13px; font-weight: 800; color: #2C1A16;">₹${Number(order.deliveryCharge || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 16px 4px 6px 4px; text-align: left; font-size: 16px; font-weight: 900; color: #3C1B13; border-top: 2px solid #3C1B13; text-transform: uppercase;">ORDER VALUE</td>
                    <td style="padding: 16px 4px 6px 4px; text-align: right; font-size: 22px; font-weight: 900; color: #3C1B13; border-top: 2px solid #3C1B13;">₹${Number(order.total || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${adminDashboardLink}" class="action-button" style="background-color: #3C1B13; color: #FFFFFF; display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 0px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Open Admin Dashboard</a>
              </div>

              ${getReceiptBarcodeMarkup(order.orderNumber)}
            </div>
          </body>
        </html>
      `,
    });
  },

  sendOrderConfirmed: async (email, order) => {
    const { getFrontendUrl } = require('../utils/urlUtils');
    const frontendUrl = getFrontendUrl();
    const trackingLink = `${frontendUrl}/account/orders/${order._id}`;
    const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Build items table rows (Receipt Style)
    const itemsRows = (order.items || []).map(item => {
      const resolvedFlavor = getDisplayFlavor(item);
      const showFlavor = item.selectedFlavor || resolvedFlavor !== 'Standard';
      const weight = item.selectedWeight || (item.isCustomCake && item.customDetails?.weight) || '';
      const flavorDisplay = item.isCustomCake
        ? (item.customDetails?.flavour || resolvedFlavor)
        : (showFlavor ? resolvedFlavor : '');
      const finalUnitPrice = Number(item.finalPrice ?? item.price ?? 0);
      
      const subtagParts = [flavorDisplay, weight];
      if (Number(item.price) > finalUnitPrice) {
        subtagParts.push(`Original: ₹${Number(item.price).toFixed(2)}`);
      }
      let subtag = subtagParts.filter(Boolean).join(' · ');
      
      let addonTotal = 0;
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        const addonList = item.addons.map(a => `+ ${a.name} (x${a.qty || 1}) - ₹${(a.price * (a.qty || 1)).toFixed(2)}`).join('<br/>');
        subtag = subtag ? `${subtag}<br/><span style="color: #7A6B65;">${addonList}</span>` : `<span style="color: #7A6B65;">${addonList}</span>`;
        addonTotal = item.addons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0);
      }
      
      const lineTotal = (finalUnitPrice * Number(item.qty || 1)) + (addonTotal * Number(item.qty || 1));

      return `
        <tr>
          <td style="padding: 12px 4px; border-bottom: 1px solid #EAE3DE; font-size: 13px; font-weight: 700; color: #2C1A16;">
            ${item.name}${subtag ? `<br/><span style="font-size: 11px; font-weight: 500; color: #7A6B65;">${subtag}</span>` : ''}
          </td>
          <td style="padding: 12px 4px; border-bottom: 1px solid #EAE3DE; text-align: center; font-size: 13px; font-weight: 800; color: #2C1A16;">${item.qty}</td>
          <td style="padding: 12px 4px; border-bottom: 1px solid #EAE3DE; text-align: right; font-size: 13px; font-weight: 800; color: #2C1A16;">₹${lineTotal.toFixed(2)}</td>
        </tr>`;
    }).join('');

    return await sendMail({
      to: email,
      subject: `Order Confirmed #${order.orderNumber} - The Chocolate Mine`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px;">
              
              <!-- Receipt Top Details Header Bar -->
              <table width="100%" cellpadding="0" cellspacing="0" class="receipt-header" style="border-bottom: 2px solid #3C1B13; padding-bottom: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">Order: #${order.orderNumber}</td>
                  <td style="text-align: right; font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">${formattedDate}</td>
                </tr>
              </table>

              ${getLogoMarkup()}
              <h2 class="title-text" style="color: #3C1B13; font-size: 20px; font-weight: 900; text-transform: uppercase; text-align: center; margin: 12px 0 20px 0;">Your order is confirmed!</h2>
              
              <p style="font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Hi ${order.address?.fullName || 'Valued Customer'},</p>
              <p style="font-size: 13px; color: #52443F; line-height: 1.5; margin: 0 0 24px 0;">Thank you for your order! Our kitchen is preparing your premium chocolates with pure ingredients.</p>

              <!-- Payment & Order Items Summary -->
              <div style="font-size: 12px; font-weight: 900; color: #3C1B13; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1.5px solid #3C1B13; padding-bottom: 6px;">
                PAYMENT SUMMARY
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                <thead>
                  <tr>
                    <th style="text-align: left; padding: 8px 4px; border-bottom: 1.5px solid #3C1B13; font-size: 10px; font-weight: 900; color: #7A6B65; text-transform: uppercase; letter-spacing: 0.5px; width: 55%;">ITEMS</th>
                    <th style="text-align: center; padding: 8px 4px; border-bottom: 1.5px solid #3C1B13; font-size: 10px; font-weight: 900; color: #7A6B65; text-transform: uppercase; letter-spacing: 0.5px; width: 15%;">QUANTITY</th>
                    <th style="text-align: right; padding: 8px 4px; border-bottom: 1.5px solid #3C1B13; font-size: 10px; font-weight: 900; color: #7A6B65; text-transform: uppercase; letter-spacing: 0.5px; width: 30%;">PRICE</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 10px 4px 6px 4px; text-align: left; font-size: 12px; font-weight: 700; color: #7A6B65;">Subtotal</td>
                    <td style="padding: 10px 4px 6px 4px; text-align: right; font-size: 13px; font-weight: 800; color: #2C1A16;">₹${Number(order.subtotal || 0).toFixed(2)}</td>
                  </tr>
                  ${Number(order.discount || 0) > 0 ? `
                  <tr>
                    <td colspan="2" style="padding: 6px 4px; text-align: left; font-size: 12px; font-weight: 700; color: #2E7D32;">Discount</td>
                    <td style="padding: 6px 4px; text-align: right; font-size: 13px; font-weight: 800; color: #2E7D32;">-₹${Number(order.discount).toFixed(2)}</td>
                  </tr>` : ''}
                  <tr>
                    <td colspan="2" style="padding: 6px 4px; text-align: left; font-size: 12px; font-weight: 700; color: #7A6B65;">Delivery Charge</td>
                    <td style="padding: 6px 4px; text-align: right; font-size: 13px; font-weight: 800; color: #2C1A16;">₹${Number(order.deliveryCharge || 0).toFixed(2)}</td>
                  </tr>
                  ${Number(order.convenienceFee || 0) > 0 ? `
                  <tr>
                    <td colspan="2" style="padding: 6px 4px; text-align: left; font-size: 12px; font-weight: 700; color: #7A6B65;">Convenience Fee (2.5%)</td>
                    <td style="padding: 6px 4px; text-align: right; font-size: 13px; font-weight: 800; color: #2C1A16;">₹${Number(order.convenienceFee || 0).toFixed(2)}</td>
                  </tr>` : ''}
                  <tr>
                    <td colspan="2" style="padding: 6px 4px; text-align: left; font-size: 12px; font-weight: 700; color: #7A6B65;">GST (18%)</td>
                    <td style="padding: 6px 4px; text-align: right; font-size: 12px; font-weight: 800; color: #2E7D32;">Inclusive</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 16px 4px 6px 4px; text-align: left; font-size: 16px; font-weight: 900; color: #3C1B13; border-top: 2px solid #3C1B13; text-transform: uppercase;">TOTAL</td>
                    <td style="padding: 16px 4px 6px 4px; text-align: right; font-size: 22px; font-weight: 900; color: #3C1B13; border-top: 2px solid #3C1B13;">₹${Number(order.total || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${trackingLink}" class="action-button" style="background-color: #3C1B13; color: #FFFFFF; display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 0px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Track My Order</a>
              </div>

              ${getReceiptBarcodeMarkup(order.orderNumber)}
            </div>
          </body>
        </html>
      `,
    });
  },

  sendPacked: async (email, order) => {
    const { getFrontendUrl } = require('../utils/urlUtils');
    const frontendUrl = getFrontendUrl();
    const trackingLink = `${frontendUrl}/account/orders/${order._id}`;
    const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return await sendMail({
      to: email,
      subject: `Your Order is Packed! #${order.orderNumber}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px;">
              
              <table width="100%" cellpadding="0" cellspacing="0" class="receipt-header" style="border-bottom: 2px solid #3C1B13; padding-bottom: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">Order: #${order.orderNumber}</td>
                  <td style="text-align: right; font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">${formattedDate}</td>
                </tr>
              </table>

              ${getLogoMarkup()}
              <h2 class="title-text" style="color: #3C1B13; font-size: 20px; font-weight: 900; text-transform: uppercase; text-align: center; margin: 12px 0 20px 0;">Your order is packed!</h2>
              
              <p style="font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Hi ${order.address?.fullName || 'Valued Customer'},</p>
              <p style="font-size: 13px; color: #52443F; line-height: 1.5; margin: 0 0 24px 0;">Great news! Your order has been assembled, quality checked, and securely packaged into temperature-controlled boxes.</p>

              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${trackingLink}" class="action-button" style="background-color: #3C1B13; color: #FFFFFF; display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 0px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Track Order Status</a>
              </div>

              ${getReceiptBarcodeMarkup(order.orderNumber)}
            </div>
          </body>
        </html>
      `,
    });
  },

  sendDispatched: async (email, order) => {
    const { getFrontendUrl } = require('../utils/urlUtils');
    const frontendUrl = getFrontendUrl();
    const trackingLink = `${frontendUrl}/account/orders/${order._id}`;
    const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return await sendMail({
      to: email,
      subject: `Your Order is On Its Way! #${order.orderNumber}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px;">
              
              <table width="100%" cellpadding="0" cellspacing="0" class="receipt-header" style="border-bottom: 2px solid #3C1B13; padding-bottom: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">Order: #${order.orderNumber}</td>
                  <td style="text-align: right; font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">${formattedDate}</td>
                </tr>
              </table>

              ${getLogoMarkup()}
              <h2 class="title-text" style="color: #3C1B13; font-size: 20px; font-weight: 900; text-transform: uppercase; text-align: center; margin: 12px 0 20px 0;">Your order is on its way!</h2>
              
              <p style="font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Hi ${order.address?.fullName || 'Valued Customer'},</p>
              <p style="font-size: 13px; color: #52443F; line-height: 1.5; margin: 0 0 24px 0;">The wait is almost over! Your order is currently with our delivery executive and heading straight to your address.</p>

              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${trackingLink}" class="action-button" style="background-color: #3C1B13; color: #FFFFFF; display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 0px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Track Live Delivery</a>
              </div>

              ${getReceiptBarcodeMarkup(order.orderNumber)}
            </div>
          </body>
        </html>
      `,
    });
  },

  sendDelivered: async (email, order, pdfBuffer = null) => {
    const googleReviewUrl = process.env.GOOGLE_REVIEW_URL || 'https://www.google.com/search?q=chocolate+mine&oq=chocolate+mine&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIKCAEQLhixAxiABDINCAIQLhixAxiABDINCAIQLhixAxiABBiKBTIHCAMQLhiABDIKCAQQABixAxiABDIGCAUQRRg8MgYIBhBFGDwyBggHEEUYPNIBCDQ0MzJqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8#lrd=0x3ba8591d53333f03:0xd0f9437d533a60fc,3,,,,';
    const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return await sendMail({
      to: email,
      subject: `Order Delivered! #${order.orderNumber} - The Chocolate Mine`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px;">
              
              <table width="100%" cellpadding="0" cellspacing="0" class="receipt-header" style="border-bottom: 2px solid #3C1B13; padding-bottom: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">Order: #${order.orderNumber}</td>
                  <td style="text-align: right; font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">${formattedDate}</td>
                </tr>
              </table>

              ${getLogoMarkup()}
              <h2 class="title-text" style="color: #3C1B13; font-size: 20px; font-weight: 900; text-transform: uppercase; text-align: center; margin: 12px 0 20px 0;">Order Delivered!</h2>
              
              <p style="font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Hi ${order.address?.fullName || 'Valued Customer'},</p>
              <p style="font-size: 13px; color: #52443F; line-height: 1.5; margin: 0 0 24px 0;">Your order has been delivered successfully. We hope you enjoy every bite of your sweet treats!</p>

              <div style="border: 2px solid #3C1B13; padding: 24px; text-align: center; margin: 28px 0; background-color: #F8F5F2;">
                <h3 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 900; color: #3C1B13; text-transform: uppercase;">SHARE YOUR EXPERIENCE</h3>
                <p style="font-size: 12px; color: #52443F; margin-bottom: 18px; font-weight: 600;">Your review helps us refine our recipes. Click below to write a Google review!</p>
                <a href="${googleReviewUrl}" target="_blank" class="action-button" style="background-color: #3C1B13; color: #FFFFFF; display: inline-block; padding: 12px 28px; text-decoration: none; border-radius: 0px; font-weight: 800; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Write a Google Review</a>
              </div>

              ${getReceiptBarcodeMarkup(order.orderNumber)}
            </div>
          </body>
        </html>
      `,
      attachments: pdfBuffer ? [{
        filename: `Invoice-${order.orderNumber}.pdf`,
        content: pdfBuffer,
      }] : [],
    });
  },

  sendInvoiceEmail: async (email, order, pdfBuffer) => {
    return await emailService.sendDelivered(email, order, pdfBuffer);
  },

  sendUserPaymentFailed: async (email, order, reason) => {
    const { getFrontendUrl } = require('../utils/urlUtils');
    const frontendUrl = getFrontendUrl();
    const ordersLink = `${frontendUrl}/account/orders`;
    const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return await sendMail({
      to: email,
      subject: `Payment Failed - Order #${order.orderNumber}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px;">
              
              <table width="100%" cellpadding="0" cellspacing="0" class="receipt-header" style="border-bottom: 2px solid #3C1B13; padding-bottom: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">Order: #${order.orderNumber}</td>
                  <td style="text-align: right; font-size: 11px; font-weight: 800; color: #7A6B65; text-transform: uppercase;">${formattedDate}</td>
                </tr>
              </table>

              ${getLogoMarkup()}
              <h2 class="title-text" style="color: #C53030; font-size: 20px; font-weight: 900; text-transform: uppercase; text-align: center; margin: 12px 0 20px 0;">Transaction Unsuccessful</h2>
              
              <p style="font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Hi ${order.address?.fullName || 'Valued Customer'},</p>
              <p style="font-size: 13px; color: #52443F; line-height: 1.5; margin: 0 0 20px 0;">We were unable to process your payment for order total of ₹${order.total}.</p>
              
              <div class="error-alert" style="padding: 16px; border: 1px solid #E53E3E; background-color: #FFF5F5; color: #C53030; font-size: 13px; font-weight: 600; margin-bottom: 24px;">
                <p style="margin: 0;"><b>Reason:</b> ${reason || 'Payment transaction failed'}</p>
              </div>

              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${ordersLink}" class="action-button" style="background-color: #3C1B13; color: #FFFFFF; display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 0px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Retry Payment</a>
              </div>

              ${getReceiptBarcodeMarkup(order.orderNumber)}
            </div>
          </body>
        </html>
      `,
    });
  },

  sendAdminPaymentFailed: async (adminEmail, order, reason) => {
    return await sendMail({
      to: adminEmail,
      subject: `Payment Failure Alert: #${order.orderNumber}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px;">
              ${getLogoMarkup()}
              <h2 style="color: #E53E3E; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-top: 0;">Payment Failure Alert</h2>
              <ul style="padding-left: 20px; line-height: 1.8; font-size: 13px; color: #2C1A16;">
                <li><b>Order ID:</b> ${order.orderNumber}</li>
                <li><b>Customer Name:</b> ${order.address?.fullName || 'N/A'}</li>
                <li><b>Total Amount:</b> ₹${order.total}</li>
                <li><b>Error:</b> ${reason || 'Unknown Exception'}</li>
              </ul>
            </div>
          </body>
        </html>
      `,
    });
  },

  sendLowStockAlert: async (product) => {
    return await sendMail({
      to: process.env.SMTP_EMAIL,
      subject: `Low Stock Alert: ${product.name}`,
      text: `Inventory Exception: ${product.name} stock has fallen below threshold (${product.stock} items left).`,
    });
  },

  sendDailySalesReport: async (reportData) => {
    return await sendMail({
      to: process.env.SMTP_EMAIL,
      subject: 'Daily Sales Report',
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px;">
              <h2 style="color: #3C1B13; font-size: 20px; font-weight: 900; text-transform: uppercase; margin-top: 0;">Daily Sales Report</h2>
              <pre style="background:#F8F5F2; padding:16px; border: 1px solid #EAE3DE; font-family: monospace; font-size: 12px; overflow-x: auto;">${JSON.stringify(reportData, null, 2)}</pre>
            </div>
          </body>
        </html>
      `,
    });
  },

  sendMonthlyRevenueReport: async (reportData) => {
    return await sendMail({
      to: process.env.SMTP_EMAIL,
      subject: 'Monthly Revenue Metrics Report',
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px;">
              <h2 style="color: #3C1B13; font-size: 20px; font-weight: 900; text-transform: uppercase; margin-top: 0;">Monthly Revenue Report</h2>
              <pre style="background:#F8F5F2; padding:16px; border: 1px solid #EAE3DE; font-family: monospace; font-size: 12px; overflow-x: auto;">${JSON.stringify(reportData, null, 2)}</pre>
            </div>
          </body>
        </html>
      `,
    });
  },

  sendCustomerSupportMail: async (userEmail, subject, message) => {
    return await sendMail({
      to: process.env.SMTP_EMAIL,
      subject: `Support Portal: ${subject}`,
      text: `From: ${userEmail}\n\nMessage:\n${message}`,
    });
  },

  sendPasswordResetOTP: async (email, otp) => {
    return await sendMail({
      to: email,
      subject: 'Password Verification Code - The Chocolate Mine',
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Helvetica+Neue:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F2EF; color: #2C1A16; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased;">
            <div class="receipt-container" style="background-color: #FFFFFF; color: #2C1A16; border: 1px solid #D8CFC8; max-width: 540px; margin: 0 auto; padding: 36px 32px; border-radius: 0px; text-align: center;">
              ${getLogoMarkup()}
              <h2 class="title-text" style="color: #3C1B13; font-size: 20px; font-weight: 900; text-transform: uppercase; margin-top: 0;">Security Verification</h2>
              <p style="font-size: 13px; color: #52443F; line-height: 1.5; margin-bottom: 20px;">Use the verification code below to complete your account security update:</p>
              
              <div style="margin: 24px 0;">
                <span class="otp-display" style="color: #3C1B13; background-color: #F8F5F2; border: 2px solid #3C1B13; letter-spacing: 8px; font-size: 32px; font-weight: 900; padding: 14px 28px; border-radius: 0px; display: inline-block;">${otp}</span>
              </div>
              
              <p style="font-size: 12px; color: #7A6B65; margin-top: 24px;">This code is valid for 10 minutes.</p>
            </div>
          </body>
        </html>
      `,
    });
  },
};

module.exports = emailService;