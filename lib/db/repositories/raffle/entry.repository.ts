import { PutCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
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
   * Update entry (generic update)
   */
  async update(entryId: string, updates: Partial<EntryItem>): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value], index) => {
      const placeholder = `#attr${index}`;
      const valuePlaceholder = `:val${index}`;
      updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
      expressionAttributeNames[placeholder] = key;
      expressionAttributeValues[valuePlaceholder] = value;
    });

    // Always update updatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await db.send(new UpdateCommand({
      TableName: TABLE.ENTRIES,
      Key: { entryId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }));
  }

  /**
   * Find entry by transaction hash (for deduplication)
   * Note: Uses Scan - optimize with GSI if needed
   */
  async findByTransactionHash(transactionHash: string): Promise<EntryItem | null> {
    const { Items } = await db.send(new ScanCommand({
      TableName: TABLE.ENTRIES,
      FilterExpression: 'transactionHash = :txHash',
      ExpressionAttributeValues: { ':txHash': transactionHash },
      Limit: 1,
    }));
    return (Items?.[0] as EntryItem) ?? null;
  }

  /**
   * Update entry source field (for marking platform entries as 'BOTH')
   */
  async updateSource(entryId: string, source: 'PLATFORM' | 'DIRECT_CONTRACT' | 'BOTH'): Promise<void> {
    await this.update(entryId, { source });
  }

  /**
   * Get all entries for a raffle (no pagination, for stats)
   */
  async findByRaffleId(raffleId: string): Promise<EntryItem[]> {
    const allItems: EntryItem[] = [];
    let exclusiveStartKey: Record<string, any> | undefined;

    let hasMore = true;
    while (hasMore) {
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
      hasMore = !!LastEvaluatedKey;
    }

    return allItems;
  }

  /**
   * Count unique participants in a raffle
   */
  async countUniqueParticipants(raffleId: string): Promise<number> {
    const entries = await this.findByRaffleId(raffleId);
    const uniqueWallets = new Set(entries.map(e => e.walletAddress.toLowerCase()));
    return uniqueWallets.size;
  }

  /**
   * Check if user has entered a specific raffle
   */
  async hasUserEnteredRaffle(walletAddress: string, raffleId: string): Promise<boolean> {
    const entries = await this.getUserEntriesForRaffle(raffleId, walletAddress);
    return entries.length > 0;
  }

  /**
   * Get total entries for a user in a specific raffle
   */
  async getUserEntriesInRaffle(walletAddress: string, raffleId: string): Promise<number> {
    const entries = await this.getUserEntriesForRaffle(raffleId, walletAddress);
    return entries.reduce((sum, e) => sum + e.numEntries, 0);
  }

  /**
   * Mark multiple entries as refunded (batch operation)
   */
  async markAsRefunded(entryIds: string[]): Promise<void> {
    // DynamoDB doesn't support batch updates, so we update one by one
    // For better performance, could use Promise.all but keeping sequential for safety
    for (const entryId of entryIds) {
      await this.update(entryId, { status: 'refunded' });
    }
  }
}
