// src/controllers/message.control.js
import {
    sendMessage,
    storeIncomingMessage
} from '../services/message.service.js';

export const sendMessageController = async (req, res) => {
    try {
        const { to, body, companyId } = req.body;
        const message = await sendMessage({ to, body, companyId });
        res.json({ success: true, message });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

export const receiveMessageWebhook = async (req, res) => {
    const { From, Body } = req.body;

    try {
        await storeIncomingMessage(From, Body);
        res.status(200).send('<Response></Response>');
    } catch (err) {
        console.error(err);
        res.status(500).send('<Response></Response>');
    }
};
