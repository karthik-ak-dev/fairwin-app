/**
 * Raffle Query Hooks
 *
 * React Query hooks for fetching raffle data
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type {
  ListRafflesParams,
  PaginatedRaffles,
  ListWinnersParams,
  PaginatedWinners,
  EnrichedRaffle
} from '@/lib/services/raffle/types';
import { RaffleStatus, RaffleType } from '@/lib/db/models';

// ============================================================================
// Query Keys
// ============================================================================

export const raffleQueryKeys = {
  all: ['raffles'] as const,
  lists: () => [...raffleQueryKeys.all, 'list'] as const,
  list: (params: ListRafflesParams) => [...raffleQueryKeys.lists(), params] as const,
  details: () => [...raffleQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...raffleQueryKeys.details(), id] as const,
  winners: (raffleId: string) => [...raffleQueryKeys.detail(raffleId), 'winners'] as const,
  winnersList: (params: ListWinnersParams) => [...raffleQueryKeys.winners(params.raffleId!), params] as const,
};

// ============================================================================
// API Functions
// ============================================================================

async function fetchRaffles(params: ListRafflesParams): Promise<PaginatedRaffles> {
  // TODO: Uncomment when ready to use real API
  // const searchParams = new URLSearchParams();
  //
  // if (params.status) searchParams.set('status', params.status);
  // if (params.type) searchParams.set('type', params.type);
  // if (params.limit) searchParams.set('limit', params.limit.toString());
  // if (params.cursor) searchParams.set('cursor', params.cursor);
  //
  // const response = await fetch(`/api/raffles?${searchParams.toString()}`);
  //
  // if (!response.ok) {
  //   throw new Error('Failed to fetch raffles');
  // }
  //
  // const data = await response.json();
  //
  // // API returns { data, hasMore, nextCursor }, map to PaginatedRaffles format
  // return {
  //   raffles: data.data,
  //   hasMore: data.hasMore,
  //   nextCursor: data.nextCursor,
  // };

  // Dummy data for development (ignoring params for now)
  void params;

  return {
    raffles: [
      {
        raffleId: 'raffle-1',
        title: 'Grand Prize Raffle',
        description: 'Win amazing prizes in our grand raffle',
        prizePool: 50000,
        entryPrice: 100,
        totalEntries: 750,
        totalParticipants: 520,
        status: 'active',
        displayStatus: 'active',
        type: 'daily',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        protocolFee: 5000,
        winnerPayout: 45000,
      },
      {
        raffleId: 'raffle-2',
        title: 'Quick Draw Raffle',
        description: 'Fast-paced raffle ending soon',
        prizePool: 25000,
        entryPrice: 50,
        totalEntries: 480,
        totalParticipants: 320,
        status: 'active',
        displayStatus: 'ending',
        type: 'daily',
        startTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        protocolFee: 2500,
        winnerPayout: 22500,
      },
      {
        raffleId: 'raffle-3',
        title: 'Weekly Mega Raffle',
        description: 'Biggest prizes of the week',
        prizePool: 100000,
        entryPrice: 200,
        totalEntries: 1200,
        totalParticipants: 850,
        status: 'active',
        displayStatus: 'active',
        type: 'weekly',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        protocolFee: 10000,
        winnerPayout: 90000,
      },
    ] as any,
    hasMore: false,
    nextCursor: undefined,
  };
}

async function fetchRaffleDetails(raffleId: string): Promise<EnrichedRaffle> {
  // TODO: Uncomment when ready to use real API
  // const response = await fetch(`/api/raffles/${raffleId}`);
  //
  // if (!response.ok) {
  //   throw new Error('Failed to fetch raffle details');
  // }
  //
  // const result = await response.json();
  // return result.data;

  // Dummy data for development
  void raffleId;

  return {
    raffle: {
      raffleId: 'raffle-1',
      title: 'Daily Raffle - Feb 3rd',
      description: 'Win up to 1000 USDC! Multiple prize tiers available.',
      prizePool: 2475000000, // 2,475 USDC
      entryPrice: 5000000, // 5 USDC
      totalEntries: 852,
      totalParticipants: 315,
      status: RaffleStatus.ACTIVE,
      displayStatus: 'active',
      type: RaffleType.DAILY,
      winnerCount: 100,
      platformFeePercent: 10,
      protocolFee: 247500000, // 10% of prize pool
      winnerPayout: 2227500000, // 90% of prize pool
      prizeTiers: [
        { name: '1st Place', percentage: 40, winnerCount: 1 },
        { name: '2nd Place', percentage: 30, winnerCount: 4 },
        { name: '3rd Place', percentage: 30, winnerCount: 95 },
      ],
      startTime: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    recentEntries: [
      {
        entryId: 'entry-1',
        raffleId: 'raffle-1',
        walletAddress: '0x7a3F4b8c9d2e1a5f6b8c7d9e2f1a3b4c5d6e7f8a',
        numEntries: 5,
        totalPaid: 25000000, // 25 USDC
        transactionHash: '0xabc123...',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      },
      {
        entryId: 'entry-2',
        raffleId: 'raffle-1',
        walletAddress: '0x2eB1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
        numEntries: 10,
        totalPaid: 50000000, // 50 USDC
        transactionHash: '0xdef456...',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
      {
        entryId: 'entry-3',
        raffleId: 'raffle-1',
        walletAddress: '0x9cD4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
        numEntries: 3,
        totalPaid: 15000000, // 15 USDC
        transactionHash: '0xghi789...',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        entryId: 'entry-4',
        raffleId: 'raffle-1',
        walletAddress: '0x4fA1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
        numEntries: 1,
        totalPaid: 5000000, // 5 USDC
        transactionHash: '0xjkl012...',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      },
      {
        entryId: 'entry-5',
        raffleId: 'raffle-1',
        walletAddress: '0x8bE2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
        numEntries: 8,
        totalPaid: 40000000, // 40 USDC
        transactionHash: '0xmno345...',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      },
      {
        entryId: 'entry-6',
        raffleId: 'raffle-1',
        walletAddress: '0x1Bc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
        numEntries: 2,
        totalPaid: 10000000, // 10 USDC
        transactionHash: '0xpqr678...',
        status: 'confirmed',
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ] as any,
    winners: [], // No winners yet (raffle is active)
    entryDistribution: [
      { entries: 1, userCount: 156 },
      { entries: 2, userCount: 45 },
      { entries: 3, userCount: 28 },
      { entries: 4, userCount: 16 },
      { entries: 5, userCount: 22 },
      { entries: 6, userCount: 12 },
      { entries: 7, userCount: 8 },
      { entries: 8, userCount: 10 },
      { entries: 9, userCount: 6 },
      { entries: 10, userCount: 4 },
      { entries: 15, userCount: 5 },
      { entries: 20, userCount: 3 },
    ],
    prizeTierBreakdown: [
      {
        name: '1st Place',
        percentage: 40,
        winnerCount: 1,
        totalAmount: 891000000, // 891 USDC (40% of 2,227.5)
        amountPerWinner: 891000000, // 891 USDC per winner
      },
      {
        name: '2nd Place',
        percentage: 30,
        winnerCount: 4,
        totalAmount: 668250000, // 668.25 USDC (30% of 2,227.5)
        amountPerWinner: 167062500, // 167.06 USDC per winner
      },
      {
        name: '3rd Place',
        percentage: 30,
        winnerCount: 95,
        totalAmount: 668250000, // 668.25 USDC (30% of 2,227.5)
        amountPerWinner: 7034736, // 7.03 USDC per winner
      },
    ],
  };
}

async function fetchWinners(params: ListWinnersParams): Promise<PaginatedWinners> {
  // TODO: Uncomment when ready to use real API
  // const searchParams = new URLSearchParams();
  //
  // if (params.limit) searchParams.set('limit', params.limit.toString());
  // if (params.cursor) searchParams.set('cursor', params.cursor);
  //
  // const response = await fetch(`/api/raffles/${params.raffleId}/winners?${searchParams.toString()}`);
  //
  // if (!response.ok) {
  //   throw new Error('Failed to fetch winners');
  // }
  //
  // return response.json();

  // Dummy data for development
  return {
    winners: [
      {
        winnerId: 'winner-1',
        raffleId: params.raffleId || 'raffle-1',
        walletAddress: '0x1234567890123456789012345678901234567890',
        ticketNumber: 42,
        totalTickets: 100,
        prize: 10000,
        prizeTier: '1st',
        payoutStatus: 'paid',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        winnerId: 'winner-2',
        raffleId: params.raffleId || 'raffle-1',
        walletAddress: '0x2345678901234567890123456789012345678901',
        ticketNumber: 73,
        totalTickets: 100,
        prize: 5000,
        prizeTier: '2nd',
        payoutStatus: 'pending',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        winnerId: 'winner-3',
        raffleId: params.raffleId || 'raffle-1',
        walletAddress: '0x3456789012345678901234567890123456789012',
        ticketNumber: 15,
        totalTickets: 100,
        prize: 2500,
        prizeTier: '3rd',
        payoutStatus: 'pending',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ] as any,
    hasMore: false,
    nextCursor: undefined,
  };
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * List raffles with optional filtering and pagination
 *
 * @param params - Query parameters (status, type, limit, cursor)
 * @param options - React Query options
 * @returns Raffles query result
 *
 * @example
 * ```tsx
 * // Get active raffles
 * const { data, isLoading } = useRaffles({ status: 'active' });
 *
 * // Get daily raffles with pagination
 * const { data } = useRaffles({
 *   type: 'daily',
 *   limit: 20,
 *   cursor: nextCursor
 * });
 * ```
 */
