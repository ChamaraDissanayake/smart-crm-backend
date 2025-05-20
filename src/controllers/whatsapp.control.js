const whatsappService = require('../services/whatsapp.service');

const sendWhatsAppMessage = async (req, res) => {
    try {
        const { to, message, companyId, userId } = req.body;

        if (!to || !message || !companyId || !userId) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        const result = await whatsappService.sendMessage({ to, message, companyId, userId });
        res.json(result);

    } catch (error) {
        console.error('❌ Send Error:', error.message || error);
        res.status(500).json({ error: error.message || 'Failed to send WhatsApp message.' });
    }
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
    receiveWhatsAppMessage
}