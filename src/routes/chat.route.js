const express = require('express');
const {
    getChatHeadsByCompanyId,
    getChatHistoryByThreadId,
    webChatHandler,
    webChatAgentMessageSend,
    markAsDone,
    assignChat
} = require('../controllers/chat.control');

const router = express.Router();

router.get('/chat-heads', getChatHeadsByCompanyId);
router.get('/chat-history', getChatHistoryByThreadId);
router.post('/chat-web', webChatHandler);
router.post('/chat-web-send', webChatAgentMessageSend); // Use this to send message from crm frontend
router.patch('/mark-as-done', markAsDone);
router.patch('/assign', assignChat);

module.exports = router;