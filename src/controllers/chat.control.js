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
        const { threadId, limit = 20, offset = 0 } = req.query;

        // Service will validate threadId
        const messages = await chatService.getChatHistory(threadId, limit, offset);

        res.json(messages);
    } catch (err) {
        console.error('Error in getChatHistoryByThreadId:', err);
        res.status(err.statusCode).json({ statusCode: err.statusCode || 500, error: err.message || 'Internal server error' });
    }
};

const webChatHandler = async (req, res) => {
    const { threadId, companyId, message } = req.body;

    if (!threadId || !companyId || !message) {
        return res.status(400).json({ error: 'threadId, companyId and message are required' });
    }

    try {
        // Save user message
        await chatService.saveAndEmitMessage({
            threadId,
            role: 'user',
            content: message
        });

        // Generate bot response
        const { botResponse } = await chatService.generateBotResponse({ threadId, companyId });

        chatService.saveAndEmitMessage({
            threadId,
            role: 'assistant',
            content: botResponse
        });

        res.json({
            threadId,
            botResponse: botResponse
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const webChatAgentMessageSend = async (req, res) => {
    const { threadId, message } = req.body;
    try {
        // Save agent message
        await chatService.saveAndEmitMessage({
            threadId,
            role: 'assistant',
            content: message
        });

        res.json({
            threadId,
            message
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
}

const markAsDone = async (req, res) => {
    try {
        const { threadId } = req.body;

        const result = await chatService.markAsDone({
            threadId
        });

        res.json({
            result
        });
    } catch (error) {
        console.log(error);
        throw error
    }

}

module.exports = {
    webChatHandler,
    getChatHeadsByCompanyId,
    getChatHistoryByThreadId,
    webChatAgentMessageSend,
    markAsDone
};