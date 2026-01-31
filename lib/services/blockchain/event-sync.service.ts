/**
 * Blockchain Event Sync Service
 *
 * Orchestrates synchronization of all blockchain events to database.
 * Called by AWS EventBridge every 30 seconds.
 *
 * Features:
 * - Syncs all event types (entries, draws, winners, cancellations)
 * - Tracks last synced block to avoid duplicates
 * - Best-effort error handling (logs errors, continues processing)
 * - Returns detailed sync summary
 */

'use server';

import { getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { parseAbiItem } from 'viem';
import { config } from '@/lib/wagmi/config';
import { getContractAddress } from '@/lib/blockchain';
import { raffleRepository } from '@/lib/db/repositories/raffle';
import { statsRepository } from '@/lib/db/repositories/shared';
import {
  handleEntrySubmittedEvent,
  handleDrawRequestedEvent,
  handleWinnersSelectedEvent,
  handleRaffleCancelledEvent,
} from './event-handlers';

export interface SyncResult {
  success: boolean;
  syncedBlocks: {
    from: number;
    to: number;
  };
  eventsProcessed: {
    entries: number;
    draws: number;
    winners: number;
    cancellations: number;
  };
  errors: Array<{
    event: string;
    error: string;
  }>;
  duration: number; // milliseconds
}

/**
 * Main sync function - syncs all events from last synced block
 */
export async function syncBlockchainEvents(
  chainId: number = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '137')
): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: Array<{ event: string; error: string }> = [];

  const result: SyncResult = {
    success: false,
    syncedBlocks: { from: 0, to: 0 },
    eventsProcessed: {
      entries: 0,
      draws: 0,
      winners: 0,
      cancellations: 0,
    },
    errors: [],
    duration: 0,
  };

  try {
    // 1. Get latest block from blockchain
    const chain = chainId === 137 ? polygon : polygonAmoy;
    const client = getPublicClient(config, { chainId: chain.id });

    if (!client) {
      throw new Error('Failed to get blockchain client');
    }

    const latestBlock = Number(await client.getBlockNumber());

    // 2. Get last synced block from database
    const lastSynced = await statsRepository.getLastSyncedBlock();
    const fromBlock = lastSynced + 1;
    const toBlock = latestBlock;

    result.syncedBlocks = { from: fromBlock, to: toBlock };

    // 3. Check if there are new blocks to sync
    if (fromBlock > toBlock) {
      console.log('[EventSync] No new blocks to sync');
      result.success = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(
      `[EventSync] Syncing blocks ${fromBlock} to ${toBlock} (${toBlock - fromBlock + 1} blocks)`
    );

    // 4. Get all active raffles
    const activeRaffles = await raffleRepository.findByStatus('active');
    console.log(`[EventSync] Found ${activeRaffles.length} active raffles`);

    // 5. Get contract address
    const addresses = getContractAddress(chainId);

    // 6. Sync events for each raffle
    for (const raffle of activeRaffles) {
      if (!raffle.contractRaffleId) {
        console.warn(
          `[EventSync] Raffle ${raffle.raffleId} missing contractRaffleId, skipping`
        );
        continue;
      }

      try {
        // 6a. Sync EntrySubmitted events
        const entryLogs = await client.getLogs({
          address: addresses.raffle,
          event: parseAbiItem(
            'event EntrySubmitted(uint256 indexed raffleId, address indexed participant, uint256 numEntries)'
          ),
          fromBlock: BigInt(fromBlock),
          toBlock: BigInt(toBlock),
          args: { raffleId: BigInt(raffle.contractRaffleId) },
        });

        for (const log of entryLogs) {
          try {
            await handleEntrySubmittedEvent(log, raffle);
            result.eventsProcessed.entries++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push({ event: `EntrySubmitted:${log.transactionHash}`, error: errorMsg });
            console.error(`[EventSync] Error handling EntrySubmitted:`, error);
          }
        }

        // 6b. Sync DrawRequested events
        const drawLogs = await client.getLogs({
          address: addresses.raffle,
          event: parseAbiItem(
            'event DrawRequested(uint256 indexed raffleId, uint256 requestId)'
          ),
          fromBlock: BigInt(fromBlock),
          toBlock: BigInt(toBlock),
          args: { raffleId: BigInt(raffle.contractRaffleId) },
        });

        for (const log of drawLogs) {
          try {
            await handleDrawRequestedEvent(log, raffle);
            result.eventsProcessed.draws++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push({ event: `DrawRequested:${log.transactionHash}`, error: errorMsg });
            console.error(`[EventSync] Error handling DrawRequested:`, error);
          }
        }

        // 6c. Sync WinnersSelected events
        const winnerLogs = await client.getLogs({
          address: addresses.raffle,
          event: parseAbiItem(
            'event WinnersSelected(uint256 indexed raffleId, address[] winners, uint256[] prizes, uint256 totalPrize, uint256 protocolFee)'
          ),
          fromBlock: BigInt(fromBlock),
          toBlock: BigInt(toBlock),
          args: { raffleId: BigInt(raffle.contractRaffleId) },
        });

        for (const log of winnerLogs) {
          try {
            await handleWinnersSelectedEvent(log, raffle);
            result.eventsProcessed.winners++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push({ event: `WinnersSelected:${log.transactionHash}`, error: errorMsg });
            console.error(`[EventSync] Error handling WinnersSelected:`, error);
          }
        }

        // 6d. Sync RaffleCancelled events
        const cancelLogs = await client.getLogs({
          address: addresses.raffle,
          event: parseAbiItem('event RaffleCancelled(uint256 indexed raffleId, string reason)'),
          fromBlock: BigInt(fromBlock),
          toBlock: BigInt(toBlock),
          args: { raffleId: BigInt(raffle.contractRaffleId) },
        });

        for (const log of cancelLogs) {
          try {
            await handleRaffleCancelledEvent(log, raffle);
            result.eventsProcessed.cancellations++;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push({
              event: `RaffleCancelled:${log.transactionHash}`,
              error: errorMsg,
            });
            console.error(`[EventSync] Error handling RaffleCancelled:`, error);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({ event: `Raffle:${raffle.raffleId}`, error: errorMsg });
        console.error(`[EventSync] Error syncing raffle ${raffle.raffleId}:`, error);
      }
    }

    // 7. Update last synced block (even if there were errors - best-effort)
    await statsRepository.updateLastSyncedBlock(
      toBlock,
      errors.length > 0 ? `${errors.length} errors occurred` : undefined
    );

    // 8. Mark as successful if all events processed
    result.success = errors.length === 0;
    result.errors = errors;
    result.duration = Date.now() - startTime;

    const totalEvents =
      result.eventsProcessed.entries +
      result.eventsProcessed.draws +
      result.eventsProcessed.winners +
      result.eventsProcessed.cancellations;

    console.log(`[EventSync] Complete: ${totalEvents} events processed in ${result.duration}ms`);
    if (errors.length > 0) {
      console.error(`[EventSync] ${errors.length} errors occurred`);
    }

    return result;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[EventSync] Fatal error:', error);

    // Try to save error to database
    try {
      await statsRepository.updateLastSyncedBlock(
        result.syncedBlocks.to || 0,
        `Fatal error: ${errorMsg}`
      );
    } catch (dbError) {
      console.error('[EventSync] Failed to save error to database:', dbError);
    }

    result.success = false;
    result.errors = [{ event: 'FATAL', error: errorMsg }];
    result.duration = Date.now() - startTime;

    return result;
  }
}
