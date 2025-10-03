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

exports.createWithdrawal = async (req, res) => {
	console.log(req.body);
	try {
		const { userId, withdrawals, bankName, accountNumber, accountName } =
			req.body;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(201).json({
				success: false,
				message: "User not found",
			});
		}

		console.log("User found:", user.userbalance);

		if (user.userbalance < withdrawals) {
			return res.status(202).json({
				success: false,
				message: "Insufficient balance",
			});
		}

		// ✅ Correct subtraction
		user.userbalance = user.userbalance - withdrawals;

		// ✅ Always await save
		await user.save();

		console.log("User balance after withdrawal:", user.userbalance);

		const payment = new Payment({
			user_id: userId,
			withdrawalsAmount: withdrawals,
			withdrawalStatus: "pending",
			payment_method: bankName,
			accountNumber,
			accountHolderName: accountName,
		});

		await payment.save();

		res.status(201).json({
			success: true,
			message: "Withdrawal request created successfully",
			data: payment,
		});
	} catch (error) {
		console.error("Error creating withdrawal:", error);
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
exports.updatePaymentStatus = async (req, res) => {
	console.log("req.body ", req.body);

	// Note: Assuming 'requesId' is a typo and should be 'requestId' or 'paymentId'
	// but I'll stick to 'requesId' as it's in your provided code.
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

		// Check if the payment request exists
		const payment = await Payment.findOne({ user_id: userId, _id: requesId });
		// Check if the user exists
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

		// Handle Approved/Pending/etc. status
		if (type === "deposit") {
			payment.depositStatus = status;

			if (status === "approved") {
				const depositAmount = Number(payment.depositsAmount) || 0;
				console.log("Depositing amount:", depositAmount);

				// Update user's balance and total deposits
				user.userbalance = (user.userbalance || 0) + depositAmount;
				user.userTotalDeposits = (user.userTotalDeposits || 0) + depositAmount;

				console.log("New balance:", user.userbalance);
				console.log("Total deposits:", user.userTotalDeposits);

				// --- START REFERRAL COMMISSION LOGIC ---

				// 1. DIRECT REFERRAL COMMISSION (8%)
				if (user.referredBy) {
					// 'referredBy' is the randomCode of the direct referrer
					const directReferrer = await User.findOne({
						randomCode: user.referredBy,
					});

					if (directReferrer) {
						const directCommission = depositAmount * 0.08;
						directReferrer.userbalance =
							(directReferrer.userbalance || 0) + directCommission;
						directReferrer.totalCommissionEarned =
							(directReferrer.totalCommissionEarned || 0) + directCommission;
						await directReferrer.save();
						console.log(
							`Direct commission (${directCommission}) credited to ${directReferrer.fullName}`
						);

						// 2. INDIRECT REFERRAL COMMISSION (3%)
						if (directReferrer.referredBy) {
							const indirectReferrer = await User.findOne({
								randomCode: directReferrer.referredBy,
							});

							if (indirectReferrer) {
								const indirectCommission = depositAmount * 0.03;
								indirectReferrer.userbalance =
									(indirectReferrer.userbalance || 0) + indirectCommission;
								indirectReferrer.totalCommissionEarned =
									(indirectReferrer.totalCommissionEarned || 0) +
									indirectCommission;
								await indirectReferrer.save();
								console.log(
									`Indirect commission (${indirectCommission}) credited to ${indirectReferrer.fullName}`
								);

								// 3. EXTENDED REFERRAL COMMISSION (2%)
								if (indirectReferrer.referredBy) {
									const extendedReferrer = await User.findOne({
										randomCode: indirectReferrer.referredBy,
									});

									if (extendedReferrer) {
										const extendedCommission = depositAmount * 0.02;
										extendedReferrer.userbalance =
											(extendedReferrer.userbalance || 0) + extendedCommission;
										extendedReferrer.totalCommissionEarned =
											(extendedReferrer.totalCommissionEarned || 0) +
											extendedCommission;
										await extendedReferrer.save();
										console.log(
											`Extended commission (${extendedCommission}) credited to ${extendedReferrer.fullName}`
										);
									}
								}
							}
						}
					}
				}

				// --- END REFERRAL COMMISSION LOGIC ---

				// Save the current user's updated balance and deposits
				await user.save();
			}
		} else if (type === "withdrawal") {
			payment.withdrawalStatus = status;

			if (status === "approved") {
				const withdrawalAmount = Number(payment.withdrawalsAmount) || 0;
				console.log("Withdrawing amount:", withdrawalAmount);

				// Update balance
				// Note: Balance is typically checked and reduced BEFORE the request is made.
				// Reducing it here confirms the withdrawal.
				user.userbalance = user.userbalance - withdrawalAmount;

				// ✅ CORRECT: Add to total withdrawals
				user.userTotalWithdrawals =
					(user.userTotalWithdrawals || 0) + withdrawalAmount;

				console.log("New balance:", user.userbalance);
				console.log("Total withdrawals:", user.userTotalWithdrawals);
				await user.save();
			}
		}

		// Save the payment status change
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

// 		// Handle reject case
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

// 		// ✅ FIXED: Correct calculations for deposits and withdrawals
// 		if (type === "deposit") {
// 			payment.depositStatus = status;

// 			if (status === "approved") {
// 				const depositAmount = Number(payment.depositsAmount) || 0;
// 				console.log("Depositing amount:", depositAmount);

// 				// Update balance
// 				user.userbalance = user.userbalance + depositAmount;

// 				// ✅ CORRECT: Add to total deposits
// 				user.userTotalDeposits = (user.userTotalDeposits || 0) + depositAmount;

// 				console.log("New balance:", user.userbalance);
// 				console.log("Total deposits:", user.userTotalDeposits);
// 				const userCommission = awit User.find({randomCode :referredBy});

// 				await user.save();

// 			}
// 		} else if (type === "withdrawal") {
// 			payment.withdrawalStatus = status;

// 			if (status === "approved") {
// 				const withdrawalAmount = Number(payment.withdrawalsAmount) || 0;
// 				console.log("Withdrawing amount:", withdrawalAmount);

// 				// Update balance
// 				user.userbalance = user.userbalance - withdrawalAmount;

// 				// ✅ CORRECT: Add to total withdrawals
// 				user.userTotalWithdrawals =
// 					(user.userTotalWithdrawals || 0) + withdrawalAmount;

// 				console.log("New balance:", user.userbalance);
// 				console.log("Total withdrawals:", user.userTotalWithdrawals);
// 				await user.save();
// 			}
// 		}

// 		await payment.save();

// 		return res.status(200).json({
// 			success: true,
// 			message: `Payment ${type} status updated successfully`,
// 			payment,
// 			newBalance: user.userbalance,
// 			totalDeposits: user.userTotalDeposits,
// 			totalWithdrawals: user.userTotalWithdrawals,
// 		});
// 	} catch (error) {
// 		console.error(error);
// 		return res.status(500).json({ success: false, message: error.message });
// 	}
// };
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
