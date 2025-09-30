const express = require("express");
const {
	createBindAccount,
	getUserBindAccounts,
} = require("../controllers/bindAccountController");

const router = express.Router();

router.post("/", createBindAccount); // create
router.post("/find", getUserBindAccounts); // get all by user

module.exports = router;
