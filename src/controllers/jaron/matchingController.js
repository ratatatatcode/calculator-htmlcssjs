const MatchingService = require('@/services/jaron/matchingService');
const MatchDataService = require('@/services/jaron/matchDataService');
const SemanticSimilarityService = require('@/services/jaron/semanticSimilarityService');
const UserService = require('@/services/userService');

class MatchingController {
  constructor(matchingService, matchDataService, semanticService, userService) {
    this.matchingService = matchingService;
    this.matchDataService = matchDataService;
    this.semanticService = semanticService;
    this.userService = userService;
  }

  async requestMatch(req, res) {
    try {
      const { userId } = req.params;
      
      console.log(` Processing match request for user: ${userId}`);

      const matches = await this.matchingService.runMatchingProcess(userId);
      
      if (matches.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No compatible matches found at this time',
          matches: [],
          semanticAnalysis: {
            enabled: true,
            threshold: this.semanticService.similarityThreshold
          }
        });
      }

      const semanticAnalysis = [];
      for (const match of matches) {
        const userA = await this.userService.getProfileById(match.userA);
        const userB = await this.userService.getProfileById(match.userB);
        
        if (userA && userB) {
          const compatibility = await this.semanticService.calculateBidirectionalSemanticCompatibility(userA, userB);
          semanticAnalysis.push({
            matchId: `${match.userA}_${match.userB}`,
            userA: match.userA,
            userB: match.userB,
            compatibility: {
              totalScore: compatibility.totalScore,
              averageScore: compatibility.averageScore,
              userToOther: compatibility.userToOther,
              otherToUser: compatibility.otherToUser
            }
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Found ${matches.length} compatible match(es)`,
        matches: matches,
        semanticAnalysis: {
          enabled: true,
          threshold: this.semanticService.similarityThreshold,
          details: semanticAnalysis
        }
      });

    } catch (error) {
      console.error('Error in requestMatch:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing match request',
        error: error.message
      });
    }
  }

  async getPotentialPartners(req, res) {
    try {
      const { userId } = req.params;
      
      console.log(`🔍 Finding potential partners for user: ${userId}`);

      const potentialMatches = await this.matchingService.findPotentialMatches(userId);
      
      if (potentialMatches.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No potential partners found',
          potentialPartners: [],
          semanticAnalysis: {
            enabled: true,
            threshold: this.semanticService.similarityThreshold
          }
        });
      }

      const detailedPartners = [];
      for (const partner of potentialMatches) {
        const user = await this.userService.getProfileById(userId);
        const compatibility = await this.semanticService.calculateBidirectionalSemanticCompatibility(user, partner);
        
        detailedPartners.push({
          id: partner.id,
          username: partner.username,
          skillsOffered: partner.skillsOffered || partner.skills || [],
          skillsWanted: partner.skillsWanted || partner.skills || [],
          compatibility: {
            totalScore: compatibility.totalScore,
            averageScore: compatibility.averageScore,
            userToOther: compatibility.userToOther,
            otherToUser: compatibility.otherToUser
          }
        });
      }

      res.status(200).json({
        success: true,
        message: `Found ${potentialMatches.length} potential partner(s)`,
        potentialPartners: detailedPartners,
        semanticAnalysis: {
          enabled: true,
          threshold: this.semanticService.similarityThreshold
        }
      });

    } catch (error) {
      console.error('Error in getPotentialPartners:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching potential partners',
        error: error.message
      });
    }
  }

  async getMatches(req, res) {
    try {
      const { userId } = req.params;
      
      console.log(`📋 Getting matches for user: ${userId}`);

      const matches = await this.matchDataService.getUserMatches(userId);
      
      if (matches.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No matches found',
          matches: [],
          semanticAnalysis: {
            enabled: true,
            threshold: this.semanticService.similarityThreshold
          }
        });
      }

      const detailedMatches = [];
      for (const match of matches) {
        const userA = await this.userService.getProfileById(match.userA);
        const userB = await this.userService.getProfileById(match.userB);
        
        if (userA && userB) {
          const compatibility = await this.semanticService.calculateBidirectionalSemanticCompatibility(userA, userB);
          detailedMatches.push({
            id: match.id,
            userA: {
              id: userA.id,
              username: userA.username,
              skillsOffered: userA.skillsOffered || userA.skills || [],
              skillsWanted: userA.skillsWanted || userA.skills || []
            },
            userB: {
              id: userB.id,
              username: userB.username,
              skillsOffered: userB.skillsOffered || userB.skills || [],
              skillsWanted: userB.skillsWanted || userB.skills || []
            },
            matchedOn: match.matchedOn,
            compatibility: {
              totalScore: compatibility.totalScore,
              averageScore: compatibility.averageScore,
              userToOther: compatibility.userToOther,
              otherToUser: compatibility.otherToUser
            }
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Found ${matches.length} match(es)`,
        matches: detailedMatches,
        semanticAnalysis: {
          enabled: true,
          threshold: this.semanticService.similarityThreshold
        }
      });

    } catch (error) {
      console.error('Error in getMatches:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching matches',
        error: error.message
      });
    }
  }

  async testSemanticSimilarity(req, res) {
    try {
      const { skill1, skill2 } = req.body;
      
      if (!skill1 || !skill2) {
        return res.status(400).json({
          success: false,
          message: 'Both skill1 and skill2 are required'
        });
      }

      const similarity = await this.semanticService.calculateSkillSimilarity(skill1, skill2);
      
      res.status(200).json({
        success: true,
        message: 'Semantic similarity calculated successfully',
        skill1,
        skill2,
        similarity: similarity.score,
        details: similarity
      });

    } catch (error) {
      console.error('Error in testSemanticSimilarity:', error);
      res.status(500).json({
        success: false,
        message: 'Error testing semantic similarity',
        error: error.message
      });
    }
  }

  async updateSimilarityThreshold(req, res) {
    try {
      const { threshold } = req.body;
      
      if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
        return res.status(400).json({
          success: false,
          message: 'Threshold must be a number between 0 and 1'
        });
      }

      this.semanticService.similarityThreshold = threshold;
      
      res.status(200).json({
        success: true,
        message: 'Similarity threshold updated successfully',
        threshold: this.semanticService.similarityThreshold
      });

    } catch (error) {
      console.error('Error in updateSimilarityThreshold:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating similarity threshold',
        error: error.message
      });
    }
  }

  async getSemanticConfig(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Semantic configuration retrieved successfully',
        config: {
          threshold: this.semanticService.similarityThreshold,
          modelLoaded: this.semanticService.modelLoaded,
          fallbackEnabled: this.semanticService.fallbackEnabled
        }
      });

    } catch (error) {
      console.error('Error in getSemanticConfig:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving semantic configuration',
        error: error.message
      });
    }
  }

  async clearExpiredCache(req, res) {
    try {
      const result = await this.semanticService.clearExpiredCache();
      
      res.status(200).json({
        success: true,
        message: 'Expired cache cleared successfully',
        result
      });

    } catch (error) {
      console.error('Error in clearExpiredCache:', error);
      res.status(500).json({
        success: false,
        message: 'Error clearing expired cache',
        error: error.message
      });
    }
  }

  async preloadCommonSkills(req, res) {
    try {
      const result = await this.semanticService.preloadCommonSkills();
      
      res.status(200).json({
        success: true,
        message: 'Common skills preloaded successfully',
        result
      });

    } catch (error) {
      console.error('Error in preloadCommonSkills:', error);
      res.status(500).json({
        success: false,
        message: 'Error preloading common skills',
        error: error.message
      });
    }
  }

  async getCacheStats(req, res) {
    try {
      const stats = await this.semanticService.getCacheStats();
      
      res.status(200).json({
        success: true,
        message: 'Cache statistics retrieved successfully',
        stats
      });

    } catch (error) {
      console.error('Error in getCacheStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving cache statistics',
        error: error.message
      });
    }
  }
}

module.exports = MatchingController;

