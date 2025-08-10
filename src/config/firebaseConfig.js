require("dotenv").config();
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");

// Debug: Check if environment variables are loaded
console.log("Environment variables check:");
console.log("FIREBASE_API_KEY:", process.env.FIREBASE_API_KEY ? "✓ Loaded" : "✗ Missing");
console.log("FIREBASE_AUTH_DOMAIN:", process.env.FIREBASE_AUTH_DOMAIN ? "✓ Loaded" : "✗ Missing");
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "✓ Loaded" : "✗ Missing");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

module.exports = { auth, db };
