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


module.exports = {
    chatHandler,
};