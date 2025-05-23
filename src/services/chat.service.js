const openai = require('../config/deepseek.config');
const chatModel = require('../models/chat.model');
const companyModel = require('../models/company.model');

const MODEL_NAME = 'deepseek-chat';

const handleChat = async (userId, companyId, prompt, channel = 'web') => {
    // Step 1: Get thread (or create if not exists)
    const threadId = await chatModel.findOrCreateThread({ userId, companyId, channel });

    // Step 2: Save user message
    await chatModel.createMessage({ thread_id: threadId, role: 'user', content: prompt });

    // Step 3: Get past messages
    const pastMessages = await chatModel.getMessagesByThread({ threadId, limit: 10, offset: 0 });

    const chatHistory = pastMessages.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
    }));

    // Step 4: Get company chatbot instruction
    const company = await companyModel.findById(companyId);
    const instruction = company?.chatbot_instruction || "You are a helpful assistant.";

    // Step 5: Construct messages for LLM
    const messages = [
        { role: 'system', content: instruction },
        ...chatHistory,
    ];

    // Step 6: Get assistant response
    const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages,
        temperature: 0.4,
        max_tokens: 300,
    });

    const assistantReply = response.choices[0].message.content;

    // Step 7: Save assistant response
    await chatModel.createMessage({ thread_id: threadId, role: 'assistant', content: assistantReply });

    return assistantReply;
};

// send company id and get chat threads -> id, customer_id, channel
// collect all customer ids and get their details -> id, name, phone, email
const getChatHeadsByCompanyId = async (companyId, channel) => {
    try {
        return await chatModel.getChatThreadsWithCustomerInfo({ companyId, channel });
    } catch (err) {
        console.error(`Error in getChatHeadsByCompanyId for companyId ${companyId}:`, err.message);
        throw err; // Let the controller handle how to respond to the client
    }
};

const getChatHistory = async (threadId, offset) => {
    try {
        return await chatModel.getChatHistory({ threadId, offset });
    } catch (err) {
        console.error(`Error in getChatHistory for threadId ${threadId}:`, err.message);
        throw err; // Let the controller handle how to respond to the client
    }
};

module.exports = {
    handleChat,
    getChatHeadsByCompanyId,
    getChatHistory
};
