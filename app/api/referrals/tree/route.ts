// GET /api/referrals/tree - Get referral tree structure
// Responsibilities:
// - Authenticate user via JWT
// - Call referral-tree.service.buildReferralTree(userId)
// - Return tree structure with 5 levels
// - Each node includes: userId, walletAddress, stakeAmount, joinDate, level
// - Used by referrals page to visualize network
