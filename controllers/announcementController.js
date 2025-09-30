const Announcement = require("../models/Announcements");

// Create a new announcement
exports.createAnnouncement = async (req, res) => {
	try {
		const { message } = req.body;

		if (!message) {
			return res.status(400).json({
				success: false,
				message: "Message is required",
			});
		}

		const announcement = new Announcement({ message });
		await announcement.save();

		res.status(201).json({
			success: true,
			message: "Announcement created successfully",
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
exports.getAnnouncements = async (req, res) => {
	try {
		const announcements = await Announcement.find().sort({ createdAt: -1 });

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
