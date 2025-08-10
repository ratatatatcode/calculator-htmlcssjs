const express = require('express');
const router = express.Router();
const MatchingController = require('../controllers/matchingController');
const MatchingService = require('../services/matchingService');
const MatchDataService = require('../services/matchDataService');
const SemanticSimilarityService = require('../services/semanticSimilarityService');
const UserService = require('../services/userService');
const {
  authenticateJWT,
  requireVerifiedUser,
  rateLimitMatchingRequests,
} = require('../middleware/auth');

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
  '/request-match/:userId',
  rateLimitMatchingRequests,
  (req, res) => matchingController.requestMatch(req, res)
);

router.get('/matches/:userId', (req, res) => matchingController.getMatches(req, res));

router.get('/potential-partners/:userId', (req, res) => matchingController.getPotentialPartners(req, res));

router.post('/test-similarity', (req, res) => matchingController.testSemanticSimilarity(req, res));

router.put('/similarity-threshold', (req, res) => matchingController.updateSimilarityThreshold(req, res));

router.get('/semantic-config', (req, res) => matchingController.getSemanticConfig(req, res));

router.post('/clear-expired-cache', (req, res) => matchingController.clearExpiredCache(req, res));

router.post('/preload-common-skills', (req, res) => matchingController.preloadCommonSkills(req, res));

router.get('/cache-stats', (req, res) => matchingController.getCacheStats(req, res));

module.exports = router; 