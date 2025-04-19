const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const emailService = require('./helpers/email.helper.service');
const jwtService = require('./helpers/jwt.helper.service');

const register = async (userData) => {
    const userId = await userModel.create(userData);

    const user = await userModel.findById(userId);
    const token = jwtService.generateJWT({ type: 'verify-email', userId: user.id, email: user.email, isVerified: false }, '24h');

    // Send verification email
    if (userData.provider === 'email') {
        await emailService.sendVerificationEmail(user.email, token);
    }

    return token;
};

const verifyEmail = async (token) => {
    try {
        const decoded = jwtService.decodeJWT(token, process.env.JWT_SECRET);
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
    return jwtService.generateJWT({ type: 'login', userId: user.id, email, isVerified: user.is_verified }, '7d');
};

const requestPasswordReset = async (email) => {
    try {
        const user = await userModel.findByEmail(email);
        if (!user) throw new Error('User not found');
        const token = jwtService.generateJWT({ type: 'password-reset', userId: user.id, email, isVerified: user.is_verified }, '15m');
        await emailService.sendPasswordResetEmail(user.email, token);
        return token;
    } catch (error) {
        console.log(error);
        throw new Error('Error generating password reset token');
    }
};

const resetPassword = async (token, newPassword) => {
    try {
        const decoded = jwtService.decodeJWT(token, process.env.JWT_SECRET);
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
    const token = jwtService.generateJWT({ type: 're-verify-email', userId: user.id, email: user.email, isVerified: user.is_verified }, '24h');

    // Send email (reuse existing email service)
    await emailService.sendVerificationEmail(user.email, token);
};

const duplicateUserCheck = async (email) => {
    const user = await userModel.checkEmailExists(email);
    return user ? true : false; //If user exists, return true
}

const checkVerification = async (email) => {
    return await userModel.checkIsVerifiedUser(email);
}

module.exports = {
    register,
    verifyEmail,
    login,
    requestPasswordReset,
    resetPassword,
    deleteUserByEmail,
    resendVerificationEmail,
    duplicateUserCheck,
    checkVerification
};