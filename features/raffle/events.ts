import { type Log, parseAbiItem, type Address } from 'viem';

// =============================================================================
// Contract Event ABIs
// =============================================================================

export const RAFFLE_EVENTS = {
  RaffleCreated: parseAbiItem(
    'event RaffleCreated(uint256 indexed raffleId, uint8 raffleType, uint256 entryPrice, uint256 endTime)'
  ),
  EntrySubmitted: parseAbiItem(
    'event EntrySubmitted(uint256 indexed raffleId, address indexed player, uint256 numEntries, uint256 totalPaid)'
  ),
  DrawRequested: parseAbiItem(
    'event DrawRequested(uint256 indexed raffleId, uint256 requestId)'
  ),
  WinnerSelected: parseAbiItem(
    'event WinnerSelected(uint256 indexed raffleId, address indexed winner, uint256 prize, uint8 tier)'
  ),
  PayoutCompleted: parseAbiItem(
    'event PayoutCompleted(uint256 indexed raffleId, address indexed winner, uint256 amount, bytes32 txHash)'
  ),
  RaffleCancelled: parseAbiItem(
    'event RaffleCancelled(uint256 indexed raffleId, string reason)'
  ),
} as const;

// =============================================================================
// Parsed Event Types
// =============================================================================

export interface RaffleCreatedEvent {
  raffleId: bigint;
  raffleType: number;
  entryPrice: bigint;
  endTime: bigint;
}

export interface EntrySubmittedEvent {
  raffleId: bigint;
  player: Address;
  numEntries: bigint;
  totalPaid: bigint;
}

export interface DrawRequestedEvent {
  raffleId: bigint;
  requestId: bigint;
}

export interface WinnerSelectedEvent {
  raffleId: bigint;
  winner: Address;
  prize: bigint;
  tier: number;
}

export interface PayoutCompletedEvent {
  raffleId: bigint;
  winner: Address;
  amount: bigint;
  txHash: `0x${string}`;
}

export interface RaffleCancelledEvent {
  raffleId: bigint;
  reason: string;
}

// =============================================================================
// Event Parsing Helpers
// =============================================================================

export function parseRaffleCreated(log: Log): RaffleCreatedEvent {
  const args = log as unknown as { args: RaffleCreatedEvent };
  return {
    raffleId: args.args.raffleId,
    raffleType: args.args.raffleType,
    entryPrice: args.args.entryPrice,
    endTime: args.args.endTime,
  };
}

export function parseEntrySubmitted(log: Log): EntrySubmittedEvent {
  const args = log as unknown as { args: EntrySubmittedEvent };
  return {
    raffleId: args.args.raffleId,
    player: args.args.player,
    numEntries: args.args.numEntries,
    totalPaid: args.args.totalPaid,
  };
}

export function parseWinnerSelected(log: Log): WinnerSelectedEvent {
  const args = log as unknown as { args: WinnerSelectedEvent };
  return {
    raffleId: args.args.raffleId,
    winner: args.args.winner,
    prize: args.args.prize,
    tier: args.args.tier,
  };
}

// =============================================================================
// Watch Contract Events (viem pattern)
// =============================================================================

/**
 * Creates event watcher configs for use with viem's watchContractEvent.
 * 
 * Usage:
 * ```ts
 * import { watchContractEvent } from 'viem/actions';
 * import { RAFFLE_CONTRACT_ADDRESS } from '@/lib/contracts/addresses';
 * import { RAFFLE_EVENTS } from '@/features/raffle/events';
 * 
 * const unwatch = watchContractEvent(publicClient, {
 *   address: RAFFLE_CONTRACT_ADDRESS,
 *   abi: [RAFFLE_EVENTS.EntrySubmitted],
 *   eventName: 'EntrySubmitted',
 *   args: { raffleId: BigInt(raffleId) },
 *   onLogs: (logs) => {
 *     logs.forEach(log => {
 *       const entry = parseEntrySubmitted(log);
 *       console.log(`${entry.player} entered with ${entry.numEntries} entries`);
 *     });
 *   },
 * });
 * 
 * // Cleanup
 * unwatch();
 * ```
 */
export function getRaffleEventConfig(eventName: keyof typeof RAFFLE_EVENTS) {
  return {
    abi: [RAFFLE_EVENTS[eventName]],
    eventName,
  };
}
