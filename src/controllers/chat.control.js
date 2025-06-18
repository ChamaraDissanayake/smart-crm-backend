// src/controllers/chat.controller.js

const chatService = require('../services/chat.service');
const whatsappService = require('../services/whatsapp.service');

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
        const { threadId, limit = 1000, offset = 0 } = req.query;

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

        const thread = await chatService.getThreadById({ threadId });

        if (thread.current_handler === 'bot') {
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
        } else {
            res.json({
                threadId,
                botResponse: 'AGENT'
            });
        }

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

const assignChat = async (req, res) => {
    try {
        const { threadId, chatHandler, assignedAgentId, channel, phone, companyId } = req.body;

        const result = await chatService.assignChat({
            threadId, chatHandler, assignedAgentId
        });

        if (chatHandler !== 'bot') {
            // Notify the agent about the new assignment
            const ourMessage = 'One of our agents will contact you soon!';

            await chatService.saveAndEmitMessage({
                threadId,
                role: 'assistant',
                content: ourMessage
            });

            if (channel === 'whatsapp') {
                await whatsappService.sendMessage({ to: phone, message: ourMessage, companyId })
            }
        }

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
    markAsDone,
    assignChat
};