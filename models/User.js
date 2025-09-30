const mongoose = require("mongoose");

// Function to generate random 10-character code
function generateRandomCode() {
	const prefix = "REF"; // fixed prefix
	const number = Math.floor(100000000 + Math.random() * 900000000);
	// generates a 9-digit number
	return prefix + number;
}

const userSchema = new mongoose.Schema(
	{
		fullName: { type: String, required: true, trim: true },
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		whatsappNumber: { type: String },
		password: { type: String, required: true, minlength: 6 },
		randomCode: { type: String, default: generateRandomCode },
		team: [
			{
				type: String,
			},
		],
		userStatus: {
			type: String,
			default : "active"
		},

		resetOtp: {
			type: String,
		},
		profilepicture: {
			type: String,
		},
		resetOtpExpire: {
			type: Date,
		},
		userState: {
			type: String,
			enum: ["active", "inactive"],
			default: "active",
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		UserInvestment: {
			type: Number,
		},
		userbalance: {
			type: Number,
			default: 0,
		},
		userTotalDeposits: {
			type: Number,
			default: 0,
		},
		userTotalWithdrawals: {
			type: Number,
			default: 0,
		},

		createdAt: { type: Date, default: Date.now },
	},
	{ versionKey: false }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
