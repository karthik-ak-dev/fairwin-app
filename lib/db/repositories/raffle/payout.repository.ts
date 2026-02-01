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
   * Get all payouts for a winner
   * Uses: winnerId-createdAt-index GSI
   */
  async getByWinner(winnerId: string, limit = pagination.USER_LIST_LIMIT, startKey?: Record<string, any>) {
    const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
      TableName: TABLE.PAYOUTS,
      IndexName: 'winnerId-createdAt-index',
      KeyConditionExpression: '#winnerId = :winnerId',
      ExpressionAttributeNames: { '#winnerId': 'winnerId' },
      ExpressionAttributeValues: { ':winnerId': winnerId },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
      ...(startKey && { ExclusiveStartKey: startKey }),
    }));
    return { items: (Items as PayoutItem[]) ?? [], lastKey: LastEvaluatedKey };
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

  /**
   * Update payout status and optionally add transaction hash
   */
  async updateStatus(
    payoutId: string,
    status: PayoutItem['status'],
    txHash?: string,
    error?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    let expr = 'SET #status = :status, updatedAt = :now';
    const names: Record<string, string> = { '#status': 'status' };
    const values: Record<string, any> = { ':status': status, ':now': now };

    if (txHash) {
      expr += ', transactionHash = :txHash, processedAt = :now';
      values[':txHash'] = txHash;
    }

    if (error) {
      expr += ', #error = :error';
      names['#error'] = 'error';
      values[':error'] = error;
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
