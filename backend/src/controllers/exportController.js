const excelService = require('../services/excelService');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Download the master export excel file
 * @route   GET /api/v1/export/download
 * @access  Private/Admin
 */
exports.downloadMasterExport = async (req, res, next) => {
  try {
    const masterFile = excelService.getMasterFile();
    
    // Check if the file exists, if not initialize it
    if (!fs.existsSync(masterFile)) {
      await excelService.initializeAllCollections();
    }
    
    res.download(masterFile, 'master_export.xlsx', (err) => {
      if (err) {
        console.error('Error downloading excel file:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('Error in downloadMasterExport:', error);
    res.status(500).json({ success: false, message: 'Server error during export' });
  }
};

/**
 * @desc    Manually trigger a sync of all collections to the master excel file
 * @route   POST /api/v1/export/sync
 * @access  Private/Admin
 */
exports.syncMasterExport = async (req, res, next) => {
  try {
    await excelService.initializeAllCollections();
    res.status(200).json({ success: true, message: 'Excel export manually synced successfully' });
  } catch (error) {
    console.error('Error in syncMasterExport:', error);
    res.status(500).json({ success: false, message: 'Server error during export sync' });
  }
};
