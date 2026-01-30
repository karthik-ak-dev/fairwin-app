# FairWin Service Layer Architecture

## Overview

This document outlines the comprehensive service layer architecture for FairWin. The service layer sits between API routes and the repository layer, encapsulating all business logic, multi-step operations, and blockchain integrations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  (app/api/*)                                                     │
│  - Request validation                                            │
│  - Auth checks                                                   │
│  - Response formatting                                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  (lib/services/*)                                                │
│  - Business logic                                                │
│  - Multi-step operations                                         │
│  - Cross-repository coordination                                 │
│  - Blockchain integration                                        │
│  - Data transformation & enrichment                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌───────────────────────────┐  ┌──────────────────────────┐
│   Repository Layer         │  │  Blockchain Layer        │
│   (lib/db/repositories/*)  │  │  (lib/blockchain/*)      │
│   - DynamoDB operations    │  │  - Contract reads        │
│   - Data access only       │  │  - Contract writes       │
└────────────────────────────┘  └──────────────────────────┘
```

## Folder Structure

```
lib/services/
├── README.md                           # Service layer overview
├── types.ts                            # Shared service types and DTOs
├── errors.ts                           # Custom service errors
├── raffle/
│   ├── raffle-entry.service.ts        # Entry creation & validation
│   ├── raffle-draw.service.ts         # Winner selection & VRF integration
│   ├── raffle-payout.service.ts       # Payout processing
│   ├── raffle-query.service.ts        # Complex raffle queries
│   ├── raffle-participant.service.ts  # Participant aggregation
│   └── raffle-validation.service.ts   # Raffle business rules
├── user/
│   ├── user-profile.service.ts        # User profile management
│   ├── user-stats.service.ts          # User statistics
│   └── user-entry.service.ts          # User entry history & enrichment
├── admin/
│   ├── admin-stats.service.ts         # Platform statistics
│   ├── admin-wallet.service.ts        # Admin wallet management
│   └── admin-payout.service.ts        # Manual payout operations
├── blockchain/
│   ├── contract-read.service.ts       # Contract state queries
│   ├── contract-write.service.ts      # Transaction submission
│   ├── vrf-callback.service.ts        # Chainlink VRF handling
│   └── wallet-balance.service.ts      # Wallet balance queries
└── shared/
    ├── cache.service.ts               # In-memory caching utilities
    ├── pagination.service.ts          # Cursor pagination helpers
    └── transaction.service.ts         # Transaction coordination (future)
```

## Service Responsibilities

### Core Principles

1. **Single Responsibility**: Each service handles one domain area
2. **Stateless**: Services don't maintain state between calls
3. **Composable**: Services can call other services
4. **Testable**: Pure functions with clear inputs/outputs
5. **Error Handling**: Throw typed errors, let routes handle HTTP responses

---

## Detailed Service Specifications

### 1. Raffle Services

#### `raffle-entry.service.ts`

**Purpose**: Handle all entry creation logic and validation

**Key Functions**:

```typescript
/**
 * Create a raffle entry with full validation and atomic updates
 *
 * Business Rules:
 * - Raffle must exist and be active/ending
 * - User cannot exceed max entries per raffle
 * - Entry must have valid transaction hash
 *
 * Side Effects:
 * - Creates entry record
 * - Updates raffle stats (totalEntries, prizePool, totalParticipants)
 * - Updates user stats (totalSpent, rafflesEntered, activeEntries)
 * - Updates platform stats (totalEntries, totalRevenue, totalUsers)
 *
 * @throws RaffleNotFoundError
 * @throws RaffleNotActiveError
 * @throws MaxEntriesExceededError
 * @throws InvalidTransactionError
 */
async function createEntry(params: CreateEntryParams): Promise<CreateEntryResult>

/**
 * Validate entry eligibility without creating
 */
async function validateEntryEligibility(raffleId: string, walletAddress: string, numEntries: number): Promise<ValidationResult>

/**
 * Get user's current entry count for a raffle
 */
async function getUserEntryCount(raffleId: string, walletAddress: string): Promise<number>

/**
 * Calculate total cost for entries (entryPrice * numEntries)
 */
function calculateEntryCost(raffle: Raffle, numEntries: number): number
```

**Dependencies**:
- `RaffleRepository` (read raffle, increment stats)
- `EntryRepository` (create entry, count by user)
- `UserRepository` (get/create user, increment stats)
- `PlatformStatsRepository` (increment entry stats)
- `RaffleValidationService` (business rules)

---

#### `raffle-draw.service.ts`

**Purpose**: Handle winner selection and draw process

**Key Functions**:

```typescript
/**
 * Initiate raffle draw with VRF request
 *
 * Business Rules:
 * - Raffle must be in active/ending status
 * - Must have at least 1 entry
 * - Can only draw once per raffle
 *
 * Flow:
 * 1. Validate raffle state
 * 2. Change status to 'drawing'
 * 3. Request randomness from Chainlink VRF
 * 4. Store VRF request ID
 *
 * @throws RaffleNotReadyError
 * @throws AlreadyDrawnError
 */
async function initiateRaffleDraw(raffleId: string): Promise<DrawInitiationResult>

/**
 * Process VRF callback and select winners
 *
 * Called by VRF callback handler when randomness is ready
 *
 * Flow:
 * 1. Fetch all entries for raffle
 * 2. Use random number to select winner(s)
 * 3. Create winner records
 * 4. Update raffle status to 'completed'
 * 5. Update stats
 */
async function selectWinners(raffleId: string, randomNumber: bigint): Promise<Winner[]>

/**
 * Weighted random selection algorithm
 *
 * Users with more entries have proportionally higher win chance
 */
function selectWinnersWeighted(entries: Entry[], randomSeed: bigint, winnerCount: number): string[]
```

**Dependencies**:
- `RaffleRepository` (read raffle, update status, store VRF request)
- `EntryRepository` (get all entries for raffle)
- `WinnerRepository` (create winners)
- `ContractWriteService` (request VRF)
- `RaffleValidationService`

---

#### `raffle-payout.service.ts`

**Purpose**: Handle winner payout processing

**Key Functions**:

```typescript
/**
 * Process payouts for all winners of a raffle
 *
 * Flow:
 * 1. Get all winners for raffle
 * 2. For each winner:
 *    - Create payout record (pending)
 *    - Submit blockchain transaction
 *    - Update payout status (paid/failed)
 * 3. Update platform stats
 *
 * @throws RaffleNotCompletedError
 * @throws InsufficientFundsError
 */
async function processRafflePayouts(raffleId: string): Promise<PayoutResult[]>

/**
 * Retry failed payout
 */
async function retryPayout(payoutId: string): Promise<PayoutResult>

/**
 * Calculate winner payout amount
 *
 * Takes into account platform fee and winner share
 */
function calculatePayoutAmount(raffle: Raffle, winnerPosition: number): number

/**
 * Get payout status for a raffle
 */
async function getPayoutStatus(raffleId: string): Promise<PayoutStatus>
```

**Dependencies**:
- `RaffleRepository`
- `WinnerRepository`
- `PayoutRepository`
- `PlatformStatsRepository`
- `ContractWriteService` (submit payout transactions)

---

#### `raffle-query.service.ts`

**Purpose**: Complex raffle queries and data enrichment

**Key Functions**:

```typescript
/**
 * Get raffle with enriched data
 *
 * Includes:
 * - Raffle details
 * - Recent entries (last 10)
 * - Winners (if completed)
 * - User-specific data (if wallet provided)
 */
async function getRaffleWithDetails(raffleId: string, walletAddress?: string): Promise<EnrichedRaffle>

/**
 * List raffles with filters and pagination
 */
async function listRaffles(params: ListRafflesParams): Promise<PaginatedRaffles>

/**
 * Get raffle statistics
 */
async function getRaffleStats(raffleId: string): Promise<RaffleStats>

/**
 * Get user's position in raffle (by entry count)
 */
async function getUserRaffleRank(raffleId: string, walletAddress: string): Promise<number>
```

**Dependencies**:
- `RaffleRepository`
- `EntryRepository`
- `WinnerRepository`
- `CacheService`

---

#### `raffle-participant.service.ts`

**Purpose**: Participant aggregation and leaderboards

**Key Functions**:

```typescript
/**
 * Aggregate participants for a raffle
 *
 * Deduplicates entries by wallet address and aggregates:
 * - Total entries per participant
 * - Total amount spent
 * - Entry timestamps
 *
 * Returns sorted by entry count (descending)
 */
async function aggregateParticipants(raffleId: string, params: PaginationParams): Promise<ParticipantList>

/**
 * Get top participants (leaderboard)
 */
async function getTopParticipants(raffleId: string, limit: number): Promise<Participant[]>

/**
 * Check if user has entered raffle
 */
async function hasUserEntered(raffleId: string, walletAddress: string): Promise<boolean>
```

**Dependencies**:
- `EntryRepository`
- `CacheService`

---

#### `raffle-validation.service.ts`

**Purpose**: Centralize all raffle business rules

**Key Functions**:

```typescript
/**
 * Validate raffle is active and accepting entries
 */
function validateRaffleActive(raffle: Raffle): void

/**
 * Validate raffle can be drawn
 */
function validateRaffleDrawable(raffle: Raffle, entryCount: number): void

/**
 * Validate entry count doesn't exceed max per user
 */
function validateMaxEntriesPerUser(currentEntries: number, newEntries: number, maxEntries: number): void

/**
 * Validate raffle configuration on creation
 */
function validateRaffleConfig(config: CreateRaffleParams): void

/**
 * Check if raffle is in valid status for operation
 */
function validateRaffleStatus(raffle: Raffle, allowedStatuses: RaffleStatus[]): void
```

---

### 2. User Services

#### `user-profile.service.ts`

**Purpose**: User profile management

**Key Functions**:

```typescript
/**
 * Get or create user profile
 */
async function getOrCreateUser(walletAddress: string): Promise<User>

/**
 * Update user profile
 */
async function updateUserProfile(walletAddress: string, updates: UserProfileUpdates): Promise<User>

/**
 * Get user statistics summary
 */
async function getUserSummary(walletAddress: string): Promise<UserSummary>
```

**Dependencies**:
- `UserRepository`

---

#### `user-entry.service.ts`

**Purpose**: User entry history and enrichment

**Key Functions**:

```typescript
/**
 * Get user's entries with raffle details
 *
 * Enriches entries with raffle info (title, type, status)
 * Uses cache to batch raffle lookups
 */
async function getUserEntriesEnriched(walletAddress: string, params: PaginationParams): Promise<EnrichedEntryList>

/**
 * Get user's active entries (in ongoing raffles)
 */
async function getActiveEntries(walletAddress: string): Promise<EnrichedEntry[]>

/**
 * Get user's entry history for specific raffle
 */
async function getRaffleEntryHistory(walletAddress: string, raffleId: string): Promise<Entry[]>
```

**Dependencies**:
- `EntryRepository`
- `RaffleRepository`
- `CacheService`

---

#### `user-stats.service.ts`

**Purpose**: User statistics and analytics

**Key Functions**:

```typescript
/**
 * Get user's win rate
 */
async function getUserWinRate(walletAddress: string): Promise<number>

/**
 * Get user's total winnings
 */
async function getTotalWinnings(walletAddress: string): Promise<number>

/**
 * Get user's raffle participation history
 */
async function getParticipationStats(walletAddress: string): Promise<ParticipationStats>
```

**Dependencies**:
- `UserRepository`
- `WinnerRepository`
- `EntryRepository`

---

### 3. Admin Services

#### `admin-stats.service.ts`

**Purpose**: Platform-wide statistics and analytics

**Key Functions**:

```typescript
/**
 * Get comprehensive platform statistics
 *
 * Includes:
 * - Total revenue, payouts, raffles, entries, users, winners
 * - Active raffles count
 * - Average pool size
 * - Payout breakdown (pending/paid/failed)
 */
async function getPlatformStats(): Promise<PlatformStats>

/**
 * Get raffle type breakdown
 */
async function getRaffleTypeStats(): Promise<TypeStats[]>

/**
 * Get revenue analytics (daily/weekly/monthly)
 */
async function getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly'): Promise<RevenueData[]>
```

**Dependencies**:
- `PlatformStatsRepository`
- `RaffleRepository`
- `PayoutRepository`

---

#### `admin-wallet.service.ts`

**Purpose**: Admin wallet management and balance tracking

**Key Functions**:

```typescript
/**
 * Get admin wallet balances
 *
 * Reads from blockchain:
 * - MATIC balance
 * - USDC balance
 * - LINK balance (for VRF)
 */
async function getAdminWalletBalances(): Promise<WalletBalances>

/**
 * Check if admin wallet has sufficient balance for operation
 */
async function validateSufficientBalance(operation: 'payout' | 'vrf', amount?: number): Promise<boolean>
```

**Dependencies**:
- `WalletBalanceService` (blockchain)

---

### 4. Blockchain Services

#### `contract-read.service.ts`

**Purpose**: Read contract state from blockchain

**Key Functions**:

```typescript
/**
 * Read raffle data from contract
 */
async function getRaffleFromContract(raffleId: string): Promise<ContractRaffle>

/**
 * Get entry verification from contract
 */
async function verifyEntryOnChain(transactionHash: string): Promise<EntryVerification>

/**
 * Get winner selection data from contract
 */
async function getWinnersFromContract(raffleId: string): Promise<string[]>

/**
 * Verify payout transaction
 */
async function verifyPayoutTransaction(transactionHash: string): Promise<PayoutVerification>
```

**Dependencies**:
- `useFairWinContract` (blockchain/client.ts)

---

#### `contract-write.service.ts`

**Purpose**: Submit transactions to blockchain

**Key Functions**:

```typescript
/**
 * Request random number from Chainlink VRF
 */
async function requestRandomness(raffleId: string): Promise<RequestRandomnessResult>

/**
 * Submit winner payout transaction
 */
async function submitPayout(winner: Winner, amount: bigint): Promise<PayoutTransaction>

/**
 * Estimate gas for transaction
 */
async function estimateGas(operation: string, params: any[]): Promise<bigint>
```

**Dependencies**:
- `useFairWinContract` (blockchain/client.ts)

---

#### `vrf-callback.service.ts`

**Purpose**: Handle Chainlink VRF callbacks

**Key Functions**:

```typescript
/**
 * Process VRF fulfillment callback
 *
 * Called by Chainlink when random number is ready
 * Triggers winner selection
 */
async function handleVRFFulfillment(requestId: string, randomNumber: bigint): Promise<void>

/**
 * Verify VRF callback authenticity
 */
function verifyVRFCallback(requestId: string, signature: string): boolean
```

**Dependencies**:
- `RaffleDrawService`
- `ContractReadService`

---

#### `wallet-balance.service.ts`

**Purpose**: Query wallet balances

**Key Functions**:

```typescript
/**
 * Get MATIC balance
 */
async function getMaticBalance(address: string): Promise<bigint>

/**
 * Get USDC balance
 */
async function getUSDCBalance(address: string): Promise<bigint>

/**
 * Get LINK balance
 */
async function getLinkBalance(address: string): Promise<bigint>

/**
 * Get all token balances
 */
async function getAllBalances(address: string): Promise<TokenBalances>
```

**Dependencies**:
- `usePublicClient` (wagmi)
- `ERC20_ABI` (blockchain/client.ts)

---

### 5. Shared Services

#### `cache.service.ts`

**Purpose**: In-memory caching for batch operations

**Key Functions**:

```typescript
/**
 * Simple in-memory cache with TTL
 */
class CacheService<K, V> {
  get(key: K): V | undefined
  set(key: K, value: V, ttlMs?: number): void
  has(key: K): boolean
  delete(key: K): void
  clear(): void

  /**
   * Batch get with fetcher for cache misses
   */
  async batchGet(keys: K[], fetcher: (keys: K[]) => Promise<Map<K, V>>): Promise<Map<K, V>>
}
```

---

#### `pagination.service.ts`

**Purpose**: Cursor-based pagination helpers

**Key Functions**:

```typescript
/**
 * Encode cursor (base64)
 */
function encodeCursor(value: string): string

/**
 * Decode cursor
 */
function decodeCursor(cursor: string): string

/**
 * Build paginated response
 */
function buildPaginatedResponse<T>(items: T[], limit: number, getCursor: (item: T) => string): PaginatedResponse<T>
```

---

## Error Handling

### Custom Error Classes

```typescript
// errors.ts

export class ServiceError extends Error {
  constructor(message: string, public code: string, public statusCode: number = 500) {
    super(message);
    this.name = 'ServiceError';
  }
}

// Raffle Errors
export class RaffleNotFoundError extends ServiceError {
  constructor(raffleId: string) {
    super(`Raffle not found: ${raffleId}`, 'RAFFLE_NOT_FOUND', 404);
  }
}

export class RaffleNotActiveError extends ServiceError {
  constructor(raffleId: string, status: string) {
    super(`Raffle is not active: ${status}`, 'RAFFLE_NOT_ACTIVE', 400);
  }
}

export class MaxEntriesExceededError extends ServiceError {
  constructor(current: number, max: number) {
    super(`Max entries exceeded: ${current}/${max}`, 'MAX_ENTRIES_EXCEEDED', 400);
  }
}

// Blockchain Errors
export class InvalidTransactionError extends ServiceError {
  constructor(txHash: string) {
    super(`Invalid transaction: ${txHash}`, 'INVALID_TRANSACTION', 400);
  }
}

export class InsufficientFundsError extends ServiceError {
  constructor(required: string, available: string) {
    super(`Insufficient funds: ${required} required, ${available} available`, 'INSUFFICIENT_FUNDS', 400);
  }
}

// Add more as needed...
```

### Error Handling in Routes

```typescript
// API routes catch service errors and map to HTTP responses

try {
  const result = await raffleEntryService.createEntry(params);
  return NextResponse.json(result);
} catch (error) {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

---

## Data Transfer Objects (DTOs)

### Shared Types

```typescript
// types.ts

// Entry Creation
export interface CreateEntryParams {
  raffleId: string;
  walletAddress: string;
  numEntries: number;
  totalPaid: number;
  transactionHash: string;
  blockNumber: number;
}

export interface CreateEntryResult {
  entryId: string;
  raffleId: string;
  walletAddress: string;
  numEntries: number;
  totalPaid: number;
  timestamp: number;
}

// Raffle Enrichment
export interface EnrichedRaffle {
  raffle: Raffle;
  recentEntries: Entry[];
  winners?: Winner[];
  userStats?: {
    entries: number;
    totalSpent: number;
    rank: number;
  };
}

// Participant Aggregation
export interface Participant {
  walletAddress: string;
  numEntries: number;
  totalPaid: number;
  firstEntryAt: number;
  lastEntryAt: number;
}

export interface ParticipantList {
  participants: Participant[];
  totalParticipants: number;
  nextCursor?: string;
}

// Add more DTOs as needed...
```

---

## Implementation Priority

### Phase 1: Critical Path (Week 1)
1. **errors.ts** - Custom error classes
2. **types.ts** - Shared DTOs
3. **raffle-validation.service.ts** - Business rules
4. **raffle-entry.service.ts** - Entry creation
5. Refactor `/api/raffles/[id]/enter` to use service

### Phase 2: Draw & Payout (Week 2)
6. **contract-read.service.ts** - Contract queries
7. **contract-write.service.ts** - Transaction submission
8. **raffle-draw.service.ts** - Winner selection
9. **raffle-payout.service.ts** - Payout processing
10. Refactor draw/payout routes

### Phase 3: User & Admin (Week 3)
11. **cache.service.ts** - Caching utilities
12. **user-entry.service.ts** - Entry enrichment
13. **raffle-participant.service.ts** - Participant aggregation
14. **admin-stats.service.ts** - Platform stats
15. Refactor user/admin routes

### Phase 4: Advanced Features (Week 4)
16. **wallet-balance.service.ts** - Balance queries
17. **vrf-callback.service.ts** - VRF handling
18. **raffle-query.service.ts** - Complex queries
19. **transaction.service.ts** - Transaction coordination

---

## Testing Strategy

### Unit Tests
- Each service method tested in isolation
- Mock all dependencies (repositories, blockchain)
- Test business logic edge cases
- Test error scenarios

### Integration Tests
- Test service interactions with real repositories (DynamoDB local)
- Test multi-step operations
- Test rollback scenarios

### E2E Tests
- Test full raffle lifecycle: create → enter → draw → payout
- Test with actual blockchain testnet (Polygon Amoy)

---

## Migration Strategy

### Step-by-Step Route Refactoring

**Before** (Current):
```typescript
// app/api/raffles/[id]/enter/route.ts (50+ lines)
export async function POST(req: Request) {
  // Parse request
  // Validate raffle
  // Validate user entries
  // Create entry
  // Update raffle stats
  // Update user stats
  // Update platform stats
  // Return response
}
```

**After** (With Service):
```typescript
// app/api/raffles/[id]/enter/route.ts (15 lines)
import { raffleEntryService } from '@/lib/services/raffle/raffle-entry.service';

export async function POST(req: Request) {
  const { raffleId, walletAddress, numEntries, totalPaid, transactionHash, blockNumber } = await req.json();

  try {
    const result = await raffleEntryService.createEntry({
      raffleId,
      walletAddress,
      numEntries,
      totalPaid,
      transactionHash,
      blockNumber,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleServiceError(error);
  }
}
```

### Gradual Migration
1. Create service
2. Add tests
3. Refactor one route to use service
4. Verify functionality
5. Repeat for remaining routes
6. Remove old code

---

## Best Practices

### Service Design
- ✅ Keep services focused (single responsibility)
- ✅ Use TypeScript types for all params and returns
- ✅ Throw typed errors, don't return error objects
- ✅ Document business rules in JSDoc
- ✅ Make services stateless (no instance variables)
- ✅ Inject dependencies (don't hardcode imports)

### Performance
- ✅ Use caching for repeated lookups
- ✅ Batch database operations when possible
- ✅ Avoid N+1 queries (use batch fetching)
- ✅ Use Promise.all for parallel operations
- ⚠️ Be cautious with Promise.all if operations should be sequential

### Security
- ✅ Validate all inputs in services (don't trust route validation)
- ✅ Sanitize wallet addresses
- ✅ Verify blockchain transactions
- ✅ Use typed errors to avoid leaking sensitive info

---

## Next Steps

1. **Review this document** - Discuss any changes needed
2. **Prioritize services** - Confirm implementation order
3. **Set up testing infrastructure** - Jest config, mocks
4. **Build Phase 1 services** - Start with entry service
5. **Refactor first route** - Validate approach
6. **Iterate** - Continue with remaining services

---

## Questions for Review

1. **Service Boundaries**: Do the service responsibilities make sense? Any overlap or gaps?
2. **Error Handling**: Is the error strategy clear? Any additional error types needed?
3. **Dependencies**: Are the service dependencies appropriate? Any circular dependency risks?
4. **Testing**: Is the testing strategy sufficient? Need more test types?
5. **Priority**: Does the implementation order make sense for your needs?
6. **Blockchain Integration**: Are the blockchain services detailed enough? Need more specifics on VRF flow?

---

*Document Version: 1.0*
*Last Updated: 2026-01-30*
