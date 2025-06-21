// src/services/whatsapp.service.js
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const {
    getWhatsAppIntegration
} = require('../models/whatsapp.model');
const { getOrCreateCustomerByPhone } = require('./customer.service');
const { generateBotResponse, saveAndEmitMessage, findOrCreateThread } = require('./chat.service');
const { getExtensionFromMime } = require('../services/helpers/mime.helper.service');
const { get, post } = require('./helpers/axios.helper.service');

const BASE_GRAPH_URI = process.env.BASE_GRAPH_URI || 'https://graph.facebook.com/v22.0';
const FILE_SERVICE_URL = `${process.env.BASE_URL}/api/files/upload`;
const WHATSAPP_MEDIA_UPLOAD_TIMEOUT = 60000;

const saveAndEmitWhatsAppMessage = async ({
    phone,
    name,
    content,
    role,
    companyId,
    phoneNumberId,
    fileUrl = null,
    filename = null,
    messageType = 'text',
    mimeType = null
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
        fileName: filename,
        mimeType
    });

    return { thread };
};

const sendMessage = async ({ to, message, fileId, path, caption, companyId }) => {
    if (fileId) {
        return await sendMediaMessage({ to, fileId, path, caption, companyId });
    }

    const integration = await getWhatsAppIntegration({ companyId });

    if (!integration) {
        throw new Error('No active WhatsApp integration found');
    }

    const { access_token, phone_number_id } = integration;
    const url = `${BASE_GRAPH_URI}/${phone_number_id}/messages`;

    const res = await post(
        url,
        {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message },
        },
        access_token,
        { headers: { 'Content-Type': 'application/json' } }
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
    let mimeType = null;

    try {
        if (['image', 'document', 'audio', 'video'].includes(messageType)) {
            const mediaId = messageObj[messageType]?.id;
            if (!mediaId) {
                console.warn('⚠️ Media message received but no media ID found');
                return;
            }

            const integration = await getWhatsAppIntegration({ phoneNumberId });
            if (!integration?.access_token) {
                console.warn('⚠️ No integration found for phoneNumberId:', phoneNumberId);
                return;
            }

            const metaRes = await get(`${BASE_GRAPH_URI}/${mediaId}`, integration.access_token, { timeout: 10000 });
            mimeType = metaRes.data.mime_type;
            const originalFilename = messageObj?.document?.filename;

            const mediaRes = await get(metaRes.data.url, integration.access_token, {
                responseType: 'stream',
                timeout: WHATSAPP_MEDIA_UPLOAD_TIMEOUT
            });

            const form = new FormData();
            form.append('file', mediaRes.data, {
                filename: originalFilename || `${mediaId}.${getExtensionFromMime(mimeType)}`,
                contentType: mimeType,
                knownLength: metaRes.data.file_size
            });

            const uploadRes = await post(FILE_SERVICE_URL, form, process.env.INTERNAL_UPLOAD_TOKEN, {
                headers: {
                    ...form.getHeaders(),
                    'Content-Length': form.getLengthSync()
                },
                timeout: WHATSAPP_MEDIA_UPLOAD_TIMEOUT
            });

            fileUrl = `${process.env.BASE_URL}/${uploadRes.data.path}`;
            filename = originalFilename || uploadRes.data.fileId;
            const captionText = messageObj[messageType]?.caption || '';
            content = captionText ? `${fileUrl} ${captionText}` : fileUrl;
        }
        else if (messageType === 'text') {
            content = messageObj.text?.body;
        }
        else {
            console.warn(`⚠️ Unsupported message type received: ${messageType}`);
            return;
        }

        if (!senderWaId || !content || !phoneNumberId) {
            console.warn('⚠️ Missing required message data:', {
                senderWaId, content, phoneNumberId
            });
            return;
        }

        console.log(`💬 Message received from ${senderWaId} [${messageType}]:`,
            messageType === 'text' ? content : `${filename} (${mimeType})`);

        const { thread } = await saveAndEmitWhatsAppMessage({
            phone: senderWaId,
            name: customerName,
            content,
            role: 'user',
            phoneNumberId,
            messageType,
            fileUrl,
            filename,
            mimeType
        });

        if (thread.current_handler === 'bot') {
            let ourResponse = '';

            if (messageType !== 'text') {
                ourResponse = 'Thank you for sharing this. One of our agents will review it shortly!';
            } else {
                const { botResponse } = await generateBotResponse({
                    threadId: thread.id,
                    companyId: thread.company_id
                });
                ourResponse = botResponse;
            }

            await sendMessage({
                to: senderWaId,
                message: ourResponse,
                companyId: thread.company_id
            });
        }
    } catch (err) {
        console.error('❌ Error processing incoming message:', {
            error: err.message,
            stack: err.stack,
            messageType,
            senderWaId
        });

        try {
            if (senderWaId && phoneNumberId) {
                await sendMessage({
                    to: senderWaId,
                    message: 'We encountered an issue processing your message. Please try again.',
                    companyId: (await getWhatsAppIntegration({ phoneNumberId }))?.company_id
                });
            }
        } catch (sendError) {
            console.error('❌ Failed to send error notification:', sendError.message);
        }
    }
};

