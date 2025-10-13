// controllers/userController.js
const User = require('../models/User');

// Return sanitized user by id (protected)
exports.getUserById = async (req, res) => {
    try {
        const id = req.params.id;

        // If auth middleware exists, allow only the user themself or admin
        if (req.user) {
            if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
                return res.status(403).json({ message: 'Forbidden' });
            }
        }

        const user = await User.findById(id).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Pick only needed fields
        const payload = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            whatsappNumber: user.whatsappNumber,
            userbalance: user.userbalance ?? 0,
            balance: user.userbalance ?? 0, // convenience
        };

        return res.json(payload);
    } catch (err) {
        console.error('getUserById error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Optionally: get current user (from token)
exports.getCurrentUser = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findById(req.user._id).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        return res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            userbalance: user.userbalance ?? 0,
            balance: user.userbalance ?? 0,
        });
    } catch (err) {
        console.error('getCurrentUser error', err);
        return res.status(500).json({ message: 'Server error' });
    }
};
