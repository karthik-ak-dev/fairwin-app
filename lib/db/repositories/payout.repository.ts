import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../client';
import type { PayoutItem, CreatePayoutInput } from '../models';

export class PayoutRepository {
  async create(input: CreatePayoutInput): Promise<PayoutItem> {
    const now = new Date().toISOString();
    const item: PayoutItem = {
      ...input,
      payoutId: crypto.randomUUID(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    await db.send(new PutCommand({ TableName: TABLE.PAYOUTS, Item: item }));
    return item;
  }

  async getById(payoutId: string): Promise<PayoutItem | null> {
    const { Item } = await db.send(new GetCommand({
      TableName: TABLE.PAYOUTS,
      Key: { payoutId },
    }));
    return (Item as PayoutItem) ?? null;
  }

  async getByRaffle(raffleId: string, limit = 50, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.PAYOUTS,
      IndexName: 'raffleId-createdAt-index',
      KeyConditionExpression: 'raffleId = :raffleId',
      ExpressionAttributeValues: { ':raffleId': raffleId },
      Limit: limit,
      ScanIndexForward: false,
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as PayoutItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  async getByStatus(status: string, limit = 50, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.PAYOUTS,
      IndexName: 'status-createdAt-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      Limit: limit,
      ScanIndexForward: false,
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as PayoutItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  async getByUser(walletAddress: string, limit = 50, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.PAYOUTS,
      IndexName: 'walletAddress-createdAt-index',
      KeyConditionExpression: 'walletAddress = :addr',
      ExpressionAttributeValues: { ':addr': walletAddress },
      Limit: limit,
      ScanIndexForward: false,
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as PayoutItem[]) ?? [], lastKey: LastEvaluatedKey };
  }

  async updateStatus(payoutId: string, status: string, txHash?: string): Promise<void> {
    const now = new Date().toISOString();
    let expr = 'SET #status = :status, updatedAt = :now';
    const names: Record<string, string> = { '#status': 'status' };
    const values: Record<string, any> = { ':status': status, ':now': now };

    if (txHash) {
      expr += ', transactionHash = :txHash';
      values[':txHash'] = txHash;
    }

    await db.send(new UpdateCommand({
      TableName: TABLE.PAYOUTS,
      Key: { payoutId },
      UpdateExpression: expr,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }));
  }
}
