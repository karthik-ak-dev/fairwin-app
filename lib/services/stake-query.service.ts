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

import { Stake, StakeStatus } from '@/lib/db/models/stake.model';
import { StakeConfig } from '@/lib/db/models/stake-config.model';

/**
 * Calculate current earnings for a stake
 * Requires the stake's config to be passed in
 * Returns 0 if not active or if calculation fails
 */
export function calculateStakeEarnings(
  stake: Stake,
  config: { durationMonths: number; monthlyReturnRate: number }
): number {
  if (stake.status !== StakeStatus.ACTIVE && stake.status !== StakeStatus.COMPLETED) {
    return 0;
  }

  const now = new Date();
  const start = new Date(stake.startDate);
  const monthsElapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));

  // Cap at config's duration
  const effectiveMonths = Math.min(monthsElapsed, config.durationMonths);

  // Calculate using config's return rate
  return stake.amount * config.monthlyReturnRate * effectiveMonths;
}

/**
 * Check if stake has completed its tenure
 */
export function isStakeCompleted(stake: Stake): boolean {
  if (stake.status === StakeStatus.COMPLETED) return true;
  if (stake.status !== StakeStatus.ACTIVE) return false;

  const now = new Date();
  const end = new Date(stake.endDate);
  return now >= end;
}
