const express = require('express');
const router = express.Router();
const Plan = require('../models/plain');
const { distributePlanExpireCommission } = require('../utils/commissionLogic');

// Manual trigger for commission distribution (for testing)
router.post('/distribute/:planId', async (req, res) => {
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

// Get all plans eligible for commission distribution
router.get('/eligible-plans', async (req, res) => {
    try {
        const eligiblePlans = await Plan.findPlansForCommissionDistribution();

        res.json({
            success: true,
            count: eligiblePlans.length,
            plans: eligiblePlans
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;