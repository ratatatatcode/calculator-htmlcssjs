const { db } = require("@/config/firebaseConfig");
const {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  writeBatch,
} = require("firebase/firestore");
const UserService = require('@/services/userService');
const SemanticSimilarityService = require('./semanticSimilarityService');

class MatchingService {
  constructor(userService, semanticService) {
    this.userService = userService;
    this.semanticService = semanticService;
  }

  /**
   * Calculate skill compatibility score between two users using semantic similarity
   * @param {Array} userSkills - Skills of the first user
   * @param {Array} otherSkills - Skills of the second user
   * @returns {number} - Compatibility score based on semantic similarity
   */
  async skillCompatibilityScore(userSkills, otherSkills) {
    if (!userSkills || !otherSkills) return 0;
    
    try {
      const compatibility = await this.semanticService.calculateSemanticCompatibility(userSkills, otherSkills);
      return compatibility.score;
    } catch (error) {
      console.error('Error calculating semantic skill compatibility:', error);
      return userSkills.filter(skill => otherSkills.includes(skill)).length;
    }
  }

  /**
   * Check skill compatibility between two users using semantic similarity
   * @param {Object} user - First user object
   * @param {Object} other - Second user object
   * @returns {boolean} - Whether users have compatible skills
   */
  async checkSkillCompatibility(user, other) {
    try {
      const compatibility = await this.semanticService.calculateBidirectionalSemanticCompatibility(user, other);
      return compatibility.hasCompatibility;
    } catch (error) {
      console.error('Error checking semantic skill compatibility:', error);
      const userSkillsOffered = user.skillsOffered || user.skills || [];
      const otherSkillsWanted = other.skillsWanted || other.skills || [];
      const userSkillsWanted = user.skillsWanted || user.skills || [];
      const otherSkillsOffered = other.skillsOffered || other.skills || [];
      
      const userToOther = userSkillsOffered.filter(skill => otherSkillsWanted.includes(skill)).length;
      const otherToUser = otherSkillsOffered.filter(skill => userSkillsWanted.includes(skill)).length;
      
      return userToOther > 0 || otherToUser > 0;
    }
  }

  /**
   * Score skill compatibility between offered and wanted skills using semantic similarity
   * @param {Object} user - User object with skills
   * @param {Object} other - Other user object with skills
   * @returns {number} - Compatibility score
   */
  async scoreSkillCompatibility(user, other) {
    try {
      const compatibility = await this.semanticService.calculateBidirectionalSemanticCompatibility(user, other);
      return compatibility.totalScore;
    } catch (error) {
      console.error('Error scoring semantic skill compatibility:', error);
      const userSkillsOffered = user.skillsOffered || user.skills || [];
      const otherSkillsWanted = other.skillsWanted || other.skills || [];
      const userSkillsWanted = user.skillsWanted || user.skills || [];
      const otherSkillsOffered = other.skillsOffered || other.skills || [];
      
      const userToOther = userSkillsOffered.filter(skill => otherSkillsWanted.includes(skill)).length;
      const otherToUser = otherSkillsOffered.filter(skill => userSkillsWanted.includes(skill)).length;
      
      return userToOther + otherToUser;
    }
  }

  /**
   * Find potential matches for a user based on complementary skills using semantic similarity
   * @param {string} userId - The user ID to find matches for
   * @returns {Array} - Array of potential match users
   */
  async findPotentialMatches(userId) {
    try {
      const user = await this.userService.getProfileById(userId);
      if (!user) throw new Error("User not found");

      if (!user.isActivelyMatching) {
        console.log('User is not actively matching:', userId);
        return [];
      }

      const allUsers = await this.userService.getAllUsersExcept(userId);
      console.log(`getAllUsersExcept returned ${allUsers.length} users for userId: ${userId}`);
      
      const activelyMatchingUsers = allUsers.filter(user => user.isActivelyMatching);
      console.log(`Found ${activelyMatchingUsers.length} actively matching users`);
      
      allUsers.forEach((user, index) => {
        console.log(`User ${index + 1}: ${user.username} (${user.id}) - Actively Matching: ${user.isActivelyMatching}`);
      });

      if (activelyMatchingUsers.length === 0) {
        console.log('No other actively matching users found');
        return [];
      }

      const skillCompatible = [];
      for (const other of activelyMatchingUsers) {
        const isCompatible = await this.checkSkillCompatibility(user, other);
        if (isCompatible) {
          skillCompatible.push(other);
        }
      }

      console.log(`Found ${skillCompatible.length} potential matches for user ${userId}`);
      return skillCompatible;
    } catch (error) {
      console.error('Error finding potential matches:', error);
      throw error;
    }
  }

  /**
   * Generate preference list for a user based on semantic skill compatibility
   * @param {string} userId - The user ID
   * @param {Array} potentialMatches - Array of potential match users
   * @returns {Array} - Ordered array of user IDs by preference
   */
  async generatePreferenceList(userId, potentialMatches) {
    try {
      const user = await this.userService.getProfileById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const scored = [];
      for (const otherUser of potentialMatches) {
        const skillScore = await this.scoreSkillCompatibility(user, otherUser);
        scored.push({
          id: otherUser.id,
          score: skillScore
        });
      }

      scored.sort((a, b) => b.score - a.score);

      return scored.map((entry) => entry.id);
    } catch (error) {
      console.error('Error generating preference list:', error);
      throw error;
    }
  }

