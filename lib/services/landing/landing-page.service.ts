// Landing Page Service
// Responsibilities:
// - Aggregate platform-wide statistics for landing page
// - Fetch referral commission rates
// - Public endpoint (no authentication required)

import { getStakesByStatus } from '@/lib/db/repositories/stake.repository';
import { getWithdrawalsByStatus } from '@/lib/db/repositories/withdrawal.repository';
import { getReferralConfigById } from '@/lib/db/repositories/referral-config.repository';
import { getStakeConfigById } from '@/lib/db/repositories/stake-config.repository';
import { StakeStatus } from '@/lib/db/models/stake.model';
import { WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
import { getTotalCommissionRate } from '@/lib/services/config/referral-config.service';

/**
 * Get all data needed for landing page
 * Returns platform statistics and referral rates
 */
export async function getLandingPageData(): Promise<{
  stats: {
    totalStaked: number;
    activeStakers: number;
    totalRewardsDistributed: number;
  };
  referralRates: Array<{
    level: number;
    rate: number;
    label: string;
  }>;
  rewardRates: {
    stakingRate: number; // Monthly staking rate (e.g., 8 for 8%)
    maxReferralRate: number; // Total referral commission (e.g., 15 for 15%)
  };
}> {
  try {
    // Fetch data in parallel for performance
    const [activeStakes, completedWithdrawals, referralConfig, stakeConfig] = await Promise.all([
      getStakesByStatus(StakeStatus.ACTIVE),
      getWithdrawalsByStatus(WithdrawalStatus.COMPLETED),
      getReferralConfigById('default'),
      getStakeConfigById('default'),
    ]);

    // Calculate total staked amount
    const totalStaked = activeStakes.reduce((sum, stake) => sum + stake.amount, 0);

    // Count unique active stakers
    const uniqueStakers = new Set(activeStakes.map((stake) => stake.userId));
    const activeStakers = uniqueStakers.size;

    // Calculate total rewards distributed (completed withdrawals)
    const totalRewardsDistributed = completedWithdrawals.reduce(
      (sum, withdrawal) => sum + withdrawal.amount,
      0
    );

    // Build referral rates array
    const referralRates = referralConfig
      ? referralConfig.commissionRates.map((rate, index) => ({
          level: index + 1,
          rate: rate * 100, // Convert to percentage (0.08 → 8)
          label: index === 0 ? 'Direct Referrals' : `Level ${index + 1}`,
        }))
      : [
          { level: 1, rate: 8, label: 'Direct Referrals' },
          { level: 2, rate: 3, label: 'Level 2' },
          { level: 3, rate: 2, label: 'Level 3' },
          { level: 4, rate: 1, label: 'Level 4' },
          { level: 5, rate: 1, label: 'Level 5' },
        ];

    // Calculate reward rates from configs
    const stakingRate = stakeConfig ? stakeConfig.monthlyReturnRate * 100 : 8; // Convert to percentage
    const maxReferralRate = referralConfig ? getTotalCommissionRate(referralConfig) * 100 : 15;

    return {
      stats: {
        totalStaked,
        activeStakers,
        totalRewardsDistributed,
      },
      referralRates,
      rewardRates: {
        stakingRate,
        maxReferralRate,
      },
    };
  } catch (error) {
    console.error('Error fetching landing page data:', error);

    // Return fallback data on error
    return {
      stats: {
        totalStaked: 0,
        activeStakers: 0,
        totalRewardsDistributed: 0,
      },
      referralRates: [
        { level: 1, rate: 8, label: 'Direct Referrals' },
        { level: 2, rate: 3, label: 'Level 2' },
        { level: 3, rate: 2, label: 'Level 3' },
        { level: 4, rate: 1, label: 'Level 4' },
        { level: 5, rate: 1, label: 'Level 5' },
      ],
      rewardRates: {
        stakingRate: 8,
        maxReferralRate: 15,
      },
    };
  }
}
