const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');

const User = require('../models/User');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// Rate-limit login attempts so the server itself can't be hammered.
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20,
    message: { error: 'Too many attempts from this device. Please wait a few minutes and try again.' },
});

// JWT now carries the email too, so routes can identify "my items" without
// an extra database lookup on every request.
const signToken = (user) => jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

// ── REGISTER ────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            authProvider: 'local',
        });

        const token = signToken(user);
        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || null },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// ── LOGIN (email + password) ───────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password +failedLoginAttempts +lockUntil');

        const genericError = { error: 'Incorrect email or password.' };

        if (!user || !user.password) {
            return res.status(401).json(genericError);
        }

        if (user.isLocked()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.status(423).json({
                error: `Too many failed attempts. Account locked for ${minutesLeft} more minute(s).`,
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
                user.failedLoginAttempts = 0;
                await user.save();
                return res.status(423).json({
                    error: `Too many failed attempts. Account locked for 15 minutes.`,
                });
            }
            await user.save();
            return res.status(401).json(genericError);
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        const token = signToken(user);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || null },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// ── GOOGLE LOGIN ────────────────────────────────────────────
router.post('/google', async (req, res) => {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: req.body.token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        let user = await User.findOne({ email: payload.email.toLowerCase() });
        if (!user) {
            user = await User.create({
                name: payload.name,
                email: payload.email.toLowerCase(),
                avatar: payload.picture,
                authProvider: 'google',
            });
        }

        const token = signToken(user);
        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || null },
        });
    } catch (err) {
        console.error('Google login error:', err);
        res.status(401).json({ error: 'Invalid Google sign-in. Please try again.' });
    }
});

module.exports = router;