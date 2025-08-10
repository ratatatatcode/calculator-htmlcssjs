const OptimizedMatchingJob = require('../jobs/optimizedMatchingJob');
const UserService = require('../services/userService');
const MatchingService = require('../services/matchingService');
const MatchDataService = require('../services/matchDataService');
const SemanticSimilarityService = require('../services/semanticSimilarityService');

const userService = new UserService();
const semanticService = new SemanticSimilarityService();
const matchingService = new MatchingService(userService, semanticService);

const matchingJob = new OptimizedMatchingJob(
  userService,
  matchingService,
  MatchDataService,
  semanticService
);

matchingJob.initialize().then(() => {
  matchingJob.startScheduler();
  console.log(' Optimized matching job scheduler started');
}).catch(error => {
  console.error(' Failed to initialize optimized matching job:', error);
});