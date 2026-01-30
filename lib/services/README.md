# FairWin Service Layer

This folder contains the business logic layer for the FairWin platform. Services sit between API routes and the repository layer, handling complex operations, validation, and blockchain integration.

## Folder Structure

```
lib/services/
├── README.md                           # This file
├── SERVICE_LAYER_ARCHITECTURE.md       # Detailed architecture documentation
├── errors.ts                           # Custom error classes
├── types.ts                            # Shared DTOs and types
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
    └── pagination.service.ts          # Cursor pagination helpers
```

## Key Principles

1. **Single Responsibility**: Each service handles one domain area
2. **Stateless**: Services don't maintain state between calls
3. **Composable**: Services can call other services
4. **Testable**: Pure functions with clear inputs/outputs
5. **Error Handling**: Throw typed errors from `errors.ts`

## Usage Examples

### In API Routes

```typescript
import { raffleEntryService } from '@/lib/services/raffle/raffle-entry.service';
import { ServiceError } from '@/lib/services/errors';

export async function POST(req: Request) {
  try {
    const params = await req.json();
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
}
```

### Service Composition

```typescript
// raffle-draw.service.ts calls other services
import { raffleValidationService } from './raffle-validation.service';
import { contractWriteService } from '../blockchain/contract-write.service';

export async function initiateRaffleDraw(raffleId: string) {
  // Use validation service
  await raffleValidationService.validateRaffleDrawable(raffleId);

  // Use blockchain service
  const vrfResult = await contractWriteService.requestRandomness(raffleId);

  // ... rest of logic
}
```

## Error Handling

All services throw typed errors from `errors.ts`:

```typescript
import { RaffleNotFoundError, MaxEntriesExceededError } from '@/lib/services/errors';

// Throw errors
if (!raffle) {
  throw new RaffleNotFoundError(raffleId);
}

if (currentEntries + numEntries > maxEntries) {
  throw new MaxEntriesExceededError(currentEntries, numEntries, maxEntries);
}
```

API routes catch these and map to HTTP responses:

- `RaffleNotFoundError` → 404
- `MaxEntriesExceededError` → 400
- `ServiceError` (base class) → 500

## Testing

### Unit Tests

```typescript
import { raffleEntryService } from './raffle-entry.service';
import { RaffleNotActiveError } from '@/lib/services/errors';

describe('raffleEntryService', () => {
  it('should throw error if raffle is not active', async () => {
    await expect(
      raffleEntryService.createEntry({ raffleId: 'completed-raffle', ... })
    ).rejects.toThrow(RaffleNotActiveError);
  });
});
```

### Integration Tests

Test services with real repositories (DynamoDB Local):

```typescript
import { raffleEntryService } from './raffle-entry.service';
import { setupDynamoDBLocal } from '@/lib/db/test-utils';

describe('raffleEntryService (integration)', () => {
  beforeAll(async () => {
    await setupDynamoDBLocal();
  });

  it('should create entry and update all repositories', async () => {
    const result = await raffleEntryService.createEntry(validParams);
    expect(result.entryId).toBeDefined();

    // Verify all side effects
    const raffle = await raffleRepository.getById(raffleId);
    expect(raffle.totalEntries).toBe(1);
  });
});
```

## Best Practices

### DO

- ✅ Keep services focused (single responsibility)
- ✅ Use TypeScript types for all params and returns
- ✅ Throw typed errors from `errors.ts`
- ✅ Document business rules in JSDoc
- ✅ Make services stateless
- ✅ Validate inputs even if route validated them

### DON'T

- ❌ Return error objects (throw typed errors instead)
- ❌ Store state in service instances
- ❌ Handle HTTP concerns (status codes, headers)
- ❌ Hardcode dependencies (use dependency injection for testing)
- ❌ Mix multiple domains in one service

## Documentation

- See [SERVICE_LAYER_ARCHITECTURE.md](./SERVICE_LAYER_ARCHITECTURE.md) for comprehensive architecture details
- Each service file has JSDoc comments explaining functions and business rules
- Error classes in [errors.ts](./errors.ts) are self-documenting with descriptive messages

## Migration Guide

### Before (Business Logic in Route)

```typescript
// app/api/raffles/[id]/enter/route.ts (50+ lines)
export async function POST(req: Request) {
  const { raffleId, walletAddress, numEntries, totalPaid, transactionHash } = await req.json();

  // Validate raffle
  const raffle = await raffleRepository.getById(raffleId);
  if (!raffle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (raffle.status !== 'active') return NextResponse.json({ error: 'Not active' }, { status: 400 });

  // Check max entries
  const entries = await entryRepository.listByUserAndRaffle(walletAddress, raffleId);
  const currentEntries = entries.reduce((sum, e) => sum + e.numEntries, 0);
  if (currentEntries + numEntries > raffle.maxEntriesPerUser) {
    return NextResponse.json({ error: 'Max entries exceeded' }, { status: 400 });
  }

  // Create entry
  const entry = await entryRepository.create({ ... });

  // Update raffle stats
  await raffleRepository.incrementEntries(raffleId, numEntries, totalPaid, false);

  // Update user stats
  const user = await userRepository.getOrCreate(walletAddress);
  await userRepository.incrementEntries(walletAddress, numEntries, totalPaid, 1);

  // Update platform stats
  await platformStatsRepository.incrementEntryStats(totalPaid, false);

  return NextResponse.json(entry);
}
```

### After (Using Service)

```typescript
// app/api/raffles/[id]/enter/route.ts (15 lines)
import { raffleEntryService } from '@/lib/services/raffle/raffle-entry.service';
import { ServiceError } from '@/lib/services/errors';

export async function POST(req: Request) {
  const params = await req.json();

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Contributing

When adding new services:

1. Create service file in appropriate domain folder
2. Define input/output types in `types.ts`
3. Create custom errors in `errors.ts` if needed
4. Write unit tests alongside service
5. Document business rules in JSDoc
6. Update this README if adding new domain folders
