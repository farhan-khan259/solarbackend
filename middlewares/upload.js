const multer = require("multer");
const path = require("path");

// Storage config
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "uploads/"); // folder to save screenshots
	},
	filename: function (req, file, cb) {
		const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueName + path.extname(file.originalname)); // e.g. 169495923.png
	},
});

// File filter (optional: only images)
const fileFilter = (req, file, cb) => {
	if (file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new Error("Only image files are allowed!"), false);
	}
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
