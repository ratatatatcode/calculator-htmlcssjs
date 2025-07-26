const { db } = require("@/config/firebaseConfig");
const {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
} = require("firebase/firestore");

const userRef = collection(db, "users");

// Get user profile by user ID
async function getProfileById(userId) {
  const userDoc = await getDoc(doc(userRef, userId));
  if (!userDoc.exists()) return null;
  return { id: userDoc.id, ...userDoc.data() };
}

// Get user profile by username
async function getProfileByUsername(username) {
  const q = query(userRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
}

// Update user profile by user ID
async function updateProfileById(userId, updateData) {
  const userDocRef = doc(userRef, userId);
  await updateDoc(userDocRef, updateData);
  const updatedDoc = await getDoc(userDocRef);
  return { id: updatedDoc.id, ...updatedDoc.data() };
}

// Delete user profile by user ID
async function deleteProfileById(userId) {
  const userDocRef = doc(userRef, userId);
  await deleteDoc(userDocRef);
}

module.exports = {
  getProfileById,
  getProfileByUsername,
  updateProfileById,
  deleteProfileById,
};