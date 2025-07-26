const express = require("express");
const AuthService = require("@/services/authService")	
const AuthController = require("@/controllers/authController");

const router = express.Router();
const authService = new AuthService();
const authController = new AuthController(authService);

// Register a new user
router.post('/signup', authController.signup.bind(authController));

// Login
router.post('/login', authController.login.bind(authController));

// Password reset
router.post('/reset-password', authController.resetPasswordEmail.bind(authController));

module.exports = router;