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
const { pipeline } = require('@huggingface/transformers');

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


	async calculateEmbeddings(skills) {
		const vectors = []

		const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { pooling: "none", normalize: true });
		const embeddings = await extractor(skills, { pooling: 'none', normalize: true });
		
	  const numSkills = skills.length;
	  const embeddingSize = embeddings.data.length / numSkills;

	  // Average the embeddings
	  const avgVector = new Array(embeddingSize).fill(0);
	  for (let i = 0; i < embeddings.data.length; i++) {
	    avgVector[i % embeddingSize] += embeddings.data[i];
	  }
	  for (let i = 0; i < avgVector.length; i++) {
	    avgVector[i] /= numSkills;
	  }

	  return avgVector;
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
		const userRef = collection(db, "users");
		const curUserDoc = await getDoc(doc(userRef, userId));
		if (!curUserDoc.exists()) return null;

		const curUserData = curUserDoc.data();

		const curUserSkillOfferedId = curUserData.skillsOffered;
		const curUserSkillWantedId = curUserData.skillsWanted;

		const curUserSkillOffered = await this.getSkills(curUserSkillOfferedId)
		const curUserSkillWanted = await this.getSkills(curUserSkillWantedId)

		const curUserOfferedVector = await this.calculateEmbeddings(curUserSkillOffered)
		const curUserWantedVector = await this.calculateEmbeddings(curUserSkillWanted)

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

			const userOfferedVector = await this.calculateEmbeddings(userSkillOffered)
			const userWantedVector = await this.calculateEmbeddings(userSkillWanted)

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
	      userSkillOffered,
				userSkillWanted
	    });
		}

		matches.sort((a, b) => b.score - a.score);

		return {
			status: 200,
			success: true,
			message: "Match Found!",
			curUserSkillOffered,
			curUserSkillWanted,
			matches
		};
	}
}

module.exports = MatchingService