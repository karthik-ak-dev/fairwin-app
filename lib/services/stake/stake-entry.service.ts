// Stake Entry Service
// Responsibilities:
// - Handle stake creation and lifecycle management
// - Validate stake amounts against config limits
// - Update stake status (PENDING → VERIFYING → ACTIVE → COMPLETED)
// - Update transaction hash

import {
  createStake,
  getStakeById,
  updateStakeStatus,
  updateStakeTxHash,
} from '@/lib/db/repositories/stake.repository';
import { getStakeConfig } from '@/lib/services/config/stake-config.service';
import { Stake, StakeStatus } from '@/lib/db/models/stake.model';
import { constants } from '@/lib/constants';

/**
 * Create a new stake for a user
 * Validates amount against config limits
 */
export async function createUserStake(
  userId: string,
  amount: number,
  stakeConfigId?: string
): Promise<{ success: boolean; stake?: Stake; error?: string }> {
  try {
    // Use default config if not specified
    const configId = stakeConfigId || constants.DEFAULT_STAKE_CONFIG_ID;

    // Get and validate stake config
    const config = await getStakeConfig(configId);
    if (!config) {
      return { success: false, error: 'Stake configuration not found' };
    }

    if (!config.isActive) {
      return { success: false, error: 'Stake configuration is not active' };
    }

    // Validate amount
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

    // Create stake
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
 * Submit transaction hash for a pending stake
 * Moves stake from PENDING to VERIFYING status
 */
export async function submitStakeTxHash(
  stakeId: string,
  txHash: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get stake
    const stake = await getStakeById(stakeId);
    if (!stake) {
      return { success: false, error: 'Stake not found' };
    }

    // Validate status
    if (stake.status !== StakeStatus.PENDING) {
      return {
        success: false,
        error: 'Stake must be in PENDING status to submit transaction hash',
      };
    }

    // Update stake with txHash and move to VERIFYING
    await updateStakeTxHash(stakeId, txHash);
    await updateStakeStatus(stakeId, StakeStatus.VERIFYING);

    return { success: true };
  } catch (error) {
    console.error('Error submitting stake txHash:', error);
    return { success: false, error: 'Failed to submit transaction hash' };
  }
}

/**
 * Activate a verified stake
 * Moves stake from VERIFYING to ACTIVE status
 * Sets startDate and endDate based on config
 */
export async function activateStake(
  stakeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get stake
    const stake = await getStakeById(stakeId);
    if (!stake) {
      return { success: false, error: 'Stake not found' };
    }

    // Validate status
    if (stake.status !== StakeStatus.VERIFYING) {
      return {
        success: false,
        error: 'Stake must be in VERIFYING status to activate',
      };
    }

    // Get config to calculate end date
    const config = await getStakeConfig(stake.stakeConfigId);
    if (!config) {
      return { success: false, error: 'Stake configuration not found' };
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + config.durationMonths);

    // Update stake to ACTIVE with dates
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
 * Moves stake from ACTIVE to COMPLETED status
 */
export async function completeStake(
  stakeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get stake
    const stake = await getStakeById(stakeId);
    if (!stake) {
      return { success: false, error: 'Stake not found' };
    }

    // Validate status
    if (stake.status !== StakeStatus.ACTIVE) {
      return {
        success: false,
        error: 'Stake must be in ACTIVE status to complete',
      };
    }

    // Check if stake has reached end date
    const now = new Date();
    const endDate = new Date(stake.endDate);
    if (now < endDate) {
      return {
        success: false,
        error: 'Stake has not reached its end date yet',
      };
    }

    // Update stake to COMPLETED
    await updateStakeStatus(stakeId, StakeStatus.COMPLETED);

    return { success: true };
  } catch (error) {
    console.error('Error completing stake:', error);
    return { success: false, error: 'Failed to complete stake' };
  }
}
