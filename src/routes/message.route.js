// src/routes/message.route.js
import express from 'express';
import {
    sendMessageController,
    receiveMessageWebhook,
} from '../controllers/message.control.js';

const router = express.Router();

// Send a message
router.post('/send', sendMessageController);

// Webhook for incoming messages from Twilio
router.post('/webhook', receiveMessageWebhook);

export default router;
