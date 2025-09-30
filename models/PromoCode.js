const mongoose = require("mongoose");

const PromoCodeSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
		},
		amount: {
			type: Number, // fixed discount/reward amount
			required: true,
		},
		limit: {
			type: Number,
			required: true,
			default: 100, // max users who can use this promo
		},
		claimed: {
			type: Number,
			default: 0, // how many times used
		},
		userClaimed: [
			{
				type: mongoose.Schema.Types.ObjectId, // store user IDs
				ref: "User",
			},
		],
		createdAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ versionKey: false }
);

const PromoCode = mongoose.model("PromoCode", PromoCodeSchema);
module.exports = PromoCode;
