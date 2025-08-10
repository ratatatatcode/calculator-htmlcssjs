

const EmbeddingCacheService = require('./embeddingCacheService');

class SemanticSimilarityService {
  constructor() {
    this.similarityThreshold = 0.6;
    this.model = null;
    this.isModelLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
    this.cacheService = new EmbeddingCacheService();
  }

  /**
   * Load the Universal Sentence Encoder model
   */
  async loadModel() {
    if (this.isModelLoaded) {
      return this.model;
    }

    if (this.isLoading) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this._loadModelInternal();
    
    try {
      const result = await this.loadPromise;
      this.isLoading = false;
      return result;
    } catch (error) {
      this.isLoading = false;
      throw error;
    }
  }

  /**
   * Ito ay method to load the model
   */
  async _loadModelInternal() {
    try {
      console.log('Loading Universal Sentence Encoder model...');
      

      const tf = await import('@tensorflow/tfjs');
      const use = await import('@tensorflow-models/universal-sentence-encoder');
      

      await tf.setBackend('cpu');
      
      this.model = await use.load();
      this.isModelLoaded = true;
      console.log('Universal Sentence Encoder model loaded successfully');
      return this.model;
    } catch (error) {
      console.error('Error loading Universal Sentence Encoder model:', error);
      console.log('Falling back to rule-based similarity...');
      this.isModelLoaded = false;
      throw error;
    }
  }

  /**
   * Calculate semantic similarity between two skills using TensorFlow.js 
   * @param {string} skill1 - First skill
   * @param {string} skill2 - Second skill
   * @returns {number} - Similarity score between 0 and 1
   */
  async calculateSkillSimilarity(skill1, skill2) {
    try {
      const normalizedSkill1 = this.normalizeSkill(skill1);
      const normalizedSkill2 = this.normalizeSkill(skill2);


      if (normalizedSkill1 === normalizedSkill2) {
        return 1.0;
      }


      const ruleBasedScore = this.calculateRuleBasedSimilarity(normalizedSkill1, normalizedSkill2);
      

      if (ruleBasedScore >= 0.8) {
        return ruleBasedScore;
      }


      if (this.isModelLoaded && this.model) {
        try {
          const tf = await import('@tensorflow/tfjs');
          

          const embeddings = await this.getEmbeddingsWithCache([normalizedSkill1, normalizedSkill2]);
          
          if (embeddings.length === 2) {
  
            const similarity = await this.cosineSimilarity(
              tf.tensor(embeddings[0]), 
              tf.tensor(embeddings[1])
            );
            
            const tfScore = similarity.dataSync()[0];
            
  
            return Math.max(tfScore, ruleBasedScore);
          }
        } catch (modelError) {
          console.warn('TensorFlow model failed, using rule-based fallback:', modelError.message);
        }
      }


      return ruleBasedScore;
    } catch (error) {
      console.error('Error calculating skill similarity:', error);

      return skill1.toLowerCase() === skill2.toLowerCase() ? 1.0 : 0.0;
    }
  }

  /**
   * Calculate rule-based similarity as fallback
   * @param {string} skill1 - First skill
   * @param {string} skill2 - Second skill
   * @returns {number} - Similarity score between 0 and 1
   */
  calculateRuleBasedSimilarity(skill1, skill2) {

    if (this.areSynonyms(skill1, skill2)) {
      return 0.95;
    }


    if (this.areSkillsInSameCategory(skill1, skill2)) {
      return 0.85;
    }


    if (this.hasPartialMatch(skill1, skill2)) {
      return 0.75;
    }


    if (this.areRelatedSkills(skill1, skill2)) {
      return 0.65;
    }


    return 0.0;
  }

  /**
   * Calculate cosine similarity 
   * @param {tf.Tensor} embedding1 - First embedding
   * @param {tf.Tensor} embedding2 - Second embedding
   * @returns {tf.Tensor} - Cosine similarity score
   */
  async cosineSimilarity(embedding1, embedding2) {
    const tf = await import('@tensorflow/tfjs');
    

    const normalized1 = tf.div(embedding1, tf.norm(embedding1));
    const normalized2 = tf.div(embedding2, tf.norm(embedding2));
    

    const dotProduct = tf.sum(tf.mul(normalized1, normalized2));
    

    const similarity = tf.add(tf.div(dotProduct, 2), 0.5);
    
    return similarity;
  }