export function useRaffles(
  params: ListRafflesParams = {},
  options?: Omit<UseQueryOptions<PaginatedRaffles>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: raffleQueryKeys.list(params),
    queryFn: () => fetchRaffles(params),
    staleTime: 1000 * 60, // 1 minute
    ...options,
  });
}

/**
 * Get raffle details with enriched data
 *
 * @param raffleId - The raffle ID
 * @param options - React Query options
 * @returns Raffle details query result
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useRaffleDetails('raffle-123');
 * console.log(data?.raffle);
 * console.log(data?.recentEntries);
 * console.log(data?.entryDistribution);
 * console.log(data?.prizeTierBreakdown);
 * ```
 */
export function useRaffleDetails(
  raffleId: string,
  options?: Omit<UseQueryOptions<EnrichedRaffle>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: raffleQueryKeys.detail(raffleId),
    queryFn: () => fetchRaffleDetails(raffleId),
    staleTime: 1000 * 30, // 30 seconds (raffle details change frequently)
    enabled: !!raffleId, // Only run if raffleId is provided
    ...options,
  });
}

/**
 * Get winners for a raffle
 *
 * @param params - Query parameters (raffleId, limit, cursor)
 * @param options - React Query options
 * @returns Winners query result
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useWinners({ raffleId: 'raffle-123' });
 * console.log(data?.winners);
 *
 * // With pagination
 * const { data } = useWinners({
 *   raffleId: 'raffle-123',
 *   limit: 50,
 *   cursor: nextCursor
 * });
 * ```
 */
export function useWinners(
  params: ListWinnersParams,
  options?: Omit<UseQueryOptions<PaginatedWinners>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: raffleQueryKeys.winnersList(params),
    queryFn: () => fetchWinners(params),
    staleTime: 1000 * 60 * 5, // 5 minutes (winners don't change often)
    enabled: !!params.raffleId, // Only run if raffleId is provided
    ...options,
  });
}
