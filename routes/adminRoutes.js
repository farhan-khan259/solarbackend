const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Payment = require("../models/payment");
const Plan = require("../models/plain");
const Announcements = require("../models/Announcements");

// Admin Dashboard Statistics API
router.get("/admin/dashboard-stats", async (req, res) => {
	try {
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);
		const endOfToday = new Date();
		endOfToday.setHours(23, 59, 59, 999);

		// Today Users
		const todayUsers = await User.countDocuments({
			createdAt: { $gte: startOfToday, $lte: endOfToday },
		});

		// Today Deposits
		const todayDeposits = await Payment.aggregate([
			{
				$match: {
					createdAt: { $gte: startOfToday, $lte: endOfToday },
					depositsAmount: { $gt: 0 },
					depositStatus: "approved",
				},
			},
			{
				$group: {
					_id: null,
					total: { $sum: "$depositsAmount" },
				},
			},
		]);

		// Today Withdrawals
		const todayWithdrawals = await Payment.aggregate([
			{
				$match: {
					createdAt: { $gte: startOfToday, $lte: endOfToday },
					withdrawalsAmount: { $gt: 0 },
					withdrawalStatus: "approved",
				},
			},
			{
				$group: {
					_id: null,
					total: { $sum: "$withdrawalsAmount" },
				},
			},
		]);

		// Total Users
		const totalUsers = await User.countDocuments();

		// Total Deposits
		const totalDeposits = await User.aggregate([
			{ $group: { _id: null, total: { $sum: "$userTotalDeposits" } } },
		]);

		// Total Withdrawals
		const totalWithdrawals = await User.aggregate([
			{ $group: { _id: null, total: { $sum: "$userTotalWithdrawals" } } },
		]);

		// Pending Deposits
		const pendingDeposits = await Payment.countDocuments({
			depositStatus: "pending",
		});

		// Pending Withdrawals
		const pendingWithdrawals = await Payment.countDocuments({
			withdrawalStatus: "pending",
		});

		// Active Plans (if you have plan model; otherwise set 0)
		const activePlans = 0;

		// User Growth (group by month)
		const userGrowth = await User.aggregate([
			{
				$group: {
					_id: { $month: "$createdAt" },
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					month: {
						$switch: {
							branches: [
								{ case: { $eq: ["$_id", 1] }, then: "Jan" },
								{ case: { $eq: ["$_id", 2] }, then: "Feb" },
								{ case: { $eq: ["$_id", 3] }, then: "Mar" },
								{ case: { $eq: ["$_id", 4] }, then: "Apr" },
								{ case: { $eq: ["$_id", 5] }, then: "May" },
								{ case: { $eq: ["$_id", 6] }, then: "Jun" },
								{ case: { $eq: ["$_id", 7] }, then: "Jul" },
								{ case: { $eq: ["$_id", 8] }, then: "Aug" },
								{ case: { $eq: ["$_id", 9] }, then: "Sep" },
								{ case: { $eq: ["$_id", 10] }, then: "Oct" },
								{ case: { $eq: ["$_id", 11] }, then: "Nov" },
								{ case: { $eq: ["$_id", 12] }, then: "Dec" },
							],
							default: "Unknown",
						},
					},
					count: 1,
				},
			},
		]);

		// Monthly Deposits
		// Monthly Deposits
		const monthlyDeposits = await Payment.aggregate([
			{ $match: { depositStatus: "approved" } },
			{
				$group: {
					_id: { $month: "$createdAt" },
					total: { $sum: "$depositsAmount" },
				},
			},
			{
				$project: {
					month: {
						$switch: {
							branches: [
								{ case: { $eq: ["$_id", 1] }, then: "Jan" },
								{ case: { $eq: ["$_id", 2] }, then: "Feb" },
								{ case: { $eq: ["$_id", 3] }, then: "Mar" },
								{ case: { $eq: ["$_id", 4] }, then: "Apr" },
								{ case: { $eq: ["$_id", 5] }, then: "May" },
								{ case: { $eq: ["$_id", 6] }, then: "Jun" },
								{ case: { $eq: ["$_id", 7] }, then: "Jul" },
								{ case: { $eq: ["$_id", 8] }, then: "Aug" },
								{ case: { $eq: ["$_id", 9] }, then: "Sep" },
								{ case: { $eq: ["$_id", 10] }, then: "Oct" },
								{ case: { $eq: ["$_id", 11] }, then: "Nov" },
								{ case: { $eq: ["$_id", 12] }, then: "Dec" },
							],
							default: "Unknown",
						},
					},
					total: 1, // keep total deposits
				},
			},
		]);
		const Plans = await Plan.find();

		// Recent Deposits
		const recentDeposits = await Payment.find({ depositsAmount: { $gt: 0 } })
			.sort({ createdAt: -1 })
			.limit(5);

		// Recent Withdrawals
		const recentWithdrawals = await Payment.find({
			withdrawalsAmount: { $gt: 0 },
		})
			.sort({ createdAt: -1 })
			.limit(5);

		// Final Response
		res.json({
			success: true,
			stats: {
				todayUsers,
				todayDeposits: todayDeposits[0]?.total || 0,
				todayWithdrawals: todayWithdrawals[0]?.total || 0,
				totalUsers,
				totalDeposits: totalDeposits[0]?.total || 0,
				totalWithdrawals: totalWithdrawals[0]?.total || 0,
				pendingDeposits,
				pendingWithdrawals,
				activePlans: Plans.length,
				userGrowth,
				monthlyDeposits,
				recentDeposits,
				recentWithdrawals,
			},
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ success: false, message: "Server Error" });
	}
});
router.get("/admin/report/monthly", async (req, res) => {
	try {
		const today = new Date();
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		const endOfMonth = new Date(
			today.getFullYear(),
			today.getMonth() + 1,
			0,
			23,
			59,
			59,
			999
		);

		const monthlyUsers = await User.find({
			createdAt: { $gte: startOfMonth, $lte: endOfMonth },
		});
		const monthlyUserscount = await User.countDocuments({
			createdAt: { $gte: startOfMonth, $lte: endOfMonth },
		});

		const totalwithdraw = await Payment.aggregate([
			{
				$match: {
					createdAt: { $gte: startOfMonth, $lte: endOfMonth },
					withdrawalStatus: "approved",
					withdrawalsAmount: { $gt: 0 },
				},
			},
			{
				$group: {
					_id: null,
					total: { $sum: "$withdrawalsAmount" },
				},
			},
		]);

		const totalbalance = await Payment.aggregate([
			{
				$match: {
					createdAt: { $gte: startOfMonth, $lte: endOfMonth },
					depositStatus: "approved",
					depositsAmount: { $gt: 0 },
				},
			},
			{
				$group: {
					_id: null,
					total: { $sum: "$depositsAmount" },
				},
			},
		]);

		res.json({
			success: true,
			reportType: "monthly",
			stats: {
				month: startOfMonth.toLocaleString("default", { month: "long" }),
				year: startOfMonth.getFullYear(),
				users: monthlyUsers,
				usercount: monthlyUserscount,
				deposits: totalbalance[0]?.total || 0,
				withdrawals: totalwithdraw[0]?.total || 0,
			},
		});
	} catch (error) {
		console.error("Monthly report error:", error);
		res
			.status(500)
			.json({ success: false, message: "Error fetching monthly report" });
	}
});

