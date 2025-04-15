const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.BASE_URL}/api/user/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Email Verification',
        html: `Please click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a>`
    };

    await transporter.sendMail(mailOptions);
};

module.exports = {
    sendVerificationEmail
};