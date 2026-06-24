const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const emailService = require('./emailService');
const telegramService = require('./telegramService');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// ─── Brand Palette (Mapped from theme.css Light Theme) ────────────────────────
const COLORS = {
  brandBg:      '#EBDEDA', // --background (Soft Rose Cream)
  brandCard:    '#F1E6E2', // --card
  brandPrimary: '#4E2820', // --primary (Deep Cocoa)
  brandText:    '#2D1B17', // --foreground
  brandMuted:   '#7C6660', // --muted
  brandAccent:  '#C98F45', // --accent (Caramel Gold)
  border:       '#D5C0BA', // --border
  white:        '#FFFFFF',
};

// ─── Layout Constants ─────────────────────────────────────────────────────────
const PAGE_W    = 595.28; // A4 Width
const PAGE_H    = 841.89; // A4 Height
const MARGIN    = 45;
const CONTENT_W = PAGE_W - MARGIN * 2;   // 505.28 pt

// Table Columns configuration
const COL = {
  qty:       MARGIN,
  desc:      MARGIN + 45,
  unitPrice: MARGIN + 315,
  amount:    MARGIN + 415,
};
const COL_W = {
  qty:       45,
  desc:      270,
  unitPrice: 100,
  amount:    90,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hRule(doc, y, color, thickness) {
  color     = color     || COLORS.border;
  thickness = thickness || 1;
  doc.save()
     .moveTo(MARGIN, y)
     .lineTo(PAGE_W - MARGIN, y)
     .lineWidth(thickness)
     .strokeColor(color)
     .stroke()
     .restore();
}

// ─── Helper: Resolve dynamic display flavor for order items ───────────────────
function getDisplayFlavor(item) {
  if (!item) return 'Standard';
  if (item.isCustomCake) return item.selectedFlavor || 'Custom';
  var flavor = item.selectedFlavor;
  if (!flavor || flavor.toLowerCase() === 'standard') {
    var cat = String(item.category || '').toLowerCase();
    var name = String(item.name || '').toLowerCase();
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
    const order = await Order.findById(orderId).populate('userId');
    if (!order) throw new Error('Order not found');

    if (!order.invoiceNumber) {
      order.invoiceNumber = `INV-${Date.now()}`;
      await order.save();
    }

    const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    // ── Cream Background Surface ──────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(COLORS.brandBg);

    // ── Top Aesthetic Structural Border Bar ───────────────────────────────────
    doc.rect(MARGIN, 20, CONTENT_W, 4).fill(COLORS.brandPrimary);

    // ─────────────────────────────────────────────────────────────────────────
    //  HEADER SECTION (Text-Logo Left | Invoice Meta Details Right)
    // ─────────────────────────────────────────────────────────────────────────
    const HEADER_TOP = 42;

    // Render Text-Logo mimicking requested font style & matching exact widths
    doc.save();
    // Layer 1: "THE CHOCOLATE"
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor(COLORS.brandAccent)
       .text('T H E   C H O C O L A T E', MARGIN, HEADER_TOP, { lineBreak: false });
    
    // Layer 2: "MINE" scaled up to match structural text block width bounds
    doc.font('Helvetica-Bold')
       .fontSize(38)
       .fillColor(COLORS.brandPrimary)
       .text('MINE', MARGIN, HEADER_TOP + 12, { lineBreak: false });
    
    // Sub-label tagline description
    doc.font('Helvetica-Oblique')
       .fontSize(9)
       .fillColor(COLORS.brandMuted)
       .text('Premium Artisan Bakery', MARGIN, HEADER_TOP + 54, { lineBreak: false });
    doc.restore();

    // Right Side Metadata Block
    const INV_W = 180;
    const INV_X = PAGE_W - MARGIN - INV_W;
    
    doc.font('Helvetica-Bold').fontSize(26).fillColor(COLORS.brandPrimary)
       .text('INVOICE', INV_X, HEADER_TOP, { width: INV_W, align: 'right', lineBreak: false });

    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.brandMuted)
       .text('Invoice No:', INV_X, HEADER_TOP + 36, { width: 65, align: 'left' });
    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.brandText)
       .text(order.invoiceNumber, INV_X + 65, HEADER_TOP + 36, { width: INV_W - 65, align: 'right' });

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.brandMuted)
       .text('Date:', INV_X, HEADER_TOP + 48, { width: 65, align: 'left' });
    doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.brandText)
       .text(invoiceDate, INV_X + 65, HEADER_TOP + 48, { width: INV_W - 65, align: 'right' });

    // Divider separating header structures cleanly
    hRule(doc, 118, COLORS.brandPrimary, 1.5);

    // ─────────────────────────────────────────────────────────────────────────
    //  CLIENT DETAILS (BILL TO)
    // ─────────────────────────────────────────────────────────────────────────
    const BILL_TOP = 132;

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.brandAccent)
       .text('BILL TO', MARGIN, BILL_TOP);

    const addrLine = [
      order.address && order.address.houseNo,
      order.address && order.address.street,
      order.address && order.address.city,
      order.address && order.address.pincode,
    ].filter(Boolean).join(', ');

    const BILL_NAME_Y = BILL_TOP + 14;
    const BILL_TEXT_W = 280;

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.brandText)
       .text((order.address && order.address.fullName) || '—', MARGIN, BILL_NAME_Y, { width: BILL_TEXT_W });

    const nameH = doc.heightOfString((order.address && order.address.fullName) || '—',
                  { font: 'Helvetica-Bold', fontSize: 11, width: BILL_TEXT_W });

    doc.font('Helvetica').fontSize(9).fillColor(COLORS.brandMuted)
       .text('Phone: ' + ((order.address && order.address.phone) || '—'), MARGIN, BILL_NAME_Y + nameH + 3, { width: BILL_TEXT_W })
       .text(addrLine || '—', MARGIN, BILL_NAME_Y + nameH + 16, { width: BILL_TEXT_W });

    // Status / Payment Badge Content block
    const BADGE_W = 160;
    const BADGE_X = PAGE_W - MARGIN - BADGE_W;
    doc.roundedRect(BADGE_X, BILL_TOP + 12, BADGE_W, 26, 6).fill(COLORS.brandCard);
    doc.rect(BADGE_X, BILL_TOP + 12, BADGE_W, 26).lineWidth(1).strokeColor(COLORS.border).stroke();
    
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.brandPrimary)
       .text('PAYMENT: ' + (order.paymentMethod || '—').toUpperCase(), BADGE_X, BILL_TOP + 21,
             { width: BADGE_W, align: 'center', lineBreak: false });

    // Clean structural separation row line
    hRule(doc, 215, COLORS.border, 1);

    // ─────────────────────────────────────────────────────────────────────────
    //  INVOICE ITEM DETAILS TABLE
    // ─────────────────────────────────────────────────────────────────────────
    const TABLE_TOP = 230;
    const HEADER_H  = 26;

    // Table primary heading background accent fill
    doc.rect(MARGIN, TABLE_TOP, CONTENT_W, HEADER_H).fill(COLORS.brandPrimary);

    const HL_Y = TABLE_TOP + 8;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.white);
    doc.text('QTY',         COL.qty,       HL_Y, { width: COL_W.qty,       align: 'center' });
    doc.text('DESCRIPTION', COL.desc,      HL_Y, { width: COL_W.desc,      align: 'left' });
    doc.text('UNIT PRICE',  COL.unitPrice, HL_Y, { width: COL_W.unitPrice, align: 'right' });
    doc.text('AMOUNT',      COL.amount,    HL_Y, { width: COL_W.amount,    align: 'right' });

    // Render Product Row Loop
    let rowY   = TABLE_TOP + HEADER_H;
    const ROW_PAD = 8;

    order.items.forEach(function(item, idx) {
      const qty   = Number(item.qty   || 0);
      const price = Number(item.price || 0);
      const total = qty * price;
      const nameText = item.name || '—';

      // Build subtitle with flavor/weight
      const resolvedFlavor = getDisplayFlavor(item);
      const showFlavor = item.selectedFlavor || resolvedFlavor !== 'Standard';
      const weight = item.selectedWeight || (item.isCustomCake && item.customDetails && item.customDetails.weight) || '';
      const flavorDisplay = item.isCustomCake
        ? (item.customDetails && item.customDetails.flavour ? item.customDetails.flavour : resolvedFlavor)
        : (showFlavor ? resolvedFlavor : '');
      const subParts = [flavorDisplay, weight].filter(Boolean);
      const subtitle = subParts.length > 0 ? subParts.join(' · ') : '';

      // Calculate row height based on name + optional subtitle
      const nameH = doc.heightOfString(nameText, { font: 'Helvetica', fontSize: 9, width: COL_W.desc });
      const subH = subtitle ? doc.heightOfString(subtitle, { font: 'Helvetica-Oblique', fontSize: 7.5, width: COL_W.desc }) + 2 : 0;
      const rowH = Math.max(nameH + subH + ROW_PAD * 2, 26);

      // Explicit alternate background tracking row strips
      doc.rect(MARGIN, rowY, CONTENT_W, rowH)
         .fill(idx % 2 === 0 ? COLORS.white : COLORS.brandCard);

      // Row inline borders bounds fix
      doc.rect(MARGIN, rowY, CONTENT_W, rowH).lineWidth(0.5).strokeColor(COLORS.border).stroke();

      const cy = rowY + ROW_PAD;
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.brandText);
      doc.text(qty.toString(),             COL.qty,       cy, { width: COL_W.qty,       align: 'center' });
      doc.text(nameText,                    COL.desc,      cy, { width: COL_W.desc,      align: 'left' });
      if (subtitle) {
        doc.font('Helvetica-Oblique').fontSize(7.5).fillColor(COLORS.brandMuted);
        doc.text(subtitle, COL.desc, cy + nameH + 1, { width: COL_W.desc, align: 'left' });
      }
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.brandText);
      doc.text('Rs. ' + price.toFixed(2),   COL.unitPrice, cy, { width: COL_W.unitPrice, align: 'right' });
      doc.text('Rs. ' + total.toFixed(2),   COL.amount,    cy, { width: COL_W.amount,    align: 'right' });

      rowY += rowH;
    });

    // ─────────────────────────────────────────────────────────────────────────
    //  SUMMARY CALCULATIONS & TOTALS CLOSING
    // ─────────────────────────────────────────────────────────────────────────
    const TOT_LBL_X  = PAGE_W - MARGIN - 240;
    const TOT_LBL_W  = 130;
    const TOT_VAL_X  = TOT_LBL_X + TOT_LBL_W;
    const TOT_VAL_W  = 110;
    const LINE_H     = 20;

    let ty = rowY + 15;

    function summaryLine(label, value) {
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.brandMuted)
         .text(label, TOT_LBL_X, ty, { width: TOT_LBL_W, align: 'left' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.brandText)
         .text(value, TOT_VAL_X, ty, { width: TOT_VAL_W, align: 'right' });
      ty += LINE_H;
    }

    summaryLine('Subtotal',        'Rs. ' + Number(order.subtotal       || 0).toFixed(2));
    if (order.discount > 0) {
      summaryLine('Discount',      '-Rs. ' + Number(order.discount      || 0).toFixed(2));
    }
    summaryLine('Delivery Charge', 'Rs. ' + Number(order.deliveryCharge || 0).toFixed(2));
    summaryLine('Convenience Fee', 'Rs. ' + Number(order.convenienceFee || 0).toFixed(2));
    summaryLine('GST',             'Rs. ' + Number(order.gst            || 0).toFixed(2));

    ty += 4;
    hRule(doc, ty, COLORS.brandPrimary, 1);
    ty += 6;

    // Grand Total Clean Display Row
    const GT_H = 32;
    doc.rect(MARGIN, ty, CONTENT_W, GT_H).fill(COLORS.brandPrimary);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white)
       .text('GRAND TOTAL', MARGIN + 12, ty + 11, { width: CONTENT_W * 0.5, align: 'left' })
       .text('Rs. ' + Number(order.total || 0).toFixed(2), MARGIN + CONTENT_W * 0.5, ty + 11, { width: CONTENT_W * 0.5 - 24, align: 'right' });

    // ─────────────────────────────────────────────────────────────────────────
    //  STABLE FOOTER RUNTIME DESIGN
    // ─────────────────────────────────────────────────────────────────────────
    const FOOTER_TOP = PAGE_H - 70;
    hRule(doc, FOOTER_TOP, COLORS.border, 1);

    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.brandPrimary)
       .text('Thank you for choosing The Chocolate Mine!', MARGIN, FOOTER_TOP + 14, { width: CONTENT_W, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor(COLORS.brandMuted)
       .text('Freshly baked with care  ·  Every bite tells a story', MARGIN, FOOTER_TOP + 28, { width: CONTENT_W, align: 'center' });

    // Decorative baseline border ring
    doc.rect(MARGIN, PAGE_H - 20, CONTENT_W, 4).fill(COLORS.brandPrimary);

    doc.end();

    return new Promise(function(resolve) {
      doc.on('end', function(){ resolve(Buffer.concat(buffers)); });
    });

  } catch (err) {
    logger.error('Invoice Buffer Error:', err.message);
    throw err;
  }
};

exports.sendInvoiceAfterDelivery = async (orderId, forceResend) => {
  forceResend = forceResend || false;
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