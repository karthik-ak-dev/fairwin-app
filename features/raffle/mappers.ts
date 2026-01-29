import type { RaffleItem } from '@/lib/db/models';
import type { Raffle, RaffleState } from './types';

/**
 * Maps a DynamoDB RaffleItem to the frontend Raffle type.
 * The frontend uses `id`/`state` while the DB uses `raffleId`/`status`.
 */
export function mapRaffleItemToRaffle(item: RaffleItem): Raffle {
  // Map 'completed' -> 'ended' for frontend compatibility
  const stateMap: Record<string, RaffleState> = {
    scheduled: 'scheduled',
    active: 'active',
    ending: 'ending',
    drawing: 'drawing',
    completed: 'ended',
    cancelled: 'cancelled',
  };

  return {
    id: item.raffleId,
    raffleNumber: 0, // Not stored in DB, derive from title or use 0
    type: item.type,
    state: stateMap[item.status] || 'active',
    title: item.title,
    entryPrice: item.entryPrice,
    totalEntries: item.totalEntries,
    totalParticipants: item.totalParticipants,
    prizePool: item.prizePool,
    winnersCount: 3, // Default; could be stored in DB if needed
    maxEntriesPerUser: item.maxEntriesPerUser,
    startTime: item.startTime,
    endTime: item.endTime,
    contractAddress: item.contractAddress,
    prizeTiers: [
      {
        name: 'Grand Prize',
        icon: '🥇',
        percentage: 60,
        winnersCount: 1,
        amountPerWinner: item.winnerPayout * 0.6,
        colorClass: 'text-[#FFD700]',
      },
      {
        name: 'Runner-up',
        icon: '🥈',
        percentage: 25,
        winnersCount: 1,
        amountPerWinner: item.winnerPayout * 0.25,
        colorClass: 'text-[#C0C0C0]',
      },
      {
        name: 'Lucky Winner',
        icon: '🍀',
        percentage: 15,
        winnersCount: 1,
        amountPerWinner: item.winnerPayout * 0.15,
        colorClass: 'text-[#00ff88]',
      },
    ],
    createdAt: item.createdAt,
  };
}
