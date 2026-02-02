/**
 * Raffle Draw Service
 *
 * Handles instant winner selection without blockchain VRF.
 * Winners are selected immediately using crypto-secure randomness.
 *
 * This service combines:
 * - Winner selection logic with seeded PRNG
 * - Prize distribution calculations
 * - Raffle draw orchestration
 * - Winner record creation
 *
 * Flow:
 * 1. Validate raffle can be drawn
 * 2. Get all entries for raffle
 * 3. Generate random seed (block hash or crypto.random)
 * 4. Select winners deterministically using seed
 * 5. Create winner records with payoutStatus='pending'
 * 6. Update raffle status to 'completed'
 *
 * NO VRF, NO blockchain writes, NO event listeners
 *
 * Transparency:
 * - Random seed is stored in database
 * - Algorithm is open source
 * - Anyone can verify by re-running with same seed
 * - Block hash-based seeds are publicly verifiable
 */

import { createPublicClient, http } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import { raffleRepo, entryRepo, winnerRepo, userRepo, statsRepo } from '@/lib/db/repositories';
import { RaffleStatus, PayoutStatus } from '@/lib/db/models';
import type { EntryItem } from '@/lib/db/models';
import type { DrawInitiationResult } from '../types';
import { RaffleNotFoundError } from '../errors';
import { validateRaffleDrawable } from './raffle-validation.service';
import { env } from '@/lib/env';

// ============================================================================
// Winner Selection Types & Classes
// ============================================================================

/**
 * Seeded pseudo-random number generator (PRNG)
 * Uses mulberry32 algorithm for deterministic randomness
 */
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    // Convert hex seed to number
    this.seed = parseInt(seed.slice(0, 10), 16);
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

export interface Ticket {
  ticketNumber: number; // 0-indexed position in pool
  walletAddress: string;
  entryId: string;
}

export interface SelectedWinner {
  walletAddress: string;
  ticketNumber: number;
  totalTickets: number;
  prize: number; // In USDC smallest unit
  tier: string;
  position: number; // 1 = first, 2 = second, etc.
}

export interface WinnerSelectionResult {
  winners: SelectedWinner[];
  randomSeed: string;
  totalTickets: number;
  totalPrize: number;
  blockNumber?: bigint;
  blockHash?: string;
}

export interface PrizeTierConfig {
  name: string;
  percentage: number;
  winnerCount: number;
}

// ============================================================================
// Randomness Generation
// ============================================================================

/**
 * Generate random seed from latest Polygon block hash
 * This provides verifiable randomness that anyone can check
 */
async function generateBlockHashSeed(chainId: number = env.CHAIN_ID): Promise<{
  seed: string;
  blockNumber: bigint;
  blockHash: string;
}> {
  const chain = chainId === 137 ? polygon : polygonAmoy;
  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const blockNumber = await client.getBlockNumber();
  const block = await client.getBlock({ blockNumber });

  return {
    seed: block.hash,
    blockNumber: block.number,
    blockHash: block.hash,
  };
}

/**
 * Generate random seed from crypto.randomBytes
 * Faster than block hash but not publicly verifiable
 */
function generateCryptoSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return '0x' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// Winner Selection Logic
// ============================================================================

/**
 * Build weighted ticket pool from entries
 * Each entry contributes numEntries tickets to the pool
 */
function buildTicketPool(entries: EntryItem[]): Ticket[] {
  const tickets: Ticket[] = [];

  for (const entry of entries) {
    for (let i = 0; i < entry.numEntries; i++) {
      tickets.push({
        ticketNumber: tickets.length,
        walletAddress: entry.walletAddress,
        entryId: entry.entryId,
      });
    }
  }

  return tickets;
}

