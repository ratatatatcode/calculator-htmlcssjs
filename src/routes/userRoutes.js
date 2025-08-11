const express = require("express");
const UserService = require("@/services/userService");
const UserController = require("@/controllers/userController");

const router = express.Router();
const userService = new UserService();
const userController = new UserController(userService);
const authenticateJWT = require("@/middleware/auth");

router.get("/profile", authenticateJWT, userController.getProfile.bind(userController));
router.get("/:username", userController.getProfileByUsername.bind(userController));
router.put("/api/user/update/profile", authenticateJWT, userController.updateProfile.bind(userController));
router.delete("/api/user/delete/profile", authenticateJWT, userController.deleteProfile.bind(userController));

module.exports = router;
