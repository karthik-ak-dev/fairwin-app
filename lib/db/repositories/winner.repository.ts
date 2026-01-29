import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../client';
import type { WinnerItem, CreateWinnerInput } from '../models';

export class WinnerRepository {
  async create(input: CreateWinnerInput): Promise<WinnerItem> {
    const item: WinnerItem = {
      ...input,
      createdAt: new Date().toISOString(),
    };
    await db.send(new PutCommand({ TableName: TABLE.WINNERS, Item: item }));
    return item;
  }

  async getByRaffle(raffleId: string): Promise<WinnerItem[]> {
    const { Items } = await db.send(new QueryCommand({
      TableName: TABLE.WINNERS,
      KeyConditionExpression: 'raffleId = :raffleId',
      ExpressionAttributeValues: { ':raffleId': raffleId },
      ScanIndexForward: true,
    }));
    return (Items as WinnerItem[]) ?? [];
  }

  async getByUser(walletAddress: string, limit = 50, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.WINNERS,
      IndexName: 'walletAddress-createdAt-index',
      KeyConditionExpression: 'walletAddress = :addr',
      ExpressionAttributeValues: { ':addr': walletAddress },
      Limit: limit,
      ScanIndexForward: false,
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as WinnerItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  async updatePayout(raffleId: string, rank: number, txHash: string): Promise<void> {
    await db.send(new UpdateCommand({
      TableName: TABLE.WINNERS,
      Key: { raffleId, rank },
      UpdateExpression: 'SET transactionHash = :txHash, paidAt = :paidAt',
      ExpressionAttributeValues: {
        ':txHash': txHash,
        ':paidAt': new Date().toISOString(),
      },
    }));
  }
}
