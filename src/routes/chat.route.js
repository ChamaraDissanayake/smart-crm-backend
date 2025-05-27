const express = require('express');
const {
    getChatHeadsByCompanyId,
    getChatHistoryByThreadId,
    webChatHandler
} = require('../controllers/chat.control');

const router = express.Router();

router.get('/chat-heads', getChatHeadsByCompanyId);
router.get('/chat-history', getChatHistoryByThreadId);
router.post('/chat-web', webChatHandler);
module.exports = router;