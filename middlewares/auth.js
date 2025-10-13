const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 🔹 Authentication Middleware
async function auth(req, res, next) {
    try {
        // Get token from headers (Bearer <token>)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        const token = authHeader.split(" ")[1];

        // Verify token
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.id);

        if (!user) return res.status(401).json({ message: "User not found or deleted." });

        // Attach user to request for later use
        req.user = user;
        next();
    } catch (error) {
        console.error("❌ JWT Auth Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token." });
    }
}

// 🔹 Admin Role Check Middleware
function isAdmin(req, res, next) {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
}

module.exports = { auth, isAdmin };
