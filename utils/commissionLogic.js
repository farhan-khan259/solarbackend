// const User = require('../models/User');
// const Plan = require('../models/plain');
// const Transaction = require('../models/Transaction');

// // Commission rates for plan expiration
// const PLAN_EXPIRE_COMMISSION_RATES = {
//     1: 0.04, // 4%
//     2: 0.025, // 2.5%
//     3: 0.015 // 1.5%
// };

// // Function to get upline chain
// const getUplineChain = async (userId, maxLevels = 3) => {
//     const uplineChain = [];
//     let currentUserId = userId;

//     for (let level = 1; level <= maxLevels; level++) {
//         const currentUser = await User.findById(currentUserId);
//         if (!currentUser || !currentUser.referredBy) break;

//         const upliner = await User.findById(currentUser.referredBy);
//         if (upliner) {
//             uplineChain.push(upliner);
//             currentUserId = upliner._id;
//         } else {
//             break;
//         }
//     }

//     return uplineChain;
// };

// // Plan expire commission distribution
// const distributePlanExpireCommission = async (planId) => {
//     try {
//         const plan = await Plan.findById(planId).populate('user_id');
//         if (!plan || !plan.isEligibleForCommission) {
//             throw new Error('Plan not eligible for commission distribution');
//         }

//         const user = plan.user_id;
//         const returnProfitAmount = plan.returnProfit;

//         console.log(`Distributing commissions for plan ${plan._id}:`);
//         console.log(`- Investment: ${plan.Investment}`);
//         console.log(`- Profit Percentage: ${plan.profitPercentage}`);
//         console.log(`- Return Profit: ${returnProfitAmount}`);
//         console.log(`- Days: ${plan.days}`);

//         // Get upline chain
//         const uplineChain = await getUplineChain(user._id, 3);

//         const commissionTransactions = [];
//         let totalCommissionDistributed = 0;

//         // Distribute commissions to each level
//         for (let level = 1; level <= 3; level++) {
//             const upliner = uplineChain[level - 1];
//             if (upliner) {
//                 const commissionRate = PLAN_EXPIRE_COMMISSION_RATES[level];
//                 const commissionAmount = Math.round(returnProfitAmount * commissionRate);

//                 if (commissionAmount > 0) {
//                     // Add commission to upliner's wallet
//                     upliner.wallet += commissionAmount;
//                     await upliner.save();

//                     // Record commission in plan
//                     await plan.addUplineCommission(level, upliner._id, commissionAmount, commissionRate);

//                     // Create transaction record
//                     const commissionTransaction = new Transaction({
//                         userId: upliner._id,
//                         amount: commissionAmount,
//                         type: 'plan_expire_commission',
//                         description: `Level ${level} plan expire commission from ${user.fullName}`,
//                         status: 'completed',
//                         metadata: {
//                             fromUserId: user._id,
//                             fromUserName: user.fullName,
//                             level: level,
//                             planId: plan._id,
//                             planName: plan.PlanName,
//                             returnProfitAmount: returnProfitAmount,
//                             commissionRate: commissionRate,
//                             investmentAmount: plan.Investment,
//                             profitPercentage: plan.profitPercentage
//                         }
//                     });

//                     await commissionTransaction.save();
//                     commissionTransactions.push(commissionTransaction);
//                     totalCommissionDistributed += commissionAmount;

//                     console.log(`- Level ${level} commission: ${commissionAmount} PKR to ${upliner.fullName}`);
//                 }
//             }
//         }

//         // Mark plan as having distributed commissions
//         plan.commissionAmount = totalCommissionDistributed;
//         await plan.markCommissionsDistributed();

//         console.log(`- Total commissions distributed: ${totalCommissionDistributed} PKR`);

//         return commissionTransactions;
//     } catch (error) {
//         console.error('Error distributing plan expire commission:', error);
//         throw error;
//     }
// };

// module.exports = {
//     distributePlanExpireCommission,
//     getUplineChain,
//     PLAN_EXPIRE_COMMISSION_RATES
// };


const User = require('../models/User');
const Plan = require('../models/plain');
const Transaction = require('../models/Transaction');

// Referral commission rates (on plan purchase)
const REFERRAL_COMMISSION_RATES = {
    1: 0.06,  // 6% - Direct
    2: 0.031, // 3.1% - Indirect
    3: 0.015  // 1.5% - Extended
};

// Plan expire commission rates (when plan completes)
const PLAN_EXPIRE_COMMISSION_RATES = {
    1: 0.04,  // 4%
    2: 0.025, // 2.5%
    3: 0.015  // 1.5%
};

