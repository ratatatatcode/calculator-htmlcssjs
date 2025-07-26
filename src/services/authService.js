const { auth, db } = require("@/config/firebaseConfig");
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} = require("firebase/auth");
const { collection, doc, setDoc } = require("firebase/firestore");
const jwt = require('jsonwebtoken');

const toDataUrl = require('../utils/imageHelpers');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';


class AuthService {
  async signup(email, password, extraFields = {}) {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCred.user.uid;

    const userCollection = collection(db, 'users');
    const userData = {
      ...extraFields,
      email,
      createdAt: new Date().toISOString(),
      role: "user",
      profilePicture: toDataUrl(),
    };

    const userRef = doc(userCollection, userId);
    await setDoc(userRef, userData);

    return { userId };
  }

  async login(email, password) {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    // Issue JWT
    const idToken = jwt.sign({ id: user.uid, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    // Optionally, you can fetch user profile to check if onboarding is completed
    return {
      status: 200,
      success: true,
      message: "Logged In Successfully.",
      idToken,
      isCompleted: true // or fetch from Firestore if needed
    };
  }

  async logout() {
    await signOut(auth);
    return true;
  }

  async resetPasswordEmail(email) {
    await sendPasswordResetEmail(auth, email);
    return true;
  }
}

module.exports = AuthService;