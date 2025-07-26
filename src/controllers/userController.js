const userService = require("@/services/userService");

class UserController {
  async getProfile(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const profile = await userService.getProfileById(userId);
      if (!profile)
        return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getProfileByUsername(req, res) {
    try {
      const { username } = req.params;
      if (!username)
        return res.status(400).json({ message: "Username required" });
      const profile = await userService.getProfileByUsername(username);
      if (!profile)
        return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const updateData = req.body;
      const updatedProfile = await userService.updateProfileById(
        userId,
        updateData,
      );
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async deleteProfile(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      await userService.deleteProfileById(userId);
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
}

module.exports = UserController;
