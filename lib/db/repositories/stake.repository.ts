// Stake Repository
// Responsibilities:
// - CRUD operations for stakes
// - Query stakes by userId, status, and txHash
// - Update stake status and transaction hash

import { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@/lib/db/dynamodb';
import { env } from '@/lib/env';
import { Stake, StakeStatus } from '@/lib/db/models/stake.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new stake
 */
export async function createStake(data: {
  userId: string;
  stakeConfigId: string;
  amount: number;
  txHash?: string;
}): Promise<Stake> {
  const stakeId = uuidv4();
  const now = new Date().toISOString();

  const stake: Stake = {
    stakeId,
    userId: data.userId,
    stakeConfigId: data.stakeConfigId,
    amount: data.amount,
    startDate: '', // Will be set when status becomes ACTIVE
    endDate: '', // Will be set when status becomes ACTIVE
    status: StakeStatus.PENDING,
    txHash: data.txHash,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: env.DYNAMODB_STAKES_TABLE,
      Item: stake,
      ConditionExpression: 'attribute_not_exists(stakeId)',
    })
  );

  return stake;
}

/**
 * Get stake by stakeId
 */
export async function getStakeById(stakeId: string): Promise<Stake | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: env.DYNAMODB_STAKES_TABLE,
      Key: { stakeId },
    })
  );

  return (result.Item as Stake) || null;
}

/**
 * Get all stakes for a user (sorted by creation date)
 * Automatically handles pagination to fetch all items
 */
export async function getStakesByUserId(userId: string): Promise<Stake[]> {
  const stakes: Stake[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_STAKES_TABLE,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Sort descending (newest first)
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (result.Items) {
      stakes.push(...(result.Items as Stake[]));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return stakes;
}

/**
 * Get stakes by status (sorted by creation date)
 * Useful for admin to see all pending/verifying stakes
 * Automatically handles pagination to fetch all items
 */
export async function getStakesByStatus(status: StakeStatus): Promise<Stake[]> {
  const stakes: Stake[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_STAKES_TABLE,
        IndexName: 'status-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status', // 'status' is a reserved word
        },
        ExpressionAttributeValues: {
          ':status': status,
        },
        ScanIndexForward: false, // Sort descending (newest first)
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    if (result.Items) {
      stakes.push(...(result.Items as Stake[]));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return stakes;
}

/**
 * Get stake by transaction hash
 * Used for blockchain verification
 */
export async function getStakeByTxHash(txHash: string): Promise<Stake | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: env.DYNAMODB_STAKES_TABLE,
      IndexName: 'txHash-index',
      KeyConditionExpression: 'txHash = :txHash',
      ExpressionAttributeValues: {
        ':txHash': txHash,
      },
      Limit: 1,
    })
  );

  return (result.Items?.[0] as Stake) || null;
}

/**
 * Update stake status
 */
export async function updateStakeStatus(
  stakeId: string,
  status: StakeStatus,
  startDate?: string,
  endDate?: string
): Promise<void> {
  const now = new Date().toISOString();

  // Build update expression dynamically
  let updateExpression = 'SET #status = :status, updatedAt = :now';
  const expressionAttributeNames: Record<string, string> = {
    '#status': 'status',
  };
  const expressionAttributeValues: Record<string, any> = {
    ':status': status,
    ':now': now,
  };

  if (startDate) {
    updateExpression += ', startDate = :startDate';
    expressionAttributeValues[':startDate'] = startDate;
  }

  if (endDate) {
    updateExpression += ', endDate = :endDate';
    expressionAttributeValues[':endDate'] = endDate;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: env.DYNAMODB_STAKES_TABLE,
      Key: { stakeId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

/**
 * Update stake transaction hash
 */
export async function updateStakeTxHash(stakeId: string, txHash: string): Promise<void> {
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: env.DYNAMODB_STAKES_TABLE,
      Key: { stakeId },
      UpdateExpression: 'SET txHash = :txHash, updatedAt = :now',
      ExpressionAttributeValues: {
        ':txHash': txHash,
        ':now': now,
      },
    })
  );
}

/**
 * Delete a stake by stakeId (used for cleanup of abandoned PENDING stakes)
 */
export async function deleteStake(stakeId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: env.DYNAMODB_STAKES_TABLE,
      Key: { stakeId },
    })
  );
}
