const express = require("express");

const router = express.Router();

const punchController = require("../controllers/punchController");

// ✅ ADD THIS ROUTE
router.get("/:dbname/getpunches/:date", punchController.getPunches);

module.exports = router;