// ✅ DISTRIBUTE REFERRAL COMMISSION WHEN PLAN IS PURCHASED
const distributeReferralCommission = async (user, investmentAmount) => {
    try {
        const commissionTransactions = [];
        let currentUser = user;

        for (let level = 1; level <= 3; level++) {
            if (!currentUser.referredBy) break;

            const upliner = await User.findOne({ randomCode: currentUser.referredBy });
            if (!upliner) break;

            const commissionRate = REFERRAL_COMMISSION_RATES[level];
            const commissionAmount = investmentAmount * commissionRate;

            if (commissionAmount > 0) {
                // Add commission to upliner's balance
                upliner.userbalance += commissionAmount;
                upliner.totalCommissionEarned = (upliner.totalCommissionEarned || 0) + commissionAmount;

                // Track level-wise commission
                if (level === 1) {
                    upliner.directCommission = (upliner.directCommission || 0) + commissionAmount;
                } else if (level === 2) {
                    upliner.indirectCommission = (upliner.indirectCommission || 0) + commissionAmount;
                } else if (level === 3) {
                    upliner.extendedCommission = (upliner.extendedCommission || 0) + commissionAmount;
                }

                await upliner.save();

                // Create transaction record
                const commissionTransaction = new Transaction({
                    userId: upliner._id,
                    amount: commissionAmount,
                    type: 'referral_commission',
                    description: `Level ${level} referral commission from ${user.fullName}`,
                    status: 'completed',
                    metadata: {
                        fromUserId: user._id,
                        fromUserName: user.fullName,
                        level: level,
                        investmentAmount: investmentAmount,
                        commissionRate: commissionRate
                    }
                });

                await commissionTransaction.save();
                commissionTransactions.push(commissionTransaction);

                console.log(`💰 Level ${level} referral commission: ${commissionAmount} PKR to ${upliner.fullName}`);
            }

            currentUser = upliner;
        }

        return commissionTransactions;
    } catch (error) {
        console.error('Error distributing referral commission:', error);
        throw error;
    }
};

// ✅ DISTRIBUTE PLAN EXPIRE COMMISSION WHEN PLAN IS CLAIMED/COMPLETED
const distributePlanExpireCommission = async (planId) => {
    try {
        const plan = await Plan.findById(planId).populate('user_id');
        if (!plan) throw new Error('Plan not found');

        const user = plan.user_id;
        const returnProfitAmount = plan.returnProfit;

        console.log(`🎯 Distributing plan expire commissions for plan ${plan._id}:`);
        console.log(`- Investment: ${plan.Investment}`);
        console.log(`- Return Profit: ${returnProfitAmount}`);

        const commissionTransactions = [];
        let currentUser = user;

        for (let level = 1; level <= 3; level++) {
            if (!currentUser.referredBy) break;

            const upliner = await User.findOne({ randomCode: currentUser.referredBy });
            if (!upliner) break;

            const commissionRate = PLAN_EXPIRE_COMMISSION_RATES[level];
            const commissionAmount = returnProfitAmount * commissionRate;

            if (commissionAmount > 0) {
                // Add commission to upliner's balance
                upliner.userbalance += commissionAmount;
                upliner.totalCommissionEarned = (upliner.totalCommissionEarned || 0) + commissionAmount;
                upliner.planExpireCommission = (upliner.planExpireCommission || 0) + commissionAmount;

                await upliner.save();

                // Record commission in plan
                await plan.addUplineCommission(level, upliner._id, commissionAmount, commissionRate);

                // Create transaction record
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
                        planName: plan.PlanName,
                        returnProfitAmount: returnProfitAmount,
                        commissionRate: commissionRate
                    }
                });

                await commissionTransaction.save();
                commissionTransactions.push(commissionTransaction);

                console.log(`🎁 Level ${level} plan expire commission: ${commissionAmount} PKR to ${upliner.fullName}`);
            }

            currentUser = upliner;
        }

        // Mark plan as having distributed commissions
        plan.commissionAmount = commissionTransactions.reduce((sum, t) => sum + t.amount, 0);
        await plan.markCommissionsDistributed();

        return commissionTransactions;
    } catch (error) {
        console.error('Error distributing plan expire commission:', error);
        throw error;
    }
};

module.exports = {
    distributeReferralCommission,
    distributePlanExpireCommission,
    REFERRAL_COMMISSION_RATES,
    PLAN_EXPIRE_COMMISSION_RATES
};