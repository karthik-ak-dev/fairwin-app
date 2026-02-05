// Stake Query Service - Business logic for retrieving stake data
// Responsibilities:
// - getUserStakes(userId): Get all stakes with calculated rewards
// - getStakeDetails(stakeId): Get single stake with full details
// - calculateStakeRewards(stake): Calculate rewards based on elapsed time
//   Formula: (amount * 0.08 * monthsElapsed) for up to 24 months
// - calculateAvailableWithdrawal(userId): Sum all withdrawable rewards across stakes
// - getStakeSummary(userId): Aggregate stats (total staked, total earned, active stakes count)
// - Uses stake.repository
// - Uses reward-calculation.service for complex reward logic
// - Returns enriched stake data with calculated fields
