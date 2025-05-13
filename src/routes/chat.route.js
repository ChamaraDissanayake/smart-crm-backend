const express = require('express');
const { chatHandler } = require('../controllers/chat.control');
const router = express.Router();

router.post('/', chatHandler);

module.exports = router;