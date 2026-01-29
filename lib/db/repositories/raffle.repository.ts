import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../client';
import type { RaffleItem, CreateRaffleInput } from '../models';

export class RaffleRepository {
  async getById(raffleId: string): Promise<RaffleItem | null> {
    const { Item } = await db.send(new GetCommand({
      TableName: TABLE.RAFFLES,
      Key: { raffleId },
    }));
    return (Item as RaffleItem) ?? null;
  }

  async getByStatus(status: string, limit = 20, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.RAFFLES,
      IndexName: 'status-endTime-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      Limit: limit,
      ScanIndexForward: false,
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as RaffleItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  async getByType(type: string, limit = 20, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.RAFFLES,
      IndexName: 'type-createdAt-index',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':type': type },
      Limit: limit,
      ScanIndexForward: false,
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as RaffleItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  async create(input: CreateRaffleInput): Promise<RaffleItem> {
    const now = new Date().toISOString();
    const item = {
      raffleId: crypto.randomUUID(),
      ...input,
      status: 'scheduled' as const,
      totalEntries: 0,
      totalParticipants: 0,
      prizePool: 0,
      protocolFee: 0,
      winnerPayout: 0,
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
      createdAt: now,
      updatedAt: now,
    };
    await db.send(new PutCommand({ TableName: TABLE.RAFFLES, Item: item }));
    return item;
  }

  async update(raffleId: string, updates: Partial<RaffleItem>): Promise<void> {
    const entries = Object.entries({ ...updates, updatedAt: new Date().toISOString() });
    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};

    entries.forEach(([key, val]) => {
      expressions.push(`#${key} = :${key}`);
      names[`#${key}`] = key;
      values[`:${key}`] = val;
    });

    await db.send(new UpdateCommand({
      TableName: TABLE.RAFFLES,
      Key: { raffleId },
      UpdateExpression: `SET ${expressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }));
  }

  async incrementEntries(raffleId: string, numEntries: number, amount: number, isNewParticipant: boolean): Promise<void> {
    const updateExpr = isNewParticipant
      ? 'SET updatedAt = :now ADD totalEntries :entries, prizePool :amount, totalParticipants :one'
      : 'SET updatedAt = :now ADD totalEntries :entries, prizePool :amount';

    await db.send(new UpdateCommand({
      TableName: TABLE.RAFFLES,
      Key: { raffleId },
      UpdateExpression: updateExpr,
      ExpressionAttributeValues: {
        ':entries': numEntries,
        ':amount': amount,
        ':now': new Date().toISOString(),
        ...(isNewParticipant && { ':one': 1 }),
      },
    }));
  }
}
