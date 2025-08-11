class MatchingController {
	constructor(matchingService) {
		this.matchingService = matchingService;
	}

	test(req, res) {
		return res
			.status(200)
			.json({ success: true, message: "Matching test" });
	}

	async findMatch(req, res) {
		const userId = req.userId;
		try {
			const result = await this.matchingService.findMatch(userId);
			const { status, success, message, curUserSkillOffered, curUserSkillWanted, matches } = result;
			return res
				.status(status)
				.json({ success, message, curUserSkillOffered, curUserSkillWanted, matches });
		} catch(err) {
			console.error(`ERROR MATCHING: ${err.code} - ${err.message}`);
	        return res
	          .status(500)
	          .json({ success: false, message: "Internal Error." });
		}
	}
}

module.exports = MatchingController