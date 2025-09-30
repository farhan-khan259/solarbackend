const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		depositsAmount: {
			type: Number,
		},
		accountNumber: {
			type: Number,
		},
		accountHolderName: {
			type: String,
		},
		withdrawalsAmount: {
			type: Number,
		},
		payment_method: {
			type: String,
		},
		depositStatus: {
			type: String,
		},
		withdrawalStatus: {
			type: String,
		},
		screenshot: {
			type: String,
		},
		transaction_id: {
			type: String,
			unique: true,
			sparse: true, // Allows multiple null values but ensures uniqueness for non-null values
		},
		description: {
			type: String,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

// Use this pattern to prevent OverwriteModelError
module.exports =
	mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
