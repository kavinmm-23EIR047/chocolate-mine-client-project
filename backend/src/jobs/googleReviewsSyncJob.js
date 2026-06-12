const cron = require('node-cron');
const googleReviewsSyncService = require('../services/googleReviewsSyncService');
const config = require('../config/googlePlaces');

exports.initScheduledJobs = () => {
  if (!config.ENABLED) {
    console.log('ℹ️ Google Reviews sync job is disabled.');
    return;
  }

  // Get cron expression from env or default to every 6 hours
  const cronExpression = process.env.GOOGLE_REVIEWS_SYNC_CRON || '0 */6 * * *';

  console.log(`⏱️ Scheduling Google Reviews Sync Job: ${cronExpression}`);
  
  cron.schedule(cronExpression, async () => {
    try {
      console.log(`⏰ Running scheduled Google Reviews sync at ${new Date().toISOString()}`);
      await googleReviewsSyncService.syncReviews();
    } catch (error) {
      console.error('❌ Scheduled Google Reviews sync failed:', error.message);
    }
  });

  // Optional Full Refresh & Cleanup (Every Sunday at Midnight)
  cron.schedule('0 0 * * 0', async () => {
    try {
      console.log(`⏰ Running Sunday full refresh & cleanup for Google Reviews at ${new Date().toISOString()}`);
      await googleReviewsSyncService.syncReviews();
    } catch (error) {
      console.error('❌ Sunday refresh failed:', error.message);
    }
  });

  // Trigger on startup if configured
  if (process.env.GOOGLE_REVIEWS_SYNC_ON_STARTUP === 'true') {
    setTimeout(async () => {
      console.log('🚀 Triggering initial Google Reviews sync on startup...');
      try {
        await googleReviewsSyncService.syncReviews();
      } catch (err) {
        console.error('Startup sync failed:', err.message);
      }
    }, 5000); // 5 seconds after startup
  }
};
