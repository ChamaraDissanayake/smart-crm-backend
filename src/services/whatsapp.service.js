const axios = require('axios');
const {
    createThreadIfNotExists,
    createWhatsAppMessage,
    getWhatsAppIntegration,
    findOrCreateWhatsAppThread } = require('../models/whatsapp.model');

const BASE_GRAPH_URI = process.env.BASE_GRAPH_URI || 'https://graph.facebook.com/v22.0';

const sendMessage = async ({ to, message, companyId, userId }) => {

    // 👉 Get integration from DB
    const integration = await getWhatsAppIntegration({ userId, companyId });

    if (!integration) {
        throw new Error('No active WhatsApp integration found');
    }

    const { access_token, phone_number_id } = integration;
    const url = `${BASE_GRAPH_URI}/${phone_number_id}/messages`;

    const res = await axios.post(
        url,
        {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message },
        },
        {
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
        }
    );

    // 💬 Ensure chat thread exists
    const threadId = await findOrCreateWhatsAppThread({
        userId,
        companyId,
        channel: 'whatsapp'
    });

    await createWhatsAppMessage({
        thread_id: threadId,
        role: 'assistant',
        content: message
    });

    return { status: 'sent', response: res.data };
};

const handleIncomingMessage = async (data) => {
    const entry = data.entry?.[0];
    const changes = entry?.changes?.[0];
    const messageObj = changes?.value?.messages?.[0];
    const waId = messageObj?.from;
    const text = messageObj?.text?.body;

    if (!waId || !text) return;

    // For demo purposes, using dummy company/user IDs. Replace with real mapping.
    const companyId = 'dummy-company-id';
    const userId = 'dummy-user-id';

    const threadId = await createThreadIfNotExists(companyId, userId, 'whatsapp');
    await createWhatsAppMessage(threadId, 'user', text);
};

module.exports = {
    sendMessage,
    handleIncomingMessage
}