// GET /api/stakes/user - Get all stakes for authenticated user
// Responsibilities:
// - Authenticate user via JWT
// - Call stake-query.service.getUserStakes(userId)
// - Return array of stakes with calculated rewards
// - Each stake includes: amount, startDate, monthsElapsed, totalEarned, status
// - Used by dashboard to display stake list
