const cron = require("node-cron");
const Announcement = require("../models/Announcements");

// Run every 30 seconds to clean up expired announcements
cron.schedule("*/30 * * * * *", async () => {
    try {
        const now = new Date();
        const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

        const result = await Announcement.deleteMany({ createdAt: { $lte: cutoff } });

        if (result.deletedCount > 0) {
            console.log(`🗑️ Deleted ${result.deletedCount} expired announcements`);
        }
    } catch (error) {
        console.error("❌ Error cleaning announcements:", error.message);
    }
});
