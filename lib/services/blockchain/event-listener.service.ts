/**
 * Blockchain Event Listener Service
 *
 * Listens to smart contract events and records them in the database.
 * This is the SOURCE OF TRUTH for winner selection and payouts.
 *
 * Key Events:
 * - WinnersSelected: Contract selected winners and paid them automatically
 * - RaffleEntered: User entered a raffle
 * - DrawTriggered: Admin triggered VRF draw
 * - RaffleCancelled: Raffle was cancelled
 *
 * Event-Driven Architecture:
 * 1. Contract emits event (on-chain, immutable)
 * 2. Event listener catches event (this service)
 * 3. Database updated to reflect on-chain truth
 * 4. Frontend displays up-to-date information
 *
 * IMPORTANT: We do NOT control winner selection or payouts.
 * We only RECORD what the contract already did on-chain.
 */

'use client';

import { getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { parseAbiItem, decodeEventLog, type Log } from 'viem';
import { config } from '@/lib/wagmi/config';
import { FAIRWIN_ABI, getContractAddress } from '@/lib/blockchain';
import { raffleRepo, winnerRepo, payoutRepo, entryRepo } from '@/lib/db/repositories';
import type { CreateWinnerInput } from '@/lib/db/models';

/**
 * Get the appropriate public client for the chain
 */
function getClient(chainId: number = 137) {
  const chain = chainId === 137 ? polygon : polygonAmoy;
  return getPublicClient(config, { chainId: chain.id });
}

/**
 * WinnersSelected Event Structure (from FairWinRaffle.sol:713-719)
 *
 * event WinnersSelected(
 *   uint256 indexed raffleId,
 *   address[] winners,              // array of all winner addresses
 *   uint256 prizePerWinner,
 *   uint256 totalPrize,
 *   uint256 protocolFee
 * );
 *
 * This event is emitted when:
 * - Chainlink VRF callback (fulfillRandomWords) completes
 * - Contract has selected winners ON-CHAIN
 * - Contract has paid winners AUTOMATICALLY
 *
 * Our job: Record winners in database to match blockchain reality
 */
interface WinnersSelectedEvent {
  raffleId: bigint;
  winners: string[]; // Array of winner wallet addresses
  prizePerWinner: bigint;
  totalPrize: bigint;
  protocolFee: bigint;
}

/**
 * RaffleEntered Event Structure
 *
 * event EntrySubmitted(
 *   uint256 indexed raffleId,
 *   address indexed participant,
 *   uint256 numEntries
 * );
 */
interface RaffleEnteredEvent {
  raffleId: bigint;
  participant: string;
  numEntries: bigint;
}

/**
 * DrawTriggered Event Structure
 *
 * event DrawRequested(
 *   uint256 indexed raffleId,
 *   uint256 requestId
 * );
 */
interface DrawTriggeredEvent {
  raffleId: bigint;
  requestId: bigint;
}

/**
 * RaffleCancelled Event Structure
 *
 * event RaffleCancelled(
 *   uint256 indexed raffleId,
 *   string reason
 * );
 */
interface RaffleCancelledEvent {
  raffleId: bigint;
  reason: string;
}

/**
 * Listen for WinnersSelected events
 *
 * This is the CRITICAL event that records winners.
 * Contract has already:
 * 1. Received random number from VRF
 * 2. Selected winners using random number
 * 3. Transferred USDC to winners
 * 4. Emitted this event
 *
 * We just record what already happened on-chain.
 *
 * @param raffleId Optional raffle ID to filter events
 * @param fromBlock Block number to start listening from
 * @param toBlock Block number to listen until (default: 'latest')
 * @param chainId Chain ID
 */
export async function listenForWinnersSelected(
  raffleId?: string,
  fromBlock: bigint = BigInt(0),
  toBlock: bigint | 'latest' = 'latest',
  chainId: number = 137
): Promise<void> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    // Get logs for WinnersSelected event
    const logs = await client.getLogs({
      address: addresses.raffle,
      event: parseAbiItem('event WinnersSelected(uint256 indexed raffleId, address[] winners, uint256 prizePerWinner, uint256 totalPrize, uint256 protocolFee)'),
      fromBlock,
      toBlock,
      ...(raffleId && { args: { raffleId: BigInt(raffleId) } }),
    });

    // Process each event
    for (const log of logs) {
      await handleWinnersSelectedEvent(log, chainId);
    }
  } catch (error) {
    console.error('Error listening for WinnersSelected events:', error);
    throw error;
  }
}

