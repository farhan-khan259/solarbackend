const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
	{
		message: {
			type: String,
			required: true,
			trim: true,
		},
		expireAt: {
			type: Date,
			default: () => new Date(Date.now() + 60 * 60 * 24 * 1000), // always 24h
		},
	},
	{
		timestamps: true,
	}
);

// TTL index (delete after expireAt passes)
announcementSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Announcement", announcementSchema);
