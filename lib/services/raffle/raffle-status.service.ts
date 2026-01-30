/**
 * Raffle Status Computation Service
 *
 * Computes display status from on-chain contract state + time-based logic.
 * This separates SOURCE OF TRUTH (contractState from blockchain)
 * from COMPUTED DISPLAY STATE (status for frontend).
 *
 * Key Principle:
 * - contractState = What the blockchain says (read-only, immutable)
 * - displayStatus = What we show users (computed from contractState + time)
 *
 * Why This Separation Matters:
 * - Admin can pre-schedule raffles before creating them on-chain
 * - Frontend shows "ending soon" urgency UI without contract changes
 * - Migration path: we keep old "status" field during transition
 */

import type { RaffleItem } from '@/lib/db/models';

/**
 * Display status type - what users see in the UI
 *
 * - scheduled: Raffle created in backend but not on-chain yet (admin pre-scheduling)
 * - active: Raffle accepting entries
 * - ending: Less than 5 minutes until endTime (urgency indicator)
 * - drawing: VRF request in progress, awaiting random number
 * - completed: Winners selected and paid by contract
 * - cancelled: Raffle cancelled, refunds available
 */
export type DisplayStatus = 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';

/**
 * Contract state type - what's on the blockchain
 * Must match FairWinRaffle.sol RaffleState enum exactly
 */
export type ContractState = 'active' | 'drawing' | 'completed' | 'cancelled';

/**
 * Compute display status from raffle data
 *
 * Logic Flow:
 * 1. If no contractState → 'scheduled' (not on-chain yet)
 * 2. If contractState exists, check time-based overrides:
 *    - If before startTime → 'scheduled' (show countdown)
 *    - If < 5min until endTime → 'ending' (urgency UI)
 * 3. Otherwise return contractState as-is
 *
 * @param raffle Raffle item with contractState and time fields
 * @returns Display status for frontend
 *
 * @example
 * // Raffle not on-chain yet
 * computeDisplayStatus({ contractState: undefined, ... })
 * // Returns: 'scheduled'
 *
 * @example
 * // Raffle on-chain, 2 minutes until end
 * computeDisplayStatus({
 *   contractState: 'active',
 *   endTime: Date.now() + 2 * 60 * 1000,
 *   ...
 * })
 * // Returns: 'ending'
 *
 * @example
 * // Raffle completed
 * computeDisplayStatus({ contractState: 'completed', ... })
 * // Returns: 'completed'
 */
export function computeDisplayStatus(raffle: Pick<RaffleItem, 'contractState' | 'startTime' | 'endTime' | 'status'>): DisplayStatus {
  // If no contract state, raffle exists only in backend (pre-scheduled)
  if (!raffle.contractState) {
    return 'scheduled';
  }

  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  const endTime = new Date(raffle.endTime).getTime();

  // Contract exists but before start time → show as scheduled
  if (raffle.contractState === 'active' && now < startTime) {
    return 'scheduled';
  }

  // Less than 5 minutes until end → show urgency
  const ENDING_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
  if (raffle.contractState === 'active' && endTime - now <= ENDING_THRESHOLD && now < endTime) {
    return 'ending';
  }

  // Otherwise, display status matches contract state
  return raffle.contractState;
}

/**
 * Check if raffle is accepting entries
 *
 * A raffle accepts entries when:
 * - Contract state is 'active'
 * - Current time is between startTime and endTime
 *
 * @param raffle Raffle item
 * @returns true if raffle is accepting entries
 *
 * @example
 * isAcceptingEntries({ contractState: 'active', startTime: past, endTime: future })
 * // Returns: true
 *
 * @example
 * isAcceptingEntries({ contractState: 'drawing', ... })
 * // Returns: false (VRF in progress)
 */
export function isAcceptingEntries(raffle: Pick<RaffleItem, 'contractState' | 'startTime' | 'endTime'>): boolean {
  if (raffle.contractState !== 'active') {
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
 * - Contract state is 'active'
 * - Current time is past endTime
 * - Raffle hasn't been drawn yet
 *
 * @param raffle Raffle item
 * @returns true if raffle is ready for draw
 *
 * @example
 * canBeDrwan({ contractState: 'active', endTime: past })
 * // Returns: true
 *
 * @example
 * canBeDrawn({ contractState: 'drawing', ... })
 * // Returns: false (already drawing)
 */
export function canBeDrawn(raffle: Pick<RaffleItem, 'contractState' | 'endTime'>): boolean {
  if (raffle.contractState !== 'active') {
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
export function isFinalized(raffle: Pick<RaffleItem, 'contractState'>): boolean {
  return raffle.contractState === 'completed' || raffle.contractState === 'cancelled';
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
export function enrichWithDisplayStatus<T extends Pick<RaffleItem, 'contractState' | 'startTime' | 'endTime' | 'status'>>(
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
export function enrichManyWithDisplayStatus<T extends Pick<RaffleItem, 'contractState' | 'startTime' | 'endTime' | 'status'>>(
  raffles: T[]
): Array<T & { displayStatus: DisplayStatus }> {
  return raffles.map(enrichWithDisplayStatus);
}

/**
 * Migration helper: Sync status field from contractState
 *
 * During migration, we need to keep status field in sync with contractState.
 * This function computes status from contractState for database updates.
 *
 * @param raffle Raffle item
 * @returns Status value for database
 *
 * @deprecated Remove after migration complete and status field removed
 */
export function syncStatusFromContractState(raffle: Pick<RaffleItem, 'contractState' | 'startTime' | 'endTime' | 'status'>): RaffleItem['status'] {
  return computeDisplayStatus(raffle);
}
