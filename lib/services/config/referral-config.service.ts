// ReferralConfig Service Layer
// Business logic for referral configuration operations

import { getReferralConfigById } from '@/lib/db/repositories/referral-config.repository';
import { ReferralConfig } from '@/lib/db/models/referral-config.model';
import { constants } from '@/lib/constants';

/**
 * Get referral configuration by ID
 * Returns null if not found
 */
export async function getReferralConfig(referralConfigId: string): Promise<ReferralConfig | null> {
  try {
    const config = await getReferralConfigById(referralConfigId);
    return config;
  } catch (error) {
    console.error('Error fetching referral config:', error);
    return null;
  }
}

/**
 * Get the default referral configuration
 * Returns null if not found
 */
export async function getDefaultReferralConfig(): Promise<ReferralConfig | null> {
  return getReferralConfig(constants.DEFAULT_REFERRAL_CONFIG_ID);
}

/**
 * Validate if a referral config exists and is active
 */
export async function isValidReferralConfig(referralConfigId: string): Promise<boolean> {
  const config = await getReferralConfig(referralConfigId);
  return config !== null && config.isActive;
}

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
