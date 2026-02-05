// ReferralConfig Repository
// Responsibilities:
// - Fetch referral configurations from DynamoDB
// - Simple read-only operations (configs are managed via console)

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@/lib/db/dynamodb';
import { env } from '@/lib/env';
import { ReferralConfig } from '@/lib/db/models/referral-config.model';

/**
 * Get referral configuration by ID
 * Returns null if not found
 */
export async function getReferralConfigById(referralConfigId: string): Promise<ReferralConfig | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: env.DYNAMODB_REFERRAL_CONFIGS_TABLE,
      Key: { referralConfigId },
    })
  );

  return (result.Item as ReferralConfig) || null;
}
