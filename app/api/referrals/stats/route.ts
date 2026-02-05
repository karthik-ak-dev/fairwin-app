// GET /api/referrals/stats - Get referral statistics
// Responsibilities:
// - Authenticate user via JWT
// - Call referral-tree.service.getReferralStats(userId)
// - Return: counts by level (L1-L5), total earnings, active vs inactive
// - Commission breakdown: L1: 8%, L2: 3%, L3: 2%, L4: 1%, L5: 1%
// - Used by dashboard and referrals page