/**
 * Calculate tiered prize distribution
 *
 * Tiered Reward System:
 * - Platform takes X% fee from total pool (configured, default 5%)
 * - Remaining amount is distributed across prize tiers
 * - Each tier gets a percentage of the distributable prize
 * - Winners within a tier split the tier's allocation equally
 *
 * Example with default 3-tier system (100 USDC pool, 5% platform fee):
 * - Platform fee: 5 USDC
 * - Distributable: 95 USDC
 *   - Tier 1 (40%): 38 USDC → 1 winner gets 38 USDC
 *   - Tier 2 (30%): 28.5 USDC → 4 winners get 7.125 USDC each
 *   - Tier 3 (30%): 28.5 USDC → Remaining winners split equally
 *
 * @param totalPrize Total prize pool after platform fee (distributable amount)
 * @param prizeTiers Prize tier configuration
 * @param actualWinnerCount Actual number of winners (may be less than tier total if few participants)
 * @returns Array of prize amounts with tier info for each winner position
 */
function calculatePrizeDistribution(
  totalPrize: number,
  prizeTiers: PrizeTierConfig[],
  actualWinnerCount: number
): { amount: number; tier: string; tierIndex: number }[] {
  const distribution: { amount: number; tier: string; tierIndex: number }[] = [];
  let remainingWinners = actualWinnerCount;

  for (let tierIndex = 0; tierIndex < prizeTiers.length; tierIndex++) {
    const tier = prizeTiers[tierIndex];

    if (remainingWinners <= 0) break;

    // Calculate tier allocation (percentage of total distributable prize)
    const tierAllocation = Math.floor((totalPrize * tier.percentage) / 100);

    // Determine how many winners in this tier
    const winnersInTier = Math.min(tier.winnerCount, remainingWinners);

    // Split tier allocation among winners
    const prizePerWinner = Math.floor(tierAllocation / winnersInTier);

    // Add each winner in this tier
    for (let i = 0; i < winnersInTier; i++) {
      distribution.push({
        amount: prizePerWinner,
        tier: `${tier.name} (${i + 1}/${winnersInTier})`,
        tierIndex,
      });
    }

    remainingWinners -= winnersInTier;
  }

  return distribution;
}

/**
 * Select winners from ticket pool using random seed
 *
 * @param entries All entries for the raffle
 * @param prizePool Total USDC prize pool (after platform fee)
 * @param prizeTiers Prize tier configuration
 * @param numWinners Number of winners to select
 * @param randomSeed Random seed (hex string)
 * @returns Array of selected winners with prizes
 */
function selectWinners(
  entries: EntryItem[],
  prizePool: number,
  prizeTiers: PrizeTierConfig[],
  numWinners: number,
  randomSeed: string
): SelectedWinner[] {
  // Build ticket pool
  const tickets = buildTicketPool(entries);
  const totalTickets = tickets.length;

  if (totalTickets === 0) {
    throw new Error('No tickets in raffle');
  }

  if (numWinners > totalTickets) {
    throw new Error(`Cannot select ${numWinners} winners from ${totalTickets} tickets`);
  }

  // Initialize seeded RNG
  const rng = new SeededRandom(randomSeed);

  // Select unique winning tickets
  const winningTicketNumbers = new Set<number>();
  while (winningTicketNumbers.size < numWinners) {
    const ticketNumber = rng.nextInt(0, totalTickets);
    winningTicketNumbers.add(ticketNumber);
  }

  // Get winning tickets
  const winningTickets = Array.from(winningTicketNumbers)
    .sort((a, b) => a - b) // Sort for consistent ordering
    .map((num) => tickets[num]);

  // Calculate prize distribution
  const prizeDistribution = calculatePrizeDistribution(prizePool, prizeTiers, numWinners);

  // Map to winners with prizes
  const winners: SelectedWinner[] = winningTickets.map((ticket, index) => ({
    walletAddress: ticket.walletAddress,
    ticketNumber: ticket.ticketNumber,
    totalTickets,
    prize: prizeDistribution[index].amount,
    tier: prizeDistribution[index].tier,
    position: index + 1,
  }));

  return winners;
}