/**
 * Handle a single WinnersSelected event
 *
 * Records all winners and creates payout records (status='paid')
 * since contract already paid them.
 *
 * IMPORTANT: Payouts are created with status='paid' because
 * the contract already sent USDC to winners automatically.
 * We are NOT processing payouts - just recording what happened.
 *
 * @param log Event log from blockchain
 * @param chainId Chain ID
 */
export async function handleWinnersSelectedEvent(
  log: Log,
  chainId: number = 137
): Promise<void> {
  try {
    // Decode event data
    const decoded = decodeEventLog({
      abi: FAIRWIN_ABI,
      data: log.data,
      topics: log.topics,
    });

    const event = decoded.args as unknown as WinnersSelectedEvent;
    const raffleId = event.raffleId.toString();

    console.log(`Processing WinnersSelected event for raffle ${raffleId}`);
    console.log(`Winners: ${event.winners.length}, Prize per winner: ${event.prizePerWinner}`);

    // Get raffle details
    const raffle = await raffleRepo.getById(raffleId);
    if (!raffle) {
      console.error(`Raffle ${raffleId} not found in database`);
      return;
    }

    // Get total entries for calculating ticket numbers
    const entriesResult = await entryRepo.getByRaffle(raffleId);
    const totalTickets = entriesResult.items.reduce((sum, entry) => sum + entry.numEntries, 0);

    // Create winner records for each winner
    for (let i = 0; i < event.winners.length; i++) {
      const winnerAddress = event.winners[i];
      const prizeAmount = Number(event.prizePerWinner);

      // Determine tier based on position
      const tier = getTierLabel(i, event.winners.length);

      // Create winner record
      const winnerInput: CreateWinnerInput = {
        raffleId,
        walletAddress: winnerAddress.toLowerCase(),
        ticketNumber: i + 1, // Position in winner array (simplified)
        totalTickets,
        prize: prizeAmount,
        tier,
      };

      const winner = await winnerRepo.create(winnerInput);
      console.log(`Created winner record: ${winner.winnerId} for ${winnerAddress}`);

      // Create payout record with status='paid'
      // Contract already paid winners, we're just recording it
      await payoutRepo.create({
        winnerId: winner.winnerId,
        raffleId,
        walletAddress: winnerAddress.toLowerCase(),
        amount: prizeAmount,
      });

      // Update payout to 'paid' status with transaction hash
      const payoutResult = await payoutRepo.getByWinner(winner.winnerId);
      if (payoutResult.items.length > 0) {
        const payout = payoutResult.items[0];
        await payoutRepo.updateStatus(
          payout.payoutId,
          'paid',
          log.transactionHash || undefined
        );
        console.log(`Marked payout as paid: ${payout.payoutId}`);
      }
    }

    // Update raffle status to 'completed'
    await raffleRepo.update(raffleId, {
      status: 'completed',
      vrfRandomWord: event.totalPrize.toString(), // Store some VRF data for verification
    });

    console.log(`Raffle ${raffleId} marked as completed with ${event.winners.length} winners`);
  } catch (error) {
    console.error('Error handling WinnersSelected event:', error);
    throw error;
  }
}

/**
 * Get tier label based on winner position
 *
 * @param index Zero-based index of winner in array
 * @param totalWinners Total number of winners
 * @returns Tier label (e.g., "1st", "2nd", "3rd")
 */
function getTierLabel(index: number, totalWinners: number): string {
  if (totalWinners === 1) {
    return 'Winner';
  }

  const position = index + 1;
  switch (position) {
    case 1:
      return '1st';
    case 2:
      return '2nd';
    case 3:
      return '3rd';
    default:
      return `${position}th`;
  }
}

/**
 * Listen for RaffleEntered (EntrySubmitted) events
 *
 * Records entries from blockchain events.
 * Useful for syncing database with on-chain reality.
 *
 * @param raffleId Optional raffle ID to filter events
 * @param fromBlock Block number to start listening from
 * @param toBlock Block number to listen until (default: 'latest')
 * @param chainId Chain ID
 */
