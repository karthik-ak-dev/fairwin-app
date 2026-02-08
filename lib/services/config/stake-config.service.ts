// StakeConfig Service Layer
// Business logic for stake configuration operations

import { getStakeConfigById } from '@/lib/db/repositories/stake-config.repository';
import { StakeConfig } from '@/lib/db/models/stake-config.model';

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
