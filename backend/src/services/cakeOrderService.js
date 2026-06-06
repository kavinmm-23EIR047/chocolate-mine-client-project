const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const Order = require('../models/Order');
const telegramService = require('./telegramService');
const logger = require('../utils/logger');

exports.processCustomCake = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('userId');
    if (!order) return;

    const customItems = order.items.filter(item => item.isCustomCake);
    if (customItems.length === 0) return;

    for (const item of customItems) {
      await generateStaffSheet(order, item);
      await sendStaffWhatsApp(order, item);
      await sendUserConfirmation(order, item);
    }

  } catch (err) {
    logger.error('Custom Cake Processing Error:', err.message);
  }
};

const fetchImage = async (url) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response.data;
  } catch (err) {
    return null;
  }
};

const generateStaffSheet = async (order, item) => {
  const doc = new PDFDocument({ margin: 50 });
  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  const { customDetails, designImages } = item;

  // HEADER
  doc.fillColor('#000000').fontSize(22).text('THE CHOCOLATE MINE', { align: 'center' });
  doc.fontSize(16).text('3D CUSTOM CAKE PRODUCTION SHEET', { align: 'center' }).moveDown();
  doc.moveTo(50, 100).lineTo(550, 100).stroke();

  // VISUAL PREVIEWS (3D SNAPSHOTS)
  if (designImages && designImages.preview) {
    const previewImg = await fetchImage(designImages.preview);
    if (previewImg) {
      doc.image(previewImg, 150, 120, { width: 300 });
      doc.moveDown(15);
    }
  }

  // SIDE VIEWS GALLERY
  if (designImages && (designImages.front || designImages.top)) {
    const startY = 400;
    let currentX = 50;
    const views = ['front', 'top', 'left', 'right'];
    
    for (const view of views) {
      if (designImages[view]) {
        const img = await fetchImage(designImages[view]);
        if (img) {
          doc.image(img, currentX, startY, { width: 110 });
          doc.fontSize(8).text(view.toUpperCase(), currentX, startY + 115, { width: 110, align: 'center' });
          currentX += 130;
        }
      }
    }
  }

  // ORDER SPECS
  doc.addPage();
  doc.fontSize(14).text(`Order No: #${order.orderNumber}`, 50, 50);
  doc.text(`Customer: ${order.address.fullName}`, 50, 70).moveDown();
  doc.moveTo(50, 90).lineTo(550, 90).stroke();

  doc.fontSize(14).text('SPECIFICATIONS', 50, 110, { underline: true });
  doc.fontSize(12);
  doc.text(`Shape: ${customDetails.shape?.toUpperCase()}`, 50, 140);
  doc.text(`Tiers: ${customDetails.tiers} Tier`, 200, 140);
  doc.text(`Weight: ${customDetails.weight}`, 350, 140);
  doc.text(`Flavour: ${customDetails.flavour}`, 50, 165);
  doc.text(`Theme: ${customDetails.designTheme}`, 250, 165);

  const msgY = 220;
  doc.rect(50, msgY, 500, 40).stroke();
  doc.fontSize(10).text('MESSAGE:', 60, msgY + 5);
  doc.fontSize(14).text(customDetails.messageOnCake || 'NO MESSAGE', 60, msgY + 15, { align: 'center', width: 480 });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(buffers);
      cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'staff_sheets', public_id: `3D_STAFF_${order.orderNumber}`, format: 'pdf' },
        async (error, result) => {
          if (error) return reject(error);
          order.customCakePdfUrl = result.secure_url;
          await order.save();
          resolve(result.secure_url);
        }
      ).end(pdfBuffer);
    });
  });
};

const sendStaffWhatsApp = async (order, item) => {
  const { customDetails, designImages } = item;
  const message = `🎂 New Custom Cake Order #${order.orderNumber}\n\n${customDetails.shape?.toUpperCase()} | ${customDetails.tiers} Tier | ${customDetails.weight}\nFlavour: ${customDetails.flavour}\nTheme: ${customDetails.designTheme}\nMsg: ${customDetails.messageOnCake || 'N/A'}\n\nOpen Dashboard: ${process.env.FRONTEND_URL}/staff/orders`;
  
  await telegramService.sendStaffAlert(message, designImages?.preview);
  order.customCakeWhatsAppSent = true;
  await order.save();
};

const sendUserConfirmation = async (order, item) => {
  const { designImages } = item;
  const caption = `✅ Your custom cake order #${order.orderNumber} is confirmed.\n\nTrack: ${process.env.FRONTEND_URL}/account/orders/${order._id}`;
  
  if (designImages?.preview) {
    await telegramService.sendMediaWhatsApp(order.userId.phone, designImages.preview, caption);
  }
};
