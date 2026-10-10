const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const InShopOrder = require('../models/InShopOrder');
const emailService = require('./emailService');
const telegramService = require('./telegramService');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// ─── Palette Extracted Directly from Your Website/Admin Dashboard ────────────
const COLORS = {
  bgCanvas: '#E0D3C9', // Warm Nude/Cream Page Background
  cardBg: '#F2E8E2', // Light Cream Card Fill
  primary: '#231512', // Deep Dark Brown
  accent: '#C98F45', // Caramel Gold (Banner headers)
  textDark: '#231512', // Primary Foreground Text
  textMuted: '#6E5D57', // Muted Subtitles
  border: '#D2C4BC', // Soft Divider Border
  white: '#FFFFFF',
};

// ─── Page Geometry Constants ─────────────────────────────────────────────────
const PAGE_W = 595.28; // A4 Width
const PAGE_H = 841.89; // A4 Height
const MARGIN = 35;
const CONTENT_W = PAGE_W - MARGIN * 2; // 525.28 pt

// Table Column Mapping
const COL = {
  qty: MARGIN + 10,
  desc: MARGIN + 55,
  unitPrice: MARGIN + 320,
  amount: MARGIN + 420,
};
const COL_W = {
  qty: 40,
  desc: 265,
  unitPrice: 95,
  amount: 95,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function drawDivider(doc, y, color = COLORS.border, thickness = 0.75) {
  doc.save()
    .moveTo(MARGIN, y)
    .lineTo(PAGE_W - MARGIN, y)
    .lineWidth(thickness)
    .strokeColor(color)
    .stroke()
    .restore();
}

function getDisplayFlavor(item) {
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
}

exports.generateInvoiceBuffer = async (orderId) => {
  try {
    let order = await Order.findById(orderId).populate('userId');
    if (!order) {
      order = await InShopOrder.findById(orderId).populate('userId');
    }
    if (!order) throw new Error('Order not found');

    if (!order.invoiceNumber) {
      order.invoiceNumber = `INV-${Date.now()}`;
      try {
        await order.save();
      } catch (err) {
        // Ignore background save errors
      }
    }

    const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // ── Full Page Website Canvas Background ──────────────────────────────────
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.bgCanvas);

    // ── HEADER SECTION ────────────────────────────────────────────────────────
    const HEADER_TOP = 30;

    // Resolve 'light logo.png' asset
    const logoPaths = [
      path.join(__dirname, '../assets/light logo.png'),
      path.join(__dirname, '../../../frontend/src/assets/light logo.png'),
      path.join(__dirname, '../../frontend/src/assets/light logo.png'),
      path.join(__dirname, '../assets/logo.png')
    ];

    let activeLogo = null;
    for (const p of logoPaths) {
      if (fs.existsSync(p)) {
        activeLogo = p;
        break;
      }
    }

    if (activeLogo) {
      doc.image(activeLogo, MARGIN, HEADER_TOP, { fit: [150, 48] });
    } else {
      doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.primary).text('THE CHOCOLATE MINE', MARGIN, HEADER_TOP);
      doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.accent).text('PREMIUM ARTISAN BAKERY', MARGIN, HEADER_TOP + 18);
    }

    // Right Header: Large Title
    doc.font('Helvetica-Bold').fontSize(26).fillColor(COLORS.accent)
      .text('Invoice', PAGE_W - MARGIN - 180, HEADER_TOP + 5, { width: 180, align: 'right' });

    drawDivider(doc, 90, COLORS.border, 1);

    // ── SECTION 1: BANNER STRIP - BILL TO & ORDER DETAILS ─────────────────────
    let currentY = 105;
    const BANNER_H = 20;

    doc.rect(MARGIN, currentY, CONTENT_W, BANNER_H).fill(COLORS.accent);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white)
      .text('CUSTOMER & ORDER INFORMATION', MARGIN + 8, currentY + 5);

    currentY += BANNER_H + 8;

    // Data Mapping for Customer & Address
    const clientName = (order.address && order.address.fullName) || (order.userId && order.userId.name) || order.customerName || 'Walk-in Customer';
    const clientPhone = (order.address && order.address.phone) || (order.userId && order.userId.phone) || order.customerPhone || 'N/A';

    const streetAddr = [order.address && order.address.houseNo, order.address && order.address.street].filter(Boolean).join(', ');
    const cityState = [order.address && order.address.city, order.address && order.address.state].filter(Boolean).join(', ');
    const pincode = (order.address && order.address.pincode) || '';
    const landmark = (order.address && order.address.landmark) || '';

    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
    });

    const deliveryDate = order.deliveryDate
      ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
      : (order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A');

    const COL_W_GRID = (CONTENT_W - 20) / 2;
    const LEFT_X = MARGIN;
    const RIGHT_X = MARGIN + COL_W_GRID + 20;

    // Outer Card Frame around Grid Box
    const GRID_BOX_H = 100;
    doc.rect(MARGIN, currentY, CONTENT_W, GRID_BOX_H).fillAndStroke(COLORS.cardBg, COLORS.border);

    // Left Column: Customer & Shipping Info
    let leftY = currentY + 8;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.textDark).text('Billed / Shipped To:', LEFT_X + 8, leftY);
    leftY += 14;
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.primary).text(clientName, LEFT_X + 8, leftY);
    leftY += 13;
    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.textMuted);
    doc.text(`Phone: ${clientPhone}`, LEFT_X + 8, leftY);
    leftY += 12;
    if (streetAddr) doc.text(streetAddr, LEFT_X + 8, leftY, { width: COL_W_GRID - 16 });
    leftY += streetAddr ? 12 : 0;
    if (cityState || pincode) doc.text(`${cityState}${pincode ? ' - ' + pincode : ''}`, LEFT_X + 8, leftY);
    leftY += (cityState || pincode) ? 12 : 0;
    if (landmark) doc.text(`Landmark: ${landmark}`, LEFT_X + 8, leftY);

    // Right Column: Invoice Details Form
    let rightY = currentY + 8;
    function gridRow(label, value) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.textMuted).text(label, RIGHT_X, rightY, { width: 95 });
      doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.textDark).text(value || 'N/A', RIGHT_X + 95, rightY, { width: COL_W_GRID - 105, align: 'right' });
      rightY += 14;
    }

    gridRow('Invoice No:', order.invoiceNumber);
    gridRow('Date:', invoiceDate);
    gridRow('Order Ref ID:', order.orderNumber || order._id.toString().slice(-8).toUpperCase());
    gridRow('Payment Method:', (order.paymentMethod || 'N/A').toUpperCase());
    if (order.deliverySlot) {
      gridRow('Delivery Slot:', `${deliveryDate} (${order.deliverySlot})`);
    } else {
      gridRow('Delivery Date:', deliveryDate);
    }

    currentY += GRID_BOX_H + 15;

    // ── SECTION 2: BANNER STRIP - ORDER ITEMS ─────────────────────────────────
    doc.rect(MARGIN, currentY, CONTENT_W, BANNER_H).fill(COLORS.accent);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.white)
      .text(`ORDER ITEMS (${(order.items && order.items.length) || 0})`, MARGIN + 8, currentY + 5);

    currentY += BANNER_H;

    // Table Header Bar
    const TABLE_HDR_H = 18;
    doc.rect(MARGIN, currentY, CONTENT_W, TABLE_HDR_H).fill(COLORS.primary);

    const TH_Y = currentY + 4;
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.white);
    doc.text('QTY', COL.qty, TH_Y, { width: COL_W.qty, align: 'center' });
    doc.text('DESCRIPTION', COL.desc, TH_Y, { width: COL_W.desc, align: 'left' });
    doc.text('UNIT PRICE', COL.unitPrice, TH_Y, { width: COL_W.unitPrice, align: 'right' });
    doc.text('AMOUNT', COL.amount, TH_Y, { width: COL_W.amount, align: 'right' });

    currentY += TABLE_HDR_H;
    const ROW_PAD = 6;

    order.items.forEach((item, idx) => {
      const qty = Number(item.qty || 0);
      const finalUnitPrice = Number(item.finalPrice ?? item.price ?? 0);
      let addonTotal = 0;
      if (item.addons && Array.isArray(item.addons)) {
        addonTotal = item.addons.reduce((sum, a) => sum + (Number(a.price || 0) * (a.qty || 1)), 0) * qty;
      }
      const lineTotal = (qty * finalUnitPrice) + addonTotal;
      const nameText = item.name || 'Custom Product';

      const colorDisp = item.selectedColor ? `Color: ${item.selectedColor}` : '';
      const weightDisp = item.selectedWeight ? `Weight: ${item.selectedWeight}` : ((item.isCustomCake && item.customDetails && item.customDetails.weight) ? `Weight: ${item.customDetails.weight}` : '');
      const flavorDisp = item.selectedFlavor ? `Flavor: ${item.selectedFlavor}` : (getDisplayFlavor(item) !== 'Standard' ? `Flavor: ${getDisplayFlavor(item)}` : '');

      const subParts = [colorDisp, weightDisp, flavorDisp].filter(Boolean);
      if (Number(item.price) > finalUnitPrice) {
        subParts.push(`Original: Rs. ${Number(item.price).toFixed(2)}`);
      }
      let subtitle = subParts.length > 0 ? subParts.join(' · ') : '';

      if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
        const addonStr = item.addons.map(a => `+ ${a.name} (x${a.qty || 1}) - Rs. ${(a.price * (a.qty || 1)).toFixed(2)}`).join('\n');
        subtitle = subtitle ? `${subtitle}\n${addonStr}` : addonStr;
      }

      const nameH = doc.heightOfString(nameText, { font: 'Helvetica-Bold', fontSize: 8.5, width: COL_W.desc });
      const subH = subtitle ? doc.heightOfString(subtitle, { font: 'Helvetica', fontSize: 7.5, width: COL_W.desc }) + 2 : 0;
      const rowH = Math.max(nameH + subH + ROW_PAD * 2, 24);

      // Background shading for alternate rows
      doc.rect(MARGIN, currentY, CONTENT_W, rowH)
        .fillAndStroke(idx % 2 === 0 ? COLORS.cardBg : COLORS.white, COLORS.border);

      const cy = currentY + ROW_PAD;

      doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.textDark);
      doc.text(qty.toString(), COL.qty, cy, { width: COL_W.qty, align: 'center' });

      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.textDark);
      doc.text(nameText, COL.desc, cy, { width: COL_W.desc, align: 'left' });

      if (subtitle) {
        doc.font('Helvetica').fontSize(7.5).fillColor(COLORS.textMuted);
        doc.text(subtitle, COL.desc, cy + nameH + 2, { width: COL_W.desc, align: 'left' });
      }

      doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.textDark);
      doc.text('Rs. ' + finalUnitPrice.toFixed(2), COL.unitPrice, cy, { width: COL_W.unitPrice, align: 'right' });
      doc.text('Rs. ' + lineTotal.toFixed(2), COL.amount, cy, { width: COL_W.amount, align: 'right' });

      currentY += rowH;
    });

    currentY += 15;

    // ── SECTION 3: SUMMARY & SPECIAL NOTES ───────────────────────────────────
    const SUMMARY_W = 230;
    const SUMMARY_X = PAGE_W - MARGIN - SUMMARY_W;
    const NOTES_W = CONTENT_W - SUMMARY_W - 20;

    // Left Side: Notes Block
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.accent)
      .text('NOTES & INFORMATION', MARGIN, currentY);
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.textMuted)
      .text('• All items are freshly prepared according to order standards.\n• For support regarding this order, please present Order Ref ID.\n• GST (5%) is included in the item display price.', MARGIN, currentY + 12, { width: NOTES_W, lineGap: 3 });

    // Right Side: Totals Form Grid
    let ty = currentY;
    const LBL_W = 130;
    const VAL_W = 100;
    const SUM_LINE_H = 16;

    function sumRow(label, value) {
      doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.textMuted)
        .text(label, SUMMARY_X, ty, { width: LBL_W, align: 'left' });
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.textDark)
        .text(value, SUMMARY_X + LBL_W, ty, { width: VAL_W, align: 'right' });
      ty += SUM_LINE_H;
    }

    sumRow('Subtotal:', 'Rs. ' + Number(order.subtotal || 0).toFixed(2));

    if (order.discount > 0) {
      sumRow('Discount:', '-Rs. ' + Number(order.discount || 0).toFixed(2));
    }

    sumRow('Delivery Charge:', 'Rs. ' + Number(order.deliveryCharge || 0).toFixed(2));

    if (order.convenienceFee > 0) {
      sumRow('Convenience Fee:', 'Rs. ' + Number(order.convenienceFee || 0).toFixed(2));
    }

    sumRow('GST (5% Included):', 'Inclusive');

    ty += 4;
    drawDivider(doc, ty, COLORS.primary, 1);
    ty += 6;

    // Grand Total Solid Banner
    const GT_H = 26;
    doc.rect(SUMMARY_X, ty, SUMMARY_W, GT_H).fill(COLORS.primary);

    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.white)
      .text('GRAND TOTAL', SUMMARY_X + 10, ty + 8, { width: LBL_W, align: 'left' })
      .text('Rs. ' + Number(order.total || 0).toFixed(2), SUMMARY_X + LBL_W, ty + 8, { width: VAL_W - 10, align: 'right' });

    // ── FOOTER SECTION ───────────────────────────────────────────────────────
    const FOOTER_Y = PAGE_H - 50;
    drawDivider(doc, FOOTER_Y, COLORS.border, 0.75);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.primary)
      .text('Thank you for your order!', MARGIN, FOOTER_Y + 10, { width: CONTENT_W, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.textMuted)
      .text('The Chocolate Mine · Premium Artisan Bakery', MARGIN, FOOTER_Y + 22, { width: CONTENT_W, align: 'center' });

    doc.rect(0, PAGE_H - 4, PAGE_W, 4).fill(COLORS.accent);

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

  } catch (err) {
    logger.error('Invoice Generation Error:', err.message);
    throw err;
  }
};

exports.sendInvoiceAfterDelivery = async (orderId, forceResend = false) => {
  try {
    const order = await Order.findById(orderId).populate('userId');
    if (!order) return false;
    if (order.invoiceSent && !forceResend) return true;

    const pdfBuffer = await exports.generateInvoiceBuffer(orderId);
    const emailInfo = await emailService.sendInvoiceEmail(order.userId.email, order, pdfBuffer);

    if (emailInfo) {
      await telegramService.sendInvoiceReady(order.userId.phone, order.orderNumber, 'Email Sent');
      order.invoiceSent = true;
      order.invoiceSentAt = new Date();
      await order.save();
      return true;
    }
    return false;
  } catch (err) {
    logger.error('Send Invoice Error:', err.message);
    return false;
  }
};