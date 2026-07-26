const nodemailer = require('nodemailer');

// Uses Gmail SMTP with an "app password" (not your normal Gmail password).
// See setup instructions in the message below for how to generate one.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

async function sendOTPEmail(toEmail, otp) {
    await transporter.sendMail({
        from: `"MITS Lost & Found" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: 'Your password reset code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 24px; background: #f4f6fb; border-radius: 16px;">
                <h2 style="color: #1e293b; margin-bottom: 8px;">MITS Lost &amp; Found</h2>
                <p style="color: #475569; font-size: 14px;">Use this code to reset your password. It expires in 10 minutes.</p>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
                </div>
                <p style="color: #94a3b8; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `,
    });
}

module.exports = { sendOTPEmail };