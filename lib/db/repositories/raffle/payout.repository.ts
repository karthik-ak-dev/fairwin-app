import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../../client';
import type { PayoutItem, CreatePayoutInput } from '../../models';
import { pagination } from '@/lib/constants';

export class PayoutRepository {
  /**
   * Create a new payout record
   */
  async create(input: CreatePayoutInput): Promise<PayoutItem> {
    const now = new Date().toISOString();
    const item: PayoutItem = {
      ...input,
      payoutId: crypto.randomUUID(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    await db.send(new PutCommand({
      TableName: TABLE.PAYOUTS,
      Item: item
    }));
    return item;
  }

  /**
   * Get all payouts by status (pending, paid, failed)
   * Uses: status-createdAt-index GSI
   */
  async getByStatus(status: PayoutItem['status'], limit = pagination.USER_LIST_LIMIT, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.PAYOUTS,
      IndexName: 'status-createdAt-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as PayoutItem[]) ?? [], lastKey: LastEvaluatedKey };
  }
}
