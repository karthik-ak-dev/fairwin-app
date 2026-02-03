/**
 * Raffle Mutation Hooks
 *
 * React Query mutation hooks for raffle management operations
 */

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import type { RaffleItem } from '@/lib/db/models';
import { raffleQueryKeys } from './raffle-query.hooks';

// ============================================================================
// Mutation Types
// ============================================================================

interface MutationResponse {
  raffle: RaffleItem;
  message: string;
}

// ============================================================================
// Mutation Functions
// ============================================================================

async function pauseRaffle(raffleId: string): Promise<MutationResponse> {
  const response = await fetch(`/api/admin/raffles/${raffleId}/pause`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to pause raffle');
  }

  const result = await response.json();
  return result.data;
}

async function resumeRaffle(raffleId: string): Promise<MutationResponse> {
  const response = await fetch(`/api/admin/raffles/${raffleId}/activate`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to resume raffle');
  }

  const result = await response.json();
  return result.data;
}

async function cancelRaffle(raffleId: string): Promise<MutationResponse> {
  const response = await fetch(`/api/admin/raffles/${raffleId}/cancel`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to cancel raffle');
  }

  const result = await response.json();
  return result.data;
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Pause an active raffle
 *
 * @example
 * ```tsx
 * const { mutate: pause, isPending } = usePauseRaffle();
 *
 * const handlePause = () => {
 *   pause(raffleId, {
 *     onSuccess: () => {
 *       toast.success('Raffle paused successfully');
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   });
 * };
 * ```
 */
export function usePauseRaffle(
  options?: Omit<UseMutationOptions<MutationResponse, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseRaffle,
    onSuccess: (data, raffleId) => {
      // Invalidate raffle detail query
      queryClient.invalidateQueries({ queryKey: raffleQueryKeys.detail(raffleId) });
      // Invalidate raffle lists
      queryClient.invalidateQueries({ queryKey: raffleQueryKeys.lists() });
    },
    ...options,
  });
}

/**
 * Resume a paused raffle (reactivate)
 *
 * @example
 * ```tsx
 * const { mutate: resume, isPending } = useResumeRaffle();
 *
 * const handleResume = () => {
 *   resume(raffleId, {
 *     onSuccess: () => {
 *       toast.success('Raffle resumed successfully');
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   });
 * };
 * ```
 */
export function useResumeRaffle(
  options?: Omit<UseMutationOptions<MutationResponse, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resumeRaffle,
    onSuccess: (data, raffleId) => {
      // Invalidate raffle detail query
      queryClient.invalidateQueries({ queryKey: raffleQueryKeys.detail(raffleId) });
      // Invalidate raffle lists
      queryClient.invalidateQueries({ queryKey: raffleQueryKeys.lists() });
    },
    ...options,
  });
}

/**
 * Cancel a raffle
 *
 * @example
 * ```tsx
 * const { mutate: cancel, isPending } = useCancelRaffle();
 *
 * const handleCancel = () => {
 *   cancel(raffleId, {
 *     onSuccess: () => {
 *       toast.success('Raffle cancelled successfully');
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   });
 * };
 * ```
 */
export function useCancelRaffle(
  options?: Omit<UseMutationOptions<MutationResponse, Error, string>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelRaffle,
    onSuccess: (data, raffleId) => {
      // Invalidate raffle detail query
      queryClient.invalidateQueries({ queryKey: raffleQueryKeys.detail(raffleId) });
      // Invalidate raffle lists
      queryClient.invalidateQueries({ queryKey: raffleQueryKeys.lists() });
    },
    ...options,
  });
}
