import { PutCommand, QueryCommand, UpdateCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../../client';
import type { EntryItem, CreateEntryInput } from '../../models';
import { EntryStatus } from '../../models';
import { buildUpdateExpression } from '../../utils/dynamodb';

export class EntryRepository {
  /**
   * Create a new entry
   */
  async create(input: CreateEntryInput): Promise<EntryItem> {
    const item: EntryItem = {
      ...input,
      entryId: crypto.randomUUID(),
      status: EntryStatus.CONFIRMED,
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
   * Get all entries for a raffle (with auto-pagination to fetch all)
   * Use this for operations that need complete data (winner selection, refunds, etc.)
   */
  async getByRaffleId(raffleId: string): Promise<EntryItem[]> {
    const allItems: EntryItem[] = [];
    let exclusiveStartKey: Record<string, any> | undefined;

    do {
      const { Items, LastEvaluatedKey } = await db.send(new QueryCommand({
        TableName: TABLE.ENTRIES,
        IndexName: 'raffleId-createdAt-index',
        KeyConditionExpression: '#raffleId = :raffleId',
        ExpressionAttributeNames: { '#raffleId': 'raffleId' },
        ExpressionAttributeValues: { ':raffleId': raffleId },
        ...(exclusiveStartKey && { ExclusiveStartKey: exclusiveStartKey }),
      }));

      if (Items && Items.length > 0) {
        allItems.push(...(Items as EntryItem[]));
      }

      exclusiveStartKey = LastEvaluatedKey;
    } while (exclusiveStartKey);

    return allItems;
  }

  /**
   * Get entries for a raffle (paginated)
   * Use this for displaying entry lists in UI
   */
  async getByRafflePaginated(
    raffleId: string,
    limit = 50,
    startKey?: Record<string, any>
  ) {
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
   * Get all entries for a user (paginated)
   */
  async getByUser(
    walletAddress: string,
    limit = 50,
    startKey?: Record<string, any>
  ) {
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
   */
  async getUserEntriesForRaffle(
    walletAddress: string,
    raffleId: string
  ): Promise<EntryItem[]> {
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
   * Find entry by transaction hash
   * Used to prevent replay attacks
   */
  async findByTransactionHash(transactionHash: string): Promise<EntryItem | null> {
    const { Items } = await db.send(new QueryCommand({
      TableName: TABLE.ENTRIES,
      IndexName: 'transactionHash-index',
      KeyConditionExpression: '#transactionHash = :hash',
      ExpressionAttributeNames: { '#transactionHash': 'transactionHash' },
      ExpressionAttributeValues: { ':hash': transactionHash },
      Limit: 1,
    }));
    return (Items?.[0] as EntryItem) ?? null;
  }

  /**
   * Update entry fields
   */
  async update(entryId: string, updates: Partial<EntryItem>): Promise<void> {
    const updateExpression = buildUpdateExpression(updates);

    await db.send(new UpdateCommand({
      TableName: TABLE.ENTRIES,
      Key: { entryId },
      ...updateExpression,
    }));
  }

  /**
   * Update entry status
   */
  async updateStatus(entryId: string, status: EntryStatus): Promise<void> {
    await this.update(entryId, { status });
  }

  /**
   * Batch update status for multiple entries
   */
  async batchUpdateStatus(entryIds: string[], status: EntryStatus): Promise<void> {
    await Promise.all(
      entryIds.map(entryId => this.updateStatus(entryId, status))
    );
  }

  /**
   * Get all entries created since a specific timestamp
   * Uses DynamoDB Scan with FilterExpression and auto-pagination
   *
   * @param sinceTimestamp - ISO 8601 timestamp (e.g., "2025-01-30T00:00:00.000Z")
   * @returns Array of entries created on or after the given timestamp
   */
  async getEntriesSince(sinceTimestamp: string): Promise<EntryItem[]> {
    const allItems: EntryItem[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const { Items, LastEvaluatedKey } = await db.send(new ScanCommand({
        TableName: TABLE.ENTRIES,
        FilterExpression: '#createdAt >= :sinceTimestamp',
        ExpressionAttributeNames: {
          '#createdAt': 'createdAt'
        },
        ExpressionAttributeValues: {
          ':sinceTimestamp': sinceTimestamp
        },
        ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
      }));

      if (Items && Items.length > 0) {
        allItems.push(...(Items as EntryItem[]));
      }

      lastEvaluatedKey = LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
  }
}
