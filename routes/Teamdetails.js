// module.exports = router;
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Paymnet = require("../models/payment"); // keep your existing name if you're using Paymnet elsewhere
const Plan = require("../models/plain"); // matches your provided Plan model file (plain.js)

/**
 * Helper: calculate deposit statistics for a set of members
 */
async function calculateStats(members, commissionRate = 0) {
	const startOfDay = new Date();
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date();
	endOfDay.setHours(23, 59, 59, 999);

	const todayNewUsers = members.filter(
		(u) => u.createdAt >= startOfDay && u.createdAt <= endOfDay
	).length;

	const totalUsers = members.length;
	const totalActiveUsers = members.length; // you can change this logic if you track active differently

	let totalTeamDeposit = 0;
	let totalTeamWithdrawal = 0;
	let todayTeamDeposit = 0;
	let todayTeamWithdrawal = 0;

	const membersWithPayments = members.map((member) => {
		const totalDeposit = member.userTotalDeposits || 0;
		const totalWithdrawal = member.userTotalWithdrawals || 0;

		const todayDeposit =
			member.createdAt >= startOfDay && member.createdAt <= endOfDay
				? totalDeposit
				: 0;

		const todayWithdrawal =
			member.createdAt >= startOfDay && member.createdAt <= endOfDay
				? totalWithdrawal
				: 0;

		totalTeamDeposit += totalDeposit;
		totalTeamWithdrawal += totalWithdrawal;
		todayTeamDeposit += todayDeposit;
		todayTeamWithdrawal += todayWithdrawal;

		return {
			_id: member._id,
			fullName: member.fullName,
			email: member.email,
			randomCode: member.randomCode,
			whatsappNumber: member.whatsappNumber,
			UserInvestment: member.UserInvestment || 0,
			createdAt: member.createdAt,
			payments: {
				totalDeposit,
				totalWithdrawal,
				todayDeposit,
				todayWithdrawal,
			},
		};
	});

	const todayCommission = todayTeamDeposit * commissionRate;
	const totalCommission = totalTeamDeposit * commissionRate;

	return {
		todayNewUsers,
		totalActiveUsers,
		totalUsers,
		todayTeamDeposit,
		totalTeamDeposit,
		todayTeamWithdrawal,
		totalTeamWithdrawal,
		todayCommission,
		totalCommission,
		membersWithPayments,
	};
}

/**
 * POST /team
 * Body: { userId }
 * Returns: user info, referrals (3 levels), stats and teamPlanInvestment (plans only)
 */
