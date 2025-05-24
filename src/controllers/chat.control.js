// src/controllers/chat.controller.js

const chatService = require('../services/chat.service');

const getChatHeadsByCompanyId = async (req, res) => {
    try {
        const companyId = req.query.companyId;
        const channel = req.query.channel;
        if (!companyId) {
            return res.status(400).json({ error: 'companyId is required' });
        }
        const data = await chatService.getChatHeadsByCompanyId(companyId, channel);
        res.json(data);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const getChatHistoryByThreadId = async (req, res) => {
    try {
        const threadId = req.query.threadId;
        const offset = req.query.offset;

        if (!threadId) {
            return res.status(400).json({ error: 'Thread id is required' });
        }
        const data = await chatService.getChatHistory(threadId, limit = 20, offset);
        res.json(data);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

module.exports = {
    // chatHandler,
    getChatHeadsByCompanyId,
    getChatHistoryByThreadId
};