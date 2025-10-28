// const Payment = require("../models/payment");
// const User = require("../models/User");

// // ✅ Create Deposit
// exports.createDeposit = async (req, res) => {
// 	try {
// 		const { user_id, amount, payment_method } = req.body;
// 		if (!user_id || !amount || !payment_method) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "All fields are required",
// 			});
// 		}

// 		const screenshot = req.file ? req.file.path : null;

// 		const payment = new Payment({
// 			user_id,
// 			depositsAmount: Number(amount),
// 			screenshot,
// 			payment_method,
// 			depositStatus: "pending",
// 		});

// 		await payment.save();

// 		res.status(201).json({
// 			success: true,
// 			message: "Deposit request created successfully",
// 			data: payment,
// 		});
// 	} catch (error) {
// 		console.error("Deposit error:", error);
// 		res.status(500).json({ success: false, message: error.message });
// 	}
// };

// // ✅ Create Withdrawal
// exports.createWithdrawal = async (req, res) => {
// 	try {
// 		const { userId, withdrawals, bankName, accountNumber, accountName } = req.body;
// 		const user = await User.findById(userId);

// 		if (!user) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "User not found",
// 			});
// 		}

// 		if (user.userbalance < withdrawals) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "Insufficient balance",
// 			});
// 		}

// 		// ✅ Immediately deduct from user balance (pending withdrawal)
// 		user.userbalance = user.userbalance - withdrawals;
// 		await user.save();

// 		const payment = new Payment({
// 			user_id: userId,
// 			withdrawalsAmount: Number(withdrawals),
// 			withdrawalStatus: "pending",
// 			payment_method: bankName,
// 			accountNumber,
// 			accountHolderName: accountName,
// 		});

// 		await payment.save();

// 		res.status(201).json({
// 			success: true,
// 			message: "Withdrawal request created successfully (pending approval)",
// 			data: payment,
// 			newBalance: user.userbalance,
// 		});
// 	} catch (error) {
// 		console.error("Withdrawal creation error:", error);
// 		res.status(500).json({ success: false, message: error.message });
// 	}
// };

// // ✅ Get All Payments
// // exports.getPayments = async (req, res) => {
// // 	try {
// // 		const payments = await Payment.find();
// // 		res.status(200).json({ success: true, data: payments });
// // 	} catch (error) {
// // 		res.status(500).json({ success: false, message: error.message });
// // 	}
// // };
// // ✅ Get All Payments
// exports.getPayments = async (req, res) => {
// 	try {
// 		const payments = await Payment.find()
// 			.populate("user_id", "email fullName randomCode"); // <--- include randomCode
// 		res.status(200).json({ success: true, data: payments });
// 	} catch (error) {
// 		res.status(500).json({ success: false, message: error.message });
// 	}
// };





// // ✅ Get Payment By ID
// exports.getPaymentById = async (req, res) => {
// 	try {
// 		const payment = await Payment.findById(req.params.id).populate("user_id", "email fullName");
// 		if (!payment) {
// 			return res.status(404).json({ success: false, message: "Payment not found" });
// 		}
// 		res.status(200).json({ success: true, data: payment });
// 	} catch (error) {
// 		res.status(500).json({ success: false, message: error.message });
// 	}
// };

// // ✅ Update Payment Status (Admin)
// exports.updatePaymentStatus = async (req, res) => {
// 	const { type, status, userId, requesId } = req.body;

// 	try {
// 		const user = await User.findById(userId);
// 		const payment = await Payment.findOne({ user_id: userId, _id: requesId });

// 		if (!user) return res.status(404).json({ success: false, message: "User not found" });
// 		if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

// 		// ✅ Handle REJECT case (refund balance if withdrawal)
// 		if (status === "reject") {
// 			if (type === "deposit") {
// 				payment.depositStatus = "rejected";
// 			} else if (type === "withdrawal") {
// 				payment.withdrawalStatus = "rejected";

