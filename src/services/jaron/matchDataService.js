const { db } = require("@/config/firebaseConfig");
const {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} = require("firebase/firestore");

class MatchDataService {
  static preferencesRef = collection(db, 'preferences');
  static matchesRef = collection(db, 'matches');
  static matchRequestsRef = collection(db, 'match_requests');

  static async setUserPreferences(userId, rankedPreferences) {
    const preferenceDoc = doc(MatchDataService.preferencesRef, userId);
    await setDoc(preferenceDoc, {
      userId,
      rankedPreferences,
      timestamp: serverTimestamp()
    });
    return { userId, rankedPreferences };
  }

  static async storeUserPreferences(userId, rankedPreferences) {
    return await MatchDataService.setUserPreferences(userId, rankedPreferences);
  }

  static async getUserPreferences(userId) {
    const preferenceDoc = await getDoc(doc(MatchDataService.preferencesRef, userId));
    if (!preferenceDoc.exists()) return null;
    return { id: preferenceDoc.id, ...preferenceDoc.data() };
  }

  static async updateUserPreferences(userId, rankedPreferences) {
    const preferenceDoc = doc(MatchDataService.preferencesRef, userId);
    await updateDoc(preferenceDoc, {
      rankedPreferences,
      timestamp: serverTimestamp()
    });
    return await MatchDataService.getUserPreferences(userId);
  }

  static async saveMatch(userA, userB) {
    const matchDoc = await addDoc(MatchDataService.matchesRef, {
      userA,
      userB,
      matchedOn: serverTimestamp()
    });
    return { id: matchDoc.id, userA, userB };
  }

  static async getUserMatches(userId) {
    const q1 = query(MatchDataService.matchesRef, where("userA", "==", userId));
    const q2 = query(MatchDataService.matchesRef, where("userB", "==", userId));
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    const matches = [];
    snapshot1.docs.forEach(doc => matches.push({ id: doc.id, ...doc.data() }));
    snapshot2.docs.forEach(doc => matches.push({ id: doc.id, ...doc.data() }));
    
    return matches;
  }

  static async createMatchRequest(requesterId) {
    const requestDoc = await addDoc(MatchDataService.matchRequestsRef, {
      requesterId,
      requestedOn: serverTimestamp(),
      status: "pending"
    });
    return { id: requestDoc.id, requesterId, status: "pending" };
  }

  static async updateMatchRequestStatus(requestId, status) {
    const requestDoc = doc(MatchDataService.matchRequestsRef, requestId);
    await updateDoc(requestDoc, { status });
    return await getDoc(requestDoc);
  }

  static async getPendingMatchRequests() {
    const q = query(MatchDataService.matchRequestsRef, where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async getUserMatchRequest(requesterId) {
    const q = query(MatchDataService.matchRequestsRef, where("requesterId", "==", requesterId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
}

module.exports = MatchDataService;


