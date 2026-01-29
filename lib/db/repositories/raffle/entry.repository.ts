import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../../client';
import type { EntryItem, CreateEntryInput } from '../../models';

export class EntryRepository {
  /**
   * Create a new entry
   */
  async create(input: CreateEntryInput): Promise<EntryItem> {
    const item: EntryItem = {
      ...input,
      entryId: crypto.randomUUID(),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    await db.send(new PutCommand({
      TableName: TABLE.ENTRIES,
      Item: item
    }));
    return item;
  }

  /**
   * Get entry by ID
   */
  async getById(entryId: string): Promise<EntryItem | null> {
    const { Item } = await db.send(new GetCommand({
      TableName: TABLE.ENTRIES,
      Key: { entryId },
    }));
    return (Item as EntryItem) ?? null;
  }

  /**
   * Get all entries for a raffle
   * Uses: raffleId-createdAt-index GSI
   */
  async getByRaffle(raffleId: string, limit = 50, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.ENTRIES,
      IndexName: 'raffleId-createdAt-index',
      KeyConditionExpression: '#raffleId = :raffleId',
      ExpressionAttributeNames: { '#raffleId': 'raffleId' },
      ExpressionAttributeValues: { ':raffleId': raffleId },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as EntryItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  /**
   * Get all entries for a user across all raffles
   * Uses: walletAddress-createdAt-index GSI
   */
  async getByUser(walletAddress: string, limit = 50, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.ENTRIES,
      IndexName: 'walletAddress-createdAt-index',
      KeyConditionExpression: '#walletAddress = :addr',
      ExpressionAttributeNames: { '#walletAddress': 'walletAddress' },
      ExpressionAttributeValues: { ':addr': walletAddress },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as EntryItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  /**
   * Get user's entries for a specific raffle
   * Note: Requires filtering since we don't have a compound GSI
   */
  async getUserEntriesForRaffle(raffleId: string, walletAddress: string): Promise<EntryItem[]> {
    const { Items } = await db.send(new QueryCommand({
      TableName: TABLE.ENTRIES,
      IndexName: 'raffleId-createdAt-index',
      KeyConditionExpression: '#raffleId = :raffleId',
      FilterExpression: '#walletAddress = :addr',
      ExpressionAttributeNames: {
        '#raffleId': 'raffleId',
        '#walletAddress': 'walletAddress'
      },
      ExpressionAttributeValues: {
        ':raffleId': raffleId,
        ':addr': walletAddress
      },
    }));
    return (Items as EntryItem[]) ?? [];
  }

  /**
   * Count total entries for a raffle
   * Uses: raffleId-createdAt-index GSI
   */
  async countByRaffle(raffleId: string): Promise<number> {
    const { Count } = await db.send(new QueryCommand({
      TableName: TABLE.ENTRIES,
      IndexName: 'raffleId-createdAt-index',
      KeyConditionExpression: '#raffleId = :raffleId',
      ExpressionAttributeNames: { '#raffleId': 'raffleId' },
      ExpressionAttributeValues: { ':raffleId': raffleId },
      Select: 'COUNT',
    }));
    return Count ?? 0;
  }

  /**
   * Update entry status
   */
  async updateStatus(entryId: string, status: EntryItem['status']): Promise<void> {
    await db.send(new UpdateCommand({
      TableName: TABLE.ENTRIES,
      Key: { entryId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
    }));
  }
}
