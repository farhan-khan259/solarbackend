const mongoose = require("mongoose");

const BindAccountSchema = new mongoose.Schema(
	{
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		bankName: {
			type: String,
		},
		AccountNumber: {
			type: String,
		},
		Accountholder: {
			type: String,
		},
		createdAt: { type: Date, default: Date.now },
	},
	{ versionKey: false }
);

const BindAccount = mongoose.model("BindAccount", BindAccountSchema);
module.exports = BindAccount;
