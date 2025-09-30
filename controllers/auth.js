const User = require("../models/User");
const Plan = require("../models/plain");
const jwt = require("jsonwebtoken");
// ✅ Signup Controller
exports.signup = async (req, res) => {
	console.log(req.body);
	try {
		const { fullName, email, password, refercode, whatsappNumber } = req.body;
		console.log(refercode);
		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: "Email already registered" });
		}
		if (refercode) {
			userAvb = await User.findOne({ randomCode: refercode });

			if (!userAvb) {
				return res.status(400).json({ message: "Invalid Referral Code" });
			}
		}
		// Create new user
		const newUser = new User({ fullName, email, password, whatsappNumber });
		await newUser.save();
		if (refercode) {
			const refUser = await User.findOne({ randomCode: refercode });
			if (refUser) {
				refUser.team.push(newUser.randomCode);
				await refUser.save();
			}
		}

		res.status(201).json({
			message: "User registered successfully",
			user: newUser,
			userPlanlength: 0,
		});
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// find user
		console.log(email, password);
		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// check password
		const isMatch = password === user.password;
		if (!isMatch) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid credentials" });
		}

		// create token
		const token = jwt.sign({ id: user._id }, "your_jwt_secret", {
			expiresIn: "1d",
		});
		const plans = await Plan.find({ user_id: user._id });
		const planCount = plans.length; //

		res
			.status(200)
			.json({ success: true, token, user, userPlanlength: planCount || 0 });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};
exports.getAllUsers = async (req, res) => {
	try {
		// Find all users and exclude the password field for security
		const users = await User.find();
		res.status(200).json({
			success: true,
			users: users,
			count: users.length,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			message: err.message,
		});
	}
};

exports.deleteUser = async (req, res) => {
	console.log("Received userId:", req.body.userId);

	try {
		const userId = req.body.userId;

		if (!userId) {
			return res.status(400).json({
				success: false,
				message: "User ID is required",
			});
		}

		const result = await User.findByIdAndDelete(userId);

		if (!result) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			message: "User deleted successfully",
			user: result,
		});
	} catch (err) {
		res.status(500).json({
			success: false,
			message: err.message,
		});
	}
};

// ================= FORGET PASSWORD (SEND OTP) =================
exports.forgetPassword = async (req, res) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// Generate OTP (5 digits to match frontend)
		const otp = Math.floor(10000 + Math.random() * 90000).toString();

		// Save OTP and expiry (5 mins)
		user.resetOtp = otp;
		user.resetOtpExpire = Date.now() + 5 * 60 * 1000;
		await user.save();

		// Send OTP via email
		await transporter.sendMail({
			from: "yourEmail@gmail.com",
			to: email,
			subject: "Password Reset OTP",
			text: `Your OTP for password reset is ${otp}. It will expire in 5 minutes.`,
		});

		res.json({ success: true, message: "OTP sent to email" });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
	service: "gmail", // or "hotmail", "yahoo"
	auth: {
		user: process.env.EMAIL_USER || "fkhan14301@gmail.com", // set in .env
		pass: process.env.EMAIL_PASS || "omustmkeriwryshz",
	},
});
// ================= FORGET PASSWORD (SEND OTP) =================
exports.forgetPassword = async (req, res) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// Generate OTP (5 digits to match frontend)
		const otp = Math.floor(10000 + Math.random() * 90000).toString();
		console.log(otp);

		// Save OTP and expiry (5 mins)
		user.resetOtp = otp;
		user.resetOtpExpire = Date.now() + 5 * 60 * 1000;
		await user.save();

		// Send OTP via email
		await transporter.sendMail({
			from: "yourEmail@gmail.com",
			to: email,
			subject: "Password Reset OTP",
			text: `Your OTP for password reset is ${otp}. It will expire in 5 minutes.`,
		});

		res.json({ success: true, message: "OTP sent to email" });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

// ================= VERIFY OTP & RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
	try {
		const { email, resetcode, password, confirmpassword } = req.body;

		if (password !== confirmpassword) {
			return res
				.status(400)
				.json({ success: false, message: "Passwords do not match" });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		// Check OTP validity
		if (user.resetOtp !== resetcode || user.resetOtpExpire < Date.now()) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid or expired OTP" });
		}

		// Update password
		user.password = password;
		user.resetOtp = undefined;
		user.resetOtpExpire = undefined;
		await user.save();

		res.json({ success: true, message: "Password reset successfully" });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};
