import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../client';
import type { PlatformStatsItem } from '../models';

const STATS_KEY = { raffleId: 'PLATFORM_STATS' } as const;

export class StatsRepository {
  async get(): Promise<PlatformStatsItem | null> {
    const { Item } = await db.send(new GetCommand({
      TableName: TABLE.RAFFLES,
      Key: STATS_KEY,
    }));
    return (Item as PlatformStatsItem) ?? null;
  }

  async incrementEntryStats(amount: number, isNewPlayer: boolean): Promise<void> {
    let expr = 'ADD totalEntries :one, totalRevenue :amount';
    const values: Record<string, any> = { ':one': 1, ':amount': amount };

    if (isNewPlayer) {
      expr += ', totalPlayers :playerOne';
      values[':playerOne'] = 1;
    }

    // Ensure item exists with if_not_exists defaults
    await db.send(new UpdateCommand({
      TableName: TABLE.RAFFLES,
      Key: STATS_KEY,
      UpdateExpression: `SET totalRevenue = if_not_exists(totalRevenue, :zero), totalEntries = if_not_exists(totalEntries, :zero), totalPlayers = if_not_exists(totalPlayers, :zero), totalRaffles = if_not_exists(totalRaffles, :zero), totalPaidOut = if_not_exists(totalPaidOut, :zero), totalWinners = if_not_exists(totalWinners, :zero) ${expr}`,
      ExpressionAttributeValues: { ...values, ':zero': 0 },
    }));
  }

  async incrementWinStats(payoutAmount: number): Promise<void> {
    await db.send(new UpdateCommand({
      TableName: TABLE.RAFFLES,
      Key: STATS_KEY,
      UpdateExpression: 'SET totalPaidOut = if_not_exists(totalPaidOut, :zero), totalWinners = if_not_exists(totalWinners, :zero) ADD totalPaidOut :amount, totalWinners :one',
      ExpressionAttributeValues: { ':amount': payoutAmount, ':one': 1, ':zero': 0 },
    }));
  }

  async incrementRaffleCount(): Promise<void> {
    await db.send(new UpdateCommand({
      TableName: TABLE.RAFFLES,
      Key: STATS_KEY,
      UpdateExpression: 'SET totalRaffles = if_not_exists(totalRaffles, :zero) ADD totalRaffles :one',
      ExpressionAttributeValues: { ':one': 1, ':zero': 0 },
    }));
  }
}
