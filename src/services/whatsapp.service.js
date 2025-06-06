//src/services/whatsapp.service.js
const axios = require('axios');
const {
    getWhatsAppIntegration
} = require('../models/whatsapp.model');
const { getOrCreateCustomerByPhone } = require('./customer.service');
const { generateBotResponse, saveAndEmitMessage, findOrCreateThread } = require('./chat.service');

const BASE_GRAPH_URI = process.env.BASE_GRAPH_URI || 'https://graph.facebook.com/v22.0';

const saveAndEmitWhatsAppMessage = async ({ phone, content, role, companyId, phoneNumberId }) => {
    // Inline logic to resolve companyId, customerId, threadId
    if (!companyId && phoneNumberId) {
        const integration = await getWhatsAppIntegration({ phoneNumberId });
        if (!integration) throw new Error('No integration found for phoneNumberId');
        companyId = integration.company_id;
    }

    if (!companyId) throw new Error('Missing companyId and phoneNumberId — can’t resolve company context');

    const customerId = await getOrCreateCustomerByPhone({ phone, companyId });

    const thread = await findOrCreateThread({
        customerId,
        companyId,
        channel: 'whatsapp'
    });

    const threadId = thread.id;

    // Save and emit message to frontend
    await saveAndEmitMessage({
        threadId,
        role,
        content
    });

    return { thread };
};

const sendMessage = async ({ to, message, companyId }) => {
    const integration = await getWhatsAppIntegration({ companyId });

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

    await saveAndEmitWhatsAppMessage({
        phone: to,
        content: message,
        role: 'assistant',
        companyId
    });

    return { status: 'sent', response: res.data };
};

const handleIncomingMessage = async (data) => {
    const messageObj = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const phoneNumberId = data?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    const receiverPhone = data?.entry?.[0]?.changes?.[0]?.value?.metadata?.display_phone_number;

    if (!messageObj || messageObj.type !== 'text') {
        console.warn('⚠️ Ignored non-text or missing message.');
        return;
    }

    const senderWaId = messageObj.from;
    const text = messageObj.text?.body;

    if (!senderWaId || !text || !receiverPhone || !phoneNumberId) {
        console.warn('⚠️ Missing key data (sender, receiver, text, phoneNumberId). Skipping.');
        return;
    }

    console.log(`💬 Message: ${text}`);

    const { thread } = await saveAndEmitWhatsAppMessage({
        phone: senderWaId,
        content: text,
        role: 'user',
        phoneNumberId
    });

    if (thread.current_handler === 'bot') {
        const { botResponse } = await generateBotResponse({
            threadId: thread.id,
            companyId: thread.company_id
        });

        // Send only the clean message to customer
        await sendMessage({ to: senderWaId, message: botResponse, companyId: thread.company_id });
    }
};

module.exports = {
    sendMessage,
    handleIncomingMessage
};