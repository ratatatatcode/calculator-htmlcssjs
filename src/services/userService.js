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
  addDoc,
  serverTimestamp,
} = require("firebase/firestore");
const { COLLECTIONS } = require("@/config/firestoreCollections");

class UserService {
  constructor() {
    this.userRef = collection(db, COLLECTIONS.USERS);
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

  async getActivelyMatchingUsers() {
    const q = query(this.userRef, where("isActivelyMatching", "==", true));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateMatchingStatus(userId, isActivelyMatching) {
    const userDocRef = doc(this.userRef, userId);
    await updateDoc(userDocRef, { 
      isActivelyMatching,
      lastMatchRequest: serverTimestamp()
    });
    return await this.getProfileById(userId);
  }

  async updateUserPreferences(userId, preferences) {
    const userDocRef = doc(this.userRef, userId);
    await updateDoc(userDocRef, { 
      preferences,
      lastMatchRequest: serverTimestamp()
    });
    return await this.getProfileById(userId);
  }

  async getUsersBySkills(skills) {
    const users = [];
    
    const offeredQuery = query(this.userRef, where("skillsOffered", "array-contains-any", skills));
    const offeredSnapshot = await getDocs(offeredQuery);
    offeredSnapshot.docs.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    const wantedQuery = query(this.userRef, where("skillsWanted", "array-contains-any", skills));
    const wantedSnapshot = await getDocs(wantedQuery);
    wantedSnapshot.docs.forEach(doc => {
      const existingUser = users.find(u => u.id === doc.id);
      if (!existingUser) {
        users.push({ id: doc.id, ...doc.data() });
      }
    });

    return users;
  }

  async getAllUsersExcept(excludeUserId) {
    const usersSnapshot = await getDocs(this.userRef);
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = { id: doc.id, ...doc.data() };
      if (userData.id !== excludeUserId) {
        users.push(userData);
      }
    });
    
    return users;
  }

  async getAllUsers() {
    const usersSnapshot = await getDocs(this.userRef);
    const users = [];
    
    usersSnapshot.forEach(doc => {
      const userData = { id: doc.id, ...doc.data() };
      users.push(userData);
    });
    
    return users;
  }
}

module.exports = UserService;
