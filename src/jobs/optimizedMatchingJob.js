const cron = require('node-cron');
const UserService = require('../services/userService');
const MatchingService = require('../services/matchingService');
const MatchDataService = require('../services/matchDataService');
const SemanticSimilarityService = require('../services/semanticSimilarityService');

class OptimizedMatchingJob {
  constructor(userService, matchingService, matchDataService, semanticService) {
    this.userService = userService;
    this.matchingService = matchingService;
    this.matchDataService = matchDataService;
    this.semanticService = semanticService;
    this.isRunning = false;
    this.batchSize = 50;
    this.maxConcurrentBatches = 3;
    this.cacheWarmupInterval = 24 * 60 * 60 * 1000;
    this.lastCacheWarmup = 0;
  }

  /**
   * Initialize the matching job
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Optimized Matching Job...');
      
      await this.semanticService.loadModel();
      
      await this.semanticService.preloadCommonSkills();
      
      console.log('✅ Optimized Matching Job initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Optimized Matching Job:', error);
    }
  }

  /**
   * Start the matching job scheduler
   */
  startScheduler() {
    cron.schedule('0 */6 * * *', async () => {
      await this.runMatchingJob();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    cron.schedule('0 2 * * *', async () => {
      await this.warmupCache();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    cron.schedule('0 */12 * * *', async () => {
      await this.clearExpiredCache();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    console.log('⏰ Optimized Matching Job scheduler started');
  }

  /**
   * Run the optimized matching job
   */
  async runMatchingJob() {
    if (this.isRunning) {
      console.log('⚠️  Matching job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting optimized matching job...');

    try {
      const startTime = Date.now();
      
      const activeUsers = await this.getActiveUsers();
      console.log(`📊 Found ${activeUsers.length} active users`);

      const batches = this.createBatches(activeUsers, this.batchSize);
      console.log(`📦 Processing ${batches.length} batches of ${this.batchSize} users each`);

      const results = await this.processBatchesWithConcurrency(batches);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ Matching job completed in ${duration}ms`);
      console.log(`📈 Results: ${results.totalMatches} matches found, ${results.totalProcessed} users processed`);
      
      const cacheStats = await this.semanticService.getCacheStats();
      console.log(`📦 Cache stats: ${cacheStats.memoryCacheSize} memory, ${cacheStats.firestoreCacheSize} Firestore`);

    } catch (error) {
      console.error('❌ Error in optimized matching job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get active users for matching
   * @returns {Promise<Array>} - Array of active users
   */
  async getActiveUsers() {
    try {
      const users = await this.userService.getAllUsers();
      return users.filter(user => 
        user.isActivelyMatching && 
        user.skillsOffered && 
        user.skillsOffered.length > 0 &&
        user.skillsWanted && 
        user.skillsWanted.length > 0
      );
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  /**
   * Create batches from array
   * @param {Array} array - Array to batch
   * @param {number} batchSize - Size of each batch
   * @returns {Array} - Array of batches
   */
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Process batches with concurrency limit
   * @param {Array} batches - Array of batches to process
   * @returns {Promise<Object>} - Processing results
   */
  async processBatchesWithConcurrency(batches) {
    const results = {
      totalMatches: 0,
      totalProcessed: 0,
      batchesProcessed: 0
    };

    for (let i = 0; i < batches.length; i += this.maxConcurrentBatches) {
      const currentBatches = batches.slice(i, i + this.maxConcurrentBatches);
      
      const batchPromises = currentBatches.map((batch, index) => 
        this.processBatch(batch, i + index)
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        results.totalMatches += result.matches;
        results.totalProcessed += result.processed;
        results.batchesProcessed++;
      });
      
      console.log(`📦 Processed batch ${i + 1}-${Math.min(i + this.maxConcurrentBatches, batches.length)} of ${batches.length}`);
    }

    return results;
  }

  /**
   * Process a single batch of users
   * @param {Array} users - Array of users in batch
   * @param {number} batchIndex - Index of the batch
   * @returns {Promise<Object>} - Batch processing results
   */
  async processBatch(users, batchIndex) {
    const results = {
      matches: 0,
      processed: 0
    };

    try {
      console.log(`🔄 Processing batch ${batchIndex + 1} with ${users.length} users`);
      
      const allSkills = this.extractAllSkills(users);
      await this.preloadBatchEmbeddings(allSkills);
      
      for (const user of users) {
        try {
          const potentialMatches = await this.matchingService.findPotentialMatches(user.id);
          
          if (potentialMatches.length > 0) {
            const preferenceList = await this.matchingService.generatePreferenceList(user.id, potentialMatches);
            
            await this.matchDataService.storeUserPreferences(user.id, preferenceList);
            
            results.matches += potentialMatches.length;
          }
          
          results.processed++;
        } catch (error) {
          console.error(`Error processing user ${user.id}:`, error);
        }
      }
      
      console.log(`✅ Batch ${batchIndex + 1} completed: ${results.matches} matches, ${results.processed} users`);
      
    } catch (error) {
      console.error(`Error processing batch ${batchIndex + 1}:`, error);
    }

    return results;
  }

  /**
   * Extract all unique skills from users
   * @param {Array} users - Array of users
   * @returns {Array} - Array of unique skills
   */
  extractAllSkills(users) {
    const skills = new Set();
    
    users.forEach(user => {
      if (user.skillsOffered) {
        user.skillsOffered.forEach(skill => skills.add(skill.toLowerCase().trim()));
      }
      if (user.skillsWanted) {
        user.skillsWanted.forEach(skill => skills.add(skill.toLowerCase().trim()));
      }
    });
    
    return Array.from(skills);
  }

  /**
   * Preload embeddings for a batch of skills
   * @param {Array} skills - Array of skills to preload
   * @returns {Promise<void>}
   */
  async preloadBatchEmbeddings(skills) {
    try {
      const cacheResults = await this.semanticService.cacheService.getEmbeddingsBatch(skills);
      const missingSkills = cacheResults.missing;
      
      if (missingSkills.length > 0) {
        console.log(`📦 Preloading embeddings for ${missingSkills.length} skills...`);
        
        const embeddingPromises = missingSkills.map(async (skill) => {
          try {
            const embedding = await this.semanticService.model.embed([skill]);
            return {
              skill,
              embedding: embedding.arraySync()[0]
            };
          } catch (error) {
            console.error(`Error generating embedding for ${skill}:`, error);
            return null;
          }
        });
        
        const embeddings = await Promise.all(embeddingPromises);
        const validEmbeddings = embeddings.filter(e => e !== null);
        
        const embeddingsToStore = {};
        validEmbeddings.forEach(({ skill, embedding }) => {
          embeddingsToStore[skill] = embedding;
        });
        
        await this.semanticService.cacheService.storeEmbeddingsBatch(embeddingsToStore);
        console.log(`✅ Preloaded ${validEmbeddings.length} embeddings`);
      }
    } catch (error) {
      console.error('Error preloading batch embeddings:', error);
    }
  }

  /**
   * Warm up the cache with common skills
   * @returns {Promise<void>}
   */
  async warmupCache() {
    const now = Date.now();
    if (now - this.lastCacheWarmup < this.cacheWarmupInterval) {
      console.log('⏰ Cache warmup skipped (too soon since last warmup)');
      return;
    }

    try {
      console.log('🔥 Warming up embedding cache...');
      await this.semanticService.preloadCommonSkills();
      this.lastCacheWarmup = now;
      console.log('✅ Cache warmup completed');
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   * @returns {Promise<void>}
   */
  async clearExpiredCache() {
    try {
      console.log('🗑️  Clearing expired cache entries...');
      const clearedCount = await this.semanticService.clearExpiredCache();
      console.log(`✅ Cleared ${clearedCount} expired cache entries`);
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  /**
   * Get job statistics
   * @returns {Promise<Object>} - Job statistics
   */
  async getJobStats() {
    try {
      const modelStatus = await this.semanticService.getModelStatus();
      const cacheStats = await this.semanticService.getCacheStats();
      
      return {
        isRunning: this.isRunning,
        batchSize: this.batchSize,
        maxConcurrentBatches: this.maxConcurrentBatches,
        model: modelStatus,
        cache: cacheStats,
        lastCacheWarmup: this.lastCacheWarmup
      };
    } catch (error) {
      console.error('Error getting job stats:', error);
      return {
        isRunning: this.isRunning,
        error: error.message
      };
    }
  }
}

module.exports = OptimizedMatchingJob;
