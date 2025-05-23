// src/controllers/chat.controller.js

const chatService = require('../services/chat.service');

const chatHandler = async (req, res) => {
    try {
        const prompt = req.body?.userInput;
        const userId = req.body?.userId;
        const companyId = req.body?.companyId;
        const channel = req.body?.channel || 'web';

        if (!prompt || !userId || !companyId) {
            return res.status(400).json({ message: 'Missing userId, companyId, or prompt' });
        }

        const botResponse = await chatService.handleChat(userId, companyId, prompt, channel);
        return res.json({ botResponse });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

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
        const data = await chatService.getChatHistory(threadId, offset);
        res.json(data);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

module.exports = {
    chatHandler,
    getChatHeadsByCompanyId,
    getChatHistoryByThreadId
};