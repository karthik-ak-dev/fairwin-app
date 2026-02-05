// StakeConfig Repository
// Responsibilities:
// - Fetch stake configurations from DynamoDB
// - Simple read-only operations (configs are managed via console)

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@/lib/db/dynamodb';
import { env } from '@/lib/env';
import { StakeConfig } from '@/lib/db/models/stake-config.model';

/**
 * Get stake configuration by ID
 * Returns null if not found
 */
export async function getStakeConfigById(stakeConfigId: string): Promise<StakeConfig | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: env.DYNAMODB_STAKE_CONFIGS_TABLE,
      Key: { stakeConfigId },
    })
  );

  return (result.Item as StakeConfig) || null;
}
