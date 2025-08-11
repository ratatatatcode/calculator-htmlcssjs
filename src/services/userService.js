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
}

module.exports = UserService;
