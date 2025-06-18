// src/services/whatsapp.service.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const {
    getWhatsAppIntegration
} = require('../models/whatsapp.model');
const { getOrCreateCustomerByPhone } = require('./customer.service');
const { generateBotResponse, saveAndEmitMessage, findOrCreateThread } = require('./chat.service');
const { getExtensionFromMime } = require('../services/helpers/mime.helper.service');

const BASE_GRAPH_URI = process.env.BASE_GRAPH_URI || 'https://graph.facebook.com/v22.0';
const fileServiceUrl = `${process.env.BASE_URL}/api/files/upload`;
const downloadsDir = path.resolve(__dirname, '../../shared-files');

const saveAndEmitWhatsAppMessage = async ({
    phone,
    name,
    content,
    role,
    companyId,
    phoneNumberId,
    fileUrl = null,
    filename = null,
    messageType = 'text'
}) => {
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

    await saveAndEmitMessage({
        threadId,
        role,
        content,
        type: messageType,
        fileUrl,
        fileName: filename
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

    const statusUpdate = value?.statuses?.[0]?.status;
    if (statusUpdate) {
        console.log('📦 Message status update:', statusUpdate);
        return;
    }

    if (!messageObj) {
        console.warn('⚠️ No message object found. Skipping.');
        return;
    }

    const senderWaId = messageObj.from;
    const messageType = messageObj.type;
    let content = '';
    let fileUrl = null;
    let filename = null;

    try {
        if (['image', 'document', 'audio', 'video'].includes(messageType)) {
            const mediaId = messageObj[messageType]?.id;
            if (!mediaId) return;
            const integration = await getWhatsAppIntegration({ phoneNumberId });
            const accessToken = integration?.access_token;
            if (!accessToken) return;
            // Download media locally
            const { filename: downloadedFilename, mimeType, outputPath } = await downloadWhatsAppMedia({
                mediaId,
                accessToken,
                outputFolder: downloadsDir
            });

            filename =
                messageObj?.document?.filename ||
                downloadedFilename ||
                null;

            // Get caption text if exists (image or document)
            const captionText =
                messageType === 'image' ? (messageObj.image.caption || '') :
                    messageType === 'document' ? (messageObj.document.caption || '') :
                        '';

            // Upload media file to your backend
            const form = new FormData();
            form.append('file', fs.createReadStream(outputPath));
            const uploadRes = await axios.post(fileServiceUrl, form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${process.env.INTERNAL_UPLOAD_TOKEN}`
                },
                timeout: 300000,
            });
            fileUrl = `${process.env.FILE_SERVER_BASE_URL || 'http://localhost:3000'}/${uploadRes.data.path}`;

            // Combine file URL and caption for content
            content = `${fileUrl}` + (captionText ? ` ${captionText}` : '');
        } else if (messageType === 'text') {
            content = messageObj.text?.body;
        } else {
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
            fileUrl,
            filename
        });

        if (thread.current_handler === 'bot') {
            let ourResponse = '';
            if (content.startsWith('http')) {
                ourResponse = 'One of our agents will check this carefully and contact you soon!';
                console.log('Chamara extracted BOT_NOTEs:', `BOT_NOTE:${ourResponse}`);
            } else {
                const { botResponse } = await generateBotResponse({
                    threadId: thread.id,
                    companyId: thread.company_id
                });
                ourResponse = botResponse;
            }

            await sendMessage({ to: senderWaId, message: ourResponse, companyId: thread.company_id });
        }
    } catch (err) {
        console.error('❌ Error processing incoming media message:', err);
    }
};

const downloadWhatsAppMedia = async ({ mediaId, accessToken, outputFolder = './downloads' }) => {
    const metaRes = await axios.get(`${BASE_GRAPH_URI}/${mediaId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    const url = metaRes.data.url;
    const mimeType = metaRes.data.mime_type;
    const extension = getExtensionFromMime(mimeType);
    const filename = `${mediaId}.${extension}`;
    const outputPath = path.join(outputFolder, filename);

    fs.mkdirSync(outputFolder, { recursive: true });

    const mediaRes = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(outputPath);
    mediaRes.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ filename, mimeType, outputPath }));
        writer.on('error', reject);
    });
};

module.exports = {
    sendMessage,
    handleIncomingMessage,
    downloadWhatsAppMedia,
};
