/**
 * Service Layer - Central Export Point
 *
 * Provides easy access to all backend services from a single import.
 * Services handle business logic, database operations, and USDC verification.
 */

// Raffle services
export * as raffleEntry from './raffle/raffle-entry.service';
export * as raffleDraw from './raffle/raffle-draw.service';
export * as raffleManagement from './raffle/raffle-management.service';
export * as raffleQuery from './raffle/raffle-query.service';
export * as rafflePayout from './raffle/raffle-payout.service';

// User services
export * as userProfile from './user/user-profile.service';
export * as userEntry from './user/user-entry.service';

// Shared utilities
export * as platformStats from './shared/platform-stats.service';
export * from './shared/cache.service';
export * from './shared/pagination.service';

// Error types
export * from './errors';

// Types - organized by domain
export * from './raffle/types';
export * from './user/types';
export * from './shared/types';
