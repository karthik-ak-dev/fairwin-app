// Referral Tree Service - Business logic for MLM structure
// Responsibilities:
// - processReferralCommissions(referredUserId, stakeAmount): Create commission records
//   1. Get referral chain (up to 5 levels up from referred user)
//   2. Calculate commission for each level (8%, 3%, 2%, 1%, 1%)
//   3. Create referral records via repository
// - getReferralChain(userId, levels): Traverse up referral tree to get ancestors
// - buildReferralTree(userId): Build complete downline tree structure
// - getReferralStats(userId): Get counts and earnings by level
// - calculateTotalReferralEarnings(userId): Sum all referral commissions
// - Uses user.repository and referral.repository
// - Handles recursive tree traversal
// - Commission rates: [0.08, 0.03, 0.02, 0.01, 0.01]
