require("dotenv").config();
const User = require("../models/User");
const Plan = require("../models/plain");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

// ================== 🔐 ADMIN CREDENTIALS (SECURELY FROM .ENV) ==================
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // ✅ CHANGED TO HASH

// ================== 📧 EMAIL TRANSPORTER ==================
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

// ================== 🧾 SIGNUP ==================
// exports.signup = async (req, res) => {
// 	try {
// 		const { fullName, email, password, refercode, whatsappNumber } = req.body;

// 		// Check for existing user
// 		const existingUser = await User.findOne({ email });
// 		if (existingUser) {
// 			return res.status(400).json({ message: "Email already registered" });
// 		}

// 		// Referral check
// 		if (refercode) {
// 			const refUser = await User.findOne({ randomCode: refercode });
// 			if (!refUser) {
// 				return res.status(400).json({ message: "Invalid referral code" });
// 			}
// 		}

// 		// Hash password before saving
// 		const hashedPassword = await bcrypt.hash(password, 10);

// 		const newUser = new User({
// 			fullName,
// 			email,
// 			password: hashedPassword,
// 			whatsappNumber,
// 			referredBy: refercode,
// 		});
// 		await newUser.save();

// 		// Add referral link
// 		if (refercode) {
// 			const refUser = await User.findOne({ randomCode: refercode });
// 			if (refUser) {
// 				refUser.team.push(newUser.randomCode);
// 				await refUser.save();
// 			}
// 		}

// 		res.status(201).json({
// 			message: "User registered successfully",
// 			user: newUser,
// 			userPlanlength: 0,
// 		});
// 	} catch (err) {
// 		res.status(500).json({ message: err.message });
// 	}
// };


// exports.signup = async (req, res) => {
// 	try {
// 		const { fullName, email, password, refercode, whatsappNumber } = req.body;

// 		// Check for existing user
// 		const existingUser = await User.findOne({ email });
// 		if (existingUser) {
// 			return res.status(400).json({ message: "Email already registered" });
// 		}

// 		// ✅ MANDATORY Referral check
// 		if (!refercode) {
// 			return res.status(400).json({ message: "Referral code is required" });
// 		}

// 		// Validate referral code
// 		const refUser = await User.findOne({ randomCode: refercode });
// 		if (!refUser) {
// 			return res.status(400).json({ message: "Invalid referral code" });
// 		}

// 		// Hash password before saving
// 		const hashedPassword = await bcrypt.hash(password, 10);

// 		const newUser = new User({
// 			fullName,
// 			email,
// 			password: hashedPassword,
// 			whatsappNumber,
// 			referredBy: refercode,
// 		});
// 		await newUser.save();

// 		// Add referral link
// 		if (refercode) {
// 			const refUser = await User.findOne({ randomCode: refercode });
// 			if (refUser) {
// 				refUser.team.push(newUser.randomCode);
// 				await refUser.save();
// 			}
// 		}

// 		res.status(201).json({
// 			message: "User registered successfully",
// 			user: newUser,
// 			userPlanlength: 0,
// 		});
// 	} catch (err) {
// 		res.status(500).json({ message: err.message });
// 	}
// };


exports.signup = async (req, res) => {
	try {
		const { fullName, email, password, refercode, whatsappNumber } = req.body;

		// Check for existing user
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "Email already registered"
			});
		}

		// Get total user count
		const userCount = await User.countDocuments();
		const isFirstUser = userCount === 0;

		// 🔒 STRICT: Block if no referral code and not first user
		if (!isFirstUser) {
			if (!refercode) {
				return res.status(400).json({
					success: false,
					message: "Referral code is mandatory. You cannot sign up without a valid referral code from an existing user."
				});
			}

			// Validate referral code exists
			const referredByUser = await User.findOne({ randomCode: refercode });
			if (!referredByUser) {
				return res.status(400).json({
					success: false,
					message: "Invalid referral code. This code does not exist in our system."
				});
			}
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = new User({
			fullName,
			email,
			password: hashedPassword,
			whatsappNumber,
			referredBy: refercode || null,
			role: isFirstUser ? 'admin' : 'user'
		});

		await newUser.save();

		// Update referrer's team if applicable
		if (refercode) {
			const referredByUser = await User.findOne({ randomCode: refercode });
			if (referredByUser) {
				referredByUser.team.push(newUser.randomCode);
				await referredByUser.save();
			}
		}

		res.status(201).json({
			success: true,
			message: isFirstUser
				? "🎉 First admin account created! Your referral code: " + newUser.randomCode
				: "✅ Account created successfully!",
			user: {
				_id: newUser._id,
				fullName: newUser.fullName,
				email: newUser.email,
				randomCode: newUser.randomCode,
				role: newUser.role
			},
			isFirstUser: isFirstUser
		});

	} catch (err) {
		console.error('Signup error:', err);
		res.status(500).json({
			success: false,
			message: "Server error during registration"
		});
	}
};

// ================== 🔑 LOGIN ==================

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// ✅ Admin login (plaintext check)
		if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
			const token = jwt.sign(
				{ role: "admin", email },
				process.env.JWT_SECRET,
				{ expiresIn: "1d" }
			);

			return res.status(200).json({
				success: true,
				message: "Admin login successful",
				user: { email, role: "admin" },
				token,
				userPlanlength: 0,
			});
		}

		// ✅ Regular user login (bcrypt check)
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1d",
		});

		const plans = await Plan.find({ user_id: user._id });
		const planCount = plans.length || 0;

		res.status(200).json({
			success: true,
			message: "User login successful",
			token,
			user,
			userPlanlength: planCount,
		});
	} catch (err) {
		console.error("Login Error:", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};



// ================== 🧍 GET ALL USERS ==================
exports.getAllUsers = async (req, res) => {
	try {
		const users = await User.find().select("-password"); // exclude password
		res.status(200).json({
			success: true,
			users,
			count: users.length,
		});
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

// ================== 🗑️ DELETE USER ==================
exports.deleteUser = async (req, res) => {
	try {
		const { userId } = req.body;
		if (!userId) {
			return res.status(400).json({ success: false, message: "User ID required" });
		}

		const deleted = await User.findByIdAndDelete(userId);
		if (!deleted) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		res.status(200).json({ success: true, message: "User deleted successfully" });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

// ================== 🔁 FORGOT PASSWORD ==================
exports.forgetPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email });

		if (!user) return res.status(404).json({ success: false, message: "User not found" });

		const otp = Math.floor(10000 + Math.random() * 90000).toString();
		user.resetOtp = otp;
		user.resetOtpExpire = Date.now() + 5 * 60 * 1000;
		await user.save();

		await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to: email,
			subject: "Password Reset OTP",
			text: `Your OTP for password reset is ${otp}. It will expire in 5 minutes.`,
		});

		res.json({ success: true, message: "OTP sent to email" });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

// ================== 🔁 RESET PASSWORD ==================
exports.resetPassword = async (req, res) => {
	try {
		const { email, resetcode, password, confirmpassword } = req.body;
		if (password !== confirmpassword)
			return res.status(400).json({ success: false, message: "Passwords do not match" });

		const user = await User.findOne({ email });
		if (!user)
			return res.status(404).json({ success: false, message: "User not found" });

		if (user.resetOtp !== resetcode || user.resetOtpExpire < Date.now())
			return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

		user.password = await bcrypt.hash(password, 10);
		user.resetOtp = undefined;
		user.resetOtpExpire = undefined;
		await user.save();

		res.json({ success: true, message: "Password reset successfully" });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};