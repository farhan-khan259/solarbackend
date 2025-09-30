const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // ✅ Import CORS
const authRoutes = require("./routes/user");
const paymnetRoues = require("./routes/payment");
const bindRoues = require("./routes/bindAccountRoutes");
const teamdeatilsRoutes = require("./routes/Teamdetails");
const planRoutes = require("./routes/plain");
const promoCodeRoutes = require("./routes/promoCodeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const userHistory = require("./routes/userHistory");
const path = require("path");

const app = express();

// ✅ Enable CORS only for frontend (port 3000)
app.use(
	cors({
		origin: ["http://localhost:3000", 'https://solarx0.com'], // your React app
		methods: ["GET", "POST", "PUT", "DELETE", 'PATCH'],
		credentials: true, // if you use cookies/auth
	})
);
app.use(express.json()); // <-- this parses JSON body
app.use(express.urlencoded({ extended: true }));

// ✅ Connect MongoDB
mongoose
	.connect("mongodb+srv://mfarhankhan068:MDKMqLJZ0inz9fv7@cluster0.ttfk3ui.mongodb.net/myDatabase?retryWrites=true&w=majority", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("✅ MongoDB connected"))
	.catch((err) => console.error(err));

// ✅ Routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", authRoutes);
app.use("/api", userHistory);
app.use("/team", teamdeatilsRoutes);
app.use("/api/plans", planRoutes);
app.use("/api", paymnetRoues);
app.use("/api/bindAccountRoutes", bindRoues);
app.use("/api", promoCodeRoutes);
app.use("/api", adminRoutes);
app.use("/api", announcementRoutes);
require("./cron/planCron");
// ✅ Example route
app.get("/", (req, res) => {
	console.log("connected");
	res.send("Hello, Mongo + Express!");
});

// ✅ Start server
app.listen(3005, () => console.log("🚀 Server started on port 3005"));
