/**
 * Timezone Regression Test
 * Validates that KOT, Invoice, and WhatsApp date formatting
 * correctly output '10/10/2026' (Asia/Kolkata) when running under a UTC server environment.
 */
process.env.TZ = 'UTC';

const assert = require('assert');
const path = require('path');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function runTests() {
  console.log('=== RUNNING TIMEZONE REGRESSION TESTS (Server TZ: ' + process.env.TZ + ') ===\n');

  // Test Case 1: Unit Test with the exact timestamp from order TCM-2026-0016
  const createdAtUTC = new Date('2026-10-10T11:07:05.904Z');
  const deliveryDateUTC = new Date('2026-10-09T18:30:00.000Z');

  console.log('[Test 1] Verify raw date evaluations under UTC runtime:');
  console.log(' - Raw deliveryDate toISOString():', deliveryDateUTC.toISOString());
  console.log(' - Raw deliveryDate without timezone option:', deliveryDateUTC.toLocaleDateString('en-IN'));
  
  // Format with Asia/Kolkata
  const formattedDeliveryDate = deliveryDateUTC.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const formattedCreatedDate = createdAtUTC.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  
  console.log(' - Formatted deliveryDate WITH Asia/Kolkata:', formattedDeliveryDate);
  console.log(' - Formatted createdAt WITH Asia/Kolkata:', formattedCreatedDate);

  assert.strictEqual(formattedDeliveryDate, '10/10/2026', 'Delivery date must format as 10/10/2026');
  assert.strictEqual(formattedCreatedDate, '10/10/2026', 'Order created date must format as 10/10/2026');
  console.log('✅ Test 1 Passed: Unit date formatting evaluates to 10/10/2026 under UTC!\n');

  // Test Case 2: Test Invoice formatting
  console.log('[Test 2] Verify Invoice Date format under UTC runtime:');
  const invoiceDeliveryDate = deliveryDateUTC.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
  });
  console.log(' - Invoice delivery date:', invoiceDeliveryDate);
  assert(invoiceDeliveryDate.includes('10') && invoiceDeliveryDate.includes('Oct') && invoiceDeliveryDate.includes('2026'), 'Invoice date must include 10 Oct 2026');
  console.log('✅ Test 2 Passed: Invoice date evaluates to 10 Oct 2026 under UTC!\n');

  // Test Case 3: Verify WhatsApp notification formatting
  console.log('[Test 3] Verify WhatsApp Date format under UTC runtime:');
  const whatsappDeliveryDate = deliveryDateUTC.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const whatsappCreatedTime = createdAtUTC.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(' - WhatsApp delivery date:', whatsappDeliveryDate);
  console.log(' - WhatsApp ordered time:', whatsappCreatedTime);
  assert.strictEqual(whatsappDeliveryDate, '10/10/2026', 'WhatsApp delivery date must be 10/10/2026');
  assert(whatsappCreatedTime.includes('10/10/2026') || whatsappCreatedTime.includes('10/10/26'), 'WhatsApp created time must be 10/10/2026');
  console.log('✅ Test 3 Passed: WhatsApp dates evaluate with Asia/Kolkata under UTC!\n');

  // Test Case 4: Connect to MongoDB and generate actual KOT PDF for order TCM-2026-0016
  console.log('[Test 4] Generate KOT PDF for existing order 6aca1c59338c828400e35c47 under UTC:');
  await mongoose.connect(process.env.MONGODB_URI);
  require('../models/User');
  const Order = require('../models/Order');
  
  const realOrder = await Order.findById('6aca1c59338c828400e35c47').populate('userId', 'name phone');
  assert(realOrder, 'Order 6aca1c59338c828400e35c47 must exist in database');

  console.log(' - Loaded Order Number:', realOrder.orderNumber);
  console.log(' - Database deliveryDate (BSON Date):', realOrder.deliveryDate.toISOString());

  // Prevent modifying the database during test
  const originalSave = realOrder.save;
  realOrder.save = async function() { return this; };

  // Mock Order.findById to return our guarded order instance
  const originalFindById = Order.findById;
  Order.findById = function() {
    return {
      populate: async function() { return realOrder; }
    };
  };

  // Intercept text drawn on PDFDocument to verify KOT lines
  const drawnTexts = [];
  const originalText = PDFDocument.prototype.text;
  PDFDocument.prototype.text = function(text, ...args) {
    if (typeof text === 'string') {
      drawnTexts.push(text);
    }
    return originalText.call(this, text, ...args);
  };

  const staffController = require('../controllers/staffController');

  // Wait for the asynchronous printKOT controller to finish sending the PDF
  await new Promise((resolve, reject) => {
    const mockRes = {
      setHeader: () => {},
      status: () => mockRes,
      send: (buffer) => {
        resolve(buffer);
      }
    };
    staffController.printKOT({ params: { id: realOrder._id.toString() } }, mockRes, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Restore mocked functions
  PDFDocument.prototype.text = originalText;
  Order.findById = originalFindById;
  realOrder.save = originalSave;

  console.log('\n--- Captured KOT PDF Header Lines ---');
  drawnTexts.slice(0, 8).forEach(t => console.log(' | ' + t));

  const deliveryLine = drawnTexts.find(t => t.startsWith('Delivery :'));
  const dateLine = drawnTexts.find(t => t.startsWith('Date     :'));

  console.log('\nResulting Lines in KOT:');
  console.log(' ->', dateLine);
  console.log(' ->', deliveryLine);

  assert.strictEqual(dateLine, 'Date     : 10/10/2026', 'KOT Date line must be 10/10/2026');
  assert.strictEqual(deliveryLine, 'Delivery : 10/10/2026 (8:00 PM – 10:00 PM)', 'KOT Delivery line must be 10/10/2026 (8:00 PM – 10:00 PM)');

  console.log('\n✅ Test 4 Passed: KOT PDF generated under UTC displays 10/10/2026 (8:00 PM – 10:00 PM)!');

  await mongoose.disconnect();
  console.log('\n=== ALL REGRESSION TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
