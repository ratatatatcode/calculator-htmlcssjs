const express = require("express");
const MatchingService = require("@/services/hersey/matchingService");
const MatchingController = require("@/controllers/hersey/matchingController");

const authenticateJWT = require("@/middleware/auth")

const router = express.Router();
const matchingService = new MatchingService();
const matchingController = new MatchingController(matchingService);

router.get("/api/matching/test", matchingController.test.bind(matchingController));
router.get("/api/matching/find", authenticateJWT, matchingController.findMatch.bind(matchingController));
module.exports = router;
