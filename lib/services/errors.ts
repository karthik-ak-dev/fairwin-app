/**
 * Service Layer Error Classes
 *
 * Custom errors for service layer operations.
 * Each error includes a code and HTTP status for easy mapping in API routes.
 */

export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

// ============================================================================
// Raffle Errors
// ============================================================================

export class RaffleNotFoundError extends ServiceError {
  constructor(raffleId: string) {
    super(`Raffle not found: ${raffleId}`, 'RAFFLE_NOT_FOUND', 404);
  }
}

export class RaffleNotActiveError extends ServiceError {
  constructor(raffleId: string, status: string) {
    super(
      `Raffle is not active (current status: ${status})`,
      'RAFFLE_NOT_ACTIVE',
      400
    );
  }
}

export class RaffleNotDrawableError extends ServiceError {
  constructor(reason: string) {
    super(`Raffle cannot be drawn: ${reason}`, 'RAFFLE_NOT_DRAWABLE', 400);
  }
}

export class RaffleAlreadyDrawnError extends ServiceError {
  constructor(raffleId: string) {
    super(`Raffle already drawn: ${raffleId}`, 'RAFFLE_ALREADY_DRAWN', 400);
  }
}

export class MaxEntriesExceededError extends ServiceError {
  constructor(current: number, additional: number, max: number) {
    super(
      `Max entries exceeded: ${current} current + ${additional} new = ${current + additional}, max allowed: ${max}`,
      'MAX_ENTRIES_EXCEEDED',
      400
    );
  }
}

export class InvalidRaffleConfigError extends ServiceError {
  constructor(field: string, reason: string) {
    super(`Invalid raffle config - ${field}: ${reason}`, 'INVALID_RAFFLE_CONFIG', 400);
  }
}

// ============================================================================
// Entry Errors
// ============================================================================

export class InvalidEntryError extends ServiceError {
  constructor(reason: string) {
    super(`Invalid entry: ${reason}`, 'INVALID_ENTRY', 400);
  }
}

export class EntryNotFoundError extends ServiceError {
  constructor(entryId: string) {
    super(`Entry not found: ${entryId}`, 'ENTRY_NOT_FOUND', 404);
  }
}

// ============================================================================
// User Errors
// ============================================================================

export class UserNotFoundError extends ServiceError {
  constructor(walletAddress: string) {
    super(`User not found: ${walletAddress}`, 'USER_NOT_FOUND', 404);
  }
}

export class InvalidWalletAddressError extends ServiceError {
  constructor(address: string) {
    super(`Invalid wallet address: ${address}`, 'INVALID_WALLET_ADDRESS', 400);
  }
}

// ============================================================================
// Blockchain Errors
// ============================================================================

export class InvalidTransactionError extends ServiceError {
  constructor(txHash: string, reason?: string) {
    super(
      `Invalid transaction ${txHash}${reason ? `: ${reason}` : ''}`,
      'INVALID_TRANSACTION',
      400
    );
  }
}

export class InsufficientFundsError extends ServiceError {
  constructor(required: string, available: string) {
    super(
      `Insufficient funds: ${required} required, ${available} available`,
      'INSUFFICIENT_FUNDS',
      400
    );
  }
}

export class ContractReadError extends ServiceError {
  constructor(method: string, reason?: string) {
    super(
      `Failed to read contract method ${method}${reason ? `: ${reason}` : ''}`,
      'CONTRACT_READ_ERROR',
      500
    );
  }
}

export class ContractWriteError extends ServiceError {
  constructor(method: string, reason?: string) {
    super(
      `Failed to execute contract method ${method}${reason ? `: ${reason}` : ''}`,
      'CONTRACT_WRITE_ERROR',
      500
    );
  }
}

export class VRFRequestError extends ServiceError {
  constructor(reason: string) {
    super(`VRF request failed: ${reason}`, 'VRF_REQUEST_ERROR', 500);
  }
}

// ============================================================================
// Payout Errors
// ============================================================================

export class PayoutNotFoundError extends ServiceError {
  constructor(payoutId: string) {
    super(`Payout not found: ${payoutId}`, 'PAYOUT_NOT_FOUND', 404);
  }
}

export class PayoutAlreadyProcessedError extends ServiceError {
  constructor(payoutId: string, status: string) {
    super(
      `Payout already processed: ${payoutId} (status: ${status})`,
      'PAYOUT_ALREADY_PROCESSED',
      400
    );
  }
}

export class PayoutFailedError extends ServiceError {
  constructor(payoutId: string, reason: string) {
    super(`Payout failed: ${payoutId} - ${reason}`, 'PAYOUT_FAILED', 500);
  }
}

// ============================================================================
// Validation Errors
// ============================================================================

export class ValidationError extends ServiceError {
  constructor(field: string, reason: string) {
    super(`Validation failed - ${field}: ${reason}`, 'VALIDATION_ERROR', 400);
  }
}

export class InvalidStatusTransitionError extends ServiceError {
  constructor(from: string, to: string) {
    super(
      `Invalid status transition: ${from} -> ${to}`,
      'INVALID_STATUS_TRANSITION',
      400
    );
  }
}

// ============================================================================
// Winner Errors
// ============================================================================

export class WinnerNotFoundError extends ServiceError {
  constructor(winnerId: string) {
    super(`Winner not found: ${winnerId}`, 'WINNER_NOT_FOUND', 404);
  }
}

export class NoEntriesForDrawError extends ServiceError {
  constructor(raffleId: string) {
    super(`No entries found for raffle: ${raffleId}`, 'NO_ENTRIES_FOR_DRAW', 400);
  }
}
