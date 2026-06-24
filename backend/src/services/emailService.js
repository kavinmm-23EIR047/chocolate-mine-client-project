const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    logger.error('SMTP Connection Error:', error.message);
  } else {
    logger.info('SMTP Server is ready');
  }
});

// Helper for conflict-free dynamic styling using your brand token variables
const getThemeStyles = () => `
  <style>
    /* Light Theme (Default Layout Tokens) */
    body { background-color: #E8DCD8; color: #140907; }
    .email-container { background-color: #E8DCD8; color: #140907; border: 1px solid #D1C5C3; }
    .card { background-color: #DED0CC; border-left: 4px solid #381A14; color: #140907; }
    .title-text { color: #381A14; }
    .badge-icon { background-color: #381A14; color: #FFFFFF; }
    .action-button { background-color: #381A14; color: #FFFFFF; border: 1px solid #24110D; }
    .error-alert { background-color: #FFEBEE; border-left: 4px solid #D32F2F; color: #B71C1C; }
    .error-title { color: #D32F2F; }
    .otp-display { color: #381A14; background-color: #FFFFFF; border: 1px solid #D1C5C3; }
    
    /* Pure Text Logo Token Mapping - Light */
    .logo-top { color: #381A14; }
    .logo-bottom { color: #381A14; }
    
    /* Dark Theme Client Interception Override */
    @media (prefers-color-scheme: dark) {
      body { background-color: #120806; color: #DED0CC; }
      .email-container { background-color: #1C0D0A; color: #DED0CC; border: 1px solid #381A14; }
      .card { background-color: #24110D; border-left: 4px solid #DED0CC; color: #DED0CC; }
      .title-text { color: #DED0CC; }
      .badge-icon { background-color: #DED0CC; color: #120806; }
      .action-button { background-color: #DED0CC; color: #120806; border: 1px solid #381A14; }
      .error-alert { background-color: #4A1A1A; border-left: 4px solid #EF5350; color: #EF9A9A; }
      .error-title { color: #EF5350; }
      .otp-display { color: #DED0CC; background-color: #120806; border: 1px solid #381A14; }
      
      /* Pure Text Logo Token Mapping - Dark */
      .logo-top { color: #DED0CC; }
      .logo-bottom { color: #DED0CC; }
    }
  </style>
`;

// Generates a responsive block logo precisely cloning the heavy condensed typography of image_a3db4a.png
const getLogoMarkup = () => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
  return `
    <div style="text-align: center; margin-bottom: 28px; user-select: none;">
      <a href="${frontendUrl}" style="text-decoration: none; display: inline-block;">
        <div style="font-family: 'Arial Black', 'Impact', sans-serif; text-transform: uppercase; width: 200px; margin: 0 auto; overflow: visible;">
          <!-- Top row perfectly letter-spaced to line up with the edges -->
          <div class="logo-top" style="font-size: 11.5px; font-weight: 900; letter-spacing: 4.8px; text-align: justify; text-justify: inter-character; display: block; width: 100%; line-height: 1.2; text-align-last: justify; padding-left: 2px; font-family: sans-serif;">THE CHOCOLATE</div>
          <!-- Bottom row scaled on X-axis to achieve the heavy condensed look of image_a3db4a.png -->
          <div class="logo-bottom" style="font-size: 78px; font-weight: 900; letter-spacing: -5px; line-height: 0.8; display: block; width: 100%; text-align: center; transform: scaleX(0.78); transform-origin: center top;">MINE</div>
        </div>
      </a>
    </div>
  `;
};

