const openai = require('../config/deepseek.config');
const chatModel = require('../models/chat.model');
const companyModel = require('../models/company.model');
const { emitToThread } = require('./helpers/socket.helper.service');

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
    console.log('Chamara assistantReply', assistantReply);

    // Extract all BOT_NOTE values
    const noteMatches = [...assistantReply.matchAll(/\(BOT_NOTE:\s*(.*?)\)/g)];
    const botNotes = noteMatches.map(match => match[1].trim());

    // Remove all BOT_NOTE mentions from the final reply
    const botReply = assistantReply.replace(/\(BOT_NOTE:\s*.*?\)/g, '').trim();
    //botNote use to generate leads
    console.log('Chamara bot note', botNotes);

    return { botResponse: botReply };
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

const getChatHistory = async (threadId, limit = 20, offset = 0) => {
    try {
        if (!threadId) {
            throw { statusCode: 400, message: 'Thread id is required' };
        }

        // First verify thread exists (assuming you have a threads table)
        const threadExists = await chatModel.checkThreadExists(threadId);

        if (!threadExists) {
            throw { statusCode: 404, message: 'Thread not found' };
        }

        // Then get messages (empty array is valid response)
        const messages = await chatModel.getChatHistory({
            threadId,
            limit: Number(limit),
            offset: Number(offset)
        });

        return messages;
    } catch (err) {
        console.error(`Error in getChatHistory for threadId ${threadId}:`, err);
        throw err;
    }
};

const findOrCreateThread = async ({ customerId, companyId, channel = 'web' }) => {
    try {
        return await chatModel.findOrCreateThread({ customerId, companyId, channel });
    } catch (err) {
        console.error(`Error in findOrCreateThread for customerId ${customerId}, companyId ${companyId}:`, err.message);
        throw err; // Let the controller handle how to respond to the client
    }
};

const saveAndEmitMessage = async ({ threadId, role, content }) => {
    try {
        const msgId = await chatModel.saveMessage({ thread_id: threadId, role, content });

        // Emit over socket to frontend
        emitToThread(threadId, {
            id: msgId,
            threadId,
            content,
            role,
            createdAt: new Date().toISOString(),
        });

        return msgId
    } catch (err) {
        console.error(`Error in saveMessage for threadId ${threadId}:`, err.message);
        throw err; // Let the controller handle how to respond to the client
    }
};

module.exports = {
    generateBotResponse,
    getChatHeadsByCompanyId,
    getChatHistory,
    findOrCreateThread,
    saveAndEmitMessage
};
