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
		const { user_id, PlanName, Investment, dailyEarning, durationDays } = req.body;

		// Validate fields
		if (!user_id || !PlanName || !Investment || !dailyEarning) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}

		// Find user
		const user = await User.findById(user_id);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Check balance
		if (user.userbalance < Investment) {
			return res.status(400).json({
				success: false,
				message: "Insufficient balance. Please deposit funds to subscribe to a plan.",
			});
		}

		// Set lifetime plan (no expiry)
		const days = durationDays || null; // no expiry if not provided
		let expiryDate = null;
		let planExpireText = "Lifetime";

		if (days) {
			expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() + days);
			planExpireText = `${days} days`;
		}

		// Create plan
		const plan = new Plan({
			user_id,
			PlanName,
			Investment,
			dailyEarning,
			totalEarning: 0,
			totalAmount: Investment,
			planExpireText,
			expiryDate,
			planExpired: false,
		});

		// Deduct investment from user balance
		user.UserInvestment = (user.UserInvestment || 0) + Investment;
		user.userbalance -= Investment;

		await user.save();
		await plan.save();

		res.status(201).json({
			success: true,
			message: "Plan created successfully!",
			plan,
		});
	} catch (err) {
		console.error("❌ Error in createPlan:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Something went wrong while creating the plan",
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

		let query = {};

		// If user ID is passed, filter by user
		if (id) {
			query.user_id = id;
		}

		// Exclude expired plans if any (for safety)
		query.planExpired = false;

		// Fetch plans
		const plans = await Plan.find(query).sort({ createdAt: -1 });

		if (!plans.length) {
			return res.status(200).json({
				success: true,
				message: "No active plans found for this user.",
				plans: [],
			});
		}

		res.status(200).json({
			success: true,
			count: plans.length,
			plans,
		});
	} catch (err) {
		console.error("❌ Error fetching plans:", err);
		res.status(500).json({
			success: false,
			message: err.message || "Failed to fetch plans.",
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
