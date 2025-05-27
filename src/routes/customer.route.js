const express = require('express');
const {
    createCustomerThread,
} = require('../controllers/customer.control');

const router = express.Router();

router.post('/create', createCustomerThread);

module.exports = router;