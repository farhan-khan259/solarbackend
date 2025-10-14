const Plan = require("../models/plain");
const User = require("../models/User");

// ✅ Create a new plan
// exports.createPlan = async (req, res) => {
// 	try {
// 		const { user_id, PlanName, Investment, dailyEarning, durationDays } = req.body;

// 		if (!user_id || !PlanName || !Investment || !dailyEarning) {
// 			return res.status(400).json({ success: false, message: "All fields are required" });
// 		}

// 		const user = await User.findById(user_id);
// 		if (!user) return res.status(404).json({ success: false, message: "User not found" });

// 		if (user.userbalance < Investment) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "Insufficient balance. Please deposit funds to subscribe to a plan.",
// 			});
// 		}

// 		const days = durationDays || 60;
// 		const expiryDate = new Date();
// 		expiryDate.setDate(expiryDate.getDate() + days);

// 		const planExpireText = `${days} days`;

// 		const plan = new Plan({
// 			user_id,
// 			PlanName,
// 			Investment,
// 			dailyEarning,
// 			totalEarning: 0,
// 			totalAmount: Investment,
// 			planExpireText,
// 			expiryDate,
// 			planExpired: false,
// 		});

// 		// Update user investments
// 		user.UserInvestment = (user.UserInvestment || 0) + Investment;
// 		user.userbalance -= Investment;

// 		await user.save();
// 		await plan.save();

// 		res.status(201).json({ success: true, plan });
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).json({ success: false, message: err.message });
// 	}
// };

exports.createPlan = async (req, res) => {
	try {
		// Allow both userId and user_id for flexibility
		const { user_id, userId, PlanName, Investment, dailyEarning, durationDays } = req.body;
		const finalUserId = user_id || userId;

		// 🧩 Basic validation
		if (!finalUserId || !PlanName || !Investment || !dailyEarning) {
			return res.status(400).json({
				success: false,
				message: "All fields are required (userId, PlanName, Investment, dailyEarning)",
			});
		}

		// 🧠 Fetch user
		const user = await User.findById(finalUserId);
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		// 💰 Check balance
		if (user.userbalance < Investment) {
			return res.status(400).json({
				success: false,
				message: "Insufficient balance. Please deposit funds to subscribe to a plan.",
			});
		}

		// ⏳ Calculate expiry
		const days = durationDays || 60;
		const expiryDate = new Date();
		expiryDate.setDate(expiryDate.getDate() + days);
		const planExpireText = `${days} days`;

		// 🪙 Create new plan
		const newPlan = new Plan({
			userId: finalUserId,
			PlanName,
			Investment,
			dailyEarning,
			totalEarning: 0,
			totalAmount: Investment,
			planExpireText,
			expiryDate,
			planExpired: false,
			createdAt: new Date(),
		});

		// 🔁 Update user investment + balance
		user.UserInvestment = (user.UserInvestment || 0) + Investment;
		user.userbalance -= Investment;

		await Promise.all([user.save(), newPlan.save()]);

		return res.status(201).json({
			success: true,
			message: "Plan subscribed successfully!",
			plan: newPlan,
			updatedBalance: user.userbalance,
		});
	} catch (err) {
		console.error("❌ Error creating plan:", err);
		return res.status(500).json({
			success: false,
			message: "Server error while creating plan",
			error: err.message,
		});
	}
};

// ✅ Get all active plans of the logged-in user
// exports.getPlans = async (req, res) => {
// 	try {
// 		const userId = req.query.id; // frontend should send logged-in user's ID
// 		if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

// 		const plans = await Plan.find({ user_id: userId, planExpired: false }).populate(
// 			"user_id",
// 			"fullName email"
// 		);

// 		res.status(200).json({ success: true, plans });
// 	} catch (err) {
// 		res.status(500).json({ success: false, message: err.message });
// 	}
// };

exports.getPlans = async (req, res) => {
	try {
		const { id } = req.query;

		if (!id) {
			return res.status(400).json({
				success: false,
				message: "User ID is required in query (?id=USER_ID)",
			});
		}

		// ✅ Check if user exists first
		const userExists = await User.findById(id);
		if (!userExists) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		// ✅ Fetch user's active plans
		const plans = await Plan.find({ userId: id });

		// ✅ If no plans found, return empty array (not error)
		if (!plans.length) {
			return res.json({ success: true, plans: [] });
		}

		return res.json({ success: true, plans });
	} catch (err) {
		console.error("❌ Error fetching plans:", err);
		return res.status(500).json({
			success: false,
			message: "Server error while fetching plans",
			error: err.message,
		});
	}
};

// ✅ Get all plans for a specific user (can include expired plans if needed)
exports.getPlanById = async (req, res) => {
	try {
		const plans = await Plan.find({ user_id: req.params.id }).populate(
			"user_id",
			"fullName email"
		);

		if (!plans || plans.length === 0) {
			return res.status(404).json({ success: false, message: "No plans found for this user" });
		}

		const responsePlans = plans.map(plan => ({
			id: plan._id,
			name: plan.PlanName,
			amount: plan.Investment,
			daily: plan.dailyEarning,
			total: plan.totalEarning,
			totalAmount: plan.totalAmount,
			expireText: plan.planExpireText,
			expiryDate: plan.expiryDate,
			planExpired: plan.planExpired,
			startDate: plan.createdAt,
			user: plan.user_id,
		}));

		res.status(200).json({ success: true, plans: responsePlans });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

// ✅ Update a plan
exports.updatePlan = async (req, res) => {
	try {
		const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
		if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

		res.status(200).json({ success: true, plan });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

// ✅ Delete a plan
exports.deletePlan = async (req, res) => {
	try {
		const plan = await Plan.findByIdAndDelete(req.params.id);
		if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

		res.status(200).json({ success: true, message: "Plan deleted" });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};
