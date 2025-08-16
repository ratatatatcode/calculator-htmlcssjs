class SkillController {
  constructor(skillService) {
    this.skillService = skillService;
  }

  async createCategory(req, res) {
    const { name, description } = req.body;
    try {
      const { categoryId } = await this.skillService.createCategory(name, description);
      return res
        .status(201)
        .json({
          success: true,
          message: "Category Created Successfully.",
          categoryId
        });
    } catch (err) {
      console.error(`ERROR IN CREATING CATEGORY: ${err.code} - ${err.message}`);
      return res
        .status(500)
        .json({ success: false, message: "Error in creating category." });
    }
  }

  async createSkill(req, res) {
    const { skillName, categoryId } = req.body;
    try {
      const { skillId } = await this.skillService.createSkill(skillName, categoryId);
      return res
        .status(201)
        .json({
          success: true,
          message: "Skill Created Successfully.",
          skillId
        });
    } catch (err) {
      console.error(`ERROR IN CREATING SKILL: ${err.code} - ${err.message}`);
      return res
        .status(500)
        .json({ success: false, message: "Error in creating skill." });
    }
  }


  async createSkills(req, res) {
    const { categoryId } = req.body;
    const skills = req.body.skills.split(",").map(s => s.trim());
    try {
      const { skillIds } = await this.skillService.createSkills(skills, categoryId);
      return res
        .status(201)
        .json({
          success: true,
          message: "Skills Created Successfully.",
          skillIds
        });
    } catch (err) {
      console.error(`ERROR IN CREATING SKILLS: ${err.code} - ${err.message}`);
      return res
        .status(500)
        .json({ success: false, message: "Error in creating skills." });
    }
  }

  async createCategoryWithSkills(req, res) {
    const { name, description } = req.body;
    const skills = req.body.skills.split(",").map(s => s.trim());
    try {
      const { categoryId, skillIds } = await this.skillService.createCategoryWithSkills(name, description, skills);
      return res
        .status(201)
        .json({
          success: true,
          message: "Category and Skills Created Successfully.",
          categoryId, 
          skillIds
        });
    } catch (err) {
      console.error(`ERROR IN CREATING CATEGORY AND SKILLS: ${err.code} - ${err.message}`);
      return res
        .status(500)
        .json({ success: false, message: "Error in creating category and skills." });
    }
  }
}

module.exports = SkillController;
