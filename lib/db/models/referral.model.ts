// Referral model
// Responsibilities:
// - Track referral commission records
// - Each record represents commission earned by one user from one stake at one level
// - Created when a stake becomes ACTIVE
// - Supports 5-level deep MLM structure
// - Available balance calculated on-the-fly (total earned - total withdrawn)

export interface Referral {
  // Primary Key
  referralId: string; // UUID

  // Foreign Keys
  referrerId: string; // User.userId who earns this commission
  referredUserId: string; // User.userId who made the stake (the person at bottom of chain)
  stakeId: string; // Stake.stakeId that generated this commission

  // Referral Details
  level: number; // Referral level (1-5): 1 = direct referral, 2 = referral's referral, etc.
  stakeAmount: number; // Original stake amount in USDT
  commissionRate: number; // Commission rate for this level (e.g., 0.05 for 5%)
  commissionAmount: number; // Calculated commission amount in USDT

  // Timestamps (ISO 8601 strings)
  createdAt: string; // When this commission was created (when stake became ACTIVE)
  updatedAt: string; // Last update timestamp
}

/**
 * Example:
 *
 * User A refers User B (Level 1 from A)
 * User B refers User C (Level 2 from A, Level 1 from B)
 *
 * When User C stakes $1000 with 5% L1 rate and 3% L2 rate:
 *
 * Record 1:
 * - referrerId: B's userId
 * - referredUserId: C's userId
 * - stakeId: C's stake ID
 * - level: 1
 * - stakeAmount: 1000
 * - commissionRate: 0.05
 * - commissionAmount: 50
 *
 * Record 2:
 * - referrerId: A's userId
 * - referredUserId: C's userId
 * - stakeId: C's stake ID
 * - level: 2
 * - stakeAmount: 1000
 * - commissionRate: 0.03
 * - commissionAmount: 30
 */
