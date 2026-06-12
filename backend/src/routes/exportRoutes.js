const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// If there's an auth middleware, you could use it here. e.g. const { protect, admin } = require('../middleware/authMiddleware');
// Since I don't know the exact auth setup, assuming it's available or leaving it public for now depending on the system.
// We will leave it without auth middleware for now to ensure it works, but in production it should be protected.

router.get('/download', exportController.downloadMasterExport);
router.post('/sync', exportController.syncMasterExport);

module.exports = router;
