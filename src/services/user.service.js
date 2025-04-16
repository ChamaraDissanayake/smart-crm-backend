const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const emailService = require('./email.service'); // Add this line

const generatePlainToken = (payload, expiresIn) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// For API authentication (with Bearer prefix)
const generateAuthToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async (userData) => {
    const userId = await userModel.create(userData);

    if (userData.provider === 'email') {
        const user = await userModel.findById(userId);
        const token = generatePlainToken(
            { userId: user.id, email: user.email },
            '24h'
        );
        await emailService.sendVerificationEmail(user.email, token);
    }

    return userId;
};

const verifyEmail = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await userModel.updateVerificationStatus(decoded.userId, true);
        return true;
    } catch (err) {
        throw new Error('Invalid or expired verification link');
    }
};

const login = async (email, password) => {
    const user = await userModel.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid credentials');
    }
    return generateAuthToken(user.id); // Returns token for API auth
};

const requestPasswordReset = async (email) => {
    const user = await userModel.findByEmail(email);
    if (!user) throw new Error('User not found');
    return generatePlainToken({ userId: user.id }, '15m');
};

const resetPassword = async (token, newPassword) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await userModel.updatePassword(decoded.userId, newPassword);
        return true;
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
};

const deleteUserByEmail = async (email) => {
    try {
        await userModel.deleteUserByEmail(email);
        return true;
    } catch (err) {
        throw new Error('User deletion failed');
    }
};

const resendVerificationEmail = async (email) => {
    const user = await userModel.findByEmail(email);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.is_verified) {
        throw new Error('Email is already verified');
    }

    // Generate new token (existing token expires in 24h)
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Send email (reuse existing email service)
    await emailService.sendVerificationEmail(user.email, token);
};

const duplicateUserCheck = async (email) => {
    const user = await userModel.checkEmailExists(email);
    return user ? true : false; //If user exists, return true
}

module.exports = {
    register,
    verifyEmail,
    login,
    requestPasswordReset,
    resetPassword,
    deleteUserByEmail,
    resendVerificationEmail,
    duplicateUserCheck
};