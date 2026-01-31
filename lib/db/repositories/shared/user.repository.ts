import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../../client';
import type { UserItem } from '../../models';

export class UserRepository {
  async getByAddress(walletAddress: string): Promise<UserItem | null> {
    const { Item } = await db.send(new GetCommand({
      TableName: TABLE.USERS,
      Key: { walletAddress },
    }));
    return (Item as UserItem) ?? null;
  }

  async create(walletAddress: string): Promise<UserItem> {
    const now = new Date().toISOString();
    const item: UserItem = {
      walletAddress,
      totalWon: 0,
      totalSpent: 0,
      rafflesEntered: 0,
      rafflesWon: 0,
      winRate: 0,
      activeEntries: 0,
      lastActive: now,
      createdAt: now,
      updatedAt: now,
    };
    await db.send(new PutCommand({
      TableName: TABLE.USERS,
      Item: item,
      ConditionExpression: 'attribute_not_exists(walletAddress)',
    })).catch((err) => {
      if (err.name === 'ConditionalCheckFailedException') return;
      throw err;
    });
    return item;
  }

  async getOrCreate(walletAddress: string): Promise<UserItem> {
    const existing = await this.getByAddress(walletAddress);
    if (existing) return existing;
    return this.create(walletAddress);
  }

  async update(walletAddress: string, updates: Partial<UserItem>): Promise<void> {
    const entries = Object.entries({ ...updates, updatedAt: new Date().toISOString() });
    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};

    entries.forEach(([key, val]) => {
      expressions.push(`#${key} = :${key}`);
      names[`#${key}`] = key;
      values[`:${key}`] = val;
    });

    await db.send(new UpdateCommand({
      TableName: TABLE.USERS,
      Key: { walletAddress },
      UpdateExpression: `SET ${expressions.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    }));
  }

  async recordWin(walletAddress: string, prize: number): Promise<void> {
    const user = await this.getOrCreate(walletAddress);
    const newRafflesWon = user.rafflesWon + 1;
    const newWinRate = user.rafflesEntered > 0 ? newRafflesWon / user.rafflesEntered : 0;

    await db.send(new UpdateCommand({
      TableName: TABLE.USERS,
      Key: { walletAddress },
      UpdateExpression: 'SET winRate = :winRate, updatedAt = :now, lastActive = :now ADD totalWon :prize, rafflesWon :one',
      ExpressionAttributeValues: {
        ':prize': prize,
        ':one': 1,
        ':winRate': newWinRate,
        ':now': new Date().toISOString(),
      },
    }));
  }

  /**
   * Update active entries count (can be positive or negative delta)
   */
  async updateActiveEntries(walletAddress: string, delta: number): Promise<void> {
    const user = await this.getByAddress(walletAddress);
    if (!user) return;

    await this.update(walletAddress, {
      activeEntries: Math.max(0, user.activeEntries + delta),
      lastActive: new Date().toISOString(),
    });
  }

  /**
   * Record entry for user (create user if doesn't exist, update stats if exists)
   * Used by shared business logic
   */
  async recordEntry(
    walletAddress: string,
    raffleId: string,
    numEntries: number,
    totalPaid: number,
    hasEnteredThisRaffleBefore: boolean
  ): Promise<void> {
    const user = await this.getByAddress(walletAddress);

    if (!user) {
      // Create new user
      const now = new Date().toISOString();
      const newUser: UserItem = {
        walletAddress: walletAddress.toLowerCase(),
        totalWon: 0,
        totalSpent: totalPaid,
        rafflesEntered: 1,
        rafflesWon: 0,
        winRate: 0,
        activeEntries: numEntries,
        lastActive: now,
        createdAt: now,
        updatedAt: now,
      };
      await db.send(new PutCommand({
        TableName: TABLE.USERS,
        Item: newUser,
        ConditionExpression: 'attribute_not_exists(walletAddress)',
      })).catch((err) => {
        if (err.name === 'ConditionalCheckFailedException') return;
        throw err;
      });
    } else {
      // Update existing user
      await this.update(walletAddress, {
        totalSpent: user.totalSpent + totalPaid,
        rafflesEntered: hasEnteredThisRaffleBefore ? user.rafflesEntered : user.rafflesEntered + 1,
        activeEntries: user.activeEntries + numEntries,
        lastActive: new Date().toISOString(),
      });
    }
  }

  /**
   * Process refund (decrement stats when raffle is cancelled)
   */
  async processRefund(walletAddress: string, numEntries: number, totalPaid: number): Promise<void> {
    const user = await this.getByAddress(walletAddress);
    if (!user) return;

    await this.update(walletAddress, {
      activeEntries: Math.max(0, user.activeEntries - numEntries),
      totalSpent: Math.max(0, user.totalSpent - totalPaid),
    });
  }
}
