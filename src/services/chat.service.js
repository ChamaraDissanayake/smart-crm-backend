const { v4: uuidv4 } = require('uuid');
const openai = require('../config/deepseek.config');
const chatModel = require('../models/chat.model');
const companyModel = require('../models/company.model');

const MODEL_NAME = 'deepseek-chat';

const handleChat = async (userId, companyId, prompt, channel = 'bot') => {
    // Step 1: Get thread (or create if not exists)
    const threadId = await chatModel.findOrCreateThread({ userId, companyId, channel });

    // Step 2: Save user message
    await chatModel.createMessage({ thread_id: threadId, role: 'user', content: prompt });

    // Step 3: Get past messages
    const pastMessages = await chatModel.getMessagesByThread({ threadId, limit: 10, offset: 0 });
    console.log('Chamara pastMessages', pastMessages);

    const chatHistory = pastMessages.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
    }));

    console.log('Chamara chatHistory', chatHistory);


    // Step 4: Get company chatbot instruction
    const company = await companyModel.findById(companyId);
    const instruction = company?.chatbot_instruction || "You are a helpful assistant.";

    // Step 5: Construct messages for LLM
    const messages = [
        { role: 'system', content: instruction },
        ...chatHistory,
    ];
    // console.log('Chamara deep seek', messages);

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

module.exports = {
    handleChat,
};
