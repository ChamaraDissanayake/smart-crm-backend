const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:4000';

const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${frontendBaseUrl}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Email Verification',
        html: `Please click this link to verify your email: <a href="${verificationUrl}">Verify Now</a>`
    };

    await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;


    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Forgot your Password? Don\'t worry! Let\'s reset it.',
        html: `<p>Hello,</p>
            <p>You requested to reset your password. Click the button below:</p>
            <a href="${resetLink}" style="padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px;">
            Reset Password
            </a>
            <p>If you did not request this, you can safely ignore this email.</p>`
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};