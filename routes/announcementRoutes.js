const express = require("express");
const router = express.Router();
const {
	createAnnouncement,
	getAnnouncements,
} = require("../controllers/announcementController");
const Announcements = require("../models/Announcements");

router.post("/announcements1", async (req, res) => {
	console.log(req.body);
	try {
		const announcements = await Announcements.find().sort({ createdAt: -1 });

		console.log("Fetched announcements:", announcements); // Add this

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
}); // Get all
router.post("/announcements", createAnnouncement); // Create

module.exports = router;