  /**
   * Calculate semantic compatibility between two sets of skills
   * @param {Array} skillsOffered - Skills offered by first user
   * @param {Array} skillsWanted - Skills wanted by second user
   * @returns {Object} - Compatibility score and matching pairs
   */
  async calculateSemanticCompatibility(skillsOffered, skillsWanted) {
    try {
      if (!skillsOffered || !skillsWanted || skillsOffered.length === 0 || skillsWanted.length === 0) {
        return { score: 0, matches: [] };
      }

      const matches = [];
      let totalScore = 0;

  
      for (const offered of skillsOffered) {
        for (const wanted of skillsWanted) {
          const similarity = await this.calculateSkillSimilarity(offered, wanted);
          
          if (similarity >= this.similarityThreshold) {
            matches.push({
              offered,
              wanted,
              similarity,
              score: similarity
            });
            totalScore += similarity;
          }
        }
      }

      return {
        score: totalScore,
        matches,
        averageScore: matches.length > 0 ? totalScore / matches.length : 0
      };
    } catch (error) {
      console.error('Error calculating semantic compatibility:', error);
      return { score: 0, matches: [] };
    }
  }

  /**
   * Calculate bidirectional semantic compatibility between two users
   * @param {Object} user - First user object
   * @param {Object} other - Second user object
   * @returns {Object} - Bidirectional compatibility scores
   */
  async calculateBidirectionalSemanticCompatibility(user, other) {
    try {
      const userSkillsOffered = user.skillsOffered || user.skills || [];
      const otherSkillsWanted = other.skillsWanted || other.skills || [];
      const userSkillsWanted = user.skillsWanted || user.skills || [];
      const otherSkillsOffered = other.skillsOffered || other.skills || [];

  
      const userToOther = await this.calculateSemanticCompatibility(userSkillsOffered, otherSkillsWanted);
      const otherToUser = await this.calculateSemanticCompatibility(otherSkillsOffered, userSkillsWanted);

      return {
        userToOther,
        otherToUser,
        totalScore: userToOther.score + otherToUser.score,
        averageScore: (userToOther.averageScore + otherToUser.averageScore) / 2,
        hasCompatibility: userToOther.score > 0 || otherToUser.score > 0
      };
    } catch (error) {
      console.error('Error calculating bidirectional semantic compatibility:', error);
      return {
        userToOther: { score: 0, matches: [] },
        otherToUser: { score: 0, matches: [] },
        totalScore: 0,
        averageScore: 0,
        hasCompatibility: false
      };
    }
  }

