const express = require("express");
const UserController = require("@/controllers/userController");

const router = express.Router();
const userController = new UserController();
const { authenticateJWT } = require("@/middleware/auth");

router.get(
  "/profile",
  authenticateJWT,
  userController.getProfile.bind(userController),
);
router.get(
  "/:username",
  userController.getProfileByUsername.bind(userController),
);
router.put(
  "/user/update/profile",
  authenticateJWT,
  userController.updateProfile.bind(userController),
);
router.delete(
  "/user/delete/profile",
  authenticateJWT,
  userController.deleteProfile.bind(userController),
);

router.patch(
  "/users/:id/matching-status",
  authenticateJWT,
  userController.updateMatchingStatus.bind(userController),
);
router.get(
  "/users/skills/:skill",
  userController.getUsersBySkills.bind(userController),
);

module.exports = router;
