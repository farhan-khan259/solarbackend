const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST: Claim reward for a specific rank
router.post("/claimReward", async (req, res) => {
    try {
        const { userId, rank, reward } = req.body;

        console.log("📥 Claim reward request:", { userId, rank, reward });

        if (!userId || !rank || !reward) {
            return res.status(400).json({
                success: false,
                message: "Missing required data: userId, rank, or reward"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Initialize claimedRanks if not exist
        if (!user.claimedRanks) {
            user.claimedRanks = [];
        }

        // Check if rank already claimed
        const alreadyClaimed = user.claimedRanks.some(claimedRank =>
            claimedRank.rankName === rank
        );

        if (alreadyClaimed) {
            return res.status(400).json({
                success: false,
                message: `Reward for ${rank} rank already claimed`
            });
        }

        // Convert reward to number and add to user balance
        const rewardAmount = Number(reward);
        user.userbalance = (user.userbalance || 0) + rewardAmount;

        // Mark this rank as claimed with proper structure
        user.claimedRanks.push({
            rankName: rank,
            claimedAt: new Date()
        });

        await user.save();

        console.log("✅ Reward claimed successfully for user:", userId, "Rank:", rank);

        return res.status(200).json({
            success: true,
            message: `Reward of PKR ${rewardAmount.toLocaleString()} claimed successfully for ${rank} rank!`,
            newBalance: user.userbalance,
            claimedRanks: user.claimedRanks,
        });
    } catch (error) {
        console.error("❌ Error claiming reward:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while claiming reward"
        });
    }
});

module.exports = router;