const express = require("express");
const MatchService = require("@/services/james/matchingService");
const MatchController = require("@/controllers/james/matchingController");

const router = express.Router();
const matchService = new MatchService();
const matchController = new MatchController(matchService);

// router.get("/james/matching/")
// router.post("/api/james/matching/run")

module.exports = router;
