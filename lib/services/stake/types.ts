// Stake Service Types
// Shared types used across stake services

import { Stake } from '@/lib/db/models/stake.model';
import { StakeConfig } from '@/lib/db/models/stake-config.model';

/**
 * Enriched stake with config and calculated fields
 */
export interface EnrichedStake extends Stake {
  config: StakeConfig;
  currentEarnings: number;
  isCompleted: boolean;
}
