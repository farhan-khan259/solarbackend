import express from "express";
import User from "../models/User.js"; // <-- adjust path if needed

const router = express.Router();


router.post("/updatebalance", async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || typeof amount !== "number") {
            return res.status(400).json({ message: "Invalid request data" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Ensure userbalance exists (default to 0)
        user.userbalance = user.userbalance || 0;

        // ✅ Check for insufficient balance (if deducting)
        if (amount < 0 && user.userbalance + amount < 0) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // ✅ Update the balance
        user.userbalance += amount;
        await user.save();

        console.log(`💰 Updated balance for ${user.name || user._id}: ${user.userbalance}`);

        res.json({
            success: true,
            message: "Balance updated successfully",
            newBalance: user.userbalance,
        });
    } catch (err) {
        console.error("Error updating balance:", err);
        res.status(500).json({ message: "Server error while updating balance" });
    }
});

export default router;