  /**
   * Normalize skill text for better comparison
   * @param {string} skill - Skill text to normalize
   * @returns {string} - Normalized skill text
   */
  normalizeSkill(skill) {
    if (!skill) return '';
    
    return skill
      .toLowerCase()
      .trim()
              .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if two skills are synonyms
   * @param {string} skill1 - First skill
   * @param {string} skill2 - Second skill
   * @returns {boolean} - Whether skills are synonyms
   */
  areSynonyms(skill1, skill2) {
    const synonyms = this.getSkillSynonyms();
    for (const [key, values] of Object.entries(synonyms)) {
      if (values.includes(skill1) && values.includes(skill2)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Categiry checker
   * @param {string} skill1 - First skill
   * @param {string} skill2 - Second skill
   * @returns {boolean} - Whether skills are in the same category
   */
  areSkillsInSameCategory(skill1, skill2) {
    const categories = this.getSkillCategories();
    for (const [category, skills] of Object.entries(categories)) {
      const normalizedCategorySkills = skills.map(skill => this.normalizeSkill(skill));
      if (normalizedCategorySkills.includes(skill1) && normalizedCategorySkills.includes(skill2)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for partial matches sa users
   * @param {string} skill1 - First skill
   * @param {string} skill2 - Second skill
   * @returns {boolean} - Whether skills have partial matches
   */
  hasPartialMatch(skill1, skill2) {
    const partialMatches = {
      'javascript': ['js', 'ecmascript'],
      'python': ['py'],
      'java': ['j2ee', 'j2se'],
      'c++': ['cpp', 'c plus plus'],
      'web development': ['web dev', 'frontend', 'backend'],
      'mobile development': ['mobile dev', 'ios', 'android'],
      'data science': ['data analysis', 'machine learning', 'ml'],
      'machine learning': ['ml', 'ai', 'artificial intelligence'],
      'photography': ['photo', 'photography'],
      'digital art': ['digital design', 'graphic design'],
      'graphic design': ['design', 'visual design'],
      'weightlifting': ['lifting', 'strength training'],
      'strength training': ['lifting', 'weightlifting'],
      'yoga': ['yoga practice', 'meditation'],
      'pilates': ['pilates practice'],
      'cooking': ['culinary arts', 'chef skills'],
      'baking': ['pastry', 'dessert making'],
      'grilling': ['bbq', 'barbecue'],
      'guitar': ['acoustic guitar', 'electric guitar'],
      'piano': ['keyboard', 'digital piano'],
      'violin': ['fiddle'],
      'ukulele': ['uke'],
      'drums': ['drumming', 'percussion'],
      'singing': ['vocal', 'voice'],
      'music production': ['music making', 'recording'],
      'composition': ['songwriting', 'music writing']
    };

    for (const [key, values] of Object.entries(partialMatches)) {
      if ((key === skill1 && values.includes(skill2)) || 
          (key === skill2 && values.includes(skill1)) ||
          (values.includes(skill1) && values.includes(skill2))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if skills are related 
   * @param {string} skill1 - First skill
   * @param {string} skill2 - Second skill
   * @returns {boolean} - Whether skills are related
   */
  areRelatedSkills(skill1, skill2) {
    const relatedSkills = {
      'web development': ['javascript', 'html', 'css', 'react', 'angular', 'vue'],
      'javascript': ['web development', 'node.js', 'react', 'angular', 'vue'],
      'python': ['data science', 'machine learning', 'django', 'flask'],
      'data science': ['python', 'r', 'machine learning', 'statistics'],
      'machine learning': ['python', 'data science', 'ai', 'deep learning'],
      'mobile development': ['ios', 'android', 'react native', 'flutter'],
      'ios': ['mobile development', 'swift', 'objective-c'],
      'android': ['mobile development', 'java', 'kotlin'],
      'cooking': ['baking', 'culinary arts', 'meal prep'],
      'baking': ['cooking', 'pastry', 'dessert'],
      'photography': ['digital art', 'photo editing', 'visual arts'],
      'digital art': ['photography', 'graphic design', 'visual arts'],
      'guitar': ['ukulele', 'bass', 'music', 'string instruments'],
      'piano': ['keyboard', 'music', 'keyboard instruments'],
      'violin': ['cello', 'viola', 'string instruments', 'classical music'],
      'yoga': ['pilates', 'meditation', 'fitness', 'wellness'],
      'pilates': ['yoga', 'fitness', 'core training', 'wellness'],
      'weightlifting': ['strength training', 'fitness', 'bodybuilding'],
      'running': ['jogging', 'cardio', 'fitness', 'endurance']
    };

    for (const [key, values] of Object.entries(relatedSkills)) {
      if ((key === skill1 && values.includes(skill2)) || 
          (key === skill2 && values.includes(skill1)) ||
          (values.includes(skill1) && values.includes(skill2))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Set similarity threshold for matching
   * @param {number} threshold - Threshold between 0 and 1
   */
  setSimilarityThreshold(threshold) {
    if (threshold >= 0 && threshold <= 1) {
      this.similarityThreshold = threshold;
    } else {
      throw new Error('Similarity threshold must be between 0 and 1');
    }
  }

  /**
   * Get predefined skill categories for enhanced matching
   * @returns {Object} - Skill categories mapping
   */
  getSkillCategories() {
    return {
      music: ['guitar', 'piano', 'violin', 'drums', 'ukulele', 'bass', 'singing', 'music production', 'composition'],
      programming: ['javascript', 'python', 'java', 'c++', 'web development', 'mobile development', 'data science', 'machine learning'],
      cooking: ['cooking', 'baking', 'grilling', 'meal prep', 'pastry', 'culinary arts', 'food preparation'],
      art: ['painting', 'drawing', 'photography', 'digital art', 'sculpture', 'design', 'graphic design'],
      fitness: ['yoga', 'weightlifting', 'running', 'swimming', 'cycling', 'pilates', 'crossfit'],
      language: ['english', 'spanish', 'french', 'german', 'chinese', 'japanese', 'italian', 'portuguese'],
      business: ['marketing', 'sales', 'management', 'entrepreneurship', 'finance', 'accounting', 'strategy'],
      technology: ['computer repair', 'networking', 'cybersecurity', 'cloud computing', 'database management']
    };
  }

  /**
   * Get skill synonyms for enhanced matching
   * @returns {Object} - Skill synonyms mapping
   */
  getSkillSynonyms() {
    return {
      'javascript': ['js', 'ecmascript'],
      'python': ['py'],
      'java': ['j2ee', 'j2se'],
      'c++': ['cpp', 'c plus plus'],
      'web development': ['web dev', 'frontend development', 'backend development'],
      'mobile development': ['mobile dev', 'app development'],
      'data science': ['data analysis', 'analytics'],
      'machine learning': ['ml', 'ai', 'artificial intelligence'],
      'photography': ['photo', 'photography'],
      'digital art': ['digital design', 'computer art'],
      'graphic design': ['design', 'visual design'],
      'weightlifting': ['lifting', 'strength training'],
      'strength training': ['lifting', 'weightlifting'],
      'yoga': ['yoga practice', 'meditation'],
      'pilates': ['pilates practice'],
      'cooking': ['culinary arts', 'chef skills'],
      'baking': ['pastry', 'dessert making'],
      'grilling': ['bbq', 'barbecue'],
      'guitar': ['acoustic guitar', 'electric guitar'],
      'piano': ['keyboard', 'digital piano'],
      'violin': ['fiddle'],
      'ukulele': ['uke'],
      'drums': ['drumming', 'percussion'],
      'singing': ['vocal', 'voice'],
      'music production': ['music making', 'recording'],
      'composition': ['songwriting', 'music writing']
    };
  }

  /**
   * Get embeddings 
   * @param {Array<string>} skills - Array of skills to get embeddings for
   * @returns {Promise<Array>} - Array of embeddings
   */
  async getEmbeddingsWithCache(skills) {
    try {
  
      const cacheResults = await this.cacheService.getEmbeddingsBatch(skills);
      const cachedEmbeddings = cacheResults.cached;
      const missingSkills = cacheResults.missing;

      const embeddings = [];
      const newEmbeddings = {};

      
      for (const skill of skills) {
        if (cachedEmbeddings[skill]) {
          embeddings.push(cachedEmbeddings[skill]);
        } else {
  
          const embedding = await this.model.embed([skill]);
          const embeddingArray = embedding.arraySync()[0];
          
          embeddings.push(embeddingArray);
          newEmbeddings[skill] = embeddingArray;
        }
      }

      
      if (Object.keys(newEmbeddings).length > 0) {
        await this.cacheService.storeEmbeddingsBatch(newEmbeddings);
      }

      return embeddings;
    } catch (error) {
      console.error('Error getting embeddings with cache:', error);
      
      if (this.isModelLoaded && this.model) {
        const embeddings = await this.model.embed(skills);
        return embeddings.arraySync();
      }
      throw error;
    }
  }

  /**
   * Preload common skills into cache
   * @returns {Promise<void>}
   */
  async preloadCommonSkills() {
    if (!this.isModelLoaded || !this.model) {
      console.warn('Model not loaded, cannot preload skills');
      return;
    }

    const commonSkills = [
  
      'javascript', 'python', 'java', 'c++', 'web development', 'mobile development',
      'data science', 'machine learning', 'react', 'angular', 'vue', 'node.js',
      
      
      'guitar', 'piano', 'violin', 'drums', 'ukulele', 'bass', 'singing',
      'music production', 'composition', 'keyboard',
      
      
      'cooking', 'baking', 'grilling', 'meal prep', 'pastry', 'culinary arts',
      'food preparation', 'bbq',
      
      
      'painting', 'drawing', 'photography', 'digital art', 'sculpture', 'design',
      'graphic design', 'photo editing',
      
      
      'yoga', 'weightlifting', 'running', 'swimming', 'cycling', 'pilates',
      'crossfit', 'strength training', 'jogging',
      
      
      'js', 'py', 'cpp', 'ml', 'ai'
    ];

    await this.cacheService.preloadCommonSkills(commonSkills, async (skill) => {
      const embedding = await this.model.embed([skill]);
      return embedding.arraySync()[0];
    });
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  async getCacheStats() {
    return await this.cacheService.getCacheStats();
  }

  /**
   * Clear expired cache entries
   * @returns {Promise<number>} - Number of entries cleared
   */
  async clearExpiredCache() {
    return await this.cacheService.clearExpiredCache();
  }

  /**
   * Get model status with cache information
   * @returns {Object} - Model status information
   */
  async getModelStatus() {
    const baseStatus = {
      isModelLoaded: this.isModelLoaded,
      isLoading: this.isLoading,
      similarityThreshold: this.similarityThreshold,
      usingTensorFlow: this.isModelLoaded && this.model !== null
    };

    try {
      const cacheStats = await this.getCacheStats();
      return {
        ...baseStatus,
        cache: cacheStats
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return baseStatus;
    }
  }
}

module.exports = SemanticSimilarityService;
