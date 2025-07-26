const express = require("express");
const router = express.Router();
const UserController = require("@/controllers/userController");
const authenticateJWT = require('../middleware/auth');

const userController = new UserController();

// Get current user's profile (protected)
router.get('/profile', authenticateJWT, userController.getProfile.bind(userController));

// Get profile by username (public)
router.get('/:username', userController.getProfileByUsername.bind(userController));

// Update current user's profile (protected)
router.put('/profile', authenticateJWT, userController.updateProfile.bind(userController));

// Delete current user's profile (protected)
router.delete('/profile', authenticateJWT, userController.deleteProfile.bind(userController));

module.exports = router;