const express = require("express");

const router = express.Router();

const punchController = require("../controllers/punchController");

// Date
router.get("/:dbname/getpunches/:date", punchController.getPunches);

// Date Range
router.get("/:dbname/getpunches/:fromDate/:toDate", punchController.getPunchesByDateRange);

module.exports = router;