export async function listenForRaffleEntered(
  raffleId?: string,
  fromBlock: bigint = BigInt(0),
  toBlock: bigint | 'latest' = 'latest',
  chainId: number = 137
): Promise<void> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    // Get logs for EntrySubmitted event
    const logs = await client.getLogs({
      address: addresses.raffle,
      event: parseAbiItem('event EntrySubmitted(uint256 indexed raffleId, address indexed participant, uint256 numEntries)'),
      fromBlock,
      toBlock,
      ...(raffleId && { args: { raffleId: BigInt(raffleId) } }),
    });

    // Process each event
    for (const log of logs) {
      await handleRaffleEnteredEvent(log, chainId);
    }

    console.log(`Processed ${logs.length} EntrySubmitted events`);
  } catch (error) {
    console.error('Error listening for EntrySubmitted events:', error);
    throw error;
  }
}

/**
 * Handle a single RaffleEntered event
 *
 * Verifies entry exists in database, updates stats if needed.
 *
 * @param log Event log from blockchain
 * @param chainId Chain ID
 */
export async function handleRaffleEnteredEvent(
  log: Log,
  chainId: number = 137
): Promise<void> {
  try {
    const decoded = decodeEventLog({
      abi: FAIRWIN_ABI,
      data: log.data,
      topics: log.topics,
    });

    const event = decoded.args as unknown as RaffleEnteredEvent;
    const raffleId = event.raffleId.toString();

    console.log(`Processing EntrySubmitted event for raffle ${raffleId}, participant ${event.participant}`);

    // Entry should already exist (created when user submitted transaction)
    // This is mainly for verification and sync purposes
    const entries = await entryRepo.getUserEntriesForRaffle(
      raffleId,
      event.participant.toLowerCase()
    );

    if (entries.length === 0) {
      console.warn(`Entry not found in database for raffle ${raffleId}, user ${event.participant}`);
      // Could create entry here if needed for recovery
    } else {
      console.log(`Verified entry exists for raffle ${raffleId}, user ${event.participant}`);
    }
  } catch (error) {
    console.error('Error handling EntrySubmitted event:', error);
    // Don't throw - this is non-critical sync operation
  }
}

/**
 * Listen for DrawRequested (DrawTriggered) events
 *
 * Updates raffle status when draw is triggered.
 *
 * @param raffleId Optional raffle ID to filter events
 * @param fromBlock Block number to start listening from
 * @param toBlock Block number to listen until (default: 'latest')
 * @param chainId Chain ID
 */
export async function listenForDrawTriggered(
  raffleId?: string,
  fromBlock: bigint = BigInt(0),
  toBlock: bigint | 'latest' = 'latest',
  chainId: number = 137
): Promise<void> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    // Get logs for DrawRequested event
    const logs = await client.getLogs({
      address: addresses.raffle,
      event: parseAbiItem('event DrawRequested(uint256 indexed raffleId, uint256 requestId)'),
      fromBlock,
      toBlock,
      ...(raffleId && { args: { raffleId: BigInt(raffleId) } }),
    });

    // Process each event
    for (const log of logs) {
      await handleDrawTriggeredEvent(log, chainId);
    }

    console.log(`Processed ${logs.length} DrawRequested events`);
  } catch (error) {
    console.error('Error listening for DrawRequested events:', error);
    throw error;
  }
}

/**
 * Handle a single DrawTriggered event
 *
 * Updates raffle status to 'drawing' and stores VRF request ID.
 *
 * @param log Event log from blockchain
 * @param chainId Chain ID
 */
export async function handleDrawTriggeredEvent(
  log: Log,
  chainId: number = 137
): Promise<void> {
  try {
    const decoded = decodeEventLog({
      abi: FAIRWIN_ABI,
      data: log.data,
      topics: log.topics,
    });

    const event = decoded.args as unknown as DrawTriggeredEvent;
    const raffleId = event.raffleId.toString();

    console.log(`Processing DrawRequested event for raffle ${raffleId}, requestId ${event.requestId}`);

    // Update raffle status to 'drawing'
    await raffleRepo.update(raffleId, {
      status: 'drawing',
      vrfRequestId: event.requestId.toString(),
    });

    console.log(`Raffle ${raffleId} status updated to 'drawing'`);
  } catch (error) {
    console.error('Error handling DrawRequested event:', error);
    throw error;
  }
}

