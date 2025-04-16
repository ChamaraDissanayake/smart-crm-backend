const { Router } = require('express');
const {
    register,
    verifyEmail,
    login,
    requestPasswordReset,
    resetPassword,
    deleteUserByEmail,
    resendVerificationEmail,
    checkDuplicateUser,
} = require('../controllers/user.control');

const router = Router();

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.delete('/delete', deleteUserByEmail);
router.post('/resend-verification-email', resendVerificationEmail);
router.get('/check-duplicate-user', checkDuplicateUser);

module.exports = router;