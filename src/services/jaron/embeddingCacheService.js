const { db } = require("@/config/firebaseConfig");
const {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} = require("firebase/firestore");

class EmbeddingCacheService {
  constructor() {
    this.embeddingsRef = collection(db, 'embeddings');
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000;
  }

  /**
   * Generate a cache key for a skill
   * @param {string} skill - The skill text
   * @returns {string} - Cache key
   */
  generateCacheKey(skill) {
    if (!skill) return '';
    return skill.toLowerCase().trim().replace(/\s+/g, '_');
  }

  /**
   * Get embedding from cache (in-memory first, then Firestore)
   * @param {string} skill - The skill text
   * @returns {Promise<Array|null>} - Cached embedding or null
   */
  async getEmbedding(skill) {
    const cacheKey = this.generateCacheKey(skill);
    
    const memoryCache = this.cache.get(cacheKey);
    if (memoryCache && Date.now() - memoryCache.timestamp < this.cacheExpiry) {
      console.log(` Embedding cache hit (memory): ${skill}`);
      return memoryCache.embedding;
    }

    try {
      const embeddingDoc = doc(this.embeddingsRef, cacheKey);
      const docSnap = await getDoc(embeddingDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const embedding = data.embedding;
        
        if (data.timestamp && Date.now() - data.timestamp.toMillis() < this.cacheExpiry) {
          this.cache.set(cacheKey, {
            embedding,
            timestamp: Date.now()
          });
          
          console.log(`📦 Embedding cache hit (Firestore): ${skill}`);
          return embedding;
        } else {
          console.log(`🗑️  Removing expired embedding cache: ${skill}`);
          await this.removeEmbedding(skill);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting embedding from cache:', error);
      return null;
    }
  }

  /**
   * Store embedding in cache (both memory and Firestore)
   * @param {string} skill - The skill text
   * @param {Array} embedding - The embedding array
   * @returns {Promise<void>}
   */
  async storeEmbedding(skill, embedding) {
    const cacheKey = this.generateCacheKey(skill);
    
    try {
      this.cache.set(cacheKey, {
        embedding,
        timestamp: Date.now()
      });

      const embeddingDoc = doc(this.embeddingsRef, cacheKey);
      await setDoc(embeddingDoc, {
        skill: skill.toLowerCase().trim(),
        embedding,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      console.log(` Stored embedding in cache: ${skill}`);
    } catch (error) {
      console.error('Error storing embedding in cache:', error);
    }
  }

  /**
   * Remove embedding from cache
   * @param {string} skill - The skill text
   * @returns {Promise<void>}
   */
  async removeEmbedding(skill) {
    const cacheKey = this.generateCacheKey(skill);
    
    this.cache.delete(cacheKey);
    
    try {
      const embeddingDoc = doc(this.embeddingsRef, cacheKey);
      await setDoc(embeddingDoc, {
        skill: skill.toLowerCase().trim(),
        deleted: true,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing embedding from cache:', error);
    }
  }

  /**
   * Get multiple embeddings with batching
   * @param {Array<string>} skills - Array of skills
   * @returns {Promise<Object>} - Object with skill -> embedding mapping
   */
  async getEmbeddingsBatch(skills) {
    const results = {};
    const missingSkills = [];

    for (const skill of skills) {
      const embedding = await this.getEmbedding(skill);
      if (embedding) {
        results[skill] = embedding;
      } else {
        missingSkills.push(skill);
      }
    }

    return {
      cached: results,
      missing: missingSkills
    };
  }

  /**
   * Store multiple embeddings with batching
   * @param {Object} embeddings - Object with skill -> embedding mapping
   * @returns {Promise<void>}
   */
  async storeEmbeddingsBatch(embeddings) {
    const promises = Object.entries(embeddings).map(([skill, embedding]) =>
      this.storeEmbedding(skill, embedding)
    );
    
    await Promise.all(promises);
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  async getCacheStats() {
    try {
      const memoryCacheSize = this.cache.size;
      
      const querySnapshot = await getDocs(this.embeddingsRef);
      const firestoreCacheSize = querySnapshot.size;
      
      return {
        memoryCacheSize,
        firestoreCacheSize,
        totalCacheSize: memoryCacheSize + firestoreCacheSize
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        memoryCacheSize: this.cache.size,
        firestoreCacheSize: 0,
        totalCacheSize: this.cache.size
      };
    }
  }

  /**
   * Clear expired cache entries
   * @returns {Promise<number>} - Number of entries cleared
   */
  async clearExpiredCache() {
    let clearedCount = 0;
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
        clearedCount++;
      }
    }

    try {
      const querySnapshot = await getDocs(this.embeddingsRef);
      const batch = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp && now - data.timestamp.toMillis() > this.cacheExpiry) {
          batch.push(doc.ref);
        }
      });

      if (batch.length > 0) {
        console.log(`🗑️  Marking ${batch.length} expired cache entries for deletion`);
        clearedCount += batch.length;
      }
    } catch (error) {
      console.error('Error clearing expired Firestore cache:', error);
    }

    return clearedCount;
  }

  /**
   * Preload common skills into cache
   * @param {Array<string>} commonSkills - Array of common skills to preload
   * @param {Function} embeddingFunction - Function to generate embeddings
   * @returns {Promise<void>}
   */
  async preloadCommonSkills(commonSkills, embeddingFunction) {
    console.log(`🔄 Preloading ${commonSkills.length} common skills...`);
    
    const batchSize = 10;
    for (let i = 0; i < commonSkills.length; i += batchSize) {
      const batch = commonSkills.slice(i, i + batchSize);
      
      const batchResults = await this.getEmbeddingsBatch(batch);
      const missingSkills = batchResults.missing;
      
      if (missingSkills.length > 0) {
        console.log(`📦 Generating embeddings for ${missingSkills.length} skills...`);
        
        const embeddings = {};
        for (const skill of missingSkills) {
          try {
            const embedding = await embeddingFunction(skill);
            embeddings[skill] = embedding;
          } catch (error) {
            console.error(`Error generating embedding for ${skill}:`, error);
          }
        }
        
        await this.storeEmbeddingsBatch(embeddings);
      }
    }
    
    console.log(' Common skills preloaded successfully');
  }
}

module.exports = EmbeddingCacheService;


