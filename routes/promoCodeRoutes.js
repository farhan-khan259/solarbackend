const express = require("express");
const {
	createPromoCode,
	applyPromoCode,
	getAllPromoCodes,
	deletePromoCode,
} = require("../controllers/promoCodeController");

const PromoCode = require("../models/PromoCode");
const router = express.Router();

router.post("/promoCode", createPromoCode); // Create promo
router.post("/promoCode/apply", applyPromoCode); // Apply promo
router.post("/promoCodeGetAll", getAllPromoCodes); // Get all promos
router.post("/promoCodeDelete1", async (req, res) => {
	try {
		const { id } = req.body;
		console.log("ddd", id);
		const deleted = await PromoCode.findByIdAndDelete(id);

		if (!deleted) {
			return res.status(404).json({
				success: false,
				message: "Promo code not found",
			});
		}

		res.status(200).json({
			success: true,
			message: "Promo code deleted successfully",
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
	res.send("hello");
}); // Delete promo

module.exports = router;
