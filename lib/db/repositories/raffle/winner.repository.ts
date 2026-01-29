import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../../client';
import type { WinnerItem, CreateWinnerInput } from '../../models';

export class WinnerRepository {
  /**
   * Create a new winner record
   */
  async create(input: CreateWinnerInput): Promise<WinnerItem> {
    const item: WinnerItem = {
      ...input,
      winnerId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await db.send(new PutCommand({
      TableName: TABLE.WINNERS,
      Item: item
    }));
    return item;
  }

  /**
   * Get winner by ID
   */
  async getById(winnerId: string): Promise<WinnerItem | null> {
    const { Item } = await db.send(new GetCommand({
      TableName: TABLE.WINNERS,
      Key: { winnerId },
    }));
    return (Item as WinnerItem) ?? null;
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
  async getByUser(walletAddress: string, limit = 50, startKey?: Record<string, any>) {
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
   * Update winner with payout transaction hash
   */
  async updatePayout(winnerId: string, txHash: string): Promise<void> {
    await db.send(new UpdateCommand({
      TableName: TABLE.WINNERS,
      Key: { winnerId },
      UpdateExpression: 'SET transactionHash = :txHash',
      ExpressionAttributeValues: {
        ':txHash': txHash,
      },
    }));
  }

  /**
   * Count total winners for a raffle
   */
  async countByRaffle(raffleId: string): Promise<number> {
    const { Count } = await db.send(new QueryCommand({
      TableName: TABLE.WINNERS,
      IndexName: 'raffleId-createdAt-index',
      KeyConditionExpression: '#raffleId = :raffleId',
      ExpressionAttributeNames: { '#raffleId': 'raffleId' },
      ExpressionAttributeValues: { ':raffleId': raffleId },
      Select: 'COUNT',
    }));
    return Count ?? 0;
  }
}
