const openai = require('../config/deepseek.config');
const chatModel = require('../models/chat.model');
const companyModel = require('../models/company.model');
const { emitToThread, emitToCompany } = require('./helpers/socket.helper.service');

const MODEL_NAME = 'deepseek-chat';

const generateBotResponse = async ({ threadId, companyId }) => {
    // 1. Get chat history (reversed to have latest first)
    const pastMessages = await getChatHistory(threadId, 1000, 0);
    const chatHistory = pastMessages.reverse().map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    // 2. Get company instructions
    const company = await companyModel.findById(companyId);
    const instruction = company?.chatbot_instruction || "You are a helpful assistant.";

    // 3. Prepare messages for LLM
    const messages = [
        { role: 'system', content: instruction },
        ...chatHistory
    ];

    // 4. Get LLM response
    const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages,
        temperature: 0.4,
        max_tokens: 300,
    });

    const assistantReply = response.choices[0].message.content;

    // 5. Extract ALL content within parentheses (more generic)
    const parentheticalMatches = [...assistantReply.matchAll(/\(([^)]+)\)/g)];
    const extractedNotes = parentheticalMatches.map(match => match[1].trim());

    // 6. Remove ALL parenthetical content from final reply
    const botReply = assistantReply.replace(/\([^)]+\)/g, '').trim();

    // 7. Separate BOT_NOTE from other parentheticals
    const botNotes = extractedNotes.filter(note => note.startsWith('BOT_NOTE:'));
    const otherParentheticals = extractedNotes.filter(note => !note.startsWith('BOT_NOTE:'));

    console.log('Chamara extracted BOT_NOTEs:', botNotes);
    console.log('Chamara other parenthetical content:', otherParentheticals);

    return {
        botResponse: botReply,
        metadata: {
            botNotes,
            otherParentheticals
        }
    };
};

// send company id and get chat threads -> id, customer_id, channel
// collect all customer ids and get their details -> id, name, phone, email
const getChatHeadsByCompanyId = async (companyId, channel) => {
    try {
        const data = await chatModel.getChatThreadsWithCustomerInfo({ companyId, channel });
        return data;
    } catch (err) {
        console.error(`Error in getChatHeadsByCompanyId for companyId ${companyId}:`, err.message);
        throw err; // Let the controller handle how to respond to the client
    }
};

const getChatHistory = async (threadId, limit = 1000, offset = 0) => {
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
        const { thread, isNewThread } = await chatModel.findOrCreateThread({ customerId, companyId, channel });

        if (isNewThread) {
            // Emit to CRM frontend chats that a new thread was created
            emitToCompany(thread.company_id, {
                id: thread.id,
                companyId: thread.company_id
            });
        }
        return thread;
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
        throw err;
    }
};

const markAsDone = async ({ threadId }) => {
    try {
        return await chatModel.markAsDone({ threadId });
    } catch (err) {
        console.error(`Error in saveMessage for threadId ${threadId}:`, err.message);
        throw err;
    }
};

const assignChat = async ({ threadId, chatHandler, assignedAgentId }) => {
    try {
        return await chatModel.assignChat({ threadId, chatHandler, assignedAgentId });
    } catch (err) {
        console.error(`Error in assign for threadId ${data.threadId}:`, err.message);
        throw err;
    }
};

const getThreadById = async ({ threadId }) => {
    try {
        return await chatModel.getThreadById({ threadId });
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    generateBotResponse,
    getChatHeadsByCompanyId,
    getChatHistory,
    findOrCreateThread,
    saveAndEmitMessage,
    markAsDone,
    assignChat,
    getThreadById
};
