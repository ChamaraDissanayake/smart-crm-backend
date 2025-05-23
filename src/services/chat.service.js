const openai = require('../config/deepseek.config');
const chatModel = require('../models/chat.model');
const companyModel = require('../models/company.model');

const MODEL_NAME = 'deepseek-chat';

const generateBotResponse = async ({ threadId, companyId }) => {

    // 3. Chat history
    const pastMessages = await getChatHistory(threadId, limit = 10, offset = 0);
    const chatHistory = pastMessages.reverse().map(msg => ({ role: msg.role, content: msg.content }));

    // 4. Company instruction
    const company = await companyModel.findById(companyId);
    const instruction = company?.chatbot_instruction || "You are a helpful assistant.";

    // 5. Final message array
    const messages = [{ role: 'system', content: instruction }, ...chatHistory];

    // 6. LLM response
    const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages,
        temperature: 0.4,
        max_tokens: 300,
    });

    const assistantReply = response.choices[0].message.content;

    return { botResponse: assistantReply };
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

const getChatHistory = async (threadId, limit, offset) => {
    try {
        return await chatModel.getChatHistory({ threadId, limit, offset });
    } catch (err) {
        console.error(`Error in getChatHistory for threadId ${threadId}:`, err.message);
        throw err; // Let the controller handle how to respond to the client
    }
};

module.exports = {
    generateBotResponse,
    getChatHeadsByCompanyId,
    getChatHistory
};
