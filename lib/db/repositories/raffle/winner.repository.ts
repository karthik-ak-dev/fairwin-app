import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../../client';
import type { WinnerItem, CreateWinnerInput } from '../../models';
import { pagination } from '@/lib/constants';

export class WinnerRepository {
  /**
   * Create a new winner record
   */
  async create(input: CreateWinnerInput): Promise<WinnerItem> {
    const item: WinnerItem = {
      ...input,
      winnerId: crypto.randomUUID(),
      payoutStatus: input.payoutStatus || 'pending',
      createdAt: new Date().toISOString(),
    };
    await db.send(new PutCommand({
      TableName: TABLE.WINNERS,
      Item: item
    }));
    return item;
  }

  /**
   * Get all winners for a raffle
   * Uses: raffleId-createdAt-index GSI
   */
  async getByRaffle(raffleId: string, limit = 100, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.WINNERS,
      IndexName: 'raffleId-createdAt-index',
      KeyConditionExpression: '#raffleId = :raffleId',
      ExpressionAttributeNames: { '#raffleId': 'raffleId' },
      ExpressionAttributeValues: { ':raffleId': raffleId },
      Limit: limit,
      ScanIndexForward: true, // Oldest first (order winners were selected)
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as WinnerItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  /**
   * Get all wins for a user across all raffles
   * Uses: walletAddress-createdAt-index GSI
   */
  async getByUser(walletAddress: string, limit = pagination.USER_LIST_LIMIT, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.WINNERS,
      IndexName: 'walletAddress-createdAt-index',
      KeyConditionExpression: '#walletAddress = :addr',
      ExpressionAttributeNames: { '#walletAddress': 'walletAddress' },
      ExpressionAttributeValues: { ':addr': walletAddress },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as WinnerItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  /**
   * Get a single winner by ID
   */
  async getById(winnerId: string): Promise<WinnerItem | null> {
    const { Items } = await db.send(new QueryCommand({
      TableName: TABLE.WINNERS,
      KeyConditionExpression: '#winnerId = :winnerId',
      ExpressionAttributeNames: { '#winnerId': 'winnerId' },
      ExpressionAttributeValues: { ':winnerId': winnerId },
      Limit: 1,
    }));
    return (Items?.[0] as WinnerItem) ?? null;
  }

  /**
   * Get recent winners across all raffles
   * Note: Uses Scan - consider adding GSI for production
   */
  async getRecent(limit = 100): Promise<WinnerItem[]> {
    const { Items } = await db.send(new QueryCommand({
      TableName: TABLE.WINNERS,
      Limit: limit,
      ScanIndexForward: false,
    }));
    return (Items as WinnerItem[]) ?? [];
  }

  /**
   * Update payout status for a winner
   */
  async updatePayoutStatus(
    winnerId: string,
    status: WinnerItem['payoutStatus'],
    transactionHash?: string
  ): Promise<void> {
    const updateExpression = transactionHash
      ? 'SET payoutStatus = :status, payoutTransactionHash = :hash, updatedAt = :now'
      : 'SET payoutStatus = :status, updatedAt = :now';

    const expressionValues: Record<string, any> = {
      ':status': status,
      ':now': new Date().toISOString(),
    };

    if (transactionHash) {
      expressionValues[':hash'] = transactionHash;
    }

    await db.send(new UpdateCommand({
      TableName: TABLE.WINNERS,
      Key: { winnerId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionValues,
    }));
  }
}
