const { db } = require("@/config/firebaseConfig");
const {
  collection,
  doc,
  addDoc,
} = require("firebase/firestore");

class SkillService {
	async createCategory(name, description) {
		const skillCategoryCollection = collection(db, "categories");
		const skillCategoryData = {
	    name,
	    description,
	  };
	  const skillCategoryRef = await addDoc(skillCategoryCollection, skillCategoryData);

		return { categoryId: skillCategoryRef.id};
	}

	async createSkill(skillName, categoryId) {
	  const skillCollection = collection(db, "skills");

  	const skillData = {
			name: skillName,
    	categoryId
		}
    const skillRef = await addDoc(skillCollection, skillData);
    return { skillId: skillRef.id };
	}

	async createSkills(skills, categoryId) {
	  const skillCollection = collection(db, "skills");
	  const skillIds = []

	  for (const skillName of skills) {
	  	const skillData = {
				name: skillName,
      	categoryId
			}
	    const skillRef = await addDoc(skillCollection, skillData);
	    skillIds.push(skillRef.id);
	  }

	  return { skillIds };
	}

	async createCategoryWithSkills(name, description, skills) {
	  const categoryId = await this.createCategory(name, description);
	  const skillIds = await this.createSkills(skills, categoryId);
	  return { categoryId, skillIds };
	}

}

module.exports = SkillService