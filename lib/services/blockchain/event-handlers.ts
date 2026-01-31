/**
 * Blockchain Event Handlers - Refactored
 *
 * Thin wrappers that call shared business logic.
 * These handlers decode blockchain events and delegate to service layer.
 *
 * Architecture:
 * - Event Listener fetches events from blockchain
 * - Event Handlers decode events (this file)
 * - Business Logic Services process events (raffle-entry.service, raffle-winner.service)
 * - Repositories persist data
 */

import { decodeEventLog, type Log } from 'viem';
import { FAIRWIN_ABI } from '@/lib/blockchain';
import { raffleRepository } from '@/lib/db/repositories/raffle';
import { processEntry } from '@/lib/services/raffle/raffle-entry.service';
import {
  processWinnerSelection,
  processRaffleCancellation,
} from '@/lib/services/raffle/raffle-winner.service';
import type { RaffleItem } from '@/lib/db/models';

/**
 * Handle EntrySubmitted event
 * Delegates to shared processEntry() business logic
 */
export async function handleEntrySubmittedEvent(
  log: Log,
  raffle: RaffleItem
): Promise<void> {
  try {
    // Decode event
    const decoded = decodeEventLog({
      abi: FAIRWIN_ABI,
      data: log.data,
      topics: log.topics,
    });

    const args = decoded.args as {
      raffleId: bigint;
      participant: string;
      numEntries: bigint;
    };

    const walletAddress = args.participant.toLowerCase();
    const numEntries = Number(args.numEntries);
    const transactionHash = log.transactionHash || '';
    const blockNumber = Number(log.blockNumber);

    // Calculate totalPaid from raffle entryPrice
    const totalPaid = numEntries * raffle.entryPrice;

    console.log(
      `[EventHandler] EntrySubmitted: raffle=${raffle.raffleId}, wallet=${walletAddress}, entries=${numEntries}`
    );

    // Delegate to shared business logic
    await processEntry({
      raffleId: raffle.raffleId,
      walletAddress,
      numEntries,
      totalPaid,
      transactionHash,
      blockNumber,
      source: 'DIRECT_CONTRACT', // Event sync marks as DIRECT_CONTRACT
    });

    console.log(`[EventHandler] Successfully processed entry from event`);
  } catch (error) {
    console.error('[EventHandler] Error handling EntrySubmitted event:', error);
    throw error;
  }
}

/**
 * Handle WinnersSelected event
 * Delegates to shared processWinnerSelection() business logic
 */
export async function handleWinnersSelectedEvent(
  log: Log,
  raffle: RaffleItem
): Promise<void> {
  try {
    // Decode event
    const decoded = decodeEventLog({
      abi: FAIRWIN_ABI,
      data: log.data,
      topics: log.topics,
    });

    const args = decoded.args as {
      raffleId: bigint;
      winners: string[];
      prizes: bigint[];
      totalPrize: bigint;
      protocolFee: bigint;
    };

    const winners = args.winners.map((w) => w.toLowerCase());
    const prizes = args.prizes.map((p) => Number(p));
    const totalPrize = Number(args.totalPrize);
    const transactionHash = log.transactionHash || '';

    console.log(
      `[EventHandler] WinnersSelected: raffle=${raffle.raffleId}, winners=${winners.length}, prize=${totalPrize}`
    );

    // Delegate to shared business logic
    await processWinnerSelection({
      raffleId: raffle.raffleId,
      winners,
      prizes,
      totalPrize,
      transactionHash,
    });

    console.log(`[EventHandler] Successfully processed ${winners.length} winners`);
  } catch (error) {
    console.error('[EventHandler] Error handling WinnersSelected event:', error);
    throw error;
  }
}

/**
 * Handle DrawRequested event
 * Simple status update - no complex business logic needed
 */
export async function handleDrawRequestedEvent(
  log: Log,
  raffle: RaffleItem
): Promise<void> {
  try {
    // Decode event
    const decoded = decodeEventLog({
      abi: FAIRWIN_ABI,
      data: log.data,
      topics: log.topics,
    });

    const args = decoded.args as {
      raffleId: bigint;
      requestId: bigint;
    };

    const requestId = args.requestId.toString();

    console.log(
      `[EventHandler] DrawRequested: raffle=${raffle.raffleId}, requestId=${requestId}`
    );

    // Simple status update
    await raffleRepository.update(raffle.raffleId, {
      contractState: 'drawing',
      status: 'drawing',
      vrfRequestId: requestId,
      drawTime: new Date().toISOString(),
    });

    console.log(`[EventHandler] Raffle ${raffle.raffleId} status updated to 'drawing'`);
  } catch (error) {
    console.error('[EventHandler] Error handling DrawRequested event:', error);
    throw error;
  }
}

/**
 * Handle RaffleCancelled event
 * Delegates to shared processRaffleCancellation() business logic
 */
export async function handleRaffleCancelledEvent(
  log: Log,
  raffle: RaffleItem
): Promise<void> {
  try {
    // Decode event
    const decoded = decodeEventLog({
      abi: FAIRWIN_ABI,
      data: log.data,
      topics: log.topics,
    });

    const args = decoded.args as {
      raffleId: bigint;
      reason?: string;
    };

    const reason = args.reason || 'Unknown';

    console.log(
      `[EventHandler] RaffleCancelled: raffle=${raffle.raffleId}, reason=${reason}`
    );

    // Delegate to shared business logic
    await processRaffleCancellation(raffle.raffleId);

    console.log(`[EventHandler] Successfully cancelled raffle ${raffle.raffleId}`);
  } catch (error) {
    console.error('[EventHandler] Error handling RaffleCancelled event:', error);
    throw error;
  }
}