/**
 * Listen for RaffleCancelled events
 *
 * Updates raffle status when cancelled.
 *
 * @param raffleId Optional raffle ID to filter events
 * @param fromBlock Block number to start listening from
 * @param toBlock Block number to listen until (default: 'latest')
 * @param chainId Chain ID
 */
export async function listenForRaffleCancelled(
  raffleId?: string,
  fromBlock: bigint = BigInt(0),
  toBlock: bigint | 'latest' = 'latest',
  chainId: number = 137
): Promise<void> {
  try {
    const client = getClient(chainId);
    const addresses = getContractAddress(chainId);

    // Get logs for RaffleCancelled event
    const logs = await client.getLogs({
      address: addresses.raffle,
      event: parseAbiItem('event RaffleCancelled(uint256 indexed raffleId, string reason)'),
      fromBlock,
      toBlock,
      ...(raffleId && { args: { raffleId: BigInt(raffleId) } }),
    });

    // Process each event
    for (const log of logs) {
      await handleRaffleCancelledEvent(log, chainId);
    }

    console.log(`Processed ${logs.length} RaffleCancelled events`);
  } catch (error) {
    console.error('Error listening for RaffleCancelled events:', error);
    throw error;
  }
}

/**
 * Handle a single RaffleCancelled event
 *
 * Updates raffle status to 'cancelled'.
 *
 * @param log Event log from blockchain
 * @param chainId Chain ID
 */
export async function handleRaffleCancelledEvent(
  log: Log,
  chainId: number = 137
): Promise<void> {
  try {
    const decoded = decodeEventLog({
      abi: FAIRWIN_ABI,
      data: log.data,
      topics: log.topics,
    });

    const event = decoded.args as unknown as RaffleCancelledEvent;
    const raffleId = event.raffleId.toString();

    console.log(`Processing RaffleCancelled event for raffle ${raffleId}, reason: ${event.reason}`);

    // Update raffle status to 'cancelled'
    await raffleRepo.update(raffleId, {
      status: 'cancelled',
    });

    console.log(`Raffle ${raffleId} status updated to 'cancelled'`);
  } catch (error) {
    console.error('Error handling RaffleCancelled event:', error);
    throw error;
  }
}

/**
 * Sync all events for a raffle
 *
 * Convenience function to sync all events for a specific raffle.
 * Useful for recovering state or verifying database matches blockchain.
 *
 * @param raffleId Raffle ID to sync
 * @param fromBlock Block number to start from (default: 0)
 * @param chainId Chain ID
 */
export async function syncRaffleEvents(
  raffleId: string,
  fromBlock: bigint = BigInt(0),
  chainId: number = 137
): Promise<void> {
  console.log(`Syncing all events for raffle ${raffleId} from block ${fromBlock}`);

  try {
    // Sync all event types
    await Promise.all([
      listenForRaffleEntered(raffleId, fromBlock, 'latest', chainId),
      listenForDrawTriggered(raffleId, fromBlock, 'latest', chainId),
      listenForWinnersSelected(raffleId, fromBlock, 'latest', chainId),
      listenForRaffleCancelled(raffleId, fromBlock, 'latest', chainId),
    ]);

    console.log(`Successfully synced all events for raffle ${raffleId}`);
  } catch (error) {
    console.error(`Error syncing events for raffle ${raffleId}:`, error);
    throw error;
  }
}

/**
 * Sync all events from a specific block
 *
 * Useful for initial sync or recovery after downtime.
 *
 * @param fromBlock Block number to start from
 * @param toBlock Block number to end at (default: 'latest')
 * @param chainId Chain ID
 */
export async function syncAllEvents(
  fromBlock: bigint,
  toBlock: bigint | 'latest' = 'latest',
  chainId: number = 137
): Promise<void> {
  console.log(`Syncing all events from block ${fromBlock} to ${toBlock}`);

  try {
    // Sync all event types without raffle filter
    await Promise.all([
      listenForRaffleEntered(undefined, fromBlock, toBlock, chainId),
      listenForDrawTriggered(undefined, fromBlock, toBlock, chainId),
      listenForWinnersSelected(undefined, fromBlock, toBlock, chainId),
      listenForRaffleCancelled(undefined, fromBlock, toBlock, chainId),
    ]);

    console.log(`Successfully synced all events from block ${fromBlock}`);
  } catch (error) {
    console.error(`Error syncing all events:`, error);
    throw error;
  }
}