// 				// Refund withdrawal amount to user
// 				const refundAmount = Number(payment.withdrawalsAmount) || 0;
// 				user.userbalance = (user.userbalance || 0) + refundAmount;
// 				await user.save();
// 			}

// 			await payment.save();
// 			return res.status(200).json({
// 				success: true,
// 				message: `${type} request rejected successfully`,
// 				payment,
// 				newBalance: user.userbalance,
// 			});
// 		}

// 		// ✅ Handle APPROVED / PENDING statuses
// 		if (type === "deposit") {
// 			payment.depositStatus = status;

// 			if (status === "approved") {
// 				const depositAmount = Number(payment.depositsAmount) || 0;
// 				user.userbalance = (user.userbalance || 0) + depositAmount;
// 				user.userTotalDeposits = (user.userTotalDeposits || 0) + depositAmount;

// 				// ✅ Referral Logic
// 				if (user.referredBy) {
// 					const directRef = await User.findOne({ randomCode: user.referredBy });
// 					if (directRef) {
// 						const directBonus = depositAmount * 0.06;
// 						directRef.userbalance += directBonus;
// 						directRef.totalCommissionEarned = (directRef.totalCommissionEarned || 0) + directBonus;
// 						await directRef.save();

// 						if (directRef.referredBy) {
// 							const indirectRef = await User.findOne({ randomCode: directRef.referredBy });
// 							if (indirectRef) {
// 								const indirectBonus = depositAmount * 0.031;
// 								indirectRef.userbalance += indirectBonus;
// 								indirectRef.totalCommissionEarned = (indirectRef.totalCommissionEarned || 0) + indirectBonus;
// 								await indirectRef.save();

// 								if (indirectRef.referredBy) {
// 									const extendedRef = await User.findOne({ randomCode: indirectRef.referredBy });
// 									if (extendedRef) {
// 										const extendedBonus = depositAmount * 0.015;
// 										extendedRef.userbalance += extendedBonus;
// 										extendedRef.totalCommissionEarned = (extendedRef.totalCommissionEarned || 0) + extendedBonus;
// 										await extendedRef.save();
// 									}
// 								}
// 							}
// 						}
// 					}
// 				}

// 				await user.save();
// 			}
// 		} else if (type === "withdrawal") {
// 			payment.withdrawalStatus = status;

// 			if (status === "approved") {
// 				// Do not re-deduct balance since it was already deducted on creation
// 				user.userTotalWithdrawals =
// 					(user.userTotalWithdrawals || 0) + Number(payment.withdrawalsAmount);
// 				await user.save();
// 			}
// 		}

// 		await payment.save();

// 		return res.status(200).json({
// 			success: true,
// 			message: `${type} status updated successfully`,
// 			payment,
// 			newBalance: user.userbalance,
// 		});
// 	} catch (error) {
// 		console.error("Update Payment Status Error:", error);
// 		res.status(500).json({ success: false, message: error.message });
// 	}
// };

// // ✅ Delete Payment
// exports.deletePayment = async (req, res) => {
// 	try {
// 		const payment = await Payment.findByIdAndDelete(req.params.id);
// 		if (!payment) {
// 			return res.status(404).json({ success: false, message: "Payment not found" });
// 		}
// 		res.status(200).json({ success: true, message: "Payment deleted" });
// 	} catch (error) {
// 		res.status(500).json({ success: false, message: error.message });
// 	}
// };


const Payment = require("../models/payment");
const User = require("../models/User");

