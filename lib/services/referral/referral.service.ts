// Referral Service
// Responsibilities:
// - Create commission records when stakes become active
// - Calculate upline chain (traverse up to 5 levels)
// - Query and aggregate referral data for UI
// - Calculate total commissions earned

import {
  createReferralsBatch,
  getReferralsByReferrerId,
} from '@/lib/db/repositories/referral.repository';
import { getUserById } from '@/lib/db/repositories/user.repository';
import { getReferralConfigById } from '@/lib/db/repositories/referral-config.repository';
import { Referral } from '@/lib/db/models/referral.model';
import { calculateLevelCommission } from '@/lib/services/config/referral-config.service';

/**
 * Build upline chain for a user (up to 5 levels)
 * Returns array of user IDs from direct referrer to 5th level upline
 */
export async function buildUplineChain(userId: string, maxLevels: number = 5): Promise<string[]> {
  const upline: string[] = [];
  let currentUserId = userId;

  for (let i = 0; i < maxLevels; i++) {
    const user = await getUserById(currentUserId);
    if (!user || !user.referredBy) {
      break; // No more upline
    }

    upline.push(user.referredBy);
    currentUserId = user.referredBy;
  }

  return upline;
}

/**
 * Create referral commission records when a stake becomes ACTIVE
 * Traverses upline chain and creates commission record for each level
 */
export async function createReferralCommissions(
  referredUserId: string, // User who made the stake
  stakeId: string,
  stakeAmount: number,
  referralConfigId: string = 'default'
): Promise<{ success: boolean; referrals?: Referral[]; error?: string }> {
  try {
    // Get referral config
    const config = await getReferralConfigById(referralConfigId);
    if (!config) {
      return { success: false, error: 'Referral config not found' };
    }

    // Build upline chain (up to maxLevels from config)
    const upline = await buildUplineChain(referredUserId, config.maxLevels);

    if (upline.length === 0) {
      // No upline = no commissions to create
      return { success: true, referrals: [] };
    }

    // Prepare commission records for batch creation
    const commissionsToCreate = upline.map((referrerId, index) => {
      const level = index + 1; // Level 1 = direct referrer (index 0)
      const commissionRate = config.commissionRates[index] || 0;
      const commissionAmount = calculateLevelCommission(config, level - 1, stakeAmount);

      return {
        referrerId,
        referredUserId,
        stakeId,
        level,
        stakeAmount,
        commissionRate,
        commissionAmount,
      };
    });

    // Create all commission records in batch
    const referrals = await createReferralsBatch(commissionsToCreate);

    return { success: true, referrals };
  } catch (error) {
    console.error('Error creating referral commissions:', error);
    return { success: false, error: 'Failed to create referral commissions' };
  }
}

/**
 * Get all commissions earned by a user
 */
export async function getUserCommissions(userId: string): Promise<Referral[]> {
  return await getReferralsByReferrerId(userId);
}

/**
 * Get commissions grouped by level
 * Returns summary for each level (L1-L5)
 */
export async function getCommissionsByLevel(userId: string): Promise<
  Array<{
    level: number;
    totalEarnings: number;
    count: number;
    avgCommission: number;
  }>
> {
  const referrals = await getReferralsByReferrerId(userId);

  // Group by level
  const levelMap = new Map<number, Referral[]>();
  for (const referral of referrals) {
    const levelReferrals = levelMap.get(referral.level) || [];
    levelReferrals.push(referral);
    levelMap.set(referral.level, levelReferrals);
  }

  // Calculate summary for each level
  const summary = [];
  for (let level = 1; level <= 5; level++) {
    const levelReferrals = levelMap.get(level) || [];
    const totalEarnings = levelReferrals.reduce((sum, r) => sum + r.commissionAmount, 0);
    const count = levelReferrals.length;
    const avgCommission = count > 0 ? totalEarnings / count : 0;

    summary.push({
      level,
      totalEarnings,
      count,
      avgCommission,
    });
  }

  return summary;
}

/**
 * Get unique referred users at each level
 * Returns count of unique users who have staked at each level
 */
export async function getNetworkStructure(userId: string): Promise<
  Array<{
    level: number;
    uniqueUsers: number;
    totalStaked: number;
    totalEarnings: number;
  }>
> {
  const referrals = await getReferralsByReferrerId(userId);

  // Group by level
  const levelData = new Map<
    number,
    { users: Set<string>; totalStaked: number; totalEarnings: number }
  >();

  for (const referral of referrals) {
    const data = levelData.get(referral.level) || {
      users: new Set<string>(),
      totalStaked: 0,
      totalEarnings: 0,
    };

    data.users.add(referral.referredUserId);
    data.totalStaked += referral.stakeAmount;
    data.totalEarnings += referral.commissionAmount;

    levelData.set(referral.level, data);
  }

  // Build result array
  const structure = [];
  for (let level = 1; level <= 5; level++) {
    const data = levelData.get(level) || {
      users: new Set<string>(),
      totalStaked: 0,
      totalEarnings: 0,
    };

    structure.push({
      level,
      uniqueUsers: data.users.size,
      totalStaked: data.totalStaked,
      totalEarnings: data.totalEarnings,
    });
  }

  return structure;
}
