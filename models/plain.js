// const mongoose = require("mongoose");

// const PlanSchema = new mongoose.Schema(
// 	{
// 		user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
// 		PlanName: { type: String },
// 		Investment: { type: Number },
// 		dailyEarning: { type: Number },
// 		totalEarning: { type: Number, default: 0 },
// 		totalAmount: { type: Number, default: 0 },
// 		planExpireText: { type: String }, // e.g. "9 days"
// 		expiryDate: { type: Date }, // actual expiry date
// 		planExpired: { type: Boolean, default: false },
// 	},
// 	{ timestamps: true }
// );

// module.exports = mongoose.model("Plan", PlanSchema);
const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
	{
		user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		PlanName: { type: String, required: true },
		Investment: { type: Number, required: true },
		dailyEarning: { type: Number, required: true },
		totalEarning: { type: Number, default: 0 },
		totalAmount: { type: Number, default: 0 },
		planExpireText: { type: String, default: "Lifetime" },
		expiryDate: { type: Date, default: null },
		planExpired: { type: Boolean, default: false },
		status: { type: String, enum: ["active", "expired"], default: "active" },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);
