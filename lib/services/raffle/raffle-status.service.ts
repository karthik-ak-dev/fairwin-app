/**
 * Raffle Status Computation Service
 *
 * Computes display status from raffle state + time-based logic.
 * This provides user-friendly status indicators for the frontend.
 *
 * Key Principle:
 * - status = Base raffle state (scheduled, active, drawing, completed, cancelled)
 * - displayStatus = What we show users (computed from status + time)
 *
 * Why This Matters:
 * - Admin can pre-schedule raffles
 * - Frontend shows "ending soon" urgency UI
 * - Clear separation between backend state and UI presentation
 */

import type { RaffleItem } from '@/lib/db/models';
import { RaffleStatus } from '@/lib/db/models';
import { auth } from '@/lib/constants';

/**
 * Display status type - what users see in the UI
 *
 * - scheduled: Raffle created but not started yet
 * - active: Raffle accepting entries
 * - ending: Less than 5 minutes until endTime (urgency indicator)
 * - drawing: Backend selecting winners
 * - completed: Winners selected, payouts pending/processed
 * - cancelled: Raffle cancelled, refunds available
 */
export type DisplayStatus = 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';

/**
 * Compute display status from raffle data
 *
 * Logic Flow:
 * 1. If status is terminal (completed/cancelled) → return as-is
 * 2. If status is drawing → return 'drawing'
 * 3. If before startTime → return 'scheduled'
 * 4. If < 5min until endTime → return 'ending' (urgency UI)
 * 5. Otherwise return status
 *
 * @param raffle Raffle item with status and time fields
 * @returns Display status for frontend
 *
 * @example
 * // Raffle not started yet
 * computeDisplayStatus({ status: 'scheduled', startTime: future, ... })
 * // Returns: 'scheduled'
 *
 * @example
 * // Raffle active, 2 minutes until end
 * computeDisplayStatus({
 *   status: 'active',
 *   endTime: Date.now() + 2 * 60 * 1000,
 *   ...
 * })
 * // Returns: 'ending'
 *
 * @example
 * // Raffle completed
 * computeDisplayStatus({ status: 'completed', ... })
 * // Returns: 'completed'
 */
export function computeDisplayStatus(raffle: Pick<RaffleItem, 'status' | 'startTime' | 'endTime'>): DisplayStatus {
  // Terminal states - return as-is
  if (raffle.status === RaffleStatus.COMPLETED || raffle.status === RaffleStatus.CANCELLED) {
    return raffle.status;
  }

  // Drawing state
  if (raffle.status === RaffleStatus.DRAWING) {
    return 'drawing';
  }

  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  const endTime = new Date(raffle.endTime).getTime();

  // Before start time → show as scheduled
  if (now < startTime) {
    return 'scheduled';
  }

  // Less than 5 minutes until end → show urgency
  const ENDING_THRESHOLD = auth.CHALLENGE_EXPIRATION_MS; // 5 minutes in milliseconds
  if (raffle.status === RaffleStatus.ACTIVE && endTime - now <= ENDING_THRESHOLD && now < endTime) {
    return 'ending';
  }

  // Otherwise, display status matches base status
  return raffle.status;
}

/**
 * Check if raffle is accepting entries
 *
 * A raffle accepts entries when:
 * - Status is 'active'
 * - Current time is between startTime and endTime
 *
 * @param raffle Raffle item
 * @returns true if raffle is accepting entries
 *
 * @example
 * isAcceptingEntries({ status: 'active', startTime: past, endTime: future })
 * // Returns: true
 *
 * @example
 * isAcceptingEntries({ status: 'drawing', ... })
 * // Returns: false (winners being selected)
 */
export function isAcceptingEntries(raffle: Pick<RaffleItem, 'status' | 'startTime' | 'endTime'>): boolean {
  if (raffle.status !== RaffleStatus.ACTIVE) {
    return false;
  }

  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  const endTime = new Date(raffle.endTime).getTime();

  return now >= startTime && now < endTime;
}

/**
 * Check if raffle can be drawn
 *
 * A raffle can be drawn when:
 * - Status is 'active'
 * - Current time is past endTime
 * - Raffle hasn't been drawn yet
 *
 * @param raffle Raffle item
 * @returns true if raffle is ready for draw
 *
 * @example
 * canBeDrawn({ status: 'active', endTime: past })
 * // Returns: true
 *
 * @example
 * canBeDrawn({ status: 'drawing', ... })
 * // Returns: false (already drawing)
 */
export function canBeDrawn(raffle: Pick<RaffleItem, 'status' | 'endTime'>): boolean {
  if (raffle.status !== RaffleStatus.ACTIVE) {
    return false;
  }

  const now = Date.now();
  const endTime = new Date(raffle.endTime).getTime();

  return now >= endTime;
}

/**
 * Check if raffle is finalized (completed or cancelled)
 *
 * @param raffle Raffle item
 * @returns true if raffle is in final state
 */
export function isFinalized(raffle: Pick<RaffleItem, 'status'>): boolean {
  return raffle.status === RaffleStatus.COMPLETED || raffle.status === RaffleStatus.CANCELLED;
}

/**
 * Get time until raffle starts (in milliseconds)
 *
 * @param raffle Raffle item
 * @returns Milliseconds until start (0 if already started)
 */
export function timeUntilStart(raffle: Pick<RaffleItem, 'startTime'>): number {
  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  return Math.max(0, startTime - now);
}

/**
 * Get time until raffle ends (in milliseconds)
 *
 * @param raffle Raffle item
 * @returns Milliseconds until end (0 if already ended)
 */
export function timeUntilEnd(raffle: Pick<RaffleItem, 'endTime'>): number {
  const now = Date.now();
  const endTime = new Date(raffle.endTime).getTime();
  return Math.max(0, endTime - now);
}

/**
 * Get time remaining as human-readable string
 *
 * @param milliseconds Time in milliseconds
 * @returns Human-readable string (e.g., "2h 30m", "45m", "30s")
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) {
    return 'Ended';
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Enrich raffle with computed display status
 *
 * Adds displayStatus field to raffle object.
 * Useful for API responses.
 *
 * @param raffle Raffle item
 * @returns Raffle with displayStatus field
 *
 * @example
 * const enriched = enrichWithDisplayStatus(raffle);
 * // Returns: { ...raffle, displayStatus: 'active' }
 */
export function enrichWithDisplayStatus<T extends Pick<RaffleItem, 'status' | 'startTime' | 'endTime'>>(
  raffle: T
): T & { displayStatus: DisplayStatus } {
  return {
    ...raffle,
    displayStatus: computeDisplayStatus(raffle),
  };
}

/**
 * Enrich multiple raffles with display status
 *
 * @param raffles Array of raffle items
 * @returns Array of raffles with displayStatus field
 */
export function enrichManyWithDisplayStatus<T extends Pick<RaffleItem, 'status' | 'startTime' | 'endTime'>>(
  raffles: T[]
): Array<T & { displayStatus: DisplayStatus }> {
  return raffles.map(enrichWithDisplayStatus);
}
