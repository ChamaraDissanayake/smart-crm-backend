const { pool } = require('../config/db.config');
const {
    findOrCreateThread,
    createMessage,
    getMessagesByThread,
    getChatHistory,
    deleteOldMessages,
} = require('./chat.model');

const getWhatsAppIntegration = async ({ userId, companyId }) => {
    const conn = await pool.getConnection();
    try {
        const [rows] = await conn.query(
            `SELECT access_token, phone_number_id 
             FROM whatsapp_integrations 
             WHERE user_id = ? AND company_id = ? AND is_active = TRUE 
             LIMIT 1`,
            [userId, companyId]
        );
        return rows[0] || null;
    } finally {
        conn.release();
    }
};

// Wrapper for WhatsApp-specific usage (channel = 'whatsapp')
const findOrCreateWhatsAppThread = async ({ userId, companyId }) => {
    return await findOrCreateThread({ userId, companyId, channel: 'whatsapp' });
};

const createWhatsAppMessage = async ({ thread_id, role, content }) => {
    return await createMessage({ thread_id, role, content });
};

const getWhatsAppMessagesByThread = async ({ threadId, limit = 10, offset = 0 }) => {
    return await getMessagesByThread({ threadId, limit, offset });
};

const getWhatsAppChatHistory = async ({ userId, companyId, limit = 20, offset = 0 }) => {
    return await getChatHistory({ userId, companyId, channel: 'whatsapp', limit, offset });
};

module.exports = {
    findOrCreateWhatsAppThread,
    createWhatsAppMessage,
    getWhatsAppMessagesByThread,
    getWhatsAppChatHistory,
    deleteOldMessages,
    getWhatsAppIntegration
};
