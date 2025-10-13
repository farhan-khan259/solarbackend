
// require("dotenv").config(); // ✅ Load environment variables first

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const path = require("path");

// // ✅ Import routes
// const authRoutes = require("./routes/user");
// const paymentRoutes = require("./routes/payment");
// const claimRewardRoutes = require("./routes/claimReward");
// const bindRoutes = require("./routes/bindAccountRoutes");
// const teamDetailsRoutes = require("./routes/Teamdetails");
// const planRoutes = require("./routes/plain");
// const ticketRoutes = require("./routes/ticketRoutes");
// const promoCodeRoutes = require("./routes/promoCodeRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const announcementRoutes = require("./routes/announcementRoutes");
// const userHistory = require("./routes/userHistory");



// const app = express();


// // ✅ CORS Configuration (Only allow frontend)
// app.use(
// 	cors({
// 		origin: [
// 			"http://localhost:3000",
// 			"https://solarx0.com",
// 			"https://www.solarx0.com",
// 		],
// 		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
// 		credentials: true,
// 	})
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ✅ MongoDB Connection
// mongoose
// 	.connect(process.env.MONGO_URI, {
// 		useNewUrlParser: true,
// 		useUnifiedTopology: true,
// 	})
// 	.then(() => console.log("✅ MongoDB Connected"))
// 	.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// // ✅ Static Folder for uploads
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// // ✅ API Routes
// app.use("/api", authRoutes);
// app.use("/api", userHistory);
// app.use("/api", claimRewardRoutes);
// app.use("/team", teamDetailsRoutes);
// app.use("/api/plans", planRoutes);
// app.use("/api", paymentRoutes);
// app.use("/api/bindAccountRoutes", bindRoutes);
// app.use("/api", promoCodeRoutes);
// app.use("/api", adminRoutes);
// app.use("/api", announcementRoutes);
// app.use("/api", ticketRoutes);

// // ✅ Cron Jobs (auto-run tasks)
// require("./cron/planCron");
// require("./cron/ticketDrawCron");


// // ✅ Root Test Route
// app.get("/", (req, res) => {
// 	console.log("🌐 Server connected successfully");
// 	res.send("Hello from SolarX0 Backend!");
// });

// // ✅ Test Claim Reward Route
// app.get("/api/test-claim", (req, res) => {
// 	res.json({ message: "Claim reward route is working!" });
// });

// // ✅ Start Server
// const PORT = process.env.PORT || 3005;
// app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));



require("dotenv").config(); // ✅ Load .env variables early

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

/* ────────────────────────────────
   ✅ Middleware
──────────────────────────────── */
app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"https://solarx0.com",
			"https://www.solarx0.com",
		],
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
		credentials: true,
	})
);

app.use(express.json({ limit: "10mb" })); // Allow JSON up to 10MB
app.use(express.urlencoded({ extended: true }));

/* ────────────────────────────────
   ✅ MongoDB Connection
──────────────────────────────── */
mongoose
	.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("✅ MongoDB Connected Successfully"))
	.catch((err) => console.error("❌ MongoDB Connection Error:", err));

/* ────────────────────────────────
   ✅ Static Files
──────────────────────────────── */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ────────────────────────────────
   ✅ Import All Routes
──────────────────────────────── */
const authRoutes = require("./routes/user");
const paymentRoutes = require("./routes/payment");
const claimRewardRoutes = require("./routes/claimReward");
const bindRoutes = require("./routes/bindAccountRoutes");
const teamDetailsRoutes = require("./routes/Teamdetails");
const planRoutes = require("./routes/plain");
const promoCodeRoutes = require("./routes/promoCodeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const userHistory = require("./routes/userHistory");
const ticketRoutes = require("./routes/ticketRoutes");

/* ────────────────────────────────
   ✅ API Route Setup
──────────────────────────────── */
app.use("/api", authRoutes);
app.use("/api", userHistory);
app.use("/api", claimRewardRoutes);
app.use("/api", paymentRoutes);
app.use("/api/bindAccountRoutes", bindRoutes);
app.use("/api/plans", planRoutes);
app.use("/team", teamDetailsRoutes);
app.use("/api", promoCodeRoutes);
app.use("/api", adminRoutes);
app.use("/api", announcementRoutes);
app.use("/api", ticketRoutes);

/* ────────────────────────────────
   ✅ Cron Jobs (Background tasks)
──────────────────────────────── */
require("./cron/planCron");
require("./cron/ticketDrawCron"); // 🎯 Weekly Lucky Draw auto runner

/* ────────────────────────────────
   ✅ Test Routes
──────────────────────────────── */
app.get("/", (req, res) => {
	console.log("🌐 Server connected successfully");
	res.send("Hello from SolarX0 Backend!");
});

app.get("/api/test-claim", (req, res) => {
	res.json({ message: "Claim reward route is working!" });
});

/* ────────────────────────────────
   ✅ Error Handling (optional but good)
──────────────────────────────── */
app.use((req, res) => {
	res.status(404).json({ message: "❌ Route not found" });
});

/* ────────────────────────────────
   ✅ Start Server
──────────────────────────────── */
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
	console.log(`🚀 Server started successfully on port ${PORT}`);
});
