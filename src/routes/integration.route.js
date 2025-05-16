const express = require('express');
const integrationController = require('../controllers/integration.control');

const router = express.Router();

// Redirect user to Facebook Login URL
router.get('/facebook/login', integrationController.redirectToFacebookLogin);

// Facebook OAuth callback handler
router.get('/facebook/callback', integrationController.handleFacebookCallback);

module.exports = router;