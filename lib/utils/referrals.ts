// Referral Utilities
// Referral commission calculations and upline chain management

import {
  createReferralsBatch,
  getReferralsByReferrerId,
} from '@/lib/db/repositories/referral.repository';
import { getUserById } from '@/lib/db/repositories/user.repository';
import { getReferralConfigById } from '@/lib/db/repositories/referral-config.repository';
import { Referral } from '@/lib/db/models/referral.model';
import { ReferralConfig } from '@/lib/db/models/referral-config.model';

/**
 * Calculate commission amount for a specific level
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

/**
 * Calculate total commission rate across all levels
 */
export function getTotalCommissionRate(config: ReferralConfig): number {
  return config.commissionRates.reduce((sum, rate) => sum + rate, 0);
}

/**
 * Build upline chain for a user (up to maxLevels)
 * Returns array of user IDs from direct referrer to nth level upline
 */
export async function buildUplineChain(userId: string, maxLevels: number = 5): Promise<string[]> {
  const upline: string[] = [];
  let currentUserId = userId;

  for (let i = 0; i < maxLevels; i++) {
    const user = await getUserById(currentUserId);
    if (!user || !user.referredBy) {
      break;
    }
    upline.push(user.referredBy);
    currentUserId = user.referredBy;
  }

  return upline;
}

/**
 * Create referral commission records when a stake becomes ACTIVE
 */
export async function createReferralCommissions(
  referredUserId: string,
  stakeId: string,
  stakeAmount: number,
  referralConfigId: string = 'default'
): Promise<{ success: boolean; referrals?: Referral[]; error?: string }> {
  try {
    const config = await getReferralConfigById(referralConfigId);
    if (!config) {
      return { success: false, error: 'Referral config not found' };
    }

    const upline = await buildUplineChain(referredUserId, config.maxLevels);

    if (upline.length === 0) {
      return { success: true, referrals: [] };
    }

    const commissionsToCreate = upline.map((referrerId, index) => {
      const level = index + 1;
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

  const levelMap = new Map<number, Referral[]>();
  for (const referral of referrals) {
    const levelReferrals = levelMap.get(referral.level) || [];
    levelReferrals.push(referral);
    levelMap.set(referral.level, levelReferrals);
  }

  const summary = [];
  for (let level = 1; level <= 5; level++) {
    const levelReferrals = levelMap.get(level) || [];
    const totalEarnings = levelReferrals.reduce((sum, r) => sum + r.commissionAmount, 0);
    const count = levelReferrals.length;
    const avgCommission = count > 0 ? totalEarnings / count : 0;

    summary.push({ level, totalEarnings, count, avgCommission });
  }

  return summary;
}

/**
 * Get network structure with unique users at each level
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

/**
 * Generate a unique referral code
 */
export function generateReferralCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}
