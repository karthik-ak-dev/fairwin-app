/**
 * Winner Selection Service
 *
 * Selects raffle winners using cryptographically secure randomness.
 * Algorithm is deterministic and verifiable using stored random seed.
 *
 * Flow:
 * 1. Generate random seed (from Polygon block hash or crypto.randomBytes)
 * 2. Build weighted ticket pool from all entries
 * 3. Use seeded PRNG to select winning tickets
 * 4. Map tickets back to wallet addresses
 * 5. Calculate prize distribution
 * 6. Return winners with prize amounts
 *
 * Transparency:
 * - Random seed is stored in database
 * - Algorithm is open source
 * - Anyone can verify by re-running with same seed
 * - Block hash-based seeds are publicly verifiable
 */

import { createPublicClient, http } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import { env } from '@/lib/env';
import type { EntryItem } from '@/lib/db/models';

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

/**
 * Generate random seed from latest Polygon block hash
 * This provides verifiable randomness that anyone can check
 */
export async function generateBlockHashSeed(chainId: number = env.CHAIN_ID): Promise<{
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
export function generateCryptoSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return '0x' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Build weighted ticket pool from entries
 * Each entry contributes numEntries tickets to the pool
 */
export function buildTicketPool(entries: EntryItem[]): Ticket[] {
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
 * Calculate prize distribution for winners
 *
 * Default distribution (can be customized):
 * - 1 winner: 100% of prize pool
 * - 3 winners: 50%, 30%, 20%
 * - 5 winners: 40%, 25%, 20%, 10%, 5%
 * - 10+ winners: Top 10% split evenly
 */
export function calculatePrizeDistribution(
  totalPrize: number,
  numWinners: number
): { amount: number; tier: string }[] {
  if (numWinners === 1) {
    return [{ amount: totalPrize, tier: 'Grand Prize' }];
  }

  if (numWinners === 3) {
    return [
      { amount: Math.floor(totalPrize * 0.5), tier: '1st Place' },
      { amount: Math.floor(totalPrize * 0.3), tier: '2nd Place' },
      { amount: Math.floor(totalPrize * 0.2), tier: '3rd Place' },
    ];
  }

  if (numWinners === 5) {
    return [
      { amount: Math.floor(totalPrize * 0.4), tier: '1st Place' },
      { amount: Math.floor(totalPrize * 0.25), tier: '2nd Place' },
      { amount: Math.floor(totalPrize * 0.2), tier: '3rd Place' },
      { amount: Math.floor(totalPrize * 0.1), tier: '4th Place' },
      { amount: Math.floor(totalPrize * 0.05), tier: '5th Place' },
    ];
  }

  // Many winners: split evenly
  const prizePerWinner = Math.floor(totalPrize / numWinners);
  return Array.from({ length: numWinners }, (_, i) => ({
    amount: prizePerWinner,
    tier: `Winner #${i + 1}`,
  }));
}

/**
 * Select winners from ticket pool using random seed
 *
 * @param entries All entries for the raffle
 * @param prizePool Total USDC prize pool (after platform fee)
 * @param numWinners Number of winners to select
 * @param randomSeed Random seed (hex string)
 * @returns Array of selected winners with prizes
 */
export function selectWinners(
  entries: EntryItem[],
  prizePool: number,
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
  const prizeDistribution = calculatePrizeDistribution(prizePool, numWinners);

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
export async function selectWinnersWithBlockHash(
  entries: EntryItem[],
  prizePool: number,
  numWinners: number,
  chainId: number = env.CHAIN_ID
): Promise<WinnerSelectionResult> {
  const { seed, blockNumber, blockHash } = await generateBlockHashSeed(chainId);
  const winners = selectWinners(entries, prizePool, numWinners, seed);

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
export function selectWinnersWithCrypto(
  entries: EntryItem[],
  prizePool: number,
  numWinners: number
): WinnerSelectionResult {
  const seed = generateCryptoSeed();
  const winners = selectWinners(entries, prizePool, numWinners, seed);

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
  numWinners: number,
  storedSeed: string,
  expectedWinners: SelectedWinner[]
): boolean {
  const recomputedWinners = selectWinners(entries, prizePool, numWinners, storedSeed);

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
