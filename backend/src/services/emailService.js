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

// Shared Logo Markup (exactly as used in Navbar)
const getLogoMarkup = () => `
  <div style="text-align: center; margin-bottom: 20px;">
    <div style="display: inline-block; text-align: center;">
      <!-- "THE CHOCOLATE" text row -->
      <div style="font-size: 7px; font-weight: 800; letter-spacing: 0.5px; color: #381A14; text-transform: uppercase; margin-bottom: 3px; white-space: nowrap;">
        T H E &nbsp;&nbsp; C H O C O L A T E
      </div>
      <!-- SVG "MINE" logo -->
      <svg width="140" height="38" viewBox="0 0 325 90" fill="currentColor" style="color: #381A14; display: block; margin: 0 auto;" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 86V0h25.5l29.5 45L84.5 0H110v86H87V32L61.5 71h-13L23 32v54H0z" />
        <path d="M131 0h24v86h-24V0z" />
        <path d="M176 86V0h24.5l37.5 56V0h24v86h-23.5L200 29v57h-24z" />
        <path d="M283 0h42v21h-18v12h14v20h-14v12h18v21h-42V0z" />
      </svg>
    </div>
  </div>
`;

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
    return null;
  }
};

const emailService = {
  sendOrderConfirmed: (email, order) => {
    const quote = "All you need is love. But a little chocolate now and then doesn't hurt. 🍫";
    const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
    const trackingLink = `${frontendUrl}/track/${order._id}`;

    return sendMail({
      to: email,
      subject: `Order Confirmed #${order.orderNumber} - The Chocolate Mine`,
      html: `
        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; padding: 20px; border-radius: 12px; max-width: 600px; margin: auto; background-color: #E8DCD8; color: #140907;">
          ${getLogoMarkup()}
          <h2 style="color: #381A14; text-align: center; margin-top: 0; font-weight: 800;">Order Confirmed! 🍫</h2>
          <p>Hi ${order.address.fullName},</p>
          <p style="font-style: italic; color: #D4A017; text-align: center;">"${quote}"</p>
          <p>We've received your order and our kitchen is already buzzing with excitement! We're getting your treats ready with the finest ingredients.</p>
          
          <div style="background: #FFFFFF; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4A017;">
            <p style="margin: 0;"><b>Order ID:</b> ${order.orderNumber}</p>
            <p style="margin: 5px 0 0 0;"><b>Tracking Code:</b> ${order.trackingCode || order.orderNumber}</p>
            <p style="margin: 5px 0 0 0;"><b>Estimated Delivery:</b> ${order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'As scheduled'}</p>
          </div>

          <p>You can track your order live anytime:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${trackingLink}" style="display: inline-block; padding: 12px 25px; background: #D4A017; color: #140907; text-decoration: none; border-radius: 30px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Track My Order</a>
          </div>

          <p>Thank you for letting us be part of your sweet moments!</p>
          <br/>
          <p>Warm regards,<br/><b style="color: #381A14;">Team The Chocolate Mine</b></p>
        </div>
      `,
    });
  },

  sendDispatched: (email, order) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
    const trackingLink = `${frontendUrl}/track/${order._id}`;

    return sendMail({
      to: email,
      subject: `Your Treats are on the Way! #${order.orderNumber}`,
      html: `
        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; padding: 20px; border-radius: 12px; max-width: 600px; margin: auto; background-color: #E8DCD8; color: #140907;">
          ${getLogoMarkup()}
          <h2 style="color: #381A14; text-align: center; margin-top: 0;">Out for Delivery! 🚚</h2>
          <p>Hi ${order.address.fullName},</p>
          <p>The wait is almost over! Your order <b style="color: #D4A017;">${order.orderNumber}</b> is out for delivery and should reach you shortly.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${trackingLink}" style="display: inline-block; padding: 12px 25px; background: #D4A017; color: #140907; text-decoration: none; border-radius: 30px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Track Delivery</a>
          </div>

          <p>Get ready for some chocolatey goodness!</p>
          <br/>
          <p>Warm regards,<br/><b style="color: #381A14;">Team The Chocolate Mine</b></p>
        </div>
      `,
    });
  },

  sendDelivered: (email, order, pdfBuffer = null) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
    const feedbackLink = `${frontendUrl}/review/${order._id}`;

    return sendMail({
      to: email,
      subject: `Delivered & Sweet! Order #${order.orderNumber}`,
      html: `
        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; padding: 20px; border-radius: 12px; max-width: 600px; margin: auto; background-color: #E8DCD8; color: #140907;">
          ${getLogoMarkup()}
          <h2 style="color: #381A14; text-align: center; margin-top: 0;">Enjoy Your Treats! 🎉</h2>
          <p>Hi ${order.address.fullName},</p>
          <p>Your order <b style="color: #D4A017;">${order.orderNumber}</b> has been delivered. We hope it tastes even better than it looks!</p>
          
          <p>Please find your invoice attached to this email.</p>
          
          <div style="background: #FFFFFF; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; border: 1px solid #D4A017;">
            <h3 style="margin-top: 0; color: #381A14;">How was it?</h3>
            <p>Your feedback helps us make the world a sweeter place.</p>
            <a href="${feedbackLink}" style="display: inline-block; padding: 12px 25px; background: #D4A017; color: #140907; text-decoration: none; border-radius: 30px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Give Feedback & Review</a>
          </div>

          <p>Thank you for choosing The Chocolate Mine. We can't wait to bake for you again!</p>
          <br/>
          <p>Warm regards,<br/><b style="color: #381A14;">Team The Chocolate Mine</b></p>
        </div>
      `,
      attachments: pdfBuffer ? [{
        filename: `Invoice-${order.orderNumber}.pdf`,
        content: pdfBuffer,
      }] : [],
    });
  },

  sendInvoiceEmail: (email, order, pdfBuffer) => {
    return emailService.sendDelivered(email, order, pdfBuffer);
  },

  sendUserPaymentFailed: (email, order, reason) => {
    const frontendUrl = process.env.FRONTEND_URL || 'https://thechocolatemine.com';
    const ordersLink = `${frontendUrl}/orders`;

    return sendMail({
      to: email,
      subject: `Payment Failed - Order #${order.orderNumber} - The Chocolate Mine`,
      html: `
        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; padding: 20px; border-radius: 12px; max-width: 600px; margin: auto; background-color: #E8DCD8; color: #140907;">
          ${getLogoMarkup()}
          <h2 style="color: #A94442; text-align: center; margin-top: 0;">Payment Failed 🔴</h2>
          <p>Hi ${order.address.fullName},</p>
          <p>We noticed an issue while processing your payment for order <b style="color: #D4A017;">${order.orderNumber}</b>.</p>
          
          <div style="background: #FFFFFF; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #A94442;">
            <p style="margin: 0;"><b>Amount:</b> ₹${order.total}</p>
            <p style="margin: 5px 0 0 0;"><b>Reason:</b> ${reason || 'Transaction could not be completed'}</p>
          </div>

          <p>Don't worry, your order is still saved! You can try your payment again by visiting your orders page.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${ordersLink}" style="display: inline-block; padding: 12px 25px; background: #D4A017; color: #140907; text-decoration: none; border-radius: 30px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Retry Payment</a>
          </div>

          <p>If you continue to experience issues, please contact our support team.</p>
          <br/>
          <p>Warm regards,<br/><b style="color: #381A14;">Team The Chocolate Mine</b></p>
        </div>
      `,
    });
  },

  sendAdminPaymentFailed: (adminEmail, order, reason) => {
    return sendMail({
      to: adminEmail,
      subject: `🔴 PAYMENT FAILED: Order #${order.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px; margin: auto;">
          <h2 style="color: #A94442;">Payment Failure Alert</h2>
          <p>A payment has failed for an order.</p>
          <ul>
            <li><b>Order ID:</b> ${order.orderNumber}</li>
            <li><b>Customer Name:</b> ${order.address.fullName}</li>
            <li><b>Amount:</b> ₹${order.total}</li>
            <li><b>Reason:</b> ${reason || 'Unknown'}</li>
          </ul>
          <p>Please check the admin dashboard for details.</p>
        </div>
      `,
    });
  },

  sendLowStockAlert: (product) => {
    return sendMail({
      to: process.env.SMTP_EMAIL,
      subject: `Low Stock Alert: ${product.name}`,
      text: `Product ${product.name} is low on stock (${product.stock} left).`,
    });
  },

  sendDailySalesReport: (reportData) => {
    return sendMail({
      to: process.env.SMTP_EMAIL,
      subject: 'Daily Sales Report',
      html: `<h1>Daily Sales</h1><p>${JSON.stringify(reportData)}</p>`,
    });
  },

  sendMonthlyRevenueReport: (reportData) => {
    return sendMail({
      to: process.env.SMTP_EMAIL,
      subject: 'Monthly Revenue Report',
      html: `<h1>Monthly Revenue</h1><p>${JSON.stringify(reportData)}</p>`,
    });
  },

  sendCustomerSupportMail: (userEmail, subject, message) => {
    return sendMail({
      to: process.env.SMTP_EMAIL,
      subject: `Support: ${subject}`,
      text: `From: ${userEmail}\n\n${message}`,
    });
  },

  sendPasswordResetOTP: (email, otp) => {
    return sendMail({
      to: email,
      subject: 'Password Reset OTP - The Chocolate Mine',
      html: `
        <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; padding: 20px; border-radius: 12px; max-width: 600px; margin: auto; background-color: #E8DCD8; color: #140907; text-align: center;">
          ${getLogoMarkup()}
          <h2 style="color: #381A14; margin-top: 0;">Password Reset Request</h2>
          <p>You requested to reset your password. Use the following OTP to proceed:</p>
          <h1 style="color: #D4A017; letter-spacing: 5px; font-size: 36px; background: #FFFFFF; padding: 10px; border-radius: 8px; display: inline-block;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p style="color: #888; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  },
};

module.exports = emailService;