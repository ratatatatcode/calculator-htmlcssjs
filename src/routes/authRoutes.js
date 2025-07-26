const express = require("express");
const AuthService = require("@/services/authService");
const AuthController = require("@/controllers/authController");

const router = express.Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post("/signup", authController.signup.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post(
  "/reset-password",
  authController.resetPasswordEmail.bind(authController),
);

module.exports = router;
