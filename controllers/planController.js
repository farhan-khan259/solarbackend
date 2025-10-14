// const Plan = require("../models/plain");
// const User = require("../models/User");

// // ✅ Create a new plan
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

// // ✅ Get all active plans of the logged-in user
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

// // ✅ Get all plans for a specific user (can include expired plans if needed)
// exports.getPlanById = async (req, res) => {
// 	try {
// 		const plans = await Plan.find({ user_id: req.params.id }).populate(
// 			"user_id",
// 			"fullName email"
// 		);

// 		if (!plans || plans.length === 0) {
// 			return res.status(404).json({ success: false, message: "No plans found for this user" });
// 		}

// 		const responsePlans = plans.map(plan => ({
// 			id: plan._id,
// 			name: plan.PlanName,
// 			amount: plan.Investment,
// 			daily: plan.dailyEarning,
// 			total: plan.totalEarning,
// 			totalAmount: plan.totalAmount,
// 			expireText: plan.planExpireText,
// 			expiryDate: plan.expiryDate,
// 			planExpired: plan.planExpired,
// 			startDate: plan.createdAt,
// 			user: plan.user_id,
// 		}));

// 		res.status(200).json({ success: true, plans: responsePlans });
// 	} catch (err) {
// 		res.status(500).json({ success: false, message: err.message });
// 	}
// };

// // ✅ Update a plan
// exports.updatePlan = async (req, res) => {
// 	try {
// 		const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
// 		if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

// 		res.status(200).json({ success: true, plan });
// 	} catch (err) {
// 		res.status(500).json({ success: false, message: err.message });
// 	}
// };

// // ✅ Delete a plan
// exports.deletePlan = async (req, res) => {
// 	try {
// 		const plan = await Plan.findByIdAndDelete(req.params.id);
// 		if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

// 		res.status(200).json({ success: true, message: "Plan deleted" });
// 	} catch (err) {
// 		res.status(500).json({ success: false, message: err.message });
// 	}
// };


const mongoose = require("mongoose");
const Plan = require("../models/plain");
const User = require("../models/User");

// ✅ Create a new plan
exports.createPlan = async (req, res) => {
	try {
		let { user_id, PlanName, Investment, dailyEarning, durationDays } = req.body;

		// Validate required fields
		if (!user_id || !PlanName || !Investment || !dailyEarning) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}

		// Validate MongoDB ObjectId
		if (!mongoose.Types.ObjectId.isValid(user_id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid user ID",
			});
		}

		const user = await User.findById(user_id);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		Investment = Number(Investment);
		dailyEarning = Number(dailyEarning);
		durationDays = Number(durationDays) || 60;

		// Check balance
		if (user.userbalance < Investment) {
			return res.status(400).json({
				success: false,
				message: "Insufficient balance. Please deposit funds to subscribe to a plan.",
			});
		}

		// Calculate expiry
		const expiryDate = new Date();
		expiryDate.setDate(expiryDate.getDate() + durationDays);
		const planExpireText = `${durationDays} days`;

		// Create and save plan
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

		// Update user balance and investment
		user.UserInvestment = (user.UserInvestment || 0) + Investment;
		user.userbalance -= Investment;

		await user.save();
		await plan.save();

		return res.status(201).json({
			success: true,
			message: "Plan created successfully",
			plan,
			userBalance: user.userbalance,
		});
	} catch (err) {
		console.error("❌ Error creating plan:", err.message, err.stack);
		return res.status(500).json({
			success: false,
			message: "Server error while creating plan",
			error: err.message,
		});
	}
};

// ✅ Get all active plans of the logged-in user
exports.getPlans = async (req, res) => {
	try {
		const userId = req.query.id;
		if (!userId) {
			return res.status(400).json({ success: false, message: "User ID is required" });
		}

		const plans = await Plan.find({ user_id: userId, planExpired: false }).populate(
			"user_id",
			"fullName email"
		);

		// Shape data to match frontend needs
		const formattedPlans = plans.map(plan => ({
			_id: plan._id,
			PlanName: plan.PlanName,
			Investment: plan.Investment,
			dailyEarning: plan.dailyEarning,
			totalEarning: plan.totalEarning,
			totalAmount: plan.totalAmount,
			planExpireText: plan.planExpireText,
			expiryDate: plan.expiryDate,
			planExpired: plan.planExpired,
			createdAt: plan.createdAt,
			user: plan.user_id,
		}));

		res.status(200).json({ success: true, plans: formattedPlans });
	} catch (err) {
		console.error("❌ Error fetching plans:", err);
		res.status(500).json({ success: false, message: err.message });
	}
};

// ✅ Get plans by user ID (active + expired)
exports.getPlanById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: "Invalid user ID" });
		}

		const plans = await Plan.find({ user_id: id })
			.populate("user_id", "fullName email")
			.sort({ createdAt: -1 });

		if (!plans || plans.length === 0) {
			return res.status(404).json({ success: false, message: "No plans found for this user" });
		}

		const responsePlans = plans.map((plan) => ({
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

		return res.status(200).json({ success: true, plans: responsePlans });
	} catch (err) {
		console.error("❌ Error fetching plan by ID:", err);
		return res.status(500).json({ success: false, message: "Error fetching plan" });
	}
};

// ✅ Update a plan
exports.updatePlan = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: "Invalid plan ID" });
		}

		const plan = await Plan.findByIdAndUpdate(id, req.body, { new: true });
		if (!plan) {
			return res.status(404).json({ success: false, message: "Plan not found" });
		}

		return res.status(200).json({ success: true, plan });
	} catch (err) {
		console.error("❌ Error updating plan:", err);
		return res.status(500).json({ success: false, message: "Error updating plan" });
	}
};

// ✅ Delete a plan
exports.deletePlan = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: "Invalid plan ID" });
		}

		const plan = await Plan.findByIdAndDelete(id);
		if (!plan) {
			return res.status(404).json({ success: false, message: "Plan not found" });
		}

		return res.status(200).json({ success: true, message: "Plan deleted successfully" });
	} catch (err) {
		console.error("❌ Error deleting plan:", err);
		return res.status(500).json({ success: false, message: "Error deleting plan" });
	}
};
