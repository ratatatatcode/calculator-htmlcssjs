const express = require("express");
const router = express.Router();
const UserController = require("@/controllers/userController");
const authenticateJWT = require("../middleware/auth");

const userController = new UserController();

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
  "/profile",
  authenticateJWT,
  userController.updateProfile.bind(userController),
);
router.delete(
  "/profile",
  authenticateJWT,
  userController.deleteProfile.bind(userController),
);

module.exports = router;