router.post("/", async (req, res) => {
	const { userId } = req.body;

	try {
		if (!userId) {
			return res.status(400).json({ success: false, message: "userId is required" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		// -------------------------
		// Get referrals (levels 1,2,3)
		// -------------------------
		const directReferrals = await User.find({
			randomCode: { $in: user.team || [] },
		}).select(
			"_id fullName email randomCode whatsappNumber team createdAt userTotalDeposits userTotalWithdrawals UserInvestment"
		);

		// Level 2
		let indirectReferrals = [];
		for (const d of directReferrals) {
			if (!d.team || d.team.length === 0) continue;
			const deeper = await User.find({
				randomCode: { $in: d.team },
			}).select(
				"_id fullName email randomCode whatsappNumber team createdAt userTotalDeposits userTotalWithdrawals UserInvestment"
			);
			indirectReferrals = indirectReferrals.concat(deeper);
		}

		// Level 3
		let extendedReferrals = [];
		for (const i of indirectReferrals) {
			if (!i.team || i.team.length === 0) continue;
			const deeper = await User.find({
				randomCode: { $in: i.team },
			}).select(
				"_id fullName email randomCode whatsappNumber team createdAt userTotalDeposits userTotalWithdrawals UserInvestment"
			);
			extendedReferrals = extendedReferrals.concat(deeper);
		}

		// -------------------------
		// Stats per level
		// -------------------------
		const [directStats, indirectStats, extendedStats] = await Promise.all([
			calculateStats(directReferrals, 0.08),
			calculateStats(indirectReferrals, 0.03),
			calculateStats(extendedReferrals, 0.02),
		]);

		// Optional: payments for user
		const payment = await Paymnet.find({ user_id: userId });

		// -------------------------
		// TEAM PLAN INVESTMENT (plans collection)
		// -------------------------
		// Collect user ids for levels
		const level1UserIds = directReferrals.map((u) => u._id);
		const level2UserIds = indirectReferrals.map((u) => u._id);
		const level3UserIds = extendedReferrals.map((u) => u._id);

		// Aggregate sums for each level (only non-expired plans)
		// (Using aggregate ensures we don't load every plan doc unnecessarily)
		const [level1Agg, level2Agg, level3Agg] = await Promise.all([
			Plan.aggregate([
				{ $match: { user_id: { $in: level1UserIds }, planExpired: false } },
				{ $group: { _id: null, total: { $sum: "$Investment" } } },
			]),
			Plan.aggregate([
				{ $match: { user_id: { $in: level2UserIds }, planExpired: false } },
				{ $group: { _id: null, total: { $sum: "$Investment" } } },
			]),
			Plan.aggregate([
				{ $match: { user_id: { $in: level3UserIds }, planExpired: false } },
				{ $group: { _id: null, total: { $sum: "$Investment" } } },
			]),
		]);

		const level1Investment = (level1Agg[0] && level1Agg[0].total) || 0;
		const level2Investment = (level2Agg[0] && level2Agg[0].total) || 0;
		const level3Investment = (level3Agg[0] && level3Agg[0].total) || 0;
		const teamPlanInvestment = Number(level1Investment + level2Investment + level3Investment) || 0;

		// Debug logs (remove or keep as needed)
		console.log("Teamdetails: userId:", userId);
		console.log("Direct count:", directReferrals.length, "Indirect:", indirectReferrals.length, "Extended:", extendedReferrals.length);
		console.log("Level1Investment:", level1Investment, "Level2Investment:", level2Investment, "Level3Investment:", level3Investment);
		console.log("teamPlanInvestment:", teamPlanInvestment);

		// -------------------------
		// Commissions
		// -------------------------
		const directTotalCommission = directStats.totalCommission || 0;
		const indirectTotalCommission = indirectStats.totalCommission || 0;
		const extendedTotalCommission = extendedStats.totalCommission || 0;
		const grandTotalCommission = directTotalCommission + indirectTotalCommission + extendedTotalCommission;

		// -------------------------
		// Final JSON response
		// -------------------------
		return res.status(200).json({
			success: true,
			user: {
				_id: user._id,
				fullName: user.fullName,
				email: user.email,
				randomCode: user.randomCode,
				whatsappNumber: user.whatsappNumber,
				teamIds: user.team || [],
				UserInvestment: user.UserInvestment || 0,
				userbalance: user.userbalance || 0,
				userTotalDeposits: user.userTotalDeposits || 0,
				userCreateDate: user.createdAt || null,
				userTotalWithdrawals: user.userTotalWithdrawals || 0,
			},
			directReferrals: {
				members: directStats.membersWithPayments,
				stats: {
					todayNewUsers: directStats.todayNewUsers,
					totalActiveUsers: directStats.totalActiveUsers,
					totalUsers: directStats.totalUsers,
					todayTeamDeposit: directStats.todayTeamDeposit,
					totalTeamDeposit: directStats.totalTeamDeposit,
					todayTeamWithdrawal: directStats.todayTeamWithdrawal,
					totalTeamWithdrawal: directStats.totalTeamWithdrawal,
					todayCommission: directStats.todayCommission,
					totalCommission: directStats.totalCommission,
				},
				totalCommission: directTotalCommission,
			},
			indirectReferrals: {
				members: indirectStats.membersWithPayments,
				stats: {
					todayNewUsers: indirectStats.todayNewUsers,
					totalActiveUsers: indirectStats.totalActiveUsers,
					totalUsers: indirectStats.totalUsers,
					todayTeamDeposit: indirectStats.todayTeamDeposit,
					totalTeamDeposit: indirectStats.totalTeamDeposit,
					todayTeamWithdrawal: indirectStats.todayTeamWithdrawal,
					totalTeamWithdrawal: indirectStats.totalTeamWithdrawal,
					todayCommission: indirectStats.todayCommission,
					totalCommission: indirectStats.totalCommission,
				},
				totalCommission: indirectTotalCommission,
			},
			extendedReferrals: {
				members: extendedStats.membersWithPayments,
				stats: {
					todayNewUsers: extendedStats.todayNewUsers,
					totalActiveUsers: extendedStats.totalActiveUsers,
					totalUsers: extendedStats.totalUsers,
					todayTeamDeposit: extendedStats.todayTeamDeposit,
					totalTeamDeposit: extendedStats.totalTeamDeposit,
					todayTeamWithdrawal: extendedStats.todayTeamWithdrawal,
					totalTeamWithdrawal: extendedStats.totalTeamWithdrawal,
					todayCommission: extendedStats.todayCommission,
					totalCommission: extendedStats.totalCommission,
				},
				totalCommission: extendedTotalCommission,
			},
			commissionSummary: {
				directTotalCommission,
				indirectTotalCommission,
				extendedTotalCommission,
				grandTotalCommission,
			},
			payment: payment || [],
			// team plan investments (plans only, not deposits)
			teamPlanInvestment, // number
			teamPlanInvestmentBreakdown: {
				level1: level1Investment,
				level2: level2Investment,
				level3: level3Investment,
			},
		});
	} catch (err) {
		console.error("❌ Error in /team route:", err);
		return res.status(500).json({ success: false, message: err.message || "Server error" });
	}
});

/**
 * GET /team  - admin/debug: full referral tree
 */
router.get("/", async (req, res) => {
	try {
		const users = await User.find().select("_id fullName email randomCode whatsappNumber team createdAt");

		const result = [];
		for (const u of users) {
			const directReferrals = await User.find({ randomCode: { $in: u.team || [] } }).select("_id randomCode team");
			let indirectReferrals = [];
			for (const d of directReferrals) {
				const deeper = await User.find({ randomCode: { $in: d.team || [] } }).select("_id randomCode team");
				indirectReferrals = indirectReferrals.concat(deeper);
			}
			let extendedReferrals = [];
			for (const i of indirectReferrals) {
				const deeper = await User.find({ randomCode: { $in: i.team || [] } }).select("_id randomCode team");
				extendedReferrals = extendedReferrals.concat(deeper);
			}

			result.push({
				user: {
					_id: u._id,
					fullName: u.fullName,
					email: u.email,
					randomCode: u.randomCode,
					whatsappNumber: u.whatsappNumber,
					createdAt: u.createdAt,
					referrals: {
						direct: directReferrals,
						indirect: indirectReferrals,
						extended: extendedReferrals,
					},
				},
			});
		}

		return res.status(200).json({ success: true, count: result.length, data: result });
	} catch (error) {
		console.error("❌ Error fetching referrals:", error);
		return res.status(500).json({ success: false, message: "Server error" });
	}
});

module.exports = router;