/**
 * Select winners using block hash for randomness (recommended)
 *
 * Provides publicly verifiable randomness
 */
async function selectWinnersWithBlockHash(
  entries: EntryItem[],
  prizePool: number,
  prizeTiers: PrizeTierConfig[],
  numWinners: number,
  chainId: number = env.CHAIN_ID
): Promise<WinnerSelectionResult> {
  const { seed, blockNumber, blockHash } = await generateBlockHashSeed(chainId);
  const winners = selectWinners(entries, prizePool, prizeTiers, numWinners, seed);

  return {
    winners,
    randomSeed: seed,
    totalTickets: buildTicketPool(entries).length,
    totalPrize: prizePool,
    blockNumber,
    blockHash,
  };
}

/**
 * Select winners using crypto random (faster, not verifiable)
 */
function selectWinnersWithCrypto(
  entries: EntryItem[],
  prizePool: number,
  prizeTiers: PrizeTierConfig[],
  numWinners: number
): WinnerSelectionResult {
  const seed = generateCryptoSeed();
  const winners = selectWinners(entries, prizePool, prizeTiers, numWinners, seed);

  return {
    winners,
    randomSeed: seed,
    totalTickets: buildTicketPool(entries).length,
    totalPrize: prizePool,
  };
}

/**
 * Verify winner selection by reproducing with stored seed
 * Used for transparency and dispute resolution
 */
