const axios = require('axios');
const {
    findOrCreateWhatsAppThread,
    createWhatsAppMessage,
    getWhatsAppIntegration
} = require('../models/whatsapp.model');
const { getOrCreateCustomerByPhone } = require('../services/customer.service')

const BASE_GRAPH_URI = process.env.BASE_GRAPH_URI || 'https://graph.facebook.com/v22.0';

const sendMessage = async ({ to, message, companyId }) => {

    // 👉 Get integration from DB
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

    // 💬 Ensure customer exists and retrieve customerId
    const customerId = await getOrCreateCustomerByPhone({ phone: to, companyId });

    // 💬 Ensure chat thread exists
    const threadId = await findOrCreateWhatsAppThread({
        customerId,
        companyId,
        'assignedId': null
    });

    await createWhatsAppMessage({
        thread_id: threadId,
        role: 'assistant',
        content: message
    });

    return { status: 'sent', response: res.data };
};

const handleIncomingMessage = async (data) => {
    // const entry = data.entry?.[0];
    // const changes = entry?.changes?.[0];
    const value = changes?.value;

    const messageObj = value?.messages?.[0];
    const phoneNumberId = value?.metadata?.phone_number_id;
    const receiverPhone = value?.metadata?.display_phone_number;

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

    console.log('📥 Received WhatsApp message:');
    console.log(`🧑 From (waId): ${senderWaId}`);
    console.log(`☎️ To (display): ${receiverPhone}`);
    console.log(`🆔 phone_number_id: ${phoneNumberId}`);
    console.log(`💬 Message: ${text}`);

    await saveMessageToThread({
        phone: senderWaId,
        content: text,
        role: 'user',
        phoneNumberId // resolves companyId internally
    });
};

const saveMessageToThread = async ({ phone, content, role, companyId, phoneNumberId }) => {
    // Resolve companyId from phoneNumberId if not directly provided
    if (!companyId && phoneNumberId) {
        const integration = await getWhatsAppIntegration({ phoneNumberId });
        if (!integration) {
            throw new Error('No integration found for phoneNumberId');
        }
        companyId = integration.company_id;
    }

    if (!companyId) {
        throw new Error('Missing companyId and phoneNumberId — can’t resolve company context');
    }

    // 💬 Ensure customer exists and retrieve customerId
    const customerId = await getOrCreateCustomerByPhone({ phone, companyId });

    // 💬 Ensure chat thread exists
    const threadId = await findOrCreateWhatsAppThread({
        customerId,
        companyId,
        assignedId: null
    });

    // 💬 Create message
    await createWhatsAppMessage({
        thread_id: threadId,
        role,
        content
    });

    return { customerId, threadId, companyId };
};

module.exports = {
    sendMessage,
    handleIncomingMessage
}