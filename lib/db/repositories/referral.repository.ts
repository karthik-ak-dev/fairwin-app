// Referral Repository
// Responsibilities:
// - CRUD operations for referral commissions
// - Query commissions by referrerId (who earns) and stakeId
// - Create commission records when stakes become active

import { QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@/lib/db/dynamodb';
import { env } from '@/lib/env';
import { Referral } from '@/lib/db/models/referral.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create multiple referral commission records in batch
 * Used when a stake becomes active to create commissions for all upline levels
 */
export async function createReferralsBatch(
  referrals: Array<{
    referrerId: string;
    referredUserId: string;
    stakeId: string;
    level: number;
    stakeAmount: number;
    commissionRate: number;
    commissionAmount: number;
  }>
): Promise<Referral[]> {
  const now = new Date().toISOString();
  const createdReferrals: Referral[] = [];

  // DynamoDB BatchWrite has a limit of 25 items, but we have max 5 levels
  const items = referrals.map((data) => {
    const referralId = uuidv4();
    const referral: Referral = {
      referralId,
      referrerId: data.referrerId,
      referredUserId: data.referredUserId,
      stakeId: data.stakeId,
      level: data.level,
      stakeAmount: data.stakeAmount,
      commissionRate: data.commissionRate,
      commissionAmount: data.commissionAmount,
      createdAt: now,
      updatedAt: now,
    };
    createdReferrals.push(referral);
    return {
      PutRequest: {
        Item: referral,
      },
    };
  });

  if (items.length > 0) {
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [env.DYNAMODB_REFERRALS_TABLE]: items,
        },
      })
    );
  }

  return createdReferrals;
}

/**
 * Get all commissions earned by a user (sorted by creation date)
 * Automatically handles pagination to fetch all items
 */
export async function getReferralsByReferrerId(referrerId: string): Promise<Referral[]> {
  const referrals: Referral[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_REFERRALS_TABLE,
        IndexName: 'referrerId-index',
        KeyConditionExpression: 'referrerId = :referrerId',
        ExpressionAttributeValues: {
          ':referrerId': referrerId,
        },
        ScanIndexForward: false, // Sort descending (newest first)
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (result.Items) {
      referrals.push(...(result.Items as Referral[]));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return referrals;
}
