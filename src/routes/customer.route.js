const express = require('express');
const {
    createCustomerThread,
    createCustomer,
    updateCustomer,
    getCustomersByCompanyId,
    deleteCustomer
} = require('../controllers/customer.control');

const router = express.Router();

router.post('/create-customer-thread', createCustomerThread);
router.post('/create-customer', createCustomer);
router.post('/update-customer', updateCustomer);
router.delete('/delete-customer/:id', deleteCustomer);
router.get('/get-customers', getCustomersByCompanyId);

module.exports = router;