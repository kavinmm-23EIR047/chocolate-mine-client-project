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
    /* Default Layout Tokens */
    body { background-color: #F9F6F4; color: #2C1A16; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; margin: 0; padding: 20px; }
    .email-container { background-color: #FFFFFF; color: #2C1A16; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03); max-width: 580px; margin: auto; border-radius: 16px; padding: 32px; }
    .card { background-color: #F8F5F2; border-left: 4px solid #3C1B13; color: #2C1A16; padding: 20px; border-radius: 8px; margin: 24px 0; }
    .title-text { color: #3C1B13; }
    .badge-icon { background-color: #3C1B13; color: #FFFFFF; display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; }
    .action-button { background-color: #3C1B13; color: #FFFFFF !important; display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; text-align: center; }
    .error-alert { background-color: #FFF5F5; border-left: 4px solid #E53E3E; color: #C53030; padding: 16px; border-radius: 8px; margin: 24px 0; font-size: 14px; }
    .error-title { color: #E53E3E; }
    .otp-display { color: #3C1B13; background-color: #F8F5F2; border: 1px solid #EAE3DE; letter-spacing: 6px; font-size: 32px; font-weight: 800; padding: 12px 28px; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.02); text-align: center; }
    
    /* Pure Text Logo Token Mapping */
    .logo-top { color: #3C1B13; }
    .logo-bottom { color: #3C1B13; }
    
    @media (prefers-color-scheme: dark) {
      body { background-color: #120806 !important; color: #EAE3DE !important; }
      .email-container { background-color: #1C0D0A !important; color: #EAE3DE !important; border: 1px solid #2B120E !important; }
      .card { background-color: #24110D !important; border-left: 4px solid #EAE3DE !important; color: #EAE3DE !important; }
      .title-text { color: #EAE3DE !important; }
      .badge-icon { background-color: #EAE3DE !important; color: #120806 !important; }
      .action-button { background-color: #EAE3DE !important; color: #120806 !important; }
      .error-alert { background-color: #4A1A1A !important; border-left: 4px solid #E53E3E !important; color: #FEB2B2 !important; }
      .error-title { color: #FEB2B2 !important; }
      .otp-display { color: #EAE3DE !important; background-color: #120806 !important; border: 1px solid #2B120E !important; }
      .logo-top { color: #EAE3DE !important; }
      .logo-bottom { color: #EAE3DE !important; }
    }
  </style>
`;

// Generates a responsive block logo precisely cloning the heavy condensed typography of image_a3db4a.png
const getLogoMarkup = () => {
  const { getFrontendUrl } = require('../utils/urlUtils');
  const frontendUrl = getFrontendUrl();
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
  sendOrderConfirmed: async (email, order) => {
    const quote = "All you need is love. But a little chocolate now and then doesn't hurt.";
    const { getFrontendUrl } = require('../utils/urlUtils');
    const frontendUrl = getFrontendUrl();
    const trackingLink = `${frontendUrl}/account/orders/${order._id}`;

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
      if (Number(item.price) > finalUnitPrice) {
        subtagParts.push(`Original: ₹${Number(item.price).toFixed(2)}`);
      }
      let subtag = subtagParts.filter(Boolean).join(' · ');
      
      let addonTotal = 0;
      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        const addonList = item.addons.map(a => `+ ${a.name} (x${a.qty || 1}) - ₹${(a.price * (a.qty || 1)).toFixed(2)}`).join('<br/>');
        subtag = subtag ? `${subtag}<br/><span style="color: #A06050;">${addonList}</span>` : `<span style="color: #A06050;">${addonList}</span>`;
        addonTotal = item.addons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0);
      }
      
      const lineTotal = (finalUnitPrice * Number(item.qty || 1)) + (addonTotal * Number(item.qty || 1));

      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #EAE3DE; font-size: 13px;">
            <b>${item.name}</b>${subtag ? `<br/><span style="font-size: 11px; opacity: 0.75;">${subtag}</span>` : ''}
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #EAE3DE; text-align: center; font-size: 13px;">${item.qty}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #EAE3DE; text-align: right; font-size: 13px;">₹${lineTotal.toFixed(2)}</td>
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
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F4; color: #2C1A16; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; line-height: 1.6;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto; background-color: #FFFFFF; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              ${getLogoMarkup()}
              <h2 class="title-text" style="text-align: center; margin-top: 0; font-weight: 800; letter-spacing: -0.5px; color: #3C1B13;">Order Confirmed</h2>
              <p>Hi ${order.address.fullName},</p>
              <p style="font-style: italic; opacity: 0.85; text-align: center; margin: 16px 0;">"${quote}"</p>
              <p>We've received your order and our kitchen is preparing your treats with the finest premium ingredients.</p>
              
              <div class="card" style="padding: 20px; border-radius: 8px; margin: 24px 0; background-color: #F8F5F2; border-left: 4px solid #3C1B13; color: #2C1A16;">
                <p style="margin: 0; font-size: 14px;"><b>Order ID:</b> ${order.orderNumber}</p>
                <p style="margin: 6px 0 0 0; font-size: 14px;"><b>Tracking Code:</b> ${order.trackingCode || order.orderNumber}</p>
                <p style="margin: 6px 0 0 0; font-size: 14px;"><b>Estimated Delivery:</b> ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'As scheduled'}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 20px 0; border: 1px solid #EAE3DE; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #3C1B13;">
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
                    <td colspan="2" style="padding: 8px 12px; text-align: right; font-size: 12px; color: #7F706E; border-top: 1px solid #EAE3DE;">Subtotal</td>
                    <td style="padding: 8px 12px; text-align: right; font-size: 12px; color: #7F706E; border-top: 1px solid #EAE3DE;">₹${Number(order.subtotal || 0).toFixed(2)}</td>
                  </tr>
                  ${Number(order.discount || 0) > 0 ? `
                  <tr>
                    <td colspan="2" style="padding: 8px 12px; text-align: right; font-size: 12px; color: #2E7D32;">Discount</td>
                    <td style="padding: 8px 12px; text-align: right; font-size: 12px; color: #2E7D32;">-₹${Number(order.discount).toFixed(2)}</td>
                  </tr>` : ''}
                  <tr>
                    <td colspan="2" style="padding: 8px 12px; text-align: right; font-size: 12px; color: #7F706E;">Delivery Charge</td>
                    <td style="padding: 8px 12px; text-align: right; font-size: 12px; color: #7F706E;">₹${Number(order.deliveryCharge || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px 12px; text-align: right; font-size: 12px; color: #7F706E;">GST (18%)</td>
                    <td style="padding: 8px 12px; text-align: right; font-size: 12px; color: #7F706E;">₹${Number(order.gst || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 8px 12px; text-align: right; font-size: 12px; color: #7F706E;">Convenience Fee (2%)</td>
                    <td style="padding: 8px 12px; text-align: right; font-size: 12px; color: #7F706E;">₹${Number(order.convenienceFee || 0).toFixed(2)}</td>
                  </tr>
                  <tr style="background-color: #3C1B13; color: #fff;">
                    <td colspan="2" style="padding: 10px 12px; text-align: right; font-weight: 700; font-size: 13px; color: #fff; border-radius: 0 0 0 8px;">Grand Total</td>
                    <td style="padding: 10px 12px; text-align: right; font-weight: 800; font-size: 14px; color: #fff; border-radius: 0 0 8px 0;">₹${Number(order.total || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${trackingLink}" class="action-button" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; background-color: #3C1B13; color: #FFFFFF;">Track My Order</a>
              </div>

              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text" style="color: #3C1B13;">Team The Chocolate Mine</b></p>
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

    return await sendMail({
      to: email,
      subject: `Your Order is Packed! #${order.orderNumber}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F4; color: #2C1A16; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; line-height: 1.6;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto; background-color: #FFFFFF; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              ${getLogoMarkup()}
              <div style="text-align: center; margin-bottom: 16px;">
                <span class="badge-icon" style="background-color: #3C1B13; color: #FFFFFF; display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">Ready for Dispatch</span>
              </div>
              <h2 class="title-text" style="text-align: center; margin-top: 0; font-weight: 800; color: #3C1B13;">Order Packed</h2>
              <p>Hi ${order.address.fullName},</p>
              <p>Great news! Your order has been assembled, quality checked, and securely packaged. It will be picked up by our courier partner shortly.</p>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="${trackingLink}" class="action-button" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; background-color: #3C1B13; color: #FFFFFF;">Track Order Status</a>
              </div>
              <br/>
              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text" style="color: #3C1B13;">Team The Chocolate Mine</b></p>
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

    return await sendMail({
      to: email,
      subject: `Your Treats are on the Way! #${order.orderNumber}`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F4; color: #2C1A16; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; line-height: 1.6;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto; background-color: #FFFFFF; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              ${getLogoMarkup()}
              <div style="text-align: center; margin-bottom: 16px;">
                <span class="badge-icon" style="background-color: #3C1B13; color: #FFFFFF; display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px;">In Transit</span>
              </div>
              <h2 class="title-text" style="text-align: center; margin-top: 0; font-weight: 800; color: #3C1B13;">Out for Delivery</h2>
              <p>Hi ${order.address.fullName},</p>
              <p>The wait is almost over! Your order is officially with our delivery partner and heading your way.</p>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="${trackingLink}" class="action-button" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; background-color: #3C1B13; color: #FFFFFF;">Track Transit</a>
              </div>
              <br/>
              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text" style="color: #3C1B13;">Team The Chocolate Mine</b></p>
            </div>
          </body>
        </html>
      `,
    });
  },

  sendDelivered: async (email, order, pdfBuffer = null) => {
    const { getFrontendUrl } = require('../utils/urlUtils');
    const frontendUrl = getFrontendUrl();
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
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F4; color: #2C1A16; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; line-height: 1.6;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto; background-color: #FFFFFF; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              ${getLogoMarkup()}
              <h2 class="title-text" style="text-align: center; margin-top: 0; font-weight: 800; color: #3C1B13;">Order Delivered</h2>
              <p>Hi ${order.address.fullName},</p>
              <p>Your order has been delivered successfully. Your digital invoice has been attached to this message summary.</p>
              
              <div class="card" style="padding: 24px; border-radius: 8px; text-align: center; margin: 32px 0; background-color: #F8F5F2; border-left: 4px solid #3C1B13; color: #2C1A16;">
                <h3 class="title-text" style="margin-top: 0; font-weight: 700; color: #3C1B13;">Share Your Experience</h3>
                <p style="font-size: 14px; margin-bottom: 20px;">Your feedback helps us perfect our recipes.</p>
                <a href="${feedbackLink}" class="action-button" style="display: inline-block; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; background-color: #3C1B13; color: #FFFFFF;">Write a Review</a>
              </div>
              <br/>
              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text" style="color: #3C1B13;">Team The Chocolate Mine</b></p>
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

    return await sendMail({
      to: email,
      subject: `Payment Failed - Order #${order.orderNumber} - The Chocolate Mine`,
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F4; color: #2C1A16; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; line-height: 1.6;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto; background-color: #FFFFFF; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              ${getLogoMarkup()}
              <h2 class="error-title" style="text-align: center; margin-top: 0; font-weight: 800; color: #E53E3E;">Transaction Unsuccessful</h2>
              <p>Hi ${order.address.fullName},</p>
              <p>We were unable to process your payment gateway transaction details for order value.</p>
              
              <div class="error-alert" style="padding: 16px; border-radius: 8px; margin: 24px 0; font-size: 14px; background-color: #FFF5F5; border-left: 4px solid #E53E3E; color: #C53030;">
                <p style="margin: 0;"><b>Total Value:</b> ₹${order.total}</p>
                <p style="margin: 6px 0 0 0;"><b>Message Log:</b> ${reason || 'Transaction could not be completed'}</p>
              </div>

              <p>Your order configuration has been safely cached. You can safely attempt execution again via your profile dashboard:</p>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="${ordersLink}" class="action-button" style="display: inline-block; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; background-color: #3C1B13; color: #FFFFFF;">Retry Payment</a>
              </div>
              <br/>
              <p style="font-size: 14px; opacity: 0.9;">Warm regards,<br/><b class="title-text" style="color: #3C1B13;">Team The Chocolate Mine</b></p>
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
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F4; color: #2C1A16; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; line-height: 1.6;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto; background-color: #FFFFFF; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              ${getLogoMarkup()}
              <h2 class="error-title" style="margin-top: 0; font-weight: 800; color: #E53E3E;">Payment Failure Event</h2>
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
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F4; color: #2C1A16; margin: 0; padding: 20px;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto; background-color: #FFFFFF; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              <h1 class="title-text" style="color:#3C1B13; margin-top: 0; font-size: 24px; font-weight: 800;">Daily Sales Dump</h1>
              <pre style="background:#F8F5F2; padding:16px; border-radius: 8px; border: 1px solid #EAE3DE; font-family: monospace; font-size: 13px; overflow-x: auto;">${JSON.stringify(reportData, null, 2)}</pre>
            </div>
          </body>
        </html>
      `,
    });
  },

  sendMonthlyRevenueReport: async (reportData) => {
    return await sendMail({
      to: process.env.SMTP_EMAIL,
      subject: 'Monthly Performance Review Statement',
      html: `
        <html>
          <head>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
            ${getThemeStyles()}
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F4; color: #2C1A16; margin: 0; padding: 20px;">
            <div class="email-container" style="padding: 32px; border-radius: 16px; max-width: 580px; margin: auto; background-color: #FFFFFF; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              <h1 class="title-text" style="color:#3C1B13; margin-top: 0; font-size: 24px; font-weight: 800;">Monthly Revenue Metrics</h1>
              <pre style="background:#F8F5F2; padding:16px; border-radius: 8px; border: 1px solid #EAE3DE; font-family: monospace; font-size: 13px; overflow-x: auto;">${JSON.stringify(reportData, null, 2)}</pre>
            </div>
          </body>
        </html>
      `,
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
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F4; color: #2C1A16; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; line-height: 1.6;">
            <div class="email-container" style="padding: 36px; border-radius: 16px; max-width: 500px; margin: auto; text-align: center; background-color: #FFFFFF; border: 1px solid #EAE3DE; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              ${getLogoMarkup()}
              <h2 class="title-text" style="margin-top: 0; font-weight: 800; letter-spacing: -0.5px; color: #3C1B13;">Security Verification</h2>
              <p style="font-size: 15px; line-height: 1.5; margin-bottom: 24px;">You initiated a request to verify your account identity. Use the verification token credential string below to finalize password changes:</p>
              
              <div style="margin: 24px 0;">
                <span class="otp-display" style="color: #3C1B13; background-color: #F8F5F2; border: 1px solid #EAE3DE; letter-spacing: 6px; font-size: 32px; font-weight: 800; padding: 12px 28px; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.02); text-align: center;">${otp}</span>
              </div>
              
              <p style="font-size: 13px; opacity: 0.8; margin-top: 24px;">This temporary access verification code token stays active for 10 minutes from issuance.</p>
              <hr style="border: 0; border-top: 1px solid #EAE3DE; margin: 24px 0;" />
              <p style="opacity: 0.5; font-size: 11px; margin: 0;">If you did not execute this authentication query configuration task, please safely ignore this communication broadcast.</p>
            </div>
          </body>
        </html>
      `,
    });
  },
};

module.exports = emailService;