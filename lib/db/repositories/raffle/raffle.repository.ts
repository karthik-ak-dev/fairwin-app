import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../../client';
import type { RaffleItem, CreateRaffleInput } from '../../models';
import { RaffleStatus } from '../../models';
import { pagination } from '@/lib/constants';

export class RaffleRepository {
  /**
   * Get raffle by ID
   */
  async getById(raffleId: string): Promise<RaffleItem | null> {
    const { Item } = await db.send(new GetCommand({
      TableName: TABLE.RAFFLES,
      Key: { raffleId },
    }));
    return (Item as RaffleItem) ?? null;
  }

  /**
   * Get raffles by status (paginated)
   */
  async getByStatus(status: string, limit = pagination.DEFAULT_LIMIT, startKey?: Record<string, any>) {
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

  /**
   * Get raffles by type (paginated)
   */
  async getByType(type: string, limit = pagination.DEFAULT_LIMIT, startKey?: Record<string, any>) {
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

  /**
   * Create a new raffle
   */
  async create(input: CreateRaffleInput): Promise<RaffleItem> {
    const now = new Date().toISOString();
    const item: RaffleItem = {
      raffleId: crypto.randomUUID(),
      ...input,
      // Service layer guarantees these optional fields are populated with defaults
      platformFeePercent: input.platformFeePercent!,
      prizeTiers: input.prizeTiers!,
      status: RaffleStatus.SCHEDULED,
      totalEntries: 0,
      totalParticipants: 0,
      prizePool: 0,
      protocolFee: 0,
      winnerPayout: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.send(new PutCommand({ TableName: TABLE.RAFFLES, Item: item }));
    return item;
  }

  /**
   * Update raffle fields and return the updated item
   */
  async update(raffleId: string, updates: Partial<RaffleItem>): Promise<RaffleItem> {
    const entries = Object.entries({ ...updates, updatedAt: new Date().toISOString() });
    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};

    entries.forEach(([key, val]) => {
      expressions.push(`#${key} = :${key}`);
      names[`#${key}`] = key;
      values[`:${key}`] = val;
    });

    const { Attributes } = await db.send(new UpdateCommand({
      TableName: TABLE.RAFFLES,
      Key: { raffleId },
      UpdateExpression: `SET ${expressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));

    return Attributes as RaffleItem;
  }
}
