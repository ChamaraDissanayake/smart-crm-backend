const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');


const register = async (userData) => {
    return await userModel.create(userData);
};

const login = async (email, password) => {

    const user = await userModel.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return token;
};

const requestPasswordReset = async (email) => {
    const user = await userModel.findByEmail(email);
    if (!user) throw new Error('User not found');

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    return token;
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

module.exports = {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    deleteUserByEmail
};