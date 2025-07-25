const AuthService = require("@/services/authService");

class AuthController {
    async signup(req, res) {
        const { email, password, username, birthdate, skillsWanted, skillsOffered } = req.body;
        try {
            await AuthService.signup(email, password, { username, birthdate, skillsWanted, skillsOffered });
            return res.status(200).json({ success: true, message: "Account Created Successfully." });
        } catch (err) {
            console.error(`ERROR IN CREATING ACCOUNT: ${err.code} - ${err.message}`);
            if (err.code === "auth/email-already-in-use") {
                return res.status(409).json({ success: false, message: "Email is already in use." });
            } else {
                return res.status(500).json({ success: false, message: "Error in creating account." });
            }
        }
    }

    async login(req, res) {
        const { email, password } = req.body;
        try {
            const result = await AuthService.login(email, password);
            const { status, success, message, idToken, isCompleted } = result;
            return res.status(status).json({ success, message, idToken, isCompleted });
        } catch (err) {
            console.error(`ERROR LOGIN: ${err.code} - ${err.message}`);
            if (err.code === "auth/invalid-credential") {
                return res.status(401).json({ success: false, message: "Invalid Credentials." });
            } else {
                return res.status(500).json({ success: false, message: "Internal Error." });
            }
        }
    }

    async logout(req, res) {
        try {
            await AuthService.logout();
            return res.status(200).json({ success: true, message: "Logged Out Successfully." });
        } catch (err) {
            console.error(`ERROR LOGGING OUT: ${err.code} - ${err.message}`);
            return res.status(500).json({ success: false, message: "Internal Error." });
        }
    }

    async resetPasswordEmail(req, res) {
        const { email } = req.body;
        try {
            await AuthService.resetPasswordEmail(email);
            return res.status(200).json({ success: true, message: "Email sent. Please check your email." });
        } catch (err) {
            console.error(`ERROR RESET PASSWORD BY EMAIL: ${err.code} - ${err.message}`);
            return res.status(500).json({ success: false, message: "Internal Error." });
        }
    }
}

module.exports = AuthController;