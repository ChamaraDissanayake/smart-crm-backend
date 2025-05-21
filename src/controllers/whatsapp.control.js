const whatsappService = require('../services/whatsapp.service');

const sendWhatsAppMessage = async (req, res) => {
    try {
        const { to, message, companyId } = req.body;

        if (!to || !message || !companyId) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        const result = await whatsappService.sendMessage({ to, message, companyId });
        res.json(result);

    } catch (error) {
        console.error('❌ Send Error:', error.message || error);
        res.status(500).json({ error: error.message || 'Failed to send WhatsApp message.' });
    }
};

const verifyWebhook = (req, res) => {
    const VERIFY_TOKEN = process.env.FB_WEBHOOK_VERIFY_TOKEN;

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified');
        return res.status(200).send(challenge);
    }

    console.warn('❌ Webhook verification failed');
    res.sendStatus(403);
};

const receiveWhatsAppMessage = async (req, res) => {
    try {
        const data = req.body;
        await whatsappService.handleIncomingMessage(data);
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Receive Error:', error);
        res.status(500).json({ error: 'Failed to process incoming message.' });
    }
};

module.exports = {
    sendWhatsAppMessage,
    receiveWhatsAppMessage,
    verifyWebhook
}