const express = require("express");
const SkillService = require("@/services/hersey/skillService");
const SkillController = require("@/controllers/hersey/skillController");

const router = express.Router();
const skillService = new SkillService();
const skillController = new SkillController(skillService);

router.post("/api/skills/categories", skillController.createCategory.bind(skillController));
router.post("/api/skills", skillController.createSkill.bind(skillController));
router.post("/api/skills/bulk", skillController.createSkills.bind(skillController));
router.post("/api/skills/categories/with-skills", skillController.createCategoryWithSkills.bind(skillController));

module.exports = router;