const sendMail = async (options) => {
  try {
    const info = await transporter.sendMail({
      from: `"The Chocolate Mine" <${process.env.SMTP_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('Email Delivery Failed:', err.message);
    throw new Error(`Email delivery failed: ${err.message}`);
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
    const cat = String(item.category || '').toLowerCase();
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
  sendOrderConfirmed: async (email, order) => {
    const quote = "All you need is love. But a little chocolate now and then doesn't hurt.";
    const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
    const trackingLink = `${frontendUrl}/account/orders/${order._id}`;

    // Build items table rows
    const itemsRows = (order.items || []).map(item => {
      const resolvedFlavor = getDisplayFlavor(item);
      const showFlavor = item.selectedFlavor || resolvedFlavor !== 'Standard';
      const weight = item.selectedWeight || (item.isCustomCake && item.customDetails?.weight) || '';
      const flavorDisplay = item.isCustomCake
        ? (item.customDetails?.flavour || resolvedFlavor)
        : (showFlavor ? resolvedFlavor : '');
      const subtag = [flavorDisplay, weight].filter(Boolean).join(' · ');
      const lineTotal = (Number(item.price) || 0) * (Number(item.qty) || 1);

      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #D1C5C3; font-size: 13px;">
            <b>${item.name}</b>${subtag ? `<br/><span style="font-size: 11px; opacity: 0.75;">${subtag}</span>` : ''}
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #D1C5C3; text-align: center; font-size: 13px;">${item.qty}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #D1C5C3; text-align: right; font-size: 13px;">₹${lineTotal.toFixed(2)}</td>
        </tr>`;
    }).join('');

    return await sendMail({
      to: email,
      subject: `Order Confirmed #${order.orderNumber} - The Chocolate Mine`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', sans-serif; margin: 0; padding: 20px;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto;">
              ${getLogoMarkup()}
              <h2 class="title-text" style="text-align: center; margin-top: 0; font-weight: 800; letter-spacing: -0.5px;">Order Confirmed</h2>
              <p>Hi ${order.address.fullName},</p>
              <p style="font-style: italic; opacity: 0.85; text-align: center; margin: 16px 0;">"${quote}"</p>
              <p>We've received your order and our kitchen is preparing your treats with the finest premium ingredients.</p>
              
              <div class="card" style="padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px;"><b>Order ID:</b> ${order.orderNumber}</p>
                <p style="margin: 6px 0 0 0; font-size: 14px;"><b>Tracking Code:</b> ${order.trackingCode || order.orderNumber}</p>
                <p style="margin: 6px 0 0 0; font-size: 14px;"><b>Estimated Delivery:</b> ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'As scheduled'}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 20px 0; border: 1px solid #D1C5C3; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #381A14;">
                    <th style="padding: 10px 12px; text-align: left; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Item</th>
                    <th style="padding: 10px 8px; text-align: center; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase;">Qty</th>
                    <th style="padding: 10px 12px; text-align: right; color: #fff; font-size: 12px; font-weight: 700; text-transform: uppercase;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 10px 12px; text-align: right; font-weight: 700; font-size: 13px;">Total</td>
                    <td style="padding: 10px 12px; text-align: right; font-weight: 800; font-size: 14px;">₹${Number(order.total || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${trackingLink}" class="action-button" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Track My Order</a>
              </div>

              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text">Team The Chocolate Mine</b></p>
            </div>
          </body>
        </html>
      `,
    });
  },

  sendPacked: async (email, order) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
    const trackingLink = `${frontendUrl}/account/orders/${order._id}`;

    return await sendMail({
      to: email,
      subject: `Your Order is Packed! #${order.orderNumber}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', sans-serif; margin: 0; padding: 20px;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto;">
              ${getLogoMarkup()}
              <div style="text-align: center; margin-bottom: 16px;">
                <span class="badge-icon" style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Ready for Dispatch</span>
              </div>
              <h2 class="title-text" style="text-align: center; margin-top: 0; font-weight: 800;">Order Packed</h2>
              <p>Hi ${order.address.fullName},</p>
              <p>Great news! Your order has been assembled, quality checked, and securely packaged.</p>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="${trackingLink}" class="action-button" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Track Order Status</a>
              </div>
              <br/>
              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text">Team The Chocolate Mine</b></p>
            </div>
          </body>
        </html>
      `,
    });
  },

  sendDispatched: async (email, order) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
    const trackingLink = `${frontendUrl}/account/orders/${order._id}`;

    return await sendMail({
      to: email,
      subject: `Your Treats are on the Way! #${order.orderNumber}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', sans-serif; margin: 0; padding: 20px;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto;">
              ${getLogoMarkup()}
              <div style="text-align: center; margin-bottom: 16px;">
                <span class="badge-icon" style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">In Transit</span>
              </div>
              <h2 class="title-text" style="text-align: center; margin-top: 0; font-weight: 800;">Out for Delivery</h2>
              <p>Hi ${order.address.fullName},</p>
              <p>The wait is almost over! Your order is officially with our delivery partner and heading your way.</p>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="${trackingLink}" class="action-button" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Track Transit</a>
              </div>
              <br/>
              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text">Team The Chocolate Mine</b></p>
            </div>
          </body>
        </html>
      `,
    });
  },

  sendDelivered: async (email, order, pdfBuffer = null) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
    const feedbackLink = `${frontendUrl}/review/${order._id}`;

    return await sendMail({
      to: email,
      subject: `Delivered & Sweet! Order #${order.orderNumber}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', sans-serif; margin: 0; padding: 20px;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto;">
              ${getLogoMarkup()}
              <h2 class="title-text" style="text-align: center; margin-top: 0; font-weight: 800;">Order Delivered</h2>
              <p>Hi ${order.address.fullName},</p>
              <p>Your order has been delivered successfully. Your digital invoice has been attached to this message summary.</p>
              
              <div class="card" style="padding: 24px; border-radius: 8px; text-align: center; margin: 32px 0;">
                <h3 class="title-text" style="margin-top: 0; font-weight: 700;">Share Your Experience</h3>
                <p style="font-size: 14px; margin-bottom: 20px;">Your feedback helps us perfect our recipes.</p>
                <a href="${feedbackLink}" class="action-button" style="display: inline-block; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Write a Review</a>
              </div>
              <br/>
              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text">Team The Chocolate Mine</b></p>
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
    const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
    const ordersLink = `${frontendUrl}/account/orders`;

    return await sendMail({
      to: email,
      subject: `Payment Failed - Order #${order.orderNumber} - The Chocolate Mine`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', sans-serif; margin: 0; padding: 20px;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto;">
              ${getLogoMarkup()}
              <h2 class="error-title" style="text-align: center; margin-top: 0; font-weight: 800;">Transaction Unsuccessful</h2>
              <p>Hi ${order.address.fullName},</p>
              <p>We were unable to process your payment gateway transaction details for order value.</p>
              
              <div class="error-alert" style="padding: 16px; border-radius: 8px; margin: 24px 0; font-size: 14px;">
                <p style="margin: 0;"><b>Total Value:</b> ₹${order.total}</p>
                <p style="margin: 6px 0 0 0;"><b>Message Log:</b> ${reason || 'Transaction could not be completed'}</p>
              </div>

              <p>Your order configuration has been safely cached. You can safely attempt execution again via your profile dashboard:</p>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="${ordersLink}" class="action-button" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Retry Payment</a>
              </div>
              <br/>
              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text">Team The Chocolate Mine</b></p>
            </div>
          </body>
        </html>
      `,
    });
  },

  sendAdminPaymentFailed: async (adminEmail, order, reason) => {
    return await sendMail({
      to: adminEmail,
      subject: `Transaction Failure Warning: #${order.orderNumber}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 24px; color: #333; background: #fff;">
            <div style="max-width: 580px; margin: auto; border: 1px solid #e1e1e1; padding: 24px; border-radius: 8px;">
              <h2 style="color: #b83232; margin-top: 0;">Payment Failure Event</h2>
              <p>A checkout loop error occurred on the application gateway pipeline:</p>
              <ul style="padding-left: 20px; line-height: 1.6;">
                <li><b>Order ID:</b> ${order.orderNumber}</li>
                <li><b>Client Name:</b> ${order.address.fullName}</li>
                <li><b>Total Amount:</b> ₹${order.total}</li>
                <li><b>Reason String:</b> ${reason || 'Unknown Return Exception'}</li>
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
      text: `Product SKU inventory rule exception: ${product.name} has fallen below threshold minimums (${product.stock} items remaining in inventory state).`,
    });
  },

  sendDailySalesReport: async (reportData) => {
    return await sendMail({
      to: process.env.SMTP_EMAIL,
      subject: 'Daily Sales Metrics Engine Report',
      html: `<html><body><h1 style="color:#381A14;">Daily Sales Dump</h1><pre style="background:#f4f4f4; padding:16px;">${JSON.stringify(reportData, null, 2)}</pre></body></html>`,
    });
  },

  sendMonthlyRevenueReport: async (reportData) => {
    return await sendMail({
      to: process.env.SMTP_EMAIL,
      subject: 'Monthly Performance Review Statement',
      html: `<html><body><h1 style="color:#381A14;">Monthly Revenue Metrics</h1><pre style="background:#f4f4f4; padding:16px;">${JSON.stringify(reportData, null, 2)}</pre></body></html>`,
    });
  },

  sendCustomerSupportMail: async (userEmail, subject, message) => {
    return await sendMail({
      to: process.env.SMTP_EMAIL,
      subject: `Support Portal Inbound: ${subject}`,
      text: `Origin Communication Address: ${userEmail}\n\nMessage Payload:\n${message}`,
    });
  },

  sendPasswordResetOTP: async (email, otp) => {
    return await sendMail({
      to: email,
      subject: 'Password Verification Code - The Chocolate Mine',
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', sans-serif; margin: 0; padding: 20px;">
            <div class="email-container" style="padding: 36px; border-radius: 16px; max-width: 500px; margin: auto; text-align: center;">
              ${getLogoMarkup()}
              <h2 class="title-text" style="margin-top: 0; font-weight: 800; letter-spacing: -0.5px;">Security Verification</h2>
              <p style="font-size: 15px; line-height: 1.5; margin-bottom: 24px;">You initiated a request to verify your account identity. Use the verification token credential string below to finalize password changes:</p>
              
              <div style="margin: 24px 0;">
                <span class="otp-display" style="letter-spacing: 6px; font-size: 32px; font-weight: 800; padding: 12px 28px; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.02); text-align: center;">${otp}</span>
              </div>
              
              <p style="font-size: 13px; opacity: 0.8; margin-top: 24px;">This temporary access verification code token stays active for 10 minutes from issuance.</p>
              <hr style="border: 0; border-top: 1px solid #D1C5C3; margin: 24px 0;" />
              <p style="opacity: 0.5; font-size: 11px; margin: 0;">If you did not execute this authentication query configuration task, please safely ignore this communication broadcast.</p>
            </div>
          </body>
        </html>
      `,
    });
  },
};

module.exports = emailService;