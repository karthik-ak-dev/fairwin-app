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
export * as raffleParticipant from './raffle/raffle-participant.service';
export * as raffleValidation from './raffle/raffle-validation.service';
export * as raffleStatus from './raffle/raffle-status.service';
export * as raffleWinnerSelection from './raffle/raffle-winner-selection.service';

// User services
export * as userProfile from './user/user-profile.service';
export * as userEntry from './user/user-entry.service';

// Admin services
export * as adminStats from './admin/admin-stats.service';
export * as adminPayout from './admin/admin-payout.service';

// Blockchain services (read-only for USDC verification)
export * as usdcTransferVerification from './blockchain/usdc-transfer-verification.service';

// Audit services
export * as auditTrail from './audit/audit-trail.service';

// Shared utilities
export * from './shared/cache.service';
export * from './shared/pagination.service';

// Error types
export * from './errors';

// Types
export * from './types';
