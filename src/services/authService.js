const { auth, db } = require("@/config/firebaseConfig");
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
} = require("firebase/auth");
const {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} = require("firebase/firestore");

// signInUser
// createUser
// resetPassword