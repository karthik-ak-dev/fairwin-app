// Stake Utilities
// Stake creation, validation, and lifecycle management

import {
  createStake,
  getStakeById,
  getStakeByTxHash,
  getStakesByStatus,
  updateStakeStatus,
  updateStakeTxHash,
  deleteStake,
} from '@/lib/db/repositories/stake.repository';
import { getStakeConfigById } from '@/lib/db/repositories/stake-config.repository';
import { Stake, StakeStatus } from '@/lib/db/models/stake.model';
import { constants } from '@/lib/constants';

/**
 * Create a new stake for a user with validation
 */
export async function createUserStake(
  userId: string,
  amount: number,
  stakeConfigId?: string
): Promise<{ success: boolean; stake?: Stake; error?: string }> {
  try {
    const configId = stakeConfigId || constants.DEFAULT_STAKE_CONFIG_ID;

    const config = await getStakeConfigById(configId);
    if (!config) {
      return { success: false, error: 'Stake configuration not found' };
    }

    if (!config.isActive) {
      return { success: false, error: 'Stake configuration is not active' };
    }

    if (amount < config.minStake) {
      return {
        success: false,
        error: `Minimum stake amount is ${config.minStake}`,
      };
    }

    if (amount > config.maxStake) {
      return {
        success: false,
        error: `Maximum stake amount is ${config.maxStake}`,
      };
    }

    const stake = await createStake({
      userId,
      stakeConfigId: configId,
      amount,
    });

    return { success: true, stake };
  } catch (error) {
    console.error('Error creating stake:', error);
    return { success: false, error: 'Failed to create stake' };
  }
}

/**
 * Submit transaction hash with full validation
 */
export async function submitStakeTxHashWithValidation(
  stakeId: string,
  txHash: string,
  userId: string
): Promise<{ success: boolean; stake?: Stake; error?: string }> {
  try {
    const stake = await getStakeById(stakeId);
    if (!stake) {
      return { success: false, error: 'Stake not found' };
    }

    if (stake.userId !== userId) {
      return {
        success: false,
        error: 'Not authorized to update this stake',
      };
    }

    if (stake.status !== StakeStatus.PENDING) {
      return {
        success: false,
        error: 'Can only submit txHash for PENDING stakes',
      };
    }

    const existingStake = await getStakeByTxHash(txHash);
    if (existingStake) {
      return {
        success: false,
        error: 'Transaction hash already used',
      };
    }

    await updateStakeTxHash(stakeId, txHash);
    await updateStakeStatus(stakeId, StakeStatus.VERIFYING);

    const updatedStake = await getStakeById(stakeId);
    if (!updatedStake) {
      return {
        success: false,
        error: 'Failed to fetch updated stake',
      };
    }

    return { success: true, stake: updatedStake };
  } catch (error) {
    console.error('Error submitting stake txHash:', error);
    return { success: false, error: 'Failed to submit transaction hash' };
  }
}

/**
 * Activate a verified stake
 */
export async function activateStake(
  stakeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const stake = await getStakeById(stakeId);
    if (!stake) {
      return { success: false, error: 'Stake not found' };
    }

    if (stake.status !== StakeStatus.VERIFYING) {
      return {
        success: false,
        error: 'Stake must be in VERIFYING status to activate',
      };
    }

    const config = await getStakeConfigById(stake.stakeConfigId);
    if (!config) {
      return { success: false, error: 'Stake configuration not found' };
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + config.durationMonths);

    await updateStakeStatus(
      stakeId,
      StakeStatus.ACTIVE,
      startDate.toISOString(),
      endDate.toISOString()
    );

    return { success: true };
  } catch (error) {
    console.error('Error activating stake:', error);
    return { success: false, error: 'Failed to activate stake' };
  }
}

/**
 * Mark stake as completed
 */
export async function completeStake(
  stakeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const stake = await getStakeById(stakeId);
    if (!stake) {
      return { success: false, error: 'Stake not found' };
    }

    if (stake.status !== StakeStatus.ACTIVE) {
      return {
        success: false,
        error: 'Stake must be in ACTIVE status to complete',
      };
    }

    const now = new Date();
    const endDate = new Date(stake.endDate);
    if (now < endDate) {
      return {
        success: false,
        error: 'Stake has not reached its end date yet',
      };
    }

    await updateStakeStatus(stakeId, StakeStatus.COMPLETED);

    return { success: true };
  } catch (error) {
    console.error('Error completing stake:', error);
    return { success: false, error: 'Failed to complete stake' };
  }
}

/**
 * Get all stakes by status
 */
export async function getStakesByStatusHelper(status: StakeStatus): Promise<Stake[]> {
  try {
    return await getStakesByStatus(status);
  } catch (error) {
    console.error(`Error fetching stakes with status ${status}:`, error);
    return [];
  }
}

/**
 * Delete abandoned PENDING stakes older than specified hours
 * Returns the number of stakes deleted
 */
export async function deleteAbandonedPendingStakes(hoursOld: number = 24): Promise<{
  success: boolean;
  deletedCount: number;
  errors: string[];
}> {
  try {
    const pendingStakes = await getStakesByStatus(StakeStatus.PENDING);

    if (pendingStakes.length === 0) {
      return { success: true, deletedCount: 0, errors: [] };
    }

    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursOld);

    const stakesToDelete = pendingStakes.filter(stake => {
      const createdAt = new Date(stake.createdAt);
      return createdAt < cutoffTime;
    });

    const errors: string[] = [];
    let deletedCount = 0;

    for (const stake of stakesToDelete) {
      try {
        await deleteStake(stake.stakeId);
        deletedCount++;
      } catch (error: any) {
        errors.push(`Failed to delete stake ${stake.stakeId}: ${error.message}`);
      }
    }

    return { success: true, deletedCount, errors };
  } catch (error: any) {
    console.error('Error deleting abandoned PENDING stakes:', error);
    return { success: false, deletedCount: 0, errors: [error.message] };
  }
}
