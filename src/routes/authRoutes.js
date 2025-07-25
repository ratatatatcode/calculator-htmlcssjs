const express = require("express");
const router = express.Router();
const AuthController = require("@/controllers/authController");

const authController = new AuthController();

// Register a new user
router.post('/signup', authController.signup.bind(authController));

// Login
router.post('/login', authController.login.bind(authController));

// Password reset
router.post('/reset-password', authController.resetPasswordEmail.bind(authController));

module.exports = router;