const express = require('express');
const {
    chatHandler,
    getChatHeadsByCompanyId,
    getChatHistoryByThreadId
} = require('../controllers/chat.control');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/', chatHandler);
router.get('/chat-heads', authenticate, getChatHeadsByCompanyId);
router.get('/chat-history', authenticate, getChatHistoryByThreadId);

module.exports = router;