const jwt = require('jsonwebtoken');

// Unlike authMiddleware, this NEVER blocks the request. Guests can still
// post items with no account. If a valid token is present, it attaches
// the user's email so the item can be tagged as "posted by" them.
module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
            req.userEmail = decoded.email;
        } catch (err) {
            // invalid/expired token — just treat as a guest, don't error out
        }
    }
    next();
};