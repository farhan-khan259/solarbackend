const Payment = require("../models/payment");
const User = require("../models/User");

// ✅ Create a new deposit
exports.createDeposit = async (req, res) => {
	console.log(req.body);
	try {
		const { user_id, amount, payment_method } = req.body;
		if (!user_id || !amount || !payment_method) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}

		// If file uploaded, save path
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
		res.status(500).json({ success: false, message: error.message });
	}
};

// ✅ Create a new withdrawal
exports.createWithdrawal = async (req, res) => {
	console.log(req.body);
	try {
		const { userId, withdrawals, bankName, accountNumber, accountName } = req.body;

		const payment = new Payment({
			user_id: userId,
			withdrawalsAmount: withdrawals,
			withdrawalStatus: "pending",
			payment_method: bankName,
			accountNumber: accountNumber,
			accountHolderName: accountName, // ✅ Fixed typo here
		});

		await payment.save();

		res.status(201).json({
			success: true,
			message: "Withdrawal request created successfully",
			data: payment,
		});
	} catch (error) {
		console.error("Error creating withdrawal:", error); // ✅ Optional: log for debugging
		res.status(500).json({ success: false, message: error.message });
	}
};


// ✅ Get all payments
exports.getPayments = async (req, res) => {
	try {
		const payments = await Payment.find();
		res.status(200).json({ success: true, data: payments });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
exports.getPaymentById = async (req, res) => {
	try {
		const payment = await Payment.findById(req.params.id).populate(
			"user_id",
			"email fullName"
		);
		if (!payment) {
			return res
				.status(404)
				.json({ success: false, message: "Payment not found" });
		}
		res.status(200).json({ success: true, data: payment });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// ✅ Update deposit or withdrawal status
// exports.updatePaymentStatus = async (req, res) => {
// 	console.log("reqbody ", req.body);

// 	const { type, status, userId, requesId } = req.body; // type = 'deposit' | 'withdrawal'

// 	try {
// 		if (!userId) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "Please login first",
// 			});
// 		}

// 		if (!type || !status) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "All fields are required",
// 			});
// 		}

// 		// ✅ Fetch payment and user
// 		const payment = await Payment.findOne({ user_id: userId, _id: requesId });
// 		const user = await User.findById(userId);

// 		if (!user) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "User not found",
// 			});
// 		}

// 		if (!payment) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "Payment record not found",
// 			});
// 		}

// 		// ✅ Handle rejection
// 		if (status === "reject") {
// 			if (type === "deposit") {
// 				payment.depositStatus = "rejected";
// 			} else if (type === "withdrawal") {
// 				payment.withdrawalStatus = "rejected";
// 			}
// 			await payment.save();

// 			return res.status(200).json({
// 				success: true,
// 				message: `Payment ${type} request rejected successfully`,
// 				payment,
// 			});
// 		}

// 		// ✅ Approve logic
// 		if (type === "deposit") {
// 			payment.depositStatus = status;
// 			if (status === "approved") {
// 				// Ensure safe numbers
// 				const depositAmount = Number(payment.deposits) || 0;
// 				const currentBalance = Number(user.userbalance) || 0;

// 				user.userbalance = currentBalance + depositAmount;
// 				payment.totaldeposits = (payment.totaldeposits || 0) + depositAmount;
// 				payment.deposits = 0;

// 				await user.save();
// 			}
// 		}

// 		await payment.save();

// 		return res.status(200).json({
// 			success: true,
// 			message: `Payment ${type} status updated successfully`,
// 			payment,
// 		});
// 	} catch (error) {
// 		console.error(error);
// 		return res.status(500).json({ success: false, message: error.message });
// 	}
// };

// exports.updatePaymentStatus = async (req, res) => {
// 	console.log("req.body ", req.body);

// 	const { type, status, userId, requesId } = req.body;

// 	try {
// 		if (!userId) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "Please login first",
// 			});
// 		}

// 		if (!type || !status) {
// 			return res.status(400).json({
// 				success: false,
// 				message: "All fields are required",
// 			});
// 		}

// 		// ✅ Use correct field names based on your schema
// 		const payment = await Payment.findOne({ user_id: userId, _id: requesId });
// 		const user = await User.findById(userId);

// 		if (!user) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "User not found",
// 			});
// 		}

// 		if (!payment) {
// 			return res.status(404).json({
// 				success: false,
// 				message: "Payment record not found",
// 			});
// 		}

// 		// ✅ Handle reject case
// 		if (status === "reject") {
// 			if (type === "deposit") {
// 				payment.depositStatus = "rejected";
// 			} else if (type === "withdrawal") {
// 				payment.withdrawalStatus = "rejected";
// 			}
// 			await payment.save();

// 			return res.status(200).json({
// 				success: true,
// 				message: `Payment ${type} request rejected successfully`,
// 				payment,
// 			});
// 		}

// 		// ✅ Approve cases - USE CORRECT FIELD NAMES
// 		if (type === "deposit") {
// 			payment.depositStatus = status;

// 			if (status === "approved") {
// 				// ✅ Use depositsAmount (not deposits)
// 				const depositAmount = Number(payment.depositsAmount) || 0;
// 				console.log("Depositing amount:", depositAmount);

// 				user.userbalance = user.userbalance + depositAmount;
// 				user.userTotalDeposits = user.userbalance + user.userbalance;
// 				console.log("New user balance:", user.userbalance);
// 				await user.save();
// 			}
// 		} else if (type === "withdrawal") {
// 			payment.withdrawalStatus = status;

// 			if (status === "approved") {
// 				// ✅ Use withdrawalsAmount (not withdrawals)
// 				const withdrawalAmount = Number(payment.withdrawalsAmount) || 0;
// 				console.log("Withdrawing amount:", withdrawalAmount);
// 				user.userbalance = user.userbalance - withdrawalAmount;
// 				user.userTotalWithdrawals = user.userTotalWithdrawals + withdrawalAmount;
// 				console.log("New user balance:", user.userbalance);
// 				await user.save();
// 			}
// 		}

// 		await payment.save();

// 		return res.status(200).json({
// 			success: true,
// 			message: `Payment ${type} status updated successfully`,
// 			payment,
// 			newBalance: user.userbalance, // Send back new balance for confirmation
// 		});
// 	} catch (error) {
// 		console.error(error);
// 		return res.status(500).json({ success: false, message: error.message });
// 	}
// };

exports.updatePaymentStatus = async (req, res) => {
	console.log("req.body ", req.body);

	const { type, status, userId, requesId } = req.body;

	try {
		if (!userId) {
			return res.status(400).json({
				success: false,
				message: "Please login first",
			});
		}

		if (!type || !status) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}

		const payment = await Payment.findOne({ user_id: userId, _id: requesId });
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		if (!payment) {
			return res.status(404).json({
				success: false,
				message: "Payment record not found",
			});
		}

		// Handle reject case
		if (status === "reject") {
			if (type === "deposit") {
				payment.depositStatus = "rejected";
			} else if (type === "withdrawal") {
				payment.withdrawalStatus = "rejected";
			}
			await payment.save();

			return res.status(200).json({
				success: true,
				message: `Payment ${type} request rejected successfully`,
				payment,
			});
		}

		// ✅ FIXED: Correct calculations for deposits and withdrawals
		if (type === "deposit") {
			payment.depositStatus = status;

			if (status === "approved") {
				const depositAmount = Number(payment.depositsAmount) || 0;
				console.log("Depositing amount:", depositAmount);

				// Update balance
				user.userbalance = user.userbalance + depositAmount;

				// ✅ CORRECT: Add to total deposits
				user.userTotalDeposits = (user.userTotalDeposits || 0) + depositAmount;

				console.log("New balance:", user.userbalance);
				console.log("Total deposits:", user.userTotalDeposits);
				await user.save();
			}
		} else if (type === "withdrawal") {
			payment.withdrawalStatus = status;

			if (status === "approved") {
				const withdrawalAmount = Number(payment.withdrawalsAmount) || 0;
				console.log("Withdrawing amount:", withdrawalAmount);

				// Update balance
				user.userbalance = user.userbalance - withdrawalAmount;

				// ✅ CORRECT: Add to total withdrawals
				user.userTotalWithdrawals =
					(user.userTotalWithdrawals || 0) + withdrawalAmount;

				console.log("New balance:", user.userbalance);
				console.log("Total withdrawals:", user.userTotalWithdrawals);
				await user.save();
			}
		}

		await payment.save();

		return res.status(200).json({
			success: true,
			message: `Payment ${type} status updated successfully`,
			payment,
			newBalance: user.userbalance,
			totalDeposits: user.userTotalDeposits,
			totalWithdrawals: user.userTotalWithdrawals,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};
// ✅ Delete payment
exports.deletePayment = async (req, res) => {
	try {
		const payment = await Payment.findByIdAndDelete(req.params.id);
		if (!payment) {
			return res
				.status(404)
				.json({ success: false, message: "Payment not found" });
		}
		res.status(200).json({ success: true, message: "Payment deleted" });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
