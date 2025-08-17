const express = require("express");
const router = express.Router();
const MatchingController = require("@/controllers/jaron/matchingController");
const MatchingService = require("@/services/jaron/matchingService");
const MatchDataService = require("@/services/jaron/matchDataService");
const SemanticSimilarityService = require("@/services/jaron/semanticSimilarityService");
const UserService = require("@/services/userService");
const authenticateJWT = require("@/middleware/auth");

const userService = new UserService();
const semanticService = new SemanticSimilarityService();
const matchingService = new MatchingService(userService, semanticService);

const matchingController = new MatchingController(
  matchingService,
  MatchDataService,
  semanticService,
  userService
);

router.use(authenticateJWT);

router.post(
  "/api/matching/request-match/:userId",
  (req, res) => matchingController.requestMatch(req, res)
);

router.get(
  "/api/matching/matches/:userId", 
  (req, res) => matchingController.getMatches(req, res)
);

router.get(
  "/api/matching/potential-partners/:userId", 
  (req, res) => matchingController.getPotentialPartners(req, res)
);

router.post(
  "/api/matching/test-similarity", 
  (req, res) => matchingController.testSemanticSimilarity(req, res)
);

router.put(
  "/api/matching/similarity-threshold", 
  (req, res) => matchingController.updateSimilarityThreshold(req, res)
);

router.get(
  "/api/matching/semantic-config", 
  (req, res) => matchingController.getSemanticConfig(req, res)
);

router.post(
  "/api/matching/clear-expired-cache", 
  (req, res) => matchingController.clearExpiredCache(req, res)
);

router.post(
  "/api/matching/preload-common-skills", 
  (req, res) => matchingController.preloadCommonSkills(req, res)
);

router.get(
  "/api/matching/cache-stats", 
  (req, res) => matchingController.getCacheStats(req, res)
);

module.exports = router;