router.get("/admin/report/daily", async (req, res) => {
	try {
		const today = new Date();
		const startOfDay = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate()
		);
		const endOfDay = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
			23,
			59,
			59,
			999
		);

		// 🧍 Daily user count
		const dailyUsers = await User.find({
			createdAt: { $gte: startOfDay, $lte: endOfDay },
		});
		const dailyUserscount = dailyUsers.length;

		// 💰 Today's approved deposits
		const totalDeposits = await Payment.aggregate([
			{
				$match: {
					createdAt: { $gte: startOfDay, $lte: endOfDay },
					depositStatus: "approved",
					depositsAmount: { $gt: 0 },
				},
			},
			{
				$group: {
					_id: null,
					total: { $sum: "$depositsAmount" },
				},
			},
		]);

		// 💸 Today's approved withdrawals
		const totalWithdrawals = await Payment.aggregate([
			{
				$match: {
					createdAt: { $gte: startOfDay, $lte: endOfDay },
					withdrawalStatus: "approved",
					withdrawalsAmount: { $gt: 0 },
				},
			},
			{
				$group: {
					_id: null,
					total: { $sum: "$withdrawalsAmount" },
				},
			},
		]);

		// 📤 Return report
		res.json({
			success: true,
			reportType: "daily",
			stats: {
				date: today.toISOString().split("T")[0],
				day: today.toLocaleString("default", { weekday: "long" }),
				users: dailyUsers,
				dailyUserscount,
				deposits: totalDeposits[0]?.total || 0,
				withdrawals: totalWithdrawals[0]?.total || 0,
			},
		});
	} catch (error) {
		console.error("Daily report error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching daily report",
		});
	}
});

router.get("/admin/transactions", async (req, res) => {
	try {
		const transactions = await Payment.find();
		res.json({ success: true, transactions });
	} catch (error) {
		console.error("Error fetching transactions:", error);
		res
			.status(500)
			.json({ success: false, message: "Error fetching transactions" });
	}
});
router.post("/announcements", async (req, res) => {
	const message = req.body.message;

	try {
		const announcement = new Announcements({ message });
		await announcement.save();
		res
			.status(201)
			.json({ success: true, message: "Announcement created successfully" });
	} catch (error) {
		console.error("Error creating announcement:", error);
		res
			.status(500)
			.json({ success: false, message: "Error creating announcement" });
	}
});
router.get("/announcements", async (req, res) => {
	try {
		const announcements = await Announcements.find();
		res.json({ success: true, announcements });
	} catch (error) {
		console.error("Error fetching announcements:", error);
		res
			.status(500)
			.json({ success: false, message: "Error fetching announcements" });
	}
});

// ✅ Today Report API
// ✅ Daily Report API (with balance, bank name & user create date)

module.exports = router;
