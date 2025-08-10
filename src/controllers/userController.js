const UserService = require("@/services/userService");

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  async getProfile(req, res) {
    try {
      const userId = req.user?.id || req.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const profile = await this.userService.getProfileById(userId);
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
      const profile = await this.userService.getProfileByUsername(username);
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
      const updatedProfile = await this.userService.updateProfileById(
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
      await this.userService.deleteProfileById(userId);
      res.json({ message: "Profile deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async updateMatchingStatus(req, res) {
    try {
      const userId = req.user?.id || req.userId || req.params.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized - No user ID found" });
      
      const { isActivelyMatching } = req.body;
      if (typeof isActivelyMatching !== 'boolean') {
        return res.status(400).json({ message: "isActivelyMatching must be a boolean" });
      }
      
      const result = await this.userService.updateMatchingStatus(userId, isActivelyMatching);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error updating matching status:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUsersBySkills(req, res) {
    try {
      const { skill } = req.params;
      if (!skill) return res.status(400).json({ message: "Skill parameter required" });
      const users = await this.userService.getUsersBySkills([skill]);
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;
