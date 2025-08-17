const { db } = require("@/config/firebaseConfig");
const {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} = require("firebase/firestore");

class UserService {
  constructor() {
    this.userRef = collection(db, "users");
  }

  async getProfileById(userId) {
    const userDoc = await getDoc(doc(this.userRef, userId));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() };
  }

  async getProfileByUsername(username) {
    const q = query(this.userRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  }

  async updateProfileById(userId, updateData) {
    const userDocRef = doc(this.userRef, userId);
    await updateDoc(userDocRef, updateData);
    const updatedDoc = await getDoc(userDocRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async deleteProfileById(userId) {
    const userDocRef = doc(this.userRef, userId);
    await deleteDoc(userDocRef);
  }

  // Methods needed by Jaron's matching algorithm
  async getAllUsersExcept(excludeUserId) {
    try {
      const querySnapshot = await getDocs(this.userRef);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (doc.id !== excludeUserId && userData.isActivelyMatching) {
          users.push({
            id: doc.id,
            ...userData
          });
        }
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async getUsersBySkill(skill) {
    try {
      const q = query(
        this.userRef, 
        where("skillsOffered", "array-contains", skill),
        where("isActivelyMatching", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users by skill:', error);
      throw new Error('Failed to fetch users by skill');
    }
  }

  async getUsersBySkills(skills) {
    try {
      const users = [];
      const querySnapshot = await getDocs(this.userRef);
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.isActivelyMatching) {
          const hasMatchingSkills = skills.some(skill => 
            userData.skillsOffered && userData.skillsOffered.includes(skill)
          );
          if (hasMatchingSkills) {
            users.push({
              id: doc.id,
              ...userData
            });
          }
        }
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching users by skills:', error);
      throw new Error('Failed to fetch users by skills');
    }
  }

  async updateMatchingStatus(userId, isActivelyMatching) {
    try {
      const userDocRef = doc(this.userRef, userId);
      await updateDoc(userDocRef, { isActivelyMatching });
      return { success: true };
    } catch (error) {
      console.error('Error updating matching status:', error);
      throw new Error('Failed to update matching status');
    }
  }

  async getAllActiveUsers() {
    try {
      const q = query(this.userRef, where("isActivelyMatching", "==", true));
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw new Error('Failed to fetch active users');
    }
  }
}

module.exports = UserService;
