const { processChat, getHistory } = require('../services/chat.service');

const processChatMessage = async (req, res) => {
    try {
        const { userId, userInput } = req.body;
        if (!userId || !userInput) {
            return res.status(400).json({ error: 'userId and userInput are required' });
        }

        const botResponse = await processChat(userId, userInput);

        res.json({ botResponse });
    } catch (err) {
        console.error('Error processing chat:', err);
        res.status(500).json({ error: err.message });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const { userId, limit = 10, offset = 0 } = req.query;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const chatHistory = await getHistory(userId, limit, offset);
        res.json({ chatHistory });
    } catch (err) {
        console.error('Error retrieving chat history:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    processChatMessage,
    getChatHistory
};