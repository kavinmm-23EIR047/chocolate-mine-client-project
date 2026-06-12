const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const GoogleReview = require('../models/GoogleReview');

exports.exportReviewsToExcel = async () => {
  try {
    const reviews = await GoogleReview.find().sort({ time: -1 }).lean();
    
    const data = reviews.map(r => ({
      'Review ID': r.reviewId,
      'Customer Name': r.authorName,
      'Rating': r.rating,
      'Review Text': r.text || '',
      'Review Date': r.time ? new Date(r.time).toISOString() : '',
      'Language': r.language || '',
      'Owner Response': r.responseFromOwner?.text || '',
      'Response Date': r.responseFromOwner?.time ? new Date(r.responseFromOwner.time).toISOString() : '',
      'Sync Date': r.syncedAt ? new Date(r.syncedAt).toISOString() : '',
      'Visible Status': r.isVisible ? 'Yes' : 'No',
      'Google Profile URL': r.authorUrl || ''
    }));

    if (data.length === 0) {
      data.push({}); // Ensure at least headers are generated
    }

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    
    // Auto-fit columns
    const objectMaxLength = [];
    Object.keys(data[0]).forEach((key, i) => {
      objectMaxLength[i] = { wch: key.length + 2 };
    });
    data.forEach(row => {
      Object.keys(row).forEach((key, i) => {
        let val = row[key] ? String(row[key]) : '';
        if (val.length > 50) val = val.substring(0, 50);
        if (objectMaxLength[i].wch < val.length + 2) objectMaxLength[i].wch = val.length + 2;
      });
    });
    ws['!cols'] = objectMaxLength;

    xlsx.utils.book_append_sheet(wb, ws, 'Google Reviews');

    const EXPORTS_DIR = path.join(__dirname, '../../exports');
    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    const filePath = path.join(EXPORTS_DIR, `google_reviews_export_${Date.now()}.xlsx`);
    xlsx.writeFile(wb, filePath);
    
    return filePath;
  } catch (error) {
    console.error('Error exporting Google Reviews to Excel:', error);
    throw error;
  }
};
