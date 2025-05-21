const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.control');

router.post('/send', whatsappController.sendWhatsAppMessage);
router.get('/webhook', whatsappController.verifyWebhook);  // GET for Meta verification
router.post('/webhook', whatsappController.receiveWhatsAppMessage);  // POST for messages

module.exports = router;
