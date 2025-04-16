const userService = require('../services/user.service');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, phone, password, provider = 'email', google_id = null } = req.body;
        const token = await userService.register({ name, email, phone, password, provider, google_id });
        res.status(200).json({ token, message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        await userService.verifyEmail(token);
        res.json({ token, message: 'Email verified successfully' });
        // res.redirect('https://your-frontend.com/continue-registration'); // update to your URL
    } catch (err) {
        res.status(400).json({ error: 'Invalid or expired verification link.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await userService.login(email, password);
        res.json({ token, message: 'Logged in successfully' });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
};

const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const token = await userService.requestPasswordReset(email);
        res.json({ message: 'Password reset token generated', token });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await userService.resetPassword(token, newPassword);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const deleteUserByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        await userService.deleteUserByEmail(email);
        res.json({ message: 'User account deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        await userService.resendVerificationEmail(email);
        res.json({ message: 'Verification email resent successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

const checkDuplicateUser = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Email parameter is required' });
        }

        const userExists = await userService.duplicateUserCheck(email);

        res.status(200).json({
            exists: userExists,
            message: userExists
                ? 'Email is already registered'
                : 'Email is available'
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during email check' });
    }
};

const checkUserVerification = async (req, res) => {
    try {
        const { token } = req.query;
        console.log('Chamara token:', token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Chamara decoded:', decoded);

        if (!decoded.email) {
            return res.status(400).json({ error: 'Email parameter is required' });
        }

        const is_verified = await userService.checkVerification(decoded.email);

        res.status(200).json({ isVerified: is_verified ? true : false });

    } catch (err) {
        res.status(500).json({ error: 'Server error during email verification check' });
    }
}

module.exports = {
    register,
    verifyEmail,
    login,
    requestPasswordReset,
    resetPassword,
    deleteUserByEmail,
    resendVerificationEmail,
    checkDuplicateUser,
    checkUserVerification
};