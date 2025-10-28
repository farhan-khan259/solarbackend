// routes/commission.js or in your existing plan routes
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/plain');
const Transaction = require('../models/Transaction');

// Plan expiration commission rates
const PLAN_EXPIRE_COMMISSION_RATES = {
    1: 0.04, // 4%
    2: 0.025, // 2.5%
    3: 0.015 // 1.5%
};

// Function to distribute commissions when plan expires
const distributePlanExpireCommission = async (planId) => {
    try {
        const plan = await Plan.findById(planId).populate('userId');
        if (!plan) throw new Error('Plan not found');

        const user = plan.userId;
        const returnProfitAmount = plan.returnProfit || plan.depositAmount; // Use return profit or deposit amount

        // Get upline chain (up to 3 levels)
        const uplineChain = await getUplineChain(user._id, 3);

        const commissionTransactions = [];

        // Distribute commissions to each level
        for (let level = 1; level <= 3; level++) {
            const upliner = uplineChain[level - 1];
            if (upliner) {
                const commissionRate = PLAN_EXPIRE_COMMISSION_RATES[level];
                const commissionAmount = returnProfitAmount * commissionRate;

                if (commissionAmount > 0) {
                    // Add commission to upliner's wallet
                    upliner.wallet += commissionAmount;
                    await upliner.save();

                    // Create commission transaction
                    const commissionTransaction = new Transaction({
                        userId: upliner._id,
                        amount: commissionAmount,
                        type: 'plan_expire_commission',
                        description: `Level ${level} plan expire commission from ${user.fullName}`,
                        status: 'completed',
                        metadata: {
                            fromUserId: user._id,
                            fromUserName: user.fullName,
                            level: level,
                            planId: plan._id,
                            returnProfitAmount: returnProfitAmount,
                            commissionRate: commissionRate
                        }
                    });

                    await commissionTransaction.save();
                    commissionTransactions.push(commissionTransaction);
                }
            }
        }

        return commissionTransactions;
    } catch (error) {
        console.error('Error distributing plan expire commission:', error);
        throw error;
    }
};

// Function to get upline chain
const getUplineChain = async (userId, maxLevels = 3) => {
    const uplineChain = [];
    let currentUserId = userId;

    for (let level = 1; level <= maxLevels; level++) {
        const currentUser = await User.findById(currentUserId);
        if (!currentUser || !currentUser.referredBy) break;

        const upliner = await User.findById(currentUser.referredBy);
        if (upliner) {
            uplineChain.push(upliner);
            currentUserId = upliner._id;
        } else {
            break;
        }
    }

    return uplineChain;
};

// API endpoint to trigger plan expiration (call this when plan expires)
router.post('/plan-expire/:planId', async (req, res) => {
    try {
        const { planId } = req.params;

        const commissions = await distributePlanExpireCommission(planId);

        res.json({
            success: true,
            message: 'Plan expire commissions distributed successfully',
            commissions: commissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get plan expire commission summary for user
router.get('/plan-expire-summary/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const planExpireCommissions = await Transaction.aggregate([
            {
                $match: {
                    userId: mongoose.Types.ObjectId(userId),
                    type: 'plan_expire_commission',
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: '$metadata.level',
                    totalCommission: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            commissions: planExpireCommissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;