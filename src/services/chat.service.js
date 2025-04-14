const { openai, assistantId } = require('../config/open-ai.config');
const Chat = require('../models/chat.model');

const processChat = async (userId, userInput) => {
    try {
        let threadId;

        const threadData = await Chat.getThreadByUserId(userId);
        if (threadData) {
            threadId = threadData.id;
        }

        if (!threadId) {
            const newThread = await openai.beta.threads.create();
            if (!newThread || !newThread.id) {
                return 'Failed to create a new thread';
            }
            threadId = newThread.id;
            await Chat.createThread(threadId, userId);
        }

        await openai.beta.threads.messages.create(threadId, {
            role: 'user',
            content: userInput,
        });

        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: assistantId,
        });

        if (!run || !run.id) {
            return 'Failed to create a run for the thread';
        }

        let runStatus;
        do {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
            if (!runStatus) {
                return 'Failed to retrieve run status';
            }
        } while (runStatus.status !== 'completed');

        const messages = await openai.beta.threads.messages.list(threadId, {
            order: 'desc',
            limit: 1,
        });

        if (!messages || !messages.data || messages.data.length === 0) {
            return 'No response received from the assistant';
        }

        Chat.createMessage(threadId, 'user', userInput);
        Chat.createMessage(threadId, 'assistant', messages.data[0].content[0].text.value);

        return messages.data[0].content[0].text.value;
    } catch (error) {
        return `Error processing chat: ${error.message}`;
    }
};

const getHistory = async (userId, limit, offset) => {
    try {
        return await Chat.getChatHistory(userId, limit, offset);
    } catch (error) {
        return `Error retrieving chat history: ${error.message}`;
    }
};

module.exports = {
    processChat,
    getHistory,
};