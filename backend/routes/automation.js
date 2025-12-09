const express = require('express');
const router = express.Router();
const matchmakerService = require('../services/matchmakerService');
const certifierService = require('../services/certifierService');
const logger = require('../middleware/logger');

// Run supplier matching automation
router.post('/matchmaker/run', async (req, res) => {
  try {
    logger.info('Running supplier matching automation');
    const results = await matchmakerService.matchAllPendingRFQs();
    res.json({ success: true, matched: results.length });
  } catch (error) {
    logger.error('Matchmaker automation failed:', error);
    res.status(500).json({ error: 'Automation failed' });
  }
});

// Verify all certifications
router.post('/certifier/verify-all', async (req, res) => {
  try {
    logger.info('Running certification verification');
    const results = await certifierService.verifyAllCertifications();
    res.json({ success: true, verified: results.length });
  } catch (error) {
    logger.error('Certification verification failed:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Sync data from providers
router.post('/data-providers/sync', async (req, res) => {
  try {
    logger.info('Syncing data from providers');
    // Add your data sync logic here
    res.json({ success: true, message: 'Data sync initiated' });
  } catch (error) {
    logger.error('Data sync failed:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Process pending notifications
router.post('/notifications/process', async (req, res) => {
  try {
    logger.info('Processing notifications');
    // Add notification processing logic
    res.json({ success: true, message: 'Notifications processed' });
  } catch (error) {
    logger.error('Notification processing failed:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Generate reports
router.post('/reports/generate', async (req, res) => {
  try {
    logger.info('Generating reports');
    // Add report generation logic
    res.json({ success: true, message: 'Reports generated' });
  } catch (error) {
    logger.error('Report generation failed:', error);
    res.status(500).json({ error: 'Generation failed' });
  }
});

module.exports = router;
