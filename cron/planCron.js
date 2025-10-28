// const cron = require("node-cron");
// const Plan = require("../models/plain");
// const User = require("../models/User");

// // Run once every 24 hours at midnight
// cron.schedule("0 0 * * *", async () => {
// 	console.log("⏳ Running earnings cron job (every 24 hours at midnight)...");

// 	try {
// 		const plans = await Plan.find();

// 		for (let plan of plans) {
// 			// Skip expired plans
// 			if (plan.planExpired) continue;

// 			// Add dailyEarning to totalEarning
// 			plan.totalEarning += plan.dailyEarning;

// 			// Recalculate totalAmount = Investment + totalEarning
// 			plan.totalAmount = (plan.Investment || 0) + (plan.totalEarning || 0);

// 			// Add dailyEarning to user balance
// 			const user = await User.findById(plan.user_id);
// 			if (user) {
// 				user.userbalance += plan.dailyEarning;
// 				await user.save();
// 			}

// 			// Check if expired
// 			if (new Date() >= plan.expiryDate) {
// 				plan.planExpired = true;
// 			}

// 			await plan.save();
// 		}

// 		console.log("✅ Earnings updated for all active plans!");
// 	} catch (err) {
// 		console.error("❌ Error updating earnings:", err.message);
// 	}
// });


//UPDATED
const cron = require("node-cron");
const Plan = require("../models/plain");
const User = require("../models/User");
const { distributePlanExpireCommission } = require("../utils/commissionLogic"); // Add this import

// Run once every 24 hours at midnight - UPDATED: No daily balance additions
cron.schedule("0 0 * * *", async () => {
	console.log("⏳ Running plan progress update...");

	try {
		const plans = await Plan.find({ status: 'running' });

		for (let plan of plans) {
			// Only update the plan's internal tracking (for display purposes)
			plan.totalEarning += plan.dailyEarning;
			plan.totalAmount = (plan.Investment || 0) + (plan.totalEarning || 0);

			// ✅ REMOVED: No daily additions to user balance
			// User will get everything when they claim

			// Check if plan has completed (reached ending date)
			if (plan.endingDate && new Date() >= plan.endingDate) {
				plan.planExpired = true;
				// Plan is now ready to be claimed
				// Status remains 'running' until user manually claims
			}

			await plan.save();
		}

		console.log(`✅ Plan progress updated for ${plans.length} active plans!`);
	} catch (err) {
		console.error("❌ Error updating plan progress:", err.message);
	}
});