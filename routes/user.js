const express = require("express");
const {
	signup,
	login,
	forgetPassword,
	resetPassword,
	getAllUsers,
	deleteUser,
} = require("../controllers/auth");

const User = require("../models/User");
const payment = require("../models/payment");
const router = express.Router();

const upload = require("../middlewares/upload");
const plain = require("../models/plain");
// POST /api/signup
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgetpassword", forgetPassword);
router.post("/resetpassword", resetPassword);
router.get("/getalluser", getAllUsers);
router.post("/usertransaction", async (req, res) => {
	const { userId } = req.body;
	console.log(userId);

	try {
		// 1. Find the user
		const user = await User.findById(userId);
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// 2. Find payments for that user
		const payments = await payment.find({ user_id: userId });

		// 3. Find referral relationships
		// Assuming your User schema has `referralCode` and `referredBy` fields
		const directReferrals = await User.find({ referredBy: user.referralCode });
		const indirectReferrals = await User.find({
			referredBy: { $in: directReferrals.map((u) => u.referralCode) },
		});
		const extendedReferrals = await User.find({
			referredBy: { $in: indirectReferrals.map((u) => u.referralCode) },
		});

		// 4. Send response
		res.status(200).json({
			success: true,
			user,
			payments,
			referrals: {
				direct: directReferrals,
				indirect: indirectReferrals,
				extended: extendedReferrals,
			},
		});
	} catch (error) {
		console.error("❌ Error fetching user transaction:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
});
router.delete("/delete", deleteUser);
router.post("/account", upload.single("profilepicture"), async (req, res) => {
	try {
		const { userId, email, whatsappNumber, fullName } = req.body;

		if (!userId) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// ✅ Only check for duplicate email if provided
		if (email && email !== user.email) {
			const existing = await User.findOne({ email });
			if (existing) {
				return res.status(400).json({
					success: false,
					message: "Email already in use",
				});
			}
			user.email = email;
		}

		// ✅ Update fields without requiring password
		if (req.file) {
			user.profilepicture = `/uploads/${req.file.filename}`;
		}
		if (whatsappNumber) user.whatsappNumber = whatsappNumber;
		if (fullName) user.fullName = fullName;

		await user.save();

		console.log(user);

		res.status(200).json({
			success: true,
			message: "Account updated successfully",
			user,
		});
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
});
router.post("/changePassword", async (req, res) => {
	try {
		const { userId, oldpassword, newpassword } = req.body;
		console.log(req.body);

		if (!userId) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// ✅ Check old password (plain text)
		if (user.password !== oldpassword) {
			return res
				.status(400)
				.json({ success: false, message: "Old password is incorrect" });
		}

		// ✅ Update to new password (plain text)
		user.password = newpassword;
		await user.save();

		res.status(200).json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
});

router.post("/addBalanceByAdmin", async (req, res) => {
	try {
		const { userId, balance } = req.body; // balance can be + or -

		const user = await User.findById(userId);
		if (!user) {
			return res.status(400).json({ message: "User not found" });
		}

		// add or subtract directly based on the value
		user.userbalance += Number(balance);

		await user.save();

		return res.status(200).json({
			message: "Balance updated successfully",
			balance: user.userbalance,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
});
router.post("/addSubtractByAdmin", async (req, res) => {
	try {
		const { userId, balance } = req.body; // balance can be + or -

		const user = await User.findById(userId);
		if (!user) {
			return res.status(400).json({ message: "User not found" });
		}

		// add or subtract directly based on the value
		user.userbalance -= Number(balance);

		await user.save();

		return res.status(200).json({
			message: "Balance updated successfully",
			balance: user.userbalance,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Server error" });
	}
});
router.post("/adminLoginUserAccount", async (req, res) => {
	const { userId } = req.body;
	const user = await User.findById(userId);
	res.status(200).json(user);
});

router.post("/admindeleteplainuser", async (req, res) => {
	try {
		const { userId } = req.body;
		console.log(userId);
		console.log(req.body);
		// delete the user's plan
		const result = await plain.deleteOne({ user_id: userId });

		if (result.deletedCount === 0) {
			return res.status(201).json({ message: "No plan found for this user" });
		}

		return res.status(200).json({ message: "User plan deleted successfully" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Server error" });
	}
});




// Add this to your backend routes (in user routes or team routes)
router.post("/getUserByReferral", async (req, res) => {
	try {
		const { referralCode } = req.body;

		if (!referralCode) {
			return res.status(400).json({ success: false, message: "Referral code is required" });
		}

		const user = await User.findOne({ randomCode: referralCode }).select("fullName email randomCode");

		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		return res.status(200).json({
			success: true,
			user: {
				fullName: user.fullName,
				email: user.email,
				randomCode: user.randomCode
			}
		});
	} catch (error) {
		console.error("Error fetching user by referral:", error);
		return res.status(500).json({ success: false, message: "Server error" });
	}
});

module.exports = router;
