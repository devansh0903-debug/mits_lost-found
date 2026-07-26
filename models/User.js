const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Only set for email/password accounts. Google-login-only users have no password.
    password: { type: String, select: false },

    avatar: { type: String },
    authProvider: { type: String, enum: ['google', 'local'], default: 'local' },

    // ── Brute-force protection ──────────────────────────────
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // ── Forgot-password OTP ─────────────────────────────────
    resetOTP: { type: String, select: false },
    resetOTPExpires: { type: Date, select: false },

}, { timestamps: true });

// Virtual helper: is this account currently locked out?
userSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
};

module.exports = mongoose.model('User', userSchema);