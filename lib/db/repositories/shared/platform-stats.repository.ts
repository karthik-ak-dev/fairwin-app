import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../../client';
import type { PlatformStatsItem, StatsIncrements } from '../../models';

const STATS_KEY = { statId: 'global' } as const;

export class StatsRepository {
  /**
   * Get platform stats (single record with statId='global')
   */
  async get(): Promise<PlatformStatsItem | null> {
    const { Item } = await db.send(new GetCommand({
      TableName: TABLE.PLATFORM_STATS,
      Key: STATS_KEY,
    }));
    return (Item as PlatformStatsItem) ?? null;
  }

  /**
   * Initialize platform stats if they don't exist
   */
  async initialize(): Promise<PlatformStatsItem> {
    const now = new Date().toISOString();
    const item: PlatformStatsItem = {
      statId: 'global',
      totalRevenue: 0,
      totalPaidOut: 0,
      totalRaffles: 0,
      totalEntries: 0,
      totalUsers: 0,
      totalWinners: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.send(new PutCommand({
      TableName: TABLE.PLATFORM_STATS,
      Item: item,
      ConditionExpression: 'attribute_not_exists(statId)',
    })).catch((err: any) => {
      if (err.name === 'ConditionalCheckFailedException') {
        // Already exists, ignore
        return;
      }
      throw err;
    });

    return item;
  }

  /**
   * Get or create platform stats
   */
  async getOrCreate(): Promise<PlatformStatsItem> {
    const existing = await this.get();
    if (existing) return existing;
    return this.initialize();
  }

  /**
   * Increment multiple stats atomically
   */
  async increment(increments: StatsIncrements): Promise<void> {
    const expressions: string[] = [];
    const values: Record<string, any> = { ':now': new Date().toISOString() };

    Object.entries(increments).forEach(([key, value]) => {
      if (value !== undefined && value > 0) {
        expressions.push(`${key} :${key}`);
        values[`:${key}`] = value;
      }
    });

    if (expressions.length === 0) return;

    await db.send(new UpdateCommand({
      TableName: TABLE.PLATFORM_STATS,
      Key: STATS_KEY,
      UpdateExpression: `SET updatedAt = :now ADD ${expressions.join(', ')}`,
      ExpressionAttributeValues: values,
    }));
  }

  /**
   * Increment raffle count
   */
  async incrementRaffleCount(): Promise<void> {
    await this.increment({ totalRaffles: 1 });
  }

  /**
   * Update payout stats (complex nested object)
   */
  async updatePayoutStats(stats: PlatformStatsItem['payoutStats']): Promise<void> {
    await db.send(new UpdateCommand({
      TableName: TABLE.PLATFORM_STATS,
      Key: STATS_KEY,
      UpdateExpression: 'SET payoutStats = :stats, updatedAt = :now',
      ExpressionAttributeValues: {
        ':stats': stats,
        ':now': new Date().toISOString(),
      },
    }));
  }


  /**
   * Get last synced block number (for event sync)
   */
  async getLastSyncedBlock(): Promise<number> {
    const stats = await this.get();
    return stats?.lastSyncedBlock || 0;
  }

  /**
   * Update last synced block (for event sync)
   */
  async updateLastSyncedBlock(blockNumber: number, error?: string): Promise<void> {
    const updateExpression = error
      ? 'SET lastSyncedBlock = :block, lastSyncedAt = :timestamp, lastSyncError = :error, updatedAt = :updatedAt'
      : 'SET lastSyncedBlock = :block, lastSyncedAt = :timestamp, updatedAt = :updatedAt REMOVE lastSyncError';

    const expressionAttributeValues: Record<string, any> = {
      ':block': blockNumber,
      ':timestamp': new Date().toISOString(),
      ':updatedAt': new Date().toISOString(),
    };

    if (error) {
      expressionAttributeValues[':error'] = error;
    }

    await db.send(new UpdateCommand({
      TableName: TABLE.PLATFORM_STATS,
      Key: STATS_KEY,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    }));
  }

  /**
   * Record new entry (increment entry count and revenue)
   * Used by shared business logic
   */
  async recordEntry(totalPaid: number, isNewUser: boolean): Promise<void> {
    const protocolFee = totalPaid * 0.10;
    await this.increment({
      totalEntries: 1,
      totalRevenue: protocolFee,
      ...(isNewUser && { totalUsers: 1 }),
    });
  }

  /**
   * Record payout (increment payout count and amount)
   * Used by shared business logic
   */
  async recordPayout(totalPrize: number, winnerCount: number): Promise<void> {
    const stats = await this.getOrCreate();

    // Update main counters
    await this.increment({
      totalPaidOut: totalPrize,
      totalWinners: winnerCount,
    });

    // Update payoutStats nested object
    const updatedPayoutStats = {
      ...(stats.payoutStats || {}),
      totalPaid: (stats.payoutStats?.totalPaid || 0) + totalPrize,
      totalCount: (stats.payoutStats?.totalCount || 0) + winnerCount,
      avgPayout:
        ((stats.payoutStats?.totalPaid || 0) + totalPrize) /
        ((stats.payoutStats?.totalCount || 0) + winnerCount),
      // Keep other fields unchanged
      thisMonth: stats.payoutStats?.thisMonth || 0,
      thisWeek: stats.payoutStats?.thisWeek || 0,
      pendingCount: stats.payoutStats?.pendingCount || 0,
      failedCount: stats.payoutStats?.failedCount || 0,
    };

    await this.updatePayoutStats(updatedPayoutStats);
  }

}
