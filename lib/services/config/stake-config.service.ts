// StakeConfig Service Layer
// Business logic for stake configuration operations

import { getStakeConfigById } from '@/lib/db/repositories/stake-config.repository';
import { StakeConfig } from '@/lib/db/models/stake-config.model';
import { constants } from '@/lib/constants';

/**
 * Get stake configuration by ID
 * Returns null if not found
 */
export async function getStakeConfig(stakeConfigId: string): Promise<StakeConfig | null> {
  try {
    const config = await getStakeConfigById(stakeConfigId);
    return config;
  } catch (error) {
    console.error('Error fetching stake config:', error);
    return null;
  }
}

/**
 * Get the default stake configuration
 * Returns null if not found
 */
export async function getDefaultStakeConfig(): Promise<StakeConfig | null> {
  return getStakeConfig(constants.DEFAULT_STAKE_CONFIG_ID);
}

/**
 * Validate if a stake config exists and is active
 */
export async function isValidStakeConfig(stakeConfigId: string): Promise<boolean> {
  const config = await getStakeConfig(stakeConfigId);
  return config !== null && config.isActive;
}
