const { v4: uuidv4 } = require('uuid');
const openai = require('../config/deepseek.config');
const chatModel = require('../models/chat.model');
const companyModel = require('../models/company.model'); // NEW

const MODEL_NAME = 'deepseek-chat';

const handleChat = async (userId, companyId, prompt) => {
    // Step 1: Get thread

    let thread = await chatModel.getThreadByUserId(userId);
    if (!thread) {
        const newThreadId = uuidv4();
        await chatModel.createThread(newThreadId, userId);
        thread = { id: newThreadId };
    }

    const threadId = thread.id;

    // Step 2: Save user message
    await chatModel.createMessage(threadId, 'user', prompt);

    // Step 3: Get past messages
    const pastMessages = await chatModel.getMessagesByThread(threadId, 10, 0);
    const chatHistory = pastMessages.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
    }));

    // Step 4: Get company instructions
    const company = await companyModel.findById(companyId);

    const instruction = company?.chatbot_instruction || "You are a helpful assistant.";

    // Step 5: Construct full message array
    const messages = [
        { role: 'system', content: instruction },
        ...chatHistory,
    ];

    // Step 6: Ask DeepSeek
    const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages,
        temperature: 0.3,
        max_tokens: 300,
    });

    const assistantReply = response.choices[0].message.content;

    // Step 7: Save response
    await chatModel.createMessage(threadId, 'assistant', assistantReply);

    return assistantReply;
};

module.exports = {
    handleChat,
};
