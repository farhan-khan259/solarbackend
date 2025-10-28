

// const User = mongoose.model("User", userSchema);
// module.exports = User;
// const mongoose = require("mongoose");

// // Function to generate random 10-character code
// function generateRandomCode() {
// 	const prefix = "REF";
// 	const number = Math.floor(100000000 + Math.random() * 900000000);
// 	return prefix + number;
// }

// const userSchema = new mongoose.Schema(
// 	{
// 		fullName: { type: String, required: true, trim: true },
// 		email: {
// 			type: String,
// 			required: true,
// 			unique: true,
// 			lowercase: true,
// 			trim: true,
// 		},
// 		whatsappNumber: { type: String },
// 		password: { type: String, required: true, minlength: 6 },
// 		randomCode: { type: String, default: generateRandomCode },
// 		team: [{ type: String }],
// 		referredBy: { type: String },
// 		userStatus: { type: String, default: "active" },
// 		resetOtp: { type: String },
// 		profilepicture: { type: String },
// 		resetOtpExpire: { type: Date },
// 		userState: { type: String, enum: ["active", "inactive"], default: "active" },
// 		role: { type: String, enum: ["user", "admin"], default: "user" },
// 		UserInvestment: { type: Number, default: 0 },
// 		userbalance: { type: Number, default: 0 },
// 		userTotalDeposits: { type: Number, default: 0 },
// 		userTotalWithdrawals: { type: Number, default: 0 },

// 		// ✅ CORRECT claimedRanks schema
// 		claimedRanks: [
// 			{
// 				rankName: { type: String, required: true },
// 				claimedAt: { type: Date, default: Date.now }
// 			}
// 		],

// 		createdAt: { type: Date, default: Date.now },
// 	},
// 	{ versionKey: false }
// );

// const User = mongoose.model("User", userSchema);
// module.exports = User;




// const mongoose = require("mongoose");

// function generateRandomCode() {
// 	const prefix = "REF";
// 	const number = Math.floor(100000000 + Math.random() * 900000000);
// 	return prefix + number;
// }

// const userSchema = new mongoose.Schema(
// 	{
// 		fullName: { type: String, required: true, trim: true },
// 		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
// 		whatsappNumber: { type: String, trim: true },
// 		password: { type: String, required: true, minlength: 6 },

// 		randomCode: { type: String, default: generateRandomCode, unique: true },
// 		team: [{ type: String }],
// 		referredBy: { type: String },

// 		userStatus: { type: String, default: "active" },
// 		userState: { type: String, enum: ["active", "inactive"], default: "active" },
// 		role: { type: String, enum: ["user", "admin"], default: "user" },

// 		UserInvestment: { type: Number, default: 0 },
// 		userbalance: { type: Number, default: 0 },
// 		userTotalDeposits: { type: Number, default: 0 },
// 		userTotalWithdrawals: { type: Number, default: 0 },

// 		// 💰 Always mirror userbalance
// 		balance: { type: Number, default: 0 },

// 		claimedRanks: [
// 			{
// 				rankName: { type: String, required: true },
// 				claimedAt: { type: Date, default: Date.now },
// 			},
// 		],

// 		resetOtp: { type: String },
// 		resetOtpExpire: { type: Date },
// 		profilepicture: { type: String, default: "" },

// 		createdAt: { type: Date, default: Date.now },
// 	},
// 	{
// 		versionKey: false,
// 		timestamps: true,
// 		toJSON: { virtuals: true },
// 		toObject: { virtuals: true },
// 	}
// );

// // ✅ Keep userbalance & balance always equal
// userSchema.pre("save", function (next) {
// 	this.balance = this.userbalance;
// 	next();
// });

// const User = mongoose.model("User", userSchema);
// module.exports = User;



const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
	{
		fullName: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		randomCode: { type: String, required: true, unique: true },
		referredBy: { type: String },
		team: [String],
		whatsappNumber: { type: String },
		profilepicture: { type: String },

		// Balance and investments
		userbalance: { type: Number, default: 0 },
		UserInvestment: { type: Number, default: 0 },
		userTotalDeposits: { type: Number, default: 0 },
		userTotalWithdrawals: { type: Number, default: 0 },
		totalEarnings: { type: Number, default: 0 },

		// Commission tracking
		totalCommissionEarned: { type: Number, default: 0 },
		directCommission: { type: Number, default: 0 },
		indirectCommission: { type: Number, default: 0 },
		extendedCommission: { type: Number, default: 0 },
		planExpireCommission: { type: Number, default: 0 },

		// Wallet for additional funds if needed
		wallet: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);