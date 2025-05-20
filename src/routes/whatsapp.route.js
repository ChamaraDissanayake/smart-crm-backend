const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.control');

router.post('/send', whatsappController.sendWhatsAppMessage);
router.post('/receive', whatsappController.receiveWhatsAppMessage);

module.exports = router;