export function verifyWinnerSelection(
  entries: EntryItem[],
  prizePool: number,
  prizeTiers: PrizeTierConfig[],
  numWinners: number,
  storedSeed: string,
  expectedWinners: SelectedWinner[]
): boolean {
  const recomputedWinners = selectWinners(entries, prizePool, prizeTiers, numWinners, storedSeed);

  // Check if winners match
  if (recomputedWinners.length !== expectedWinners.length) {
    return false;
  }

  for (let i = 0; i < recomputedWinners.length; i++) {
    const recomputed = recomputedWinners[i];
    const expected = expectedWinners[i];

    if (
      recomputed.walletAddress.toLowerCase() !== expected.walletAddress.toLowerCase() ||
      recomputed.ticketNumber !== expected.ticketNumber ||
      recomputed.prize !== expected.prize
    ) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Raffle Draw Orchestration
// ============================================================================

/**
 * Initiate raffle draw with instant winner selection
 *
 * Business Rules:
 * - Raffle must be in active or ending status
 * - Raffle end time must have passed
 * - Must have at least 1 entry
 * - Can only draw once per raffle
 *
 * Flow:
 * 1. Validate raffle state
 * 2. Get all entries
 * 3. Change status to 'drawing'
 * 4. Generate random seed and select winners
 * 5. Create winner records
 * 6. Update user stats
 * 7. Change status to 'completed'
 *
 * @param raffleId Raffle ID to draw
 * @param useBlockHash Use block hash for seed (verifiable) vs crypto random (faster)
 * @returns Draw result with winners
 * @throws RaffleNotFoundError if raffle doesn't exist
 * @throws RaffleNotDrawableError if raffle cannot be drawn
 * @throws RaffleAlreadyDrawnError if raffle already drawn
 */
export async function initiateRaffleDraw(
  raffleId: string,
  useBlockHash: boolean = true
): Promise<DrawInitiationResult> {
  // Get raffle
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Get all entries
  const entriesResult = await entryRepo.getByRaffle(raffleId);
  const entries = entriesResult.items;

  // Validate raffle can be drawn (includes all status, time, and entry checks)
  validateRaffleDrawable(raffle, entries.length);

  // Update status to drawing
  await raffleRepo.update(raffleId, {
    status: RaffleStatus.DRAWING,
    drawTime: new Date().toISOString(),
  });

  console.log(`[DrawService] Starting draw for raffle ${raffleId} with ${entries.length} entries`);

  // Select winners using chosen randomness method with prize tiers
  const selectionResult = useBlockHash
    ? await selectWinnersWithBlockHash(entries, raffle.winnerPayout, raffle.prizeTiers, raffle.winnerCount, env.CHAIN_ID)
    : selectWinnersWithCrypto(entries, raffle.winnerPayout, raffle.prizeTiers, raffle.winnerCount);

  console.log(`[DrawService] Selected ${selectionResult.winners.length} winners using ${useBlockHash ? 'block hash' : 'crypto random'}`);

  // Create winner records in database
  await createWinnerRecords(raffleId, selectionResult.winners);

  // Update user stats for all winners
  await updateWinnerStats(raffleId, selectionResult.winners);

  // Update raffle to completed
  await raffleRepo.update(raffleId, {
    status: RaffleStatus.COMPLETED,
    randomSeed: selectionResult.randomSeed,
  });

  console.log(`[DrawService] Draw completed for raffle ${raffleId}`);

  return {
    raffleId,
    winners: selectionResult.winners,
    randomSeed: selectionResult.randomSeed,
    blockHash: selectionResult.blockHash,
    status: RaffleStatus.COMPLETED,
    timestamp: Date.now(),
  };
}

/**
 * Create winner records in database (batch operation for efficiency)
 */
async function createWinnerRecords(raffleId: string, winners: SelectedWinner[]): Promise<void> {
  const winnerInputs = winners.map(winner => ({
    raffleId,
    walletAddress: winner.walletAddress,
    ticketNumber: winner.ticketNumber,
    totalTickets: winner.totalTickets,
    prize: winner.prize,
    tier: winner.tier,
    payoutStatus: PayoutStatus.PENDING, // Admin will send payouts later
  }));

  await winnerRepo.batchCreate(winnerInputs);

  console.log(`[DrawService] Created ${winners.length} winner records in batch`);
}

/**
 * Update user stats for winners (parallel execution for efficiency)
 */
async function updateWinnerStats(raffleId: string, winners: SelectedWinner[]): Promise<void> {
  // Get unique winners (same user might win multiple times)
  const uniqueWinners = new Map<string, number>();
  for (const winner of winners) {
    const currentPrize = uniqueWinners.get(winner.walletAddress) || 0;
    uniqueWinners.set(winner.walletAddress, currentPrize + winner.prize);
  }

  // Update stats for all unique winners in parallel
  const userUpdatePromises = Array.from(uniqueWinners.entries()).map(
    ([walletAddress, totalWon]) => userRepo.recordWin(walletAddress, raffleId, totalWon)
  );

  // Update platform stats in parallel with user updates
  const totalPrize = winners.reduce((sum, w) => sum + w.prize, 0);
  const platformUpdatePromise = statsRepo.recordPayout(totalPrize, winners.length);

  await Promise.all([...userUpdatePromises, platformUpdatePromise]);

  console.log(`[DrawService] Updated stats for ${uniqueWinners.size} unique winners`);
}

/**
 * Check if raffle is ready to be drawn
 */
export async function isRaffleReadyForDraw(raffleId: string): Promise<{
  ready: boolean;
  reason?: string;
}> {
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    return { ready: false, reason: 'Raffle not found' };
  }

  if (raffle.status === RaffleStatus.COMPLETED) {
    return { ready: false, reason: 'Raffle already drawn' };
  }

  if (raffle.status === RaffleStatus.CANCELLED) {
    return { ready: false, reason: 'Raffle cancelled' };
  }

  const now = new Date().getTime();
  const endTime = new Date(raffle.endTime).getTime();

  if (now < endTime) {
    return { ready: false, reason: 'Raffle has not ended yet' };
  }

  const entriesResult = await entryRepo.getByRaffle(raffleId);
  if (entriesResult.items.length === 0) {
    return { ready: false, reason: 'No entries in raffle' };
  }

  return { ready: true };
}
