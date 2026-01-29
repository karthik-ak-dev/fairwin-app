import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../client';
import type { EntryItem, CreateEntryInput } from '../models';

export class EntryRepository {
  async create(input: CreateEntryInput): Promise<EntryItem> {
    const item: EntryItem = {
      ...input,
      entryId: crypto.randomUUID(),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    await db.send(new PutCommand({ TableName: TABLE.ENTRIES, Item: item }));
    return item;
  }

  async getByRaffle(raffleId: string, limit = 50, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.ENTRIES,
      KeyConditionExpression: 'raffleId = :raffleId',
      ExpressionAttributeValues: { ':raffleId': raffleId },
      Limit: limit,
      ScanIndexForward: false,
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as EntryItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  async getByUser(walletAddress: string, limit = 50, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.ENTRIES,
      IndexName: 'walletAddress-createdAt-index',
      KeyConditionExpression: 'walletAddress = :addr',
      ExpressionAttributeValues: { ':addr': walletAddress },
      Limit: limit,
      ScanIndexForward: false,
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as EntryItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  async getUserEntriesForRaffle(raffleId: string, walletAddress: string): Promise<EntryItem[]> {
    const { Items } = await db.send(new QueryCommand({
      TableName: TABLE.ENTRIES,
      IndexName: 'raffleId-walletAddress-index',
      KeyConditionExpression: 'raffleId = :raffleId AND walletAddress = :addr',
      ExpressionAttributeValues: { ':raffleId': raffleId, ':addr': walletAddress },
    }));
    return (Items as EntryItem[]) ?? [];
  }

  async countByRaffle(raffleId: string): Promise<number> {
    const { Count } = await db.send(new QueryCommand({
      TableName: TABLE.ENTRIES,
      KeyConditionExpression: 'raffleId = :raffleId',
      ExpressionAttributeValues: { ':raffleId': raffleId },
      Select: 'COUNT',
    }));
    return Count ?? 0;
  }
}
