const cron = require("node-cron");
const Plan = require("../models/plain");
const User = require("../models/User");

// Run once every 24 hours at midnight
cron.schedule("0 0 * * *", async () => {
	console.log("⏳ Running earnings cron job (every 24 hours at midnight)...");

	try {
		const plans = await Plan.find();

		for (let plan of plans) {
			// Skip expired plans
			if (plan.planExpired) continue;

			// Add dailyEarning to totalEarning
			plan.totalEarning += plan.dailyEarning;

			// Recalculate totalAmount = Investment + totalEarning
			plan.totalAmount = (plan.Investment || 0) + (plan.totalEarning || 0);

			// Add dailyEarning to user balance
			const user = await User.findById(plan.user_id);
			if (user) {
				user.userbalance += plan.dailyEarning;
				await user.save();
			}

			// Check if expired
			if (new Date() >= plan.expiryDate) {
				plan.planExpired = true;
			}

			await plan.save();
		}

		console.log("✅ Earnings updated for all active plans!");
	} catch (err) {
		console.error("❌ Error updating earnings:", err.message);
	}
});
