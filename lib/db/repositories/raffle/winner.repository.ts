import { PutCommand, QueryCommand, UpdateCommand, GetCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../../client';
import type { WinnerItem, CreateWinnerInput } from '../../models';
import { PayoutStatus } from '../../models';
import { pagination } from '@/lib/constants';

export class WinnerRepository {
  /**
   * Create a new winner record
   */
  async create(input: CreateWinnerInput): Promise<WinnerItem> {
    const now = new Date().toISOString();
    const item: WinnerItem = {
      ...input,
      winnerId: crypto.randomUUID(),
      payoutStatus: input.payoutStatus || PayoutStatus.PENDING,
      createdAt: now,
      updatedAt: now,
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
    const { Item } = await db.send(new GetCommand({
      TableName: TABLE.WINNERS,
      Key: { winnerId },
    }));
    return (Item as WinnerItem) ?? null;
  }

  /**
   * Batch create winner records (optimized for draw operations)
   */
  async batchCreate(inputs: CreateWinnerInput[]): Promise<WinnerItem[]> {
    const now = new Date().toISOString();
    const items: WinnerItem[] = inputs.map(input => ({
      ...input,
      winnerId: crypto.randomUUID(),
      payoutStatus: input.payoutStatus || PayoutStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    }));

    // DynamoDB BatchWriteItem has 25 item limit, so chunk if needed
    const chunks: WinnerItem[][] = [];
    for (let i = 0; i < items.length; i += 25) {
      chunks.push(items.slice(i, i + 25));
    }

    // Execute all batch writes in parallel
    await Promise.all(
      chunks.map(chunk =>
        db.send(new BatchWriteCommand({
          RequestItems: {
            [TABLE.WINNERS]: chunk.map(item => ({
              PutRequest: { Item: item }
            }))
          }
        }))
      )
    );

    return items;
  }

  /**
   * Update payout status for a winner
   */
  async updatePayoutStatus(
    winnerId: string,
    status: PayoutStatus,
    transactionHash?: string,
    error?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const updateParts: string[] = ['payoutStatus = :status', 'updatedAt = :now'];
    const expressionValues: Record<string, any> = {
      ':status': status,
      ':now': now,
    };

    if (transactionHash) {
      updateParts.push('payoutTransactionHash = :hash');
      expressionValues[':hash'] = transactionHash;
    }

    // Set processedAt when status becomes 'paid'
    if (status === PayoutStatus.PAID) {
      updateParts.push('payoutProcessedAt = :processedAt');
      expressionValues[':processedAt'] = now;
    }

    if (error) {
      updateParts.push('payoutError = :error');
      expressionValues[':error'] = error;
    }

    await db.send(new UpdateCommand({
      TableName: TABLE.WINNERS,
      Key: { winnerId },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
    }));
  }

  /**
   * Get all winners by payout status (pending, paid, failed, processing)
   * Uses: payoutStatus-createdAt-index GSI
   */
  async getByPayoutStatus(status: PayoutStatus, limit = pagination.USER_LIST_LIMIT, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.WINNERS,
      IndexName: 'payoutStatus-createdAt-index',
      KeyConditionExpression: '#payoutStatus = :status',
      ExpressionAttributeNames: { '#payoutStatus': 'payoutStatus' },
      ExpressionAttributeValues: { ':status': status },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as WinnerItem[]) ?? [], lastKey: LastEvaluatedKey };
  }
}