  /**
   * Implement Gale-Shapley stable matching algorithm with user preferences
   * @param {Array} userList - Array of user objects to match
   * @returns {Array} - Array of match pairs
   */
  async runStableMatching(userList) {
    try {
      if (userList.length < 2) {
        return [];
      }

      const preferencesMap = {};
      const partners = {};
      const proposals = {};

      for (const user of userList) {
        const potentialMatches = await this.findPotentialMatches(user.id);
        preferencesMap[user.id] = await this.generatePreferenceList(user.id, potentialMatches);
        proposals[user.id] = [];
        partners[user.id] = null;
      }

      let freeUsers = [...userList.map(u => u.id)];

      while (freeUsers.length > 0) {
        const currentUser = freeUsers[0];
        const preferences = preferencesMap[currentUser];

        const nextChoice = preferences.find(p => !proposals[currentUser].includes(p));
        
        if (!nextChoice) {
          freeUsers.shift();
          continue;
        }

        proposals[currentUser].push(nextChoice);

        if (!partners[nextChoice]) {
          partners[nextChoice] = currentUser;
          partners[currentUser] = nextChoice;
          freeUsers.shift();
        } else {
          const currentPartner = partners[nextChoice];
          const nextChoicePrefs = preferencesMap[nextChoice];
          
          if (nextChoicePrefs.indexOf(currentUser) < nextChoicePrefs.indexOf(currentPartner)) {
            partners[nextChoice] = currentUser;
            partners[currentUser] = nextChoice;
            partners[currentPartner] = null;
            
            freeUsers.shift();
            freeUsers.push(currentPartner);
          }
        }
      }

      const matches = [];
      const processed = new Set();
      
      for (const userId of Object.keys(partners)) {
        const partnerId = partners[userId];
        if (partnerId && !processed.has(userId) && !processed.has(partnerId)) {
          matches.push({ userA: userId, userB: partnerId });
          processed.add(userId);
          processed.add(partnerId);
        }
      }

      return matches;
    } catch (error) {
      console.error('Error running stable matching:', error);
      throw error;
    }
  }

  /**
   * Save match results to Firestore with duplicate checking
   * @param {Array} matches - Array of match objects with userA and userB
   * @returns {Promise} - Promise that resolves when matches are saved
   */
  async saveMatchResults(matches) {
    try {
      if (!matches || matches.length === 0) {
        console.log('No matches to save');
        return;
      }

      const batch = writeBatch(db);
      const matchesCollection = collection(db, 'matches');
      const timestamp = new Date();
      let savedCount = 0;

      for (const match of matches) {
        const matchId = `${match.userA}_${match.userB}`;
        const matchDocRef = doc(matchesCollection, matchId);
        
        const existingMatch = await getDoc(matchDocRef);
        
        if (!existingMatch.exists()) {
          batch.set(matchDocRef, {
            userA: match.userA,
            userB: match.userB,
            matchedOn: timestamp,
            status: 'pending',
            createdAt: timestamp
          });
          savedCount++;
        } else {
          console.log(`Match ${matchId} already exists, skipping...`);
        }
      }

      if (savedCount > 0) {
        await batch.commit();
        console.log(`Successfully saved ${savedCount} new matches`);
      } else {
        console.log('No new matches to save (all already exist)');
      }
    } catch (error) {
      console.error('Error saving match results:', error);
      throw error;
    }
  }

  /**
   * Get all matches for a specific user (as userA or userB)
   * @param {string} userId - The user ID to get matches for
   * @returns {Array} - Array of match objects with role information
   */
  async getMatchesForUser(userId) {
    try {
      const matchesCollection = collection(db, 'matches');
      
      const userAQuery = query(matchesCollection, where('userA', '==', userId));
      const userASnapshot = await getDocs(userAQuery);
      
      const userBQuery = query(matchesCollection, where('userB', '==', userId));
      const userBSnapshot = await getDocs(userBQuery);

      const matches = [];

      userASnapshot.forEach(doc => {
        const data = doc.data();
        matches.push({ 
          ...data, 
          matchId: doc.id, 
          role: 'userA' 
        });
      });

      userBSnapshot.forEach(doc => {
        const data = doc.data();
        matches.push({ 
          ...data, 
          matchId: doc.id, 
          role: 'userB' 
        });
      });

      return matches;
    } catch (error) {
      console.error('Error fetching matches for user:', error);
      throw error;
    }
  }

  /**
   * Complete matching process for a specific user
   * @param {string} userId - The user ID to run matching for
   * @returns {Array} - Array of matches involving the user
   */
  async runMatchingProcess(userId) {
    try {
      const potentialMatches = await this.findPotentialMatches(userId);
      
      if (potentialMatches.length === 0) {
        console.log('No potential matches found for user:', userId);
        return [];
      }

      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const currentUser = { id: userId, ...userDoc.data() };

      const allUsers = [currentUser, ...potentialMatches];

      const matches = await this.runStableMatching(allUsers);

      await this.saveMatchResults(matches);

      return matches.filter(match => 
        match.userA === userId || match.userB === userId
      );
    } catch (error) {
      console.error('Error in matching process:', error);
      throw error;
    }
  }

  /**
   * Get user by ID (delegated to userService)
   * @param {string} userId - The user ID
   * @returns {Object} - User object
   */
  async getUserById(userId) {
    return await this.userService.getProfileById(userId);
  }
}

module.exports = MatchingService;