const downloadWhatsAppMedia = async ({ mediaId, accessToken, outputFolder = './downloads' }) => {
    const metaRes = await get(`${BASE_GRAPH_URI}/${mediaId}`, accessToken);
    const url = metaRes.data.url;
    const mimeType = metaRes.data.mime_type;
    const extension = getExtensionFromMime(mimeType);
    const filename = `${mediaId}.${extension}`;
    const outputPath = path.join(outputFolder, filename);

    fs.mkdirSync(outputFolder, { recursive: true });

    const mediaRes = await get(url, accessToken, { responseType: 'stream' });
    const writer = fs.createWriteStream(outputPath);
    mediaRes.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ filename, mimeType, outputPath }));
        writer.on('error', reject);
    });
};

const sendMediaMessage = async ({ to, fileId, caption = '', companyId }) => {
    const integration = await getWhatsAppIntegration({ companyId });
    if (!integration) throw new Error('No active WhatsApp integration found');
    const { access_token, phone_number_id } = integration;

    const fileMeta = await get(`${process.env.BASE_URL}/api/files/${fileId}`, process.env.INTERNAL_UPLOAD_TOKEN)
        .catch(err => {
            console.error('File fetch failed:', {
                url: `${process.env.BASE_URL}/api/files/${fileId}`,
                status: err.response?.status,
                data: err.response?.data
            });
            throw new Error(`Failed to fetch file: ${err.message}`);
        });

    const { filename, path: filePath, mimeType, size } = fileMeta.data;
    const absolutePath = path.join(process.cwd(), filePath);
    const fileStream = fs.createReadStream(absolutePath);

    const form = new FormData();
    form.append('file', fileStream, {
        filename,
        contentType: mimeType,
        knownLength: size
    });
    form.append('type', mimeType);
    form.append('messaging_product', 'whatsapp');

    const uploadRes = await post(`${BASE_GRAPH_URI}/${phone_number_id}/media`, form, access_token, {
        headers: form.getHeaders(),
        timeout: WHATSAPP_MEDIA_UPLOAD_TIMEOUT
    });

    const mediaId = uploadRes.data.id;

    const categoryMap = {
        image: ['image'],
        video: ['video'],
        audio: ['audio'],
        document: ['application', 'text']
    };

    let mediaCategory = 'document';
    for (const [cat, prefixes] of Object.entries(categoryMap)) {
        if (prefixes.some(prefix => mimeType.startsWith(prefix))) {
            mediaCategory = cat;
            break;
        }
    }

    const mediaPayload = { id: mediaId };
    if (mediaCategory === 'document') mediaPayload.filename = filename;
    if (['image', 'document'].includes(mediaCategory) && caption) {
        mediaPayload.caption = caption;
    }

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: mediaCategory,
        [mediaCategory]: mediaPayload
    };

    const res = await post(`${BASE_GRAPH_URI}/${phone_number_id}/messages`, payload, access_token, {
        headers: { 'Content-Type': 'application/json' }
    });

    const fileUrl = `${process.env.BASE_URL}/${filePath}`;
    const formattedContent = caption ? `${fileUrl}\n${caption}` : fileUrl;

    await saveAndEmitWhatsAppMessage({
        phone: to,
        content: formattedContent,
        role: 'assistant',
        companyId,
        messageType: 'media',
        fileUrl,
        filename,
        mimeType
    });

    return {
        status: 'sent',
        mediaId,
        mimeType,
        whatsappResponse: res.data
    };
};


module.exports = {
    sendMessage,
    handleIncomingMessage,
    downloadWhatsAppMedia,
    sendMediaMessage
};
