/**
 * Database repositories - organized by shared vs game-specific
 *
 * Exports both:
 * 1. Repository classes (for direct instantiation)
 * 2. Singleton instances (for convenience)
 */

// ============================================
// Re-export classes
// ============================================

// Shared repositories
export { UserRepository } from './shared/user.repository';
export { StatsRepository } from './shared/platform-stats.repository';

// Raffle game repositories
export { RaffleRepository } from './raffle/raffle.repository';
export { EntryRepository } from './raffle/entry.repository';
export { WinnerRepository } from './raffle/winner.repository';

// ============================================
// Singleton instances (convenience exports)
// ============================================

import { UserRepository } from './shared/user.repository';
import { StatsRepository } from './shared/platform-stats.repository';
import { RaffleRepository } from './raffle/raffle.repository';
import { EntryRepository } from './raffle/entry.repository';
import { WinnerRepository } from './raffle/winner.repository';

// Shared repository instances
export const userRepo = new UserRepository();
export const statsRepo = new StatsRepository();

// Raffle game repository instances
export const raffleRepo = new RaffleRepository();
export const entryRepo = new EntryRepository();
export const winnerRepo = new WinnerRepository();
