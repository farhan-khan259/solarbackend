// const express = require("express");
// const {
// 	createPlan,
// 	getPlans,
// 	getPlanById,
// 	updatePlan,
// 	deletePlan,
// } = require("../controllers/planController");
// const Plan = require("../models/plain");

// const router = express.Router();

// // ✅ Create a new plan
// router.post("/", createPlan);

// router.get("/countSubscribePlanName", async (req, res) => {
// 	console.log('ss')
// 	try {
// 		// Step 1: Get all unique plan names
// 		const planNames = await Plan.distinct("PlanName");

// 		// Step 2: For each plan name, count subscribers
// 		const results = await Promise.all(
// 			planNames.map(async (name) => {
// 				const count = await Plan.countDocuments({ PlanName: name });
// 				return { planName: name, subscribers: count };
// 			})
// 		);

// 		// Step 3: Return response
// 		res.json({ success: true, plans: results });
// 	} catch (err) {
// 		console.error("❌ Error counting subscribers:", err);
// 		res.status(500).json({ success: false, message: "Server error" });
// 	}
// });
// // ✅ Get all plans
// router.get("/", getPlans);

// // ✅ Get a single plan by ID
// router.get("/:id", getPlanById);

// // ✅ Update a plan
// router.put("/:id", updatePlan);

// // ✅ Delete a plan
// router.delete("/:id", deletePlan);

// module.exports = router;

const express = require("express");
const {
	createPlan,
	getPlans,
	getPlanById,
	updatePlan,
	deletePlan,
} = require("../controllers/planController");
const Plan = require("../models/plain");

const router = express.Router();

/* ----------------------------
   ORDER MATTERS! Always put
   static routes BEFORE dynamic
-----------------------------*/

// ✅ Create a new plan
router.post("/", createPlan);

// ✅ Get all plans
router.get("/", getPlans);

// ✅ Count subscribers for each plan
router.get("/countSubscribePlanName", async (req, res) => {
	console.log("📊 Counting subscribers...");
	try {
		// Step 1: Get all unique plan names
		const planNames = await Plan.distinct("PlanName");

		// Step 2: Count subscribers for each plan
		const results = await Promise.all(
			planNames.map(async (name) => {
				const count = await Plan.countDocuments({ PlanName: name });
				return { planName: name, subscribers: count };
			})
		);

		res.json({ success: true, plans: results });
	} catch (err) {
		console.error("❌ Error counting subscribers:", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
});

// ✅ Get a single plan by ID (MUST come after static routes)
router.get("/:id", getPlanById);

// ✅ Update a plan
router.put("/:id", updatePlan);

// ✅ Delete a plan
router.delete("/:id", deletePlan);

module.exports = router;
