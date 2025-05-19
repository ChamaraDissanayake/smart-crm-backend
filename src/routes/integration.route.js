const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.control');

// 🔵 Facebook Login Routes
router.get('/facebook/login', integrationController.redirectToFacebookLogin);
router.get('/facebook/callback', integrationController.handleFacebookCallback);
router.get('/facebook/status', integrationController.getIntegrationStatus);
router.post('/facebook/disconnect', integrationController.disconnectIntegration);

module.exports = router;