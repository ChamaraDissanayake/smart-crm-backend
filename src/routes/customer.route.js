const express = require('express');
const {
    createCustomerThread,
    createCustomer,
    getCustomersByCompanyId
} = require('../controllers/customer.control');

const router = express.Router();

router.post('/create-customer-thread', createCustomerThread);
router.post('/create-customer', createCustomer);
router.get('/get-customers', getCustomersByCompanyId);

module.exports = router;