const Announcement = require("../models/Announcements");

// Create a new announcement (auto 24h expiry)
exports.createAnnouncement = async (req, res) => {
	try {
		const { message } = req.body;

		if (!message) {
			return res.status(400).json({
				success: false,
				message: "Message is required",
			});
		}

		// Expire after 24 hours
		const expireAt = new Date(Date.now() + 60 * 60 * 24 * 1000);

		const announcement = new Announcement({
			message,
			expireAt,
		});

		await announcement.save();

		res.status(201).json({
			success: true,
			message: "Announcement created successfully (auto deletes in 24h)",
			data: announcement,
		});
	} catch (error) {
		console.error("Error creating announcement:", error);
		res.status(500).json({
			success: false,
			message: "Failed to create announcement",
		});
	}
};

// Get active announcements only
exports.getAnnouncements = async (req, res) => {
	try {
		const now = new Date();

		const announcements = await Announcement.find({
			expireAt: { $gt: now },
		}).sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			data: announcements,
		});
	} catch (error) {
		console.error("Error fetching announcements:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch announcements",
		});
	}
};
