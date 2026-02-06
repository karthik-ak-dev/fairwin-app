// Stake Query Service
// Responsibilities:
// - Query and retrieve stake data
// - Calculate earnings and progress for stakes
// - Get stakes with enriched data (config, earnings)

import {
  getStakeById,
  getStakesByUserId,
  getStakesByStatus as getStakesByStatusRepo,
  getUserStakesByStatus,
  getStakeByTxHash,
} from '@/lib/db/repositories/stake.repository';
import { getStakeConfig } from '@/lib/services/config/stake-config.service';
import { Stake, StakeStatus } from '@/lib/db/models/stake.model';
import { EnrichedStake } from './types';

/**
 * Calculate current earnings for a stake
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

  const effectiveMonths = Math.min(monthsElapsed, config.durationMonths);
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

/**
 * Helper: Enrich stakes with config and calculated fields
 */
async function enrichStakes(stakes: Stake[]): Promise<EnrichedStake[]> {
  const enriched: EnrichedStake[] = [];

  for (const stake of stakes) {
    const config = await getStakeConfig(stake.stakeConfigId);
    if (!config) continue;

    enriched.push({
      ...stake,
      config,
      currentEarnings: calculateStakeEarnings(stake, config),
      isCompleted: isStakeCompleted(stake),
    });
  }

  return enriched;
}

/**
 * Get stake by ID with enriched data
 */
export async function getStakeWithDetails(stakeId: string): Promise<EnrichedStake | null> {
  try {
    const stake = await getStakeById(stakeId);
    if (!stake) return null;

    const config = await getStakeConfig(stake.stakeConfigId);
    if (!config) return null;

    return {
      ...stake,
      config,
      currentEarnings: calculateStakeEarnings(stake, config),
      isCompleted: isStakeCompleted(stake),
    };
  } catch (error) {
    console.error('Error getting stake with details:', error);
    return null;
  }
}

/**
 * Get all stakes for a user with enriched data
 */
export async function getUserStakes(userId: string): Promise<EnrichedStake[]> {
  try {
    const stakes = await getStakesByUserId(userId);
    return await enrichStakes(stakes);
  } catch (error) {
    console.error('Error getting user stakes:', error);
    return [];
  }
}

/**
 * Get user's active stakes only
 */
export async function getUserActiveStakes(userId: string): Promise<EnrichedStake[]> {
  try {
    const stakes = await getUserStakesByStatus(userId, StakeStatus.ACTIVE);
    return await enrichStakes(stakes);
  } catch (error) {
    console.error('Error getting user active stakes:', error);
    return [];
  }
}

/**
 * Get all stakes by status
 */
export async function getStakesByStatus(status: StakeStatus): Promise<EnrichedStake[]> {
  try {
    const stakes = await getStakesByStatusRepo(status);
    return await enrichStakes(stakes);
  } catch (error) {
    console.error('Error getting stakes by status:', error);
    return [];
  }
}

/**
 * Get stake by transaction hash
 */
export async function getStakeByTransaction(txHash: string): Promise<EnrichedStake | null> {
  try {
    const stake = await getStakeByTxHash(txHash);
    if (!stake) return null;

    const config = await getStakeConfig(stake.stakeConfigId);
    if (!config) return null;

    return {
      ...stake,
      config,
      currentEarnings: calculateStakeEarnings(stake, config),
      isCompleted: isStakeCompleted(stake),
    };
  } catch (error) {
    console.error('Error getting stake by txHash:', error);
    return null;
  }
}

/**
 * Get user's stake summary
 */
export async function getUserStakeSummary(userId: string): Promise<{
  totalStaked: number;
  totalEarnings: number;
  activeStakesCount: number;
  completedStakesCount: number;
}> {
  try {
    const stakes = await getUserStakes(userId);

    const summary = stakes.reduce(
      (acc, stake) => {
        acc.totalStaked += stake.amount;
        acc.totalEarnings += stake.currentEarnings;

        if (stake.status === StakeStatus.ACTIVE) {
          acc.activeStakesCount++;
        } else if (stake.status === StakeStatus.COMPLETED) {
          acc.completedStakesCount++;
        }

        return acc;
      },
      {
        totalStaked: 0,
        totalEarnings: 0,
        activeStakesCount: 0,
        completedStakesCount: 0,
      }
    );

    return summary;
  } catch (error) {
    console.error('Error getting user stake summary:', error);
    return {
      totalStaked: 0,
      totalEarnings: 0,
      activeStakesCount: 0,
      completedStakesCount: 0,
    };
  }
}
