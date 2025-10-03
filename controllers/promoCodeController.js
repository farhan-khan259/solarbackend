const PromoCode = require("../models/PromoCode");
const User = require("../models/User");

function generateRandomCode() {
  const prefix = "PRMO"; // fixed prefix
  const number = Math.floor(100000000 + Math.random() * 900000000);
  // generates a 9-digit number
  return prefix + number;
}

// ✅ Create a new promo code
exports.createPromoCode = async (req, res) => {
  try {
    const { amount, limit } = req.body;

    const promo = new PromoCode({
      code: generateRandomCode(),
      amount,
      limit,
    });

    await promo.save();

    res.status(201).json({
      success: true,
      message: "Promo code created successfully",
      data: promo,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Apply promo code
exports.applyPromoCode = async (req, res) => {
  try {
    const { code, userId } = req.body;

    const promo = await PromoCode.findOne({ code });
    const user = await User.findById(userId);

    if (!promo) {
      return res.status(400).json({
        success: false,
        message: "Promo code not found",
      });
    }

    // check if user already claimed
    if (promo.userClaimed.includes(userId)) {
      return res.status(202).json({
        success: false,
        message: "You have already used this promo code",
      });
    }

    // Check if usage limit reached
    if (promo.claimed >= promo.limit) {
      return res.status(202).json({
        success: false,
        message: "Promo code usage limit reached",
      });
    }

    // divide amount equally among users
    const forOneUser = promo.amount / promo.limit;

    // Increase usage count
    promo.claimed += 1;
    promo.userClaimed.push(userId);

    user.userbalance += forOneUser;

    await promo.save();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Promo applied successfully",
      amount: forOneUser,
      remainingUses: promo.limit - promo.claimed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Get all promo codes
exports.getAllPromoCodes = async (req, res) => {

  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: promos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete promo code
