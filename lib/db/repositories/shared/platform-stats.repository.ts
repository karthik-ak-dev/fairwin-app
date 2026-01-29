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
   * Increment entry stats (revenue + entry count + optionally user count)
   */
  async incrementEntryStats(amount: number, isNewUser: boolean): Promise<void> {
    await this.increment({
      totalEntries: 1,
      totalRevenue: amount,
      ...(isNewUser && { totalUsers: 1 }),
    });
  }

  /**
   * Increment raffle count
   */
  async incrementRaffleCount(): Promise<void> {
    await this.increment({ totalRaffles: 1 });
  }

  /**
   * Increment winner stats (winners + paid out)
   */
  async incrementWinnerStats(payoutAmount: number): Promise<void> {
    await this.increment({
      totalWinners: 1,
      totalPaidOut: payoutAmount,
    });
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
   * Update revenue by game (for multi-game support)
   */
  async updateRevenueByGame(game: string, amount: number): Promise<void> {
    await db.send(new UpdateCommand({
      TableName: TABLE.PLATFORM_STATS,
      Key: STATS_KEY,
      UpdateExpression: 'SET revenueByGame.#game = if_not_exists(revenueByGame.#game, :zero) + :amount, updatedAt = :now',
      ExpressionAttributeNames: {
        '#game': game,
      },
      ExpressionAttributeValues: {
        ':amount': amount,
        ':zero': 0,
        ':now': new Date().toISOString(),
      },
    }));
  }
}
