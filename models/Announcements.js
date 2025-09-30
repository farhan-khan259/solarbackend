const mongoose = require("mongoose");

const Announcements = new mongoose.Schema(
	{
		message: { type: String, required: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Announcements", Announcements);
