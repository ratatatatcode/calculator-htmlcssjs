const express = require("express");
const AuthService = require("@/services/authService");
const AuthController = require("@/controllers/authController");

const router = express.Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.get("/login", (req, res) => res.render("auth/login.ejs"));
router.get("/signup", (req, res) => res.render("auth/signup.ejs"));
router.post("/api/auth/signup", authController.signup.bind(authController));
router.post("/api/auth/login", authController.login.bind(authController));
router.post(
  "/reset-password",
  authController.resetPasswordEmail.bind(authController),
);

module.exports = router;
