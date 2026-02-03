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
  PaginatedWinners
} from '@/lib/services/raffle/types';

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
        name: 'Grand Prize Raffle',
        description: 'Win amazing prizes in our grand raffle',
        prizePool: 50000,
        entryPrice: 100,
        maxEntries: 1000,
        currentEntries: 750,
        status: 'active',
        displayStatus: 'active',
        type: 'daily',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        protocolFee: 2500,
      },
      {
        raffleId: 'raffle-2',
        name: 'Quick Draw Raffle',
        description: 'Fast-paced raffle ending soon',
        prizePool: 25000,
        entryPrice: 50,
        maxEntries: 500,
        currentEntries: 480,
        status: 'active',
        displayStatus: 'ending',
        type: 'daily',
        startTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        protocolFee: 1250,
      },
      {
        raffleId: 'raffle-3',
        name: 'Weekly Mega Raffle',
        description: 'Biggest prizes of the week',
        prizePool: 100000,
        entryPrice: 200,
        maxEntries: 2000,
        currentEntries: 1200,
        status: 'active',
        displayStatus: 'active',
        type: 'weekly',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        protocolFee: 5000,
      },
    ] as any,
    hasMore: false,
    nextCursor: undefined,
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
        prizeAmount: 10000,
        payoutStatus: 'paid',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        winnerId: 'winner-2',
        raffleId: params.raffleId || 'raffle-1',
        walletAddress: '0x2345678901234567890123456789012345678901',
        prizeAmount: 5000,
        payoutStatus: 'pending',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        winnerId: 'winner-3',
        raffleId: params.raffleId || 'raffle-1',
        walletAddress: '0x3456789012345678901234567890123456789012',
        prizeAmount: 2500,
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
