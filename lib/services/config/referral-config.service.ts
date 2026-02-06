// ReferralConfig Service Layer
// Business logic for referral configuration operations

import { ReferralConfig } from '@/lib/db/models/referral-config.model';

/**
 * Calculate total commission rate across all levels
 */
export function getTotalCommissionRate(config: ReferralConfig): number {
  return config.commissionRates.reduce((sum, rate) => sum + rate, 0);
}

/**
 * Calculate commission amount for a specific level (0-indexed)
 * Returns 0 if level is out of bounds or config is invalid
 */
export function calculateLevelCommission(
  config: ReferralConfig,
  level: number,
  stakeAmount: number
): number {
  if (level < 0 || level >= config.maxLevels || level >= config.commissionRates.length) {
    return 0;
  }

  const rate = config.commissionRates[level];
  return stakeAmount * rate;
}
