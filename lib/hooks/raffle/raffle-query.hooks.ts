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
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.cursor) searchParams.set('cursor', params.cursor);

  const response = await fetch(`/api/raffles?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch raffles');
  }

  const data = await response.json();

  // API returns { data, hasMore, nextCursor }, map to PaginatedRaffles format
  return {
    raffles: data.data,
    hasMore: data.hasMore,
    nextCursor: data.nextCursor,
  };
}

async function fetchWinners(params: ListWinnersParams): Promise<PaginatedWinners> {
  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.cursor) searchParams.set('cursor', params.cursor);

  const response = await fetch(`/api/raffles/${params.raffleId}/winners?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch winners');
  }

  return response.json();
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
