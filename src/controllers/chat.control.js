// src/controllers/chat.controller.js

const chatService = require('../services/chat.service');

const chatHandler = async (req, res) => {
    try {
        const prompt = req.body?.userInput;
        const userId = req.body?.userId;
        const companyId = req.body?.companyId;

        if (!prompt || !userId) {
            return res.status(400).json({ message: 'Prompt or user ID missing' });
        }

        const botResponse = await chatService.handleChat(userId, companyId, prompt);
        return res.json({ botResponse });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    chatHandler,
};