// ✅ Create Deposit
exports.createDeposit = async (req, res) => {
	try {
		const { user_id, amount, payment_method } = req.body;
		if (!user_id || !amount || !payment_method) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}

		const screenshot = req.file ? req.file.path : null;

		const payment = new Payment({
			user_id,
			depositsAmount: Number(amount),
			screenshot,
			payment_method,
			depositStatus: "pending",
		});

		await payment.save();

		res.status(201).json({
			success: true,
			message: "Deposit request created successfully",
			data: payment,
		});
	} catch (error) {
		console.error("Deposit error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// ✅ Create Withdrawal
exports.createWithdrawal = async (req, res) => {
	try {
		const { userId, withdrawals, bankName, accountNumber, accountName } = req.body;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		if (user.userbalance < withdrawals) {
			return res.status(400).json({
				success: false,
				message: "Insufficient balance",
			});
		}

		// ✅ DEDUCT FROM BALANCE IMMEDIATELY
		user.userbalance -= withdrawals;
		await user.save();

		const payment = new Payment({
			user_id: userId,
			withdrawalsAmount: Number(withdrawals),
			withdrawalStatus: "pending",
			payment_method: bankName,
			accountNumber,
			accountHolderName: accountName,
		});

		await payment.save();

		res.status(201).json({
			success: true,
			message: "Withdrawal request created successfully (pending approval)",
			data: payment,
			newBalance: user.userbalance,
		});
	} catch (error) {
		console.error("Withdrawal creation error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// ✅ Get All Payments
exports.getPayments = async (req, res) => {
	try {
		const payments = await Payment.find()
			.populate("user_id", "email fullName randomCode");
		res.status(200).json({ success: true, data: payments });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// ✅ Get Payment By ID
exports.getPaymentById = async (req, res) => {
	try {
		const payment = await Payment.findById(req.params.id).populate("user_id", "email fullName");
		if (!payment) {
			return res.status(404).json({ success: false, message: "Payment not found" });
		}
		res.status(200).json({ success: true, data: payment });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// ✅ Update Payment Status (Admin)
exports.updatePaymentStatus = async (req, res) => {
	const { type, status, userId, requesId } = req.body;

	try {
		const user = await User.findById(userId);
		const payment = await Payment.findOne({ user_id: userId, _id: requesId });

		if (!user) return res.status(404).json({ success: false, message: "User not found" });
		if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

		// ✅ Handle REJECT case (refund balance if withdrawal)
		if (status === "reject") {
			if (type === "deposit") {
				payment.depositStatus = "rejected";
			} else if (type === "withdrawal") {
				payment.withdrawalStatus = "rejected";

				// Refund withdrawal amount to user
				const refundAmount = Number(payment.withdrawalsAmount) || 0;
				user.userbalance = (user.userbalance || 0) + refundAmount;
				await user.save();
			}

			await payment.save();
			return res.status(200).json({
				success: true,
				message: `${type} request rejected successfully`,
				payment,
				newBalance: user.userbalance,
			});
		}

		// ✅ Handle APPROVED / PENDING statuses
		if (type === "deposit") {
			payment.depositStatus = status;

			if (status === "approved") {
				const depositAmount = Number(payment.depositsAmount) || 0;
				user.userbalance = (user.userbalance || 0) + depositAmount;
				user.userTotalDeposits = (user.userTotalDeposits || 0) + depositAmount;

				await user.save();
			}
		} else if (type === "withdrawal") {
			payment.withdrawalStatus = status;

			if (status === "approved") {
				// Do not re-deduct balance since it was already deducted on creation
				user.userTotalWithdrawals =
					(user.userTotalWithdrawals || 0) + Number(payment.withdrawalsAmount);
				await user.save();
			}
		}

		await payment.save();

		return res.status(200).json({
			success: true,
			message: `${type} status updated successfully`,
			payment,
			newBalance: user.userbalance,
		});
	} catch (error) {
		console.error("Update Payment Status Error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// ✅ Delete Payment
exports.deletePayment = async (req, res) => {
	try {
		const payment = await Payment.findByIdAndDelete(req.params.id);
		if (!payment) {
			return res.status(404).json({ success: false, message: "Payment not found" });
		}
		res.status(200).json({ success: true, message: "Payment deleted" });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};