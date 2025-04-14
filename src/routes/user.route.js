const { Router } = require('express');
const {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    deleteUserByEmail
} = require('../controllers/user.control');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.delete('/delete', deleteUserByEmail);

module.exports = router;