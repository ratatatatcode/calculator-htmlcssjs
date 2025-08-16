const { auth, db } = require("@/config/firebaseConfig");
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} = require("firebase/auth");
const { collection, doc, setDoc } = require("firebase/firestore");
const jwt = require("jsonwebtoken");

const AuthUtils = require("../utils/authUtils");
const JWT_SECRET = process.env.JWT_SECRET;

class AuthService {
  constructor() {
    this.authUtils = new AuthUtils();
  }

  async signup(email, password, extraFields = {}) {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const userId = userCred.user.uid;

    const skillsOfferedVector = await this.authUtils.calculateEmbeddings(extraFields.skillsOffered)
    const skillsWantedVector = await this.authUtils.calculateEmbeddings(extraFields.skillsWanted)

    const userCollection = collection(db, "users");
    const userData = {
      ...extraFields,
      skillsOfferedVector,
      skillsWantedVector,
      email,
      createdAt: new Date().toISOString(),
      role: "user",
      profilePicture: this.authUtils.toDataUrl(),
    };

    const userRef = doc(userCollection, userId);
    await setDoc(userRef, userData);

    return { userId };
  }

  async login(email, password) {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const user = userCred.user;
    const idToken = jwt.sign({ id: user.uid, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    return {
      status: 200,
      success: true,
      message: "Logged In Successfully.",
      idToken,
      isCompleted: true,
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
