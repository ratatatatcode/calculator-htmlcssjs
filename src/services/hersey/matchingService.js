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

class MatchingService {
	async getSkills(skillList) {
		const skillRef = collection(db, "skills")
		const skills = []

		for (const id of skillList) {
			const skillDoc = await getDoc(doc(skillRef, id));
			skills.push(skillDoc.data().name)
		}

		return skills
	}

	cosineSimilarity(vector1, vector2) {
		let dot = 0.0;
	  let normA = 0.0;
	  let normB = 0.0;

	  for (let i = 0; i < vector1.length; i++) {
	  	const a = vector1[i];
    	const b = vector2[i];

    	// console.log(a, b)

    	if (isNaN(a) || isNaN(b)) continue;

	    dot += a * b;
	    normA += a * a;
	    normB += b * b;
	  }

	  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
	}

	async findMatch(userId) {
		const startTime = Date.now();

		const userRef = collection(db, "users");
		const curUserDoc = await getDoc(doc(userRef, userId));
		if (!curUserDoc.exists()) return null;

		const curUserData = curUserDoc.data();

		const curUserSkillOffered = await this.getSkills(curUserData.skillsOffered)
		const curUserSkillWanted = await this.getSkills(curUserData.skillsWanted)

		const curUserOfferedVector = curUserData.skillsOfferedVector
		const curUserWantedVector = curUserData.skillsWantedVector

		const matches = [];
		const usersSnap = await getDocs(userRef);
		const users = usersSnap.docs.map(doc => ({
	    id: doc.id,
	    ...doc.data()
	  }));

		for (var user of users) {
			if (user.id == userId) continue;

			const userSkillOffered = await this.getSkills(user.skillsOffered)
			const userSkillWanted = await this.getSkills(user.skillsWanted)

			const userOfferedVector = user.skillsOfferedVector
			const userWantedVector = user.skillsWantedVector

			const score1 = this.cosineSimilarity(
	      curUserOfferedVector,
	      userWantedVector
	    );
	    const score2 = this.cosineSimilarity(
	      curUserWantedVector,
	      userOfferedVector
	    );

	    const compatibility = (score1 + score2) / 2;


	    matches.push({
	      id: user.id,
	      score: compatibility,
	      skillsOffered: userSkillOffered,
				skillsWanted: userSkillWanted
	    });
		}

		matches.sort((a, b) => b.score - a.score);

		const runtime = Date.now() - startTime;

		return {
			status: 200,
			success: true,
			message: "Match Found!",
			runtime: `${runtime} ms`,
			skillsOffered: curUserSkillOffered,
			skillsWanted: curUserSkillWanted,
			matches
		};
	}
}

module.exports = MatchingService