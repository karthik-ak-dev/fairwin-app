// Withdrawal Repository
// Responsibilities:
// - CRUD operations for withdrawals
// - Query withdrawals by userId and status
// - Update withdrawal status, txHash, and timestamps

import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '@/lib/db/dynamodb';
import { env } from '@/lib/env';
import { Withdrawal, WithdrawalStatus } from '@/lib/db/models/withdrawal.model';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new withdrawal record
 */
export async function createWithdrawal(data: {
  userId: string;
  amount: number;
  walletAddress: string;
}): Promise<Withdrawal> {
  const withdrawalId = uuidv4();
  const now = new Date().toISOString();

  const withdrawal: Withdrawal = {
    withdrawalId,
    userId: data.userId,
    amount: data.amount,
    walletAddress: data.walletAddress,
    status: WithdrawalStatus.PENDING,
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: env.DYNAMODB_WITHDRAWALS_TABLE,
      Item: withdrawal,
      ConditionExpression: 'attribute_not_exists(withdrawalId)',
    })
  );

  return withdrawal;
}

/**
 * Get withdrawal by withdrawalId
 */
export async function getWithdrawalById(withdrawalId: string): Promise<Withdrawal | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: env.DYNAMODB_WITHDRAWALS_TABLE,
      Key: { withdrawalId },
    })
  );

  return (result.Item as Withdrawal) || null;
}

/**
 * Get all withdrawals for a user (sorted by request date)
 * Automatically handles pagination to fetch all items
 */
export async function getWithdrawalsByUserId(userId: string): Promise<Withdrawal[]> {
  const withdrawals: Withdrawal[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_WITHDRAWALS_TABLE,
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
      withdrawals.push(...(result.Items as Withdrawal[]));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return withdrawals;
}

/**
 * Get withdrawals by status (sorted by request date)
 * Useful for admin to see all pending/processing withdrawals
 * Automatically handles pagination to fetch all items
 */
export async function getWithdrawalsByStatus(status: WithdrawalStatus): Promise<Withdrawal[]> {
  const withdrawals: Withdrawal[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: env.DYNAMODB_WITHDRAWALS_TABLE,
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
      withdrawals.push(...(result.Items as Withdrawal[]));
    }

    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return withdrawals;
}

/**
 * Update withdrawal status
 */
export async function updateWithdrawalStatus(
  withdrawalId: string,
  status: WithdrawalStatus,
  processedAt?: string,
  completedAt?: string,
  failureReason?: string
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

  if (processedAt) {
    updateExpression += ', processedAt = :processedAt';
    expressionAttributeValues[':processedAt'] = processedAt;
  }

  if (completedAt) {
    updateExpression += ', completedAt = :completedAt';
    expressionAttributeValues[':completedAt'] = completedAt;
  }

  if (failureReason) {
    updateExpression += ', failureReason = :failureReason';
    expressionAttributeValues[':failureReason'] = failureReason;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: env.DYNAMODB_WITHDRAWALS_TABLE,
      Key: { withdrawalId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

/**
 * Update withdrawal transaction hash and move to PROCESSING status
 */
export async function updateWithdrawalTxHash(withdrawalId: string, txHash: string): Promise<void> {
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: env.DYNAMODB_WITHDRAWALS_TABLE,
      Key: { withdrawalId },
      UpdateExpression: 'SET txHash = :txHash, #status = :status, processedAt = :now, updatedAt = :now',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':txHash': txHash,
        ':status': WithdrawalStatus.PROCESSING,
        ':now': now,
      },
    })
  );
}
