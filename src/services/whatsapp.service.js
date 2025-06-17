//src/services/whatsapp.service.js
const axios = require('axios');
const {
    getWhatsAppIntegration
} = require('../models/whatsapp.model');
const { getOrCreateCustomerByPhone } = require('./customer.service');
const { generateBotResponse, saveAndEmitMessage, findOrCreateThread } = require('./chat.service');

const BASE_GRAPH_URI = process.env.BASE_GRAPH_URI || 'https://graph.facebook.com/v22.0';

const saveAndEmitWhatsAppMessage = async ({ phone, name, content, role, companyId, phoneNumberId }) => {
    // Inline logic to resolve companyId, customerId, threadId
    if (!companyId && phoneNumberId) {
        const integration = await getWhatsAppIntegration({ phoneNumberId });
        if (!integration) throw new Error('No integration found for phoneNumberId');
        companyId = integration.company_id;
    }

    if (!companyId) throw new Error('Missing companyId and phoneNumberId — can’t resolve company context');

    const customerId = await getOrCreateCustomerByPhone({ phone, name, companyId });

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
    const value = data?.entry?.[0]?.changes?.[0]?.value;
    const messageObj = value?.messages?.[0];
    const phoneNumberId = value?.metadata?.phone_number_id;
    const customerPhone = value?.metadata?.display_phone_number;
    const customerName = value?.contacts?.[0]?.profile?.name;

    // Handle status updates like 'sent', 'delivered', etc.
    const statusUpdate = value?.statuses?.[0]?.status;
    if (statusUpdate) {
        console.log('📦 Message status update:', statusUpdate);
        return;
    }

    // Ensure a message is present
    if (!messageObj) {
        console.warn('⚠️ No message object found. Skipping.');
        return;
    }

    const senderWaId = messageObj.from;
    const messageType = messageObj.type;
    let content = '';

    switch (messageType) {
        case 'text':
            content = messageObj.text?.body;
            break;
        case 'image':
            content = `[Image] Media ID: ${messageObj.image?.id}`;
            break;
        case 'document':
            content = `[Document] Filename: ${messageObj.document?.filename}, Media ID: ${messageObj.document?.id}`;
            break;
        case 'audio':
            content = `[Audio] Media ID: ${messageObj.audio?.id}`;
            break;
        case 'video':
            content = `[Video] Media ID: ${messageObj.video?.id}`;
            break;
        default:
            console.warn(`⚠️ Unsupported message type received: ${messageType}`);
            return;
    }

    if (!senderWaId || !content || !customerPhone || !phoneNumberId) {
        console.warn('⚠️ Missing key data (sender, receiver, content, phoneNumberId). Skipping.');
        return;
    }

    console.log(`💬 Message received from ${senderWaId} [${messageType}]: ${content}`);

    const { thread } = await saveAndEmitWhatsAppMessage({
        phone: senderWaId,
        name: customerName,
        content,
        role: 'user',
        phoneNumberId,
        messageType,
        mediaId: messageObj[messageType]?.id || null,
        fileName: messageObj.document?.filename || null // optional
    });

    if (thread.current_handler === 'bot') {
        const { botResponse } = await generateBotResponse({
            threadId: thread.id,
            companyId: thread.company_id
        });

        await sendMessage({ to: senderWaId, message: botResponse, companyId: thread.company_id });
    }
};

module.exports = {
    sendMessage,
    handleIncomingMessage
};