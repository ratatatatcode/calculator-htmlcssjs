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

class MatchService {
  constructor() {
    this.userRef = collection(db, "users");
  }
}

module.exports = MatchService;
