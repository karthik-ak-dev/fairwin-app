// GET /api/withdrawals/available - Get available withdrawal amount
// Responsibilities:
// - Authenticate user via JWT
// - Call stake-query.service.calculateAvailableWithdrawal(userId)
// - Call referral-tree.service.calculateTotalReferralEarnings(userId)
// - Return: stakeRewards, referralCommissions, total, nextWithdrawalDate
// - Used by withdrawal page to show breakdown
