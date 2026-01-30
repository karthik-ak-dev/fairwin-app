# Business Logic Alignment Fixes - Implementation Tracker

**Date Created**: 2026-01-30
**Status**: Ready for Implementation
**Priority**: CRITICAL - Core business logic alignment with smart contract

---

## Overview

This tracker documents all required changes to align our off-chain business logic with the on-chain smart contract behavior. The contract controls winner selection and payouts automatically - our backend should listen and record, not control.

---

## Core Principle

```
BEFORE (WRONG):  We Control → We Calculate → We Execute → We Record
AFTER (CORRECT): Contract Controls → Contract Executes → We Listen → We Record
```

---

## Critical Issues Summary

| Issue | Impact | Files Affected | Lines to Change |
|-------|--------|----------------|-----------------|
| 🔴 Off-chain winner selection | HIGH | 3 files | ~150 lines |
| 🔴 Manual payout system | HIGH | 6 files | ~700 lines |
| 🔴 Missing fee withdrawal | **CRITICAL** | 3 files (new) | ~200 lines |
| 🔴 Admin wallet USDC checks | HIGH | 1 file | ~20 lines |
| 🟡 State management | MEDIUM | 8 files | ~100 lines |
| 🟡 Protocol fee sync | MEDIUM | 3 files | ~50 lines |
| 🟡 Emergency cancel missing | MEDIUM | 2 files (new) | ~100 lines |

**Total**: ~1320 lines affected across 26 files

---

# ADMIN OPERATIONS - WHAT ADMIN CAN/CANNOT DO

## According to Smart Contract

Based on analysis of [lib/blockchain/contracts/FairWinRaffle.sol](lib/blockchain/contracts/FairWinRaffle.sol), here are the ONLY operations admin can perform on-chain:

### ✅ Admin CAN Do (On-Chain Operations)

1. **Create Raffle** (`createRaffle()`)
   - Set entry price, duration, winner percentage, platform fee
   - Raffle starts in `Active` state immediately
   - Contract takes parameters and creates raffle on-chain

2. **Cancel Raffle** (`cancelRaffle()`)
   - Cancel raffle that hasn't been drawn yet (Active state)
   - Users can claim refunds after cancellation
   - State changes to `Cancelled`

3. **Emergency Cancel** (`emergencyCancelDrawing()`)
   - ONLY if VRF fails after 12 hours
   - Can cancel raffle stuck in `Drawing` state
   - Must wait EMERGENCY_CANCEL_DELAY (12 hours) after draw triggered
   - Prevents admin abuse (can't cancel just because they don't like winners)

4. **Trigger Draw** (`triggerDraw()`)
   - Admin manually triggers draw after endTime
   - Initiates Chainlink VRF request
   - State changes from `Active` → `Drawing`
   - Contract handles everything from here automatically

5. **Withdraw Protocol Fees** (`withdrawFees()`)
   - Withdraw accumulated platform fees (tracked in `protocolFeesCollected`)
   - Admin can ONLY withdraw fees, NOT active raffle pools
   - This is separate from raffle prize pools (security feature)

6. **Pause/Unpause Contract** (`pause()` / `unpause()`)
   - Emergency stop for entire contract
   - When paused: No new entries, but users can still claim refunds
   - Safety mechanism for critical bugs

7. **Update VRF Configuration** (`updateVRFConfig()`)
   - Change Chainlink VRF settings
   - Update subscription ID, key hash, callback gas limit
   - Technical maintenance operation

8. **Update Global Limits** (`updateLimits()`)
   - Change maxPoolSize, maxEntriesPerUser, minEntriesRequired
   - Safety rails for the platform
   - Cannot exceed hardcoded MAX constants

### ❌ Admin CANNOT Do (Automated by Contract)

1. **Select Winners**
   - Contract does this automatically in `fulfillRandomWords()` callback
   - Uses Chainlink VRF random number
   - Admin has ZERO control over who wins

2. **Process Payouts**
   - Contract sends USDC to winners AUTOMATICALLY
   - Happens immediately in `fulfillRandomWords()`
   - Admin cannot delay, modify, or cancel winner payments

3. **Change Raffle Parameters After Creation**
   - Entry price, winner percentage, platform fee are IMMUTABLE
   - Once raffle created, parameters locked
   - Prevents rug pulls and manipulation

4. **Cancel After Winners Selected**
   - `Completed` state is final
   - Cannot reverse or cancel completed raffles
   - Winners already paid, money already distributed

5. **Access Active Raffle Funds**
   - Admin can ONLY withdraw `protocolFeesCollected`
   - Active raffle pools are separate and untouchable
   - Security guarantee for users

## Our Current Backend Implementation

### ✅ What We Implement Correctly

1. **Raffle Creation** ([raffle-management.service.ts:27-59](lib/services/raffle/raffle-management.service.ts#L27-L59))
   - Admin creates raffle via API
   - We store raffle metadata in DynamoDB
   - **CORRECT**: Admin triggers on-chain `createRaffle()` transaction

2. **Raffle Cancellation** ([raffle-management.service.ts:116-130](lib/services/raffle/raffle-management.service.ts#L116-L130))
   - Admin can cancel via API
   - We update status in database
   - **CORRECT**: Admin triggers on-chain `cancelRaffle()` transaction

3. **Draw Initiation** ([raffle-draw.service.ts:42-90](lib/services/raffle/raffle-draw.service.ts#L42-L90))
   - Admin triggers draw via API
   - We call `requestRandomness()` which calls contract's `triggerDraw()`
   - **CORRECT**: Admin triggers on-chain operation

4. **Pre-scheduling** ([raffle-management.service.ts:47-51](lib/services/raffle/raffle-management.service.ts#L47-L51))
   - Admin creates raffle before announcing it publicly
   - Backend shows "scheduled" status (UI only)
   - **CORRECT**: This is backend-only, doesn't affect contract

### ❌ What We Implement INCORRECTLY

1. **Manual Payout Processing**
   - Files: `raffle-payout.service.ts`, `admin-payout.service.ts`
   - Problem: We try to manually send payouts that contract already sent
   - **FIX**: DELETE entire payout processing system (see Phase 1)

2. **Off-chain Winner Selection**
   - File: `raffle-draw.service.ts:102-151` (`selectWinnersWeighted()`)
   - Problem: We select winners in TypeScript, but contract already did it on-chain
   - **FIX**: DELETE winner selection, listen to `WinnersSelected` event (see Phase 2)

3. **Admin "Activate Raffle"**
   - File: `raffle-management.service.ts:142-156` (`activateRaffle()`)
   - Current: Changes status from "scheduled" → "active" in database only
   - **STATUS**: This is OK if it's backend-only (for pre-scheduling)
   - **CLARIFICATION NEEDED**: Does this trigger any on-chain transaction? If not, it's fine.

### 🟡 What Needs Clarification

1. **Admin Wallet Balance Tracking** ([admin-wallet.service.ts](lib/services/admin/admin-wallet.service.ts))
   - Current: Tracks MATIC, USDC, LINK balances
   - Question: Why track USDC? Winners paid from contract, not admin wallet
   - **POSSIBLE FIX**: Remove USDC balance checks for "payouts" (line 69-72)
   - Keep MATIC (gas) and LINK (VRF) checks

## Required Admin Logic Fixes

### Fix #1: Remove Manual Payout Operations

Admin should NOT be able to:
- Process payouts manually
- Retry failed payouts
- View "payout queue"

**Files to Delete**:
- ❌ `lib/services/raffle/raffle-payout.service.ts`
- ❌ `lib/services/admin/admin-payout.service.ts`
- ❌ `app/api/admin/payouts/route.ts`

### Fix #2: Clarify Admin Wallet Service

**File**: `lib/services/admin/admin-wallet.service.ts`

**Changes Required**:
```typescript
// REMOVE: Payout balance validation (lines 69-72)
// Admin wallet doesn't pay winners - contract does

// KEEP: VRF and gas balance checks
case 'vrf':
  token = 'link';
  requiredAmount = amount || BigInt(100000000000000000); // 0.1 LINK
  break;

case 'gas':
  token = 'matic';
  requiredAmount = amount || BigInt(10000000000000000); // 0.01 MATIC
  break;

// REMOVE: 'payout' case entirely
```

**Update Low Balance Warnings** (lines 98-136):
```typescript
// REMOVE: USDC balance check (lines 126-133)
// Admin doesn't need USDC - winners paid from contract balance

// KEEP: MATIC and LINK checks
```

### Fix #3: Add Missing Admin Operations

Based on contract, we should add:

1. **Withdraw Protocol Fees** API
   - **CREATE**: `app/api/admin/fees/withdraw/route.ts`
   - Calls contract's `withdrawFees()` function
   - Admin can claim accumulated platform fees

2. **Emergency Cancel** API (optional, rare use)
   - **CREATE**: `app/api/admin/raffles/[id]/emergency-cancel/route.ts`
   - Calls contract's `emergencyCancelDrawing()`
   - Only works if VRF failed for 12+ hours

3. **Pause/Unpause Contract** API (optional, emergency)
   - **CREATE**: `app/api/admin/pause/route.ts`
   - **CREATE**: `app/api/admin/unpause/route.ts`
   - Emergency stop functionality

4. **Update VRF Config** API (technical maintenance)
   - **CREATE**: `app/api/admin/vrf-config/route.ts`
   - Update Chainlink VRF settings

5. **Update Limits** API
   - **CREATE**: `app/api/admin/limits/route.ts`
   - Update maxPoolSize, maxEntriesPerUser, minEntriesRequired

### Fix #4: Update Contract Write Service

**File**: `lib/services/blockchain/contract-write.service.ts`

**Add Missing Functions**:
```typescript
// 1. Withdraw Protocol Fees
export async function withdrawProtocolFees(
  recipient: string,
  chainId: number = 137
): Promise<{ transactionHash: string; amount: bigint }> {
  // Call contract.withdrawFees(recipient)
}

// 2. Emergency Cancel Drawing
export async function emergencyCancelDrawing(
  raffleId: string,
  chainId: number = 137
): Promise<{ transactionHash: string }> {
  // Call contract.emergencyCancelDrawing(raffleId)
}

// 3. Pause Contract
export async function pauseContract(
  chainId: number = 137
): Promise<{ transactionHash: string }> {
  // Call contract.pause()
}

// 4. Unpause Contract
export async function unpauseContract(
  chainId: number = 137
): Promise<{ transactionHash: string }> {
  // Call contract.unpause()
}

// 5. Update VRF Config
export async function updateVRFConfig(
  subscriptionId: bigint,
  keyHash: string,
  callbackGasLimit: number,
  requestConfirmations: number,
  chainId: number = 137
): Promise<{ transactionHash: string }> {
  // Call contract.updateVRFConfig(...)
}

// 6. Update Limits
export async function updateLimits(
  maxPoolSize: bigint,
  maxEntriesPerUser: number,
  minEntriesRequired: number,
  chainId: number = 137
): Promise<{ transactionHash: string }> {
  // Call contract.updateLimits(...)
}

// 7. Cancel Raffle (on-chain)
export async function cancelRaffle(
  raffleId: string,
  chainId: number = 137
): Promise<{ transactionHash: string }> {
  // Call contract.cancelRaffle(raffleId)
}

// 8. Create Raffle (on-chain)
export async function createRaffleOnChain(
  entryPrice: bigint,
  startTime: number,
  endTime: number,
  maxEntries: number,
  winnerPercent: number,
  platformFeePercent: number,
  chainId: number = 137
): Promise<{ transactionHash: string; raffleId: string }> {
  // Call contract.createRaffle(...)
  // Parse RaffleCreated event to get raffleId
}
```

**Remove Incorrect Function**:
```typescript
// DELETE: submitPayout() function (lines 128-190)
// Winners paid automatically by contract, not by admin wallet
```

## Admin Operations Summary

### Complete List of Admin Actions

| Operation | On-Chain? | Implemented? | Status |
|-----------|-----------|--------------|--------|
| Create Raffle | ✅ Yes | ✅ Yes | ✅ Correct |
| Cancel Raffle | ✅ Yes | ✅ Yes | ✅ Correct |
| Trigger Draw | ✅ Yes | ✅ Yes | ✅ Correct |
| Emergency Cancel | ✅ Yes | ❌ No | 🟡 Should Add |
| Withdraw Fees | ✅ Yes | ❌ No | 🔴 **MUST ADD** |
| Pause Contract | ✅ Yes | ❌ No | 🟡 Optional |
| Unpause Contract | ✅ Yes | ❌ No | 🟡 Optional |
| Update VRF Config | ✅ Yes | ❌ No | 🟡 Optional |
| Update Limits | ✅ Yes | ❌ No | 🟡 Optional |
| ~~Process Payouts~~ | ❌ No | ❌ Yes (WRONG) | 🔴 **MUST DELETE** |
| ~~Select Winners~~ | ❌ No | ❌ Yes (WRONG) | 🔴 **MUST DELETE** |
| Pre-schedule Raffle | ❌ No (Backend only) | ✅ Yes | ✅ Correct |
| Activate Scheduled | ❌ No (Backend only) | ✅ Yes | ✅ Correct |

### Priority Admin Fixes

**CRITICAL (Must Do)**:
1. ✅ Delete manual payout processing (already in Phase 1)
2. ✅ Delete off-chain winner selection (already in Phase 2)
3. 🔴 **ADD: Withdraw Protocol Fees** - Admin needs to claim platform revenue!
4. 🔴 **REMOVE: USDC balance checks** - Admin doesn't pay winners

**IMPORTANT (Should Do)**:
5. 🟡 Add Emergency Cancel API (rare, but needed for VRF failures)
6. 🟡 Add Pause/Unpause API (emergency safety)

**OPTIONAL (Nice to Have)**:
7. 🟡 Add Update VRF Config API (technical maintenance)
8. 🟡 Add Update Limits API (safety rail adjustments)

---

# PHASE 1: DELETE INCORRECT CODE

## 1.1 Delete Manual Payout Processing Files

### Files to DELETE Completely

- [x] **lib/services/raffle/raffle-payout.service.ts** (274 lines) - **DELETED**
  - Reason: Contract pays winners automatically in fulfillRandomWords callback
  - Functions removed:
    - `processRafflePayouts()` - Manual payout submission
    - `retryFailedPayout()` - No "failed" state exists
    - `cancelPayout()` - Cannot cancel on-chain payments
    - `getPayoutStatus()` - Unnecessary complexity

- [x] **lib/services/admin/admin-payout.service.ts** (179 lines) - **DELETED**
  - Reason: Admin cannot manually trigger payouts, contract does it
  - Functions removed:
    - `triggerRafflePayouts()` - Duplicate of contract logic
    - `retryAllFailedPayouts()` - No failed payouts exist
    - `getPayoutQueue()` - No queue, instant on-chain

- [x] **app/api/admin/payouts/route.ts** (entire file) - **DELETED**
  - Reason: No manual payout API needed
  - Endpoints removed:
    - `POST /api/admin/payouts` - process/retry/retryAll/cancel actions

- [x] **app/api/admin/raffles/[id]/payouts/route.ts** (entire file) - **DELETED**
  - Reason: Payout status is read from blockchain events
  - Endpoints removed:
    - `GET /api/admin/raffles/[id]/payouts` - Status check

### Actions Required
```bash
# Delete files
rm lib/services/raffle/raffle-payout.service.ts
rm lib/services/admin/admin-payout.service.ts
rm app/api/admin/payouts/route.ts
rm app/api/admin/raffles/[id]/payouts/route.ts
```

---

## 1.2 Delete Off-Chain Winner Selection Logic

### File: `lib/services/raffle/raffle-draw.service.ts`

- [x] **DELETE Function**: `selectWinnersWeighted()` (Lines 102-151) - **DELETED**
  - Reason: Winners selected on-chain, not off-chain
  - Algorithm duplicates contract logic incorrectly

- [x] **DELETE Function**: `hashBigInt()` (Lines 210-221) - **DELETED**
  - Reason: Used only by selectWinnersWeighted

- [x] **REFACTOR Function**: `completeRaffleDraw()` (Lines 159-206) - **REFACTORED**
  - Current: Selects winners off-chain and creates records
  - New: Event-driven getDrawResults() that reads from database (see Phase 2)

### Code to Remove
```typescript
// DELETE THESE LINES: 102-151
export function selectWinnersWeighted(
  entries: EntryItem[],
  randomSeed: bigint,
  winnerCount: number
): string[] {
  // ... entire function
}

// DELETE THESE LINES: 210-221
function hashBigInt(value: bigint): string {
  // ... entire function
}

// REFACTOR THESE LINES: 159-206
export async function completeRaffleDraw(
  raffleId: string,
  randomNumber: bigint
): Promise<WinnerSelectionResult> {
  // Current implementation is WRONG
  // See Phase 2 for new event-driven approach
}
```

---

# PHASE 2: CREATE EVENT LISTENING SYSTEM

## 2.1 Create Blockchain Event Listener Service

- [x] **CREATE**: `lib/services/blockchain/event-listener.service.ts` - **CREATED**

### Implementation Details

```typescript
/**
 * Event Listener Service
 *
 * Listens to smart contract events and records them in our database.
 * This is our ONLY source of truth for on-chain operations.
 */

import { createPublicClient, http, parseAbiItem } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import { CONTRACT_ADDRESSES } from '@/lib/blockchain/addresses';
import { raffleRepo, winnerRepo, payoutRepo, entryRepo } from '@/lib/db/repositories';

// Contract events we listen to
const EVENTS = {
  RaffleCreated: parseAbiItem('event RaffleCreated(uint256 indexed raffleId, uint256 entryPrice, uint256 startTime, uint256 endTime, uint256 maxEntries, uint256 winnerPercent, uint256 platformFeePercent)'),

  RaffleEntered: parseAbiItem('event RaffleEntered(uint256 indexed raffleId, address indexed user, uint256 numEntries, uint256 totalUserEntries, uint256 amountPaid)'),

  DrawTriggered: parseAbiItem('event DrawTriggered(uint256 indexed raffleId, uint256 vrfRequestId, uint256 expectedWinners)'),

  WinnersSelected: parseAbiItem('event WinnersSelected(uint256 indexed raffleId, address[] winners, uint256 prizePerWinner, uint256 totalPrize, uint256 protocolFee)'),

  RaffleCancelled: parseAbiItem('event RaffleCancelled(uint256 indexed raffleId, string reason)'),

  RefundClaimed: parseAbiItem('event RefundClaimed(uint256 indexed raffleId, address indexed user, uint256 amount)'),

  FeesWithdrawn: parseAbiItem('event FeesWithdrawn(address indexed to, uint256 amount)'),
};

/**
 * Listen for WinnersSelected event - CRITICAL
 * This is how we know who won and how much they were paid
 */
export async function listenForWinnersSelected(raffleId: string, chainId: number = 137) {
  const client = createPublicClient({
    chain: chainId === 137 ? polygon : polygonAmoy,
    transport: http(),
  });

  const unwatch = client.watchContractEvent({
    address: CONTRACT_ADDRESSES[chainId].raffle,
    abi: [EVENTS.WinnersSelected],
    eventName: 'WinnersSelected',
    args: { raffleId: BigInt(raffleId) },
    onLogs: async (logs) => {
      for (const log of logs) {
        await handleWinnersSelectedEvent(log);
      }
    },
  });

  return unwatch;
}

/**
 * Handle WinnersSelected event
 * Record winners and payouts based on what contract emitted
 */
async function handleWinnersSelectedEvent(log: any) {
  const { raffleId, winners, prizePerWinner, totalPrize, protocolFee } = log.args;
  const transactionHash = log.transactionHash;

  console.log(`[WinnersSelected] Raffle ${raffleId}: ${winners.length} winners`);

  // Create winner records based on CONTRACT data
  const winnerRecords = await Promise.all(
    winners.map((walletAddress: string, index: number) =>
      winnerRepo.create({
        raffleId: raffleId.toString(),
        walletAddress: walletAddress.toLowerCase(),
        prize: Number(prizePerWinner), // Contract calculated this
        ticketNumber: 0, // Not tracked on-chain
        totalTickets: 0, // Will update separately
        tier: getTierLabel(index),
      })
    )
  );

  // Create payout records (already paid by contract)
  await Promise.all(
    winnerRecords.map((winner) =>
      payoutRepo.create({
        winnerId: winner.winnerId,
        raffleId: raffleId.toString(),
        walletAddress: winner.walletAddress,
        amount: winner.prize,
        status: 'paid', // Contract already paid them
        transactionHash,
        paidAt: new Date().toISOString(),
      })
    )
  );

  // Update raffle to completed
  await raffleRepo.update(raffleId.toString(), {
    contractState: 'completed',
    status: 'completed', // For backward compatibility during migration
    protocolFee: Number(protocolFee),
  });

  console.log(`[WinnersSelected] Recorded ${winnerRecords.length} winners for raffle ${raffleId}`);
}

/**
 * Listen for RaffleEntered event
 * Sync entry data with blockchain
 */
export async function listenForRaffleEntered(raffleId: string, chainId: number = 137) {
  const client = createPublicClient({
    chain: chainId === 137 ? polygon : polygonAmoy,
    transport: http(),
  });

  const unwatch = client.watchContractEvent({
    address: CONTRACT_ADDRESSES[chainId].raffle,
    abi: [EVENTS.RaffleEntered],
    eventName: 'RaffleEntered',
    args: { raffleId: BigInt(raffleId) },
    onLogs: async (logs) => {
      for (const log of logs) {
        await handleRaffleEnteredEvent(log);
      }
    },
  });

  return unwatch;
}

async function handleRaffleEnteredEvent(log: any) {
  const { raffleId, user, numEntries, totalUserEntries, amountPaid } = log.args;
  const transactionHash = log.transactionHash;

  console.log(`[RaffleEntered] User ${user} entered raffle ${raffleId} with ${numEntries} entries`);

  // Verify entry exists in our DB, create if not
  // This handles cases where blockchain tx happened but our API call failed
  const existingEntries = await entryRepo.getByUserAndRaffle(
    user.toLowerCase(),
    raffleId.toString()
  );

  if (existingEntries.items.length === 0) {
    console.log(`[RaffleEntered] Entry missing in DB, creating from event`);
    await entryRepo.create({
      raffleId: raffleId.toString(),
      walletAddress: user.toLowerCase(),
      numEntries: Number(numEntries),
      totalCost: Number(amountPaid),
      transactionHash,
    });
  }
}

/**
 * Listen for DrawTriggered event
 * Update raffle state when draw starts
 */
export async function listenForDrawTriggered(raffleId: string, chainId: number = 137) {
  const client = createPublicClient({
    chain: chainId === 137 ? polygon : polygonAmoy,
    transport: http(),
  });

  const unwatch = client.watchContractEvent({
    address: CONTRACT_ADDRESSES[chainId].raffle,
    abi: [EVENTS.DrawTriggered],
    eventName: 'DrawTriggered',
    args: { raffleId: BigInt(raffleId) },
    onLogs: async (logs) => {
      for (const log of logs) {
        const { raffleId, vrfRequestId } = log.args;

        console.log(`[DrawTriggered] Raffle ${raffleId} draw initiated, VRF request: ${vrfRequestId}`);

        await raffleRepo.update(raffleId.toString(), {
          contractState: 'drawing',
          status: 'drawing',
          vrfRequestId: vrfRequestId.toString(),
          drawTime: new Date().toISOString(),
        });
      }
    },
  });

  return unwatch;
}

/**
 * Listen for RaffleCancelled event
 */
export async function listenForRaffleCancelled(raffleId: string, chainId: number = 137) {
  const client = createPublicClient({
    chain: chainId === 137 ? polygon : polygonAmoy,
    transport: http(),
  });

  const unwatch = client.watchContractEvent({
    address: CONTRACT_ADDRESSES[chainId].raffle,
    abi: [EVENTS.RaffleCancelled],
    eventName: 'RaffleCancelled',
    args: { raffleId: BigInt(raffleId) },
    onLogs: async (logs) => {
      for (const log of logs) {
        const { raffleId, reason } = log.args;

        console.log(`[RaffleCancelled] Raffle ${raffleId} cancelled: ${reason}`);

        await raffleRepo.update(raffleId.toString(), {
          contractState: 'cancelled',
          status: 'cancelled',
        });
      }
    },
  });

  return unwatch;
}

/**
 * Start listening to all events for a raffle
 */
export async function startRaffleEventListeners(raffleId: string, chainId: number = 137) {
  const unwatchFunctions = await Promise.all([
    listenForRaffleEntered(raffleId, chainId),
    listenForDrawTriggered(raffleId, chainId),
    listenForWinnersSelected(raffleId, chainId),
    listenForRaffleCancelled(raffleId, chainId),
  ]);

  console.log(`[EventListener] Started all listeners for raffle ${raffleId}`);

  // Return function to stop all listeners
  return () => {
    unwatchFunctions.forEach(unwatch => unwatch());
    console.log(`[EventListener] Stopped all listeners for raffle ${raffleId}`);
  };
}

// Helper function
function getTierLabel(index: number): string {
  if (index === 0) return '1st';
  if (index === 1) return '2nd';
  if (index === 2) return '3rd';
  return `${index + 1}th`;
}

export {
  handleWinnersSelectedEvent,
  handleRaffleEnteredEvent,
};
```

### Checklist
- [x] Create file `lib/services/blockchain/event-listener.service.ts`
- [x] Implement `listenForWinnersSelected()`
- [x] Implement `listenForRaffleEntered()`
- [x] Implement `listenForDrawTriggered()`
- [x] Implement `listenForRaffleCancelled()`
- [x] Implement `syncRaffleEvents()` and `syncAllEvents()` convenience functions
- [x] Add proper error handling and logging

---

## 2.2 Update Raffle Draw Service

- [x] **REFACTOR**: `lib/services/raffle/raffle-draw.service.ts` - **COMPLETE**

### Changes Required

```typescript
// REMOVE: Lines 159-206 (completeRaffleDraw function)
// REPLACE WITH:

/**
 * Complete raffle draw - EVENT DRIVEN
 *
 * This function is now ONLY called when we receive the WinnersSelected event
 * It does NOT select winners - the contract already did that
 *
 * @deprecated Use event listener instead
 */
export async function completeRaffleDraw(
  raffleId: string,
  randomNumber: bigint
): Promise<WinnerSelectionResult> {
  console.warn('[DEPRECATED] completeRaffleDraw should not be called directly');
  console.warn('Winners are selected by contract and recorded via WinnersSelected event');

  // Get raffle to return basic info
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Get winners that were already recorded by event listener
  const winnersResult = await winnerRepo.getByRaffle(raffleId);

  return {
    raffleId,
    winners: winnersResult.items,
    randomNumber: randomNumber.toString(),
    timestamp: Date.now(),
  };
}
```

### Checklist
- [x] Delete `selectWinnersWeighted()` function
- [x] Delete `hashBigInt()` helper
- [x] Refactor `completeRaffleDraw()` to `getDrawResults()` - read-only function
- [x] Update function documentation
- [x] Add comments explaining on-chain winner selection

---

# PHASE 3: STATE MANAGEMENT FIXES

## 3.1 Update Raffle Model

- [x] **MODIFY**: `lib/db/models/raffle/raffle.model.ts` - **COMPLETE**

### Changes Required

Add `contractState` field and keep `status` for backward compatibility during migration:

```typescript
export interface RaffleItem {
  raffleId: string;
  type: 'daily' | 'weekly' | 'mega' | 'flash' | 'monthly';

  /**
   * On-chain contract state - SOURCE OF TRUTH
   * Must exactly match contract's RaffleState enum:
   * - active: Raffle accepting entries (RaffleState.Active)
   * - drawing: VRF requested, awaiting random number (RaffleState.Drawing)
   * - completed: Winners selected and paid (RaffleState.Completed)
   * - cancelled: Raffle cancelled, refunds available (RaffleState.Cancelled)
   *
   * This field is synced from blockchain and is read-only from our perspective
   */
  contractState: 'active' | 'drawing' | 'completed' | 'cancelled';

  /**
   * Legacy status field - DEPRECATED, kept for backward compatibility
   * Use contractState for business logic
   * This will be removed after full migration
   *
   * @deprecated Use contractState instead
   */
  status: 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';

  title: string;
  description: string;
  entryPrice: number;
  maxEntriesPerUser: number;
  totalEntries: number;
  totalParticipants: number;
  prizePool: number;
  protocolFee: number;
  winnerPayout: number;
  winnerCount: number;
  startTime: string;
  endTime: string;
  drawTime?: string;
  vrfRequestId?: string;
  vrfRandomWord?: string;
  contractAddress: string;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Computed display status for UI
 *
 * This is NOT stored in database - computed on the fly
 * Based on contractState + time-based conditions
 */
export type DisplayStatus = 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';
```

### Checklist
- [x] Add `contractState` field to `RaffleItem` interface
- [x] Add JSDoc explaining contractState is source of truth
- [x] Mark `status` as @deprecated (kept for backward compatibility)
- [x] Update `CreateRaffleInput` if needed (no changes needed)
- [x] Document that contractState comes from blockchain

---

## 3.2 Create Status Computation Service

- [x] **CREATE**: `lib/services/raffle/raffle-status.service.ts` - **COMPLETE**

### Implementation

```typescript
/**
 * Raffle Status Service
 *
 * Computes display status from contract state + time conditions
 * Syncs contract state from blockchain
 */

import type { RaffleItem, DisplayStatus } from '@/lib/db/models';
import { createPublicClient, http } from 'viem';
import { polygon, polygonAmoy } from 'viem/chains';
import { CONTRACT_ADDRESSES } from '@/lib/blockchain/addresses';
import { raffleRepo } from '@/lib/db/repositories';

/**
 * Compute display status for UI
 *
 * Contract state is source of truth, but we add UI states:
 * - "scheduled": Time-based, before startTime (admin pre-scheduled)
 * - "ending": Time-based, less than 5 min to endTime (urgency indicator)
 */
export function computeDisplayStatus(raffle: RaffleItem): DisplayStatus {
  const now = Date.now();
  const startTime = new Date(raffle.startTime).getTime();
  const endTime = new Date(raffle.endTime).getTime();

  // If contract is not active, use contract state directly
  if (raffle.contractState !== 'active') {
    return raffle.contractState;
  }

  // Contract is active, compute UI-specific states

  // SCHEDULED: Before start time (admin pre-scheduled on backend)
  // Note: Contract may already be Active, but we haven't announced it yet
  if (now < startTime) {
    return 'scheduled';
  }

  // ENDING: Less than 5 minutes until end (urgency indicator for UI)
  const fiveMinutes = 5 * 60 * 1000;
  if (endTime - now < fiveMinutes && now < endTime) {
    return 'ending';
  }

  // Default: Active
  return 'active';
}

/**
 * Sync raffle state from contract
 * Reads on-chain state and updates our database
 */
export async function syncRaffleStateFromContract(
  raffleId: string,
  chainId: number = 137
): Promise<RaffleItem['contractState']> {
  const client = createPublicClient({
    chain: chainId === 137 ? polygon : polygonAmoy,
    transport: http(),
  });

  // Read raffle state from contract
  const contractRaffle = await client.readContract({
    address: CONTRACT_ADDRESSES[chainId].raffle,
    abi: [
      {
        name: 'raffles',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'raffleId', type: 'uint256' }],
        outputs: [
          { name: 'entryPrice', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'maxEntries', type: 'uint256' },
          { name: 'winnerPercent', type: 'uint256' },
          { name: 'platformFeePercent', type: 'uint256' },
          { name: 'state', type: 'uint8' }, // RaffleState enum
          { name: 'totalEntries', type: 'uint256' },
          { name: 'totalPool', type: 'uint256' },
          { name: 'numWinners', type: 'uint256' },
          { name: 'prizePerWinner', type: 'uint256' },
          { name: 'vrfRequestId', type: 'uint256' },
        ],
      },
    ],
    functionName: 'raffles',
    args: [BigInt(raffleId)],
  }) as any;

  // Map contract state enum to our type
  // enum RaffleState { Active, Drawing, Completed, Cancelled }
  const stateMap: Record<number, RaffleItem['contractState']> = {
    0: 'active',
    1: 'drawing',
    2: 'completed',
    3: 'cancelled',
  };

  const contractState = stateMap[contractRaffle.state];

  // Update our database
  await raffleRepo.update(raffleId, {
    contractState,
    totalEntries: Number(contractRaffle.totalEntries),
    prizePool: Number(contractRaffle.totalPool),
  });

  console.log(`[StateSync] Raffle ${raffleId} state synced: ${contractState}`);

  return contractState;
}

/**
 * Sync all active raffles from contract
 * Run this periodically (e.g., every 5 minutes)
 */
export async function syncAllActiveRaffles(chainId: number = 137) {
  // Get all raffles that are not completed/cancelled
  const activeRaffles = await raffleRepo.getActiveRaffles();

  console.log(`[StateSync] Syncing ${activeRaffles.length} active raffles...`);

  const results = await Promise.allSettled(
    activeRaffles.map(raffle =>
      syncRaffleStateFromContract(raffle.raffleId, chainId)
    )
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`[StateSync] Complete: ${succeeded} synced, ${failed} failed`);

  return { succeeded, failed };
}

/**
 * Add display status to raffle object
 * Use this in API responses
 */
export function addDisplayStatus(raffle: RaffleItem): RaffleItem & { displayStatus: DisplayStatus } {
  return {
    ...raffle,
    displayStatus: computeDisplayStatus(raffle),
  };
}
```

### Checklist
- [ ] Create `lib/services/raffle/raffle-status.service.ts`
- [ ] Implement `computeDisplayStatus()` - handles "scheduled" and "ending"
- [ ] Implement `syncRaffleStateFromContract()` - reads on-chain state
- [ ] Implement `syncAllActiveRaffles()` - batch sync
- [ ] Implement `addDisplayStatus()` - for API responses

---

## 3.3 Update Repository to Support contractState

- [x] **MODIFY**: `lib/db/repositories/raffle/raffle.repository.ts` - **COMPLETE**

### Changes Required

Add method to get active raffles:

```typescript
/**
 * Get all active raffles (not completed or cancelled)
 * Used for state syncing
 */
async getActiveRaffles(): Promise<RaffleItem[]> {
  const result = await this.client.scan({
    TableName: this.tableName,
    FilterExpression: 'contractState IN (:active, :drawing)',
    ExpressionAttributeValues: {
      ':active': 'active',
      ':drawing': 'drawing',
    },
  });

  return (result.Items || []).map(item => this.mapItem(item));
}
```

### Checklist
- [x] Add `getActiveRaffles()` method to repository
- [x] Update index queries if needed (uses existing status index)
- [x] Ensure contractState is included in all queries (field is optional, backward compatible)

---

## 3.4 Update Services to Use contractState

- [ ] **MODIFY**: `lib/services/raffle/raffle-entry.service.ts`

Change status checks from `status` to `contractState`:

```typescript
// BEFORE
if (raffle.status !== 'active' && raffle.status !== 'ending') {
  throw new RaffleNotActiveError(raffleId, raffle.status);
}

// AFTER
if (raffle.contractState !== 'active') {
  throw new RaffleNotActiveError(raffleId, raffle.contractState);
}

// Also check time-based conditions
const now = Date.now();
const endTime = new Date(raffle.endTime).getTime();
if (now >= endTime) {
  throw new RaffleNotActiveError(raffleId, 'ended');
}
```

- [ ] **MODIFY**: `lib/services/raffle/raffle-validation.service.ts`

Update validation logic:

```typescript
export function validateRaffleDrawable(raffle: RaffleItem, entryCount: number): void {
  // Check contract state
  if (raffle.contractState !== 'active') {
    throw new RaffleNotDrawableError(`Raffle is ${raffle.contractState}`);
  }

  // Check time
  const now = Date.now();
  const endTime = new Date(raffle.endTime).getTime();
  if (now < endTime) {
    throw new RaffleNotDrawableError('Raffle has not ended yet');
  }

  // Check entries
  if (entryCount === 0) {
    throw new NoEntriesForDrawError(raffle.raffleId);
  }
}
```

- [ ] **MODIFY**: `lib/services/admin/admin-raffle.service.ts`

Update admin operations:

```typescript
export async function activateRaffle(raffleId: string): Promise<RaffleItem> {
  const raffle = await raffleRepo.getById(raffleId);
  if (!raffle) {
    throw new RaffleNotFoundError(raffleId);
  }

  // Note: Contract is already active, we're just updating our "scheduled" status
  // This is a backend-only state change, contract doesn't have "scheduled"
  await raffleRepo.update(raffleId, {
    status: 'active', // Legacy field
    // contractState stays 'active' (it already was)
  });

  return raffleRepo.getById(raffleId);
}
```

### Checklist
- [ ] Update `raffle-entry.service.ts` - use contractState
- [ ] Update `raffle-validation.service.ts` - use contractState
- [ ] Update `admin-raffle.service.ts` - use contractState
- [ ] Search all files for `raffle.status` and evaluate each usage
- [ ] Add time-based checks where needed (endTime, startTime)

---

## 3.5 Update API Responses to Include displayStatus

- [ ] **MODIFY**: All raffle GET endpoints

Add displayStatus to API responses:

```typescript
// app/api/raffles/route.ts
import { addDisplayStatus } from '@/lib/services/raffle/raffle-status.service';

export async function GET() {
  const raffles = await listRaffles({ limit: 50 });

  // Add display status to each raffle
  const rafflesWithStatus = raffles.items.map(addDisplayStatus);

  return success({
    raffles: rafflesWithStatus,
    pagination: raffles.pagination,
  });
}
```

### Checklist
- [ ] Update `app/api/raffles/route.ts` - Add displayStatus
- [ ] Update `app/api/raffles/[id]/route.ts` - Add displayStatus
- [ ] Update `app/api/admin/raffles/route.ts` - Add displayStatus
- [ ] Update `app/api/admin/raffles/[id]/route.ts` - Add displayStatus

---

# PHASE 4: PROTOCOL FEE SYNC

## 4.1 Add Fee Reading to Contract Service

- [ ] **MODIFY**: `lib/services/blockchain/contract-read.service.ts`

Add function to read protocol fees from contract:

```typescript
/**
 * Get total protocol fees collected by contract
 * This is the source of truth for fee tracking
 */
export async function getProtocolFeesCollected(chainId: number = 137): Promise<bigint> {
  const client = createPublicClient({
    chain: chainId === 137 ? polygon : polygonAmoy,
    transport: http(),
  });

  const fees = await client.readContract({
    address: CONTRACT_ADDRESSES[chainId].raffle,
    abi: [
      {
        name: 'protocolFeesCollected',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'protocolFeesCollected',
  });

  return fees as bigint;
}

/**
 * Get raffle state directly from contract
 */
export async function getRaffleStateFromContract(
  raffleId: string,
  chainId: number = 137
): Promise<{
  state: 'active' | 'drawing' | 'completed' | 'cancelled';
  totalEntries: number;
  totalPool: number;
}> {
  const client = createPublicClient({
    chain: chainId === 137 ? polygon : polygonAmoy,
    transport: http(),
  });

  const raffle = await client.readContract({
    address: CONTRACT_ADDRESSES[chainId].raffle,
    abi: [
      {
        name: 'raffles',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'raffleId', type: 'uint256' }],
        outputs: [
          { name: 'entryPrice', type: 'uint256' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'maxEntries', type: 'uint256' },
          { name: 'winnerPercent', type: 'uint256' },
          { name: 'platformFeePercent', type: 'uint256' },
          { name: 'state', type: 'uint8' },
          { name: 'totalEntries', type: 'uint256' },
          { name: 'totalPool', type: 'uint256' },
          { name: 'numWinners', type: 'uint256' },
          { name: 'prizePerWinner', type: 'uint256' },
          { name: 'vrfRequestId', type: 'uint256' },
        ],
      },
    ],
    functionName: 'raffles',
    args: [BigInt(raffleId)],
  }) as any;

  const stateMap: Record<number, any> = {
    0: 'active',
    1: 'drawing',
    2: 'completed',
    3: 'cancelled',
  };

  return {
    state: stateMap[raffle.state],
    totalEntries: Number(raffle.totalEntries),
    totalPool: Number(raffle.totalPool),
  };
}
```

### Checklist
- [ ] Add `getProtocolFeesCollected()` to contract-read service
- [ ] Add `getRaffleStateFromContract()` to contract-read service
- [ ] Export both functions

---

## 4.2 Create Periodic Sync Service

- [ ] **CREATE**: `lib/services/blockchain/sync.service.ts`

```typescript
/**
 * Blockchain Sync Service
 *
 * Periodically syncs data from contract to our database
 * - Protocol fees
 * - Raffle states
 * - Entry counts
 */

import { getProtocolFeesCollected } from './contract-read.service';
import { syncAllActiveRaffles } from '../raffle/raffle-status.service';
import { statsRepo } from '@/lib/db/repositories';

/**
 * Sync protocol fees from contract
 */
export async function syncProtocolFees(chainId: number = 137) {
  console.log('[Sync] Syncing protocol fees from contract...');

  const onChainFees = await getProtocolFeesCollected(chainId);

  await statsRepo.update({
    totalProtocolFees: Number(onChainFees),
    lastFeesSyncAt: new Date().toISOString(),
  });

  console.log(`[Sync] Protocol fees synced: ${onChainFees}`);

  return Number(onChainFees);
}

/**
 * Run all sync operations
 * Call this periodically (e.g., every 5 minutes)
 */
export async function syncAll(chainId: number = 137) {
  console.log('[Sync] Starting full sync...');

  const [fees, raffleSync] = await Promise.allSettled([
    syncProtocolFees(chainId),
    syncAllActiveRaffles(chainId),
  ]);

  console.log('[Sync] Full sync complete');

  return {
    fees: fees.status === 'fulfilled' ? fees.value : null,
    raffles: raffleSync.status === 'fulfilled' ? raffleSync.value : null,
  };
}

// Export for cron job or API endpoint
export { syncProtocolFees, syncAllActiveRaffles };
```

### Checklist
- [ ] Create `lib/services/blockchain/sync.service.ts`
- [ ] Implement `syncProtocolFees()`
- [ ] Implement `syncAll()`
- [ ] Add error handling and logging

---

## 4.3 Create Sync API Endpoint

- [ ] **CREATE**: `app/api/admin/sync/route.ts`

```typescript
/**
 * POST /api/admin/sync
 *
 * Manually trigger blockchain sync
 * Admin only
 */

import { NextRequest } from 'next/server';
import { handleError, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { syncAll } from '@/lib/services/blockchain/sync.service';

function isAdmin(request: NextRequest): boolean {
  // TODO: Implement proper admin auth
  const adminKey = request.headers.get('x-admin-key');
  return adminKey === process.env.ADMIN_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return unauthorized('Admin access required');
    }

    const body = await request.json();
    const { chainId = 137 } = body;

    const result = await syncAll(chainId);

    return success({
      result,
      message: 'Blockchain sync completed',
    });
  } catch (error) {
    return handleError(error);
  }
}
```

### Checklist
- [ ] Create `app/api/admin/sync/route.ts`
- [ ] Implement admin authentication
- [ ] Add error handling
- [ ] Document endpoint

---

## 4.4 Setup Periodic Sync (Optional)

- [ ] **CREATE**: `lib/cron/sync-blockchain.ts` (if using cron)

OR

- [ ] Setup Vercel Cron Job in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/sync",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Checklist
- [ ] Choose sync method (cron, Vercel Cron, manual)
- [ ] Implement periodic sync (every 5-10 minutes)
- [ ] Add monitoring/alerts for sync failures

---

# PHASE 5: ADD MISSING ADMIN OPERATIONS

## 5.1 Add Withdraw Protocol Fees (CRITICAL)

Admin MUST be able to withdraw platform revenue!

### Contract Write Service

- [ ] **MODIFY**: `lib/services/blockchain/contract-write.service.ts`

Add function:
```typescript
/**
 * Withdraw accumulated protocol fees
 * Admin-only operation
 *
 * Contract: withdrawFees(address recipient)
 */
export async function withdrawProtocolFees(
  recipient: string,
  chainId: number = 137
): Promise<{ transactionHash: string; amount: bigint }> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('withdrawFees', 'No wallet connected');
    }

    // Execute withdrawal
    const hash = await walletClient.writeContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'withdrawFees',
      args: [recipient],
    });

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new ContractWriteError('withdrawFees', 'Transaction failed');
    }

    // Parse FeesWithdrawn event
    const feeLog = receipt.logs.find((log) => {
      try {
        const decoded = decodeEventLog({
          abi: FAIRWIN_ABI,
          data: log.data,
          topics: log.topics,
        });
        return decoded.eventName === 'FeesWithdrawn';
      } catch {
        return false;
      }
    });

    let amount = BigInt(0);
    if (feeLog) {
      const decoded = decodeEventLog({
        abi: FAIRWIN_ABI,
        data: feeLog.data,
        topics: feeLog.topics,
      });
      amount = (decoded.args as any).amount || BigInt(0);
    }

    return {
      transactionHash: hash,
      amount,
    };
  } catch (error) {
    throw new ContractWriteError('withdrawFees', (error as Error).message);
  }
}
```

### Admin Service

- [ ] **CREATE**: `lib/services/admin/admin-fees.service.ts`

```typescript
/**
 * Admin Fees Service
 *
 * Handles protocol fee withdrawal
 */

import { withdrawProtocolFees } from '../blockchain/contract-write.service';
import { getProtocolFeesCollected } from '../blockchain/contract-read.service';
import { statsRepo } from '@/lib/db/repositories';
import type { FeeWithdrawal } from '../types';

/**
 * Get available fees for withdrawal
 */
export async function getAvailableFees(chainId: number = 137): Promise<bigint> {
  return await getProtocolFeesCollected(chainId);
}

/**
 * Withdraw protocol fees to recipient address
 */
export async function withdrawFees(
  recipient: string,
  chainId: number = 137
): Promise<FeeWithdrawal> {
  // Verify fees available
  const available = await getAvailableFees(chainId);

  if (available === BigInt(0)) {
    throw new Error('No fees available for withdrawal');
  }

  // Execute withdrawal on-chain
  const result = await withdrawProtocolFees(recipient, chainId);

  // Update stats
  await statsRepo.update({
    totalFeesWithdrawn: Number(result.amount),
    lastWithdrawalAt: new Date().toISOString(),
  });

  return {
    transactionHash: result.transactionHash,
    amount: result.amount,
    recipient,
    timestamp: Date.now(),
  };
}

/**
 * Get withdrawal history from events
 * Listen to FeesWithdrawn events
 */
export async function getWithdrawalHistory(chainId: number = 137) {
  // TODO: Query FeesWithdrawn events from contract
  // Return array of past withdrawals
}
```

### API Endpoint

- [ ] **CREATE**: `app/api/admin/fees/withdraw/route.ts`

```typescript
/**
 * POST /api/admin/fees/withdraw
 *
 * Withdraw accumulated protocol fees
 * Admin only
 */

import { NextRequest } from 'next/server';
import { handleError, unauthorized, badRequest } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { withdrawFees, getAvailableFees } from '@/lib/services/admin/admin-fees.service';

function isAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key');
  return adminKey === process.env.ADMIN_API_KEY;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return unauthorized('Admin access required');
    }

    const body = await request.json();
    const { recipient, chainId = 137 } = body;

    if (!recipient) {
      return badRequest('Missing required field: recipient');
    }

    const result = await withdrawFees(recipient, chainId);

    return success({
      withdrawal: result,
      message: `Withdrew ${result.amount} USDC to ${recipient}`,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/admin/fees/withdraw
 *
 * Get available fees for withdrawal
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return unauthorized('Admin access required');
    }

    const { searchParams } = request.nextUrl;
    const chainId = parseInt(searchParams.get('chainId') || '137', 10);

    const available = await getAvailableFees(chainId);

    return success({
      availableFees: available.toString(),
      formatted: (Number(available) / 1_000_000).toFixed(2) + ' USDC',
    });
  } catch (error) {
    return handleError(error);
  }
}
```

### Checklist
- [ ] Add `withdrawProtocolFees()` to contract-write service
- [ ] Create `admin-fees.service.ts`
- [ ] Create `app/api/admin/fees/withdraw/route.ts`
- [ ] Test on testnet before mainnet
- [ ] Add proper admin authentication

---

## 5.2 Add Emergency Cancel Operation (Important)

For cases when VRF fails for 12+ hours.

- [ ] **MODIFY**: `lib/services/blockchain/contract-write.service.ts`

```typescript
/**
 * Emergency cancel a raffle stuck in Drawing state
 * ONLY works if 12+ hours passed since draw triggered
 *
 * Contract: emergencyCancelDrawing(uint256 raffleId)
 */
export async function emergencyCancelDrawing(
  raffleId: string,
  chainId: number = 137
): Promise<{ transactionHash: string }> {
  try {
    const { publicClient, walletClient } = await getClients(chainId);
    const addresses = getContractAddress(chainId);

    if (!walletClient) {
      throw new ContractWriteError('emergencyCancelDrawing', 'No wallet connected');
    }

    const hash = await walletClient.writeContract({
      address: addresses.raffle,
      abi: FAIRWIN_ABI,
      functionName: 'emergencyCancelDrawing',
      args: [BigInt(raffleId)],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== 'success') {
      throw new ContractWriteError('emergencyCancelDrawing', 'Transaction failed');
    }

    return { transactionHash: hash };
  } catch (error) {
    throw new ContractWriteError('emergencyCancelDrawing', (error as Error).message);
  }
}
```

- [ ] **CREATE**: `app/api/admin/raffles/[id]/emergency-cancel/route.ts`

```typescript
/**
 * POST /api/admin/raffles/[id]/emergency-cancel
 *
 * Emergency cancel raffle stuck in Drawing state
 * ONLY works if 12+ hours passed since draw
 */

import { NextRequest } from 'next/server';
import { handleError, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { emergencyCancelDrawing } from '@/lib/services/blockchain/contract-write.service';
import { raffleRepo } from '@/lib/db/repositories';

function isAdmin(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key');
  return adminKey === process.env.ADMIN_API_KEY;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return unauthorized('Admin access required');
    }

    const { id: raffleId } = await params;
    const body = await request.json();
    const { chainId = 137 } = body;

    // Execute emergency cancel on-chain
    const result = await emergencyCancelDrawing(raffleId, chainId);

    // Update status in database
    await raffleRepo.update(raffleId, {
      contractState: 'cancelled',
      status: 'cancelled',
    });

    return success({
      raffle: await raffleRepo.getById(raffleId),
      transactionHash: result.transactionHash,
      message: 'Raffle emergency cancelled (VRF failure)',
    });
  } catch (error) {
    return handleError(error);
  }
}
```

### Checklist
- [ ] Add `emergencyCancelDrawing()` to contract-write service
- [ ] Create emergency cancel API endpoint
- [ ] Add 12-hour delay check in frontend
- [ ] Document when to use (VRF failures only)

---

## 5.3 Fix Admin Wallet Service (Remove USDC Checks)

Admin wallet doesn't pay winners - contract does.

- [ ] **MODIFY**: `lib/services/admin/admin-wallet.service.ts`

Remove payout-related code:

```typescript
// DELETE: Lines 69-72 (payout case)
// DELETE: Lines 126-133 (USDC balance warning)

// AFTER CHANGES:
export async function validateSufficientBalance(
  operation: 'vrf' | 'gas', // REMOVED: 'payout'
  amount?: bigint,
  chainId: number = 137
): Promise<boolean> {
  if (!ADMIN_WALLET_ADDRESS) {
    return false;
  }

  let token: 'matic' | 'link'; // REMOVED: 'usdc'
  let requiredAmount: bigint;

  switch (operation) {
    case 'vrf':
      token = 'link';
      requiredAmount = amount || BigInt(100000000000000000);
      break;

    case 'gas':
      token = 'matic';
      requiredAmount = amount || BigInt(10000000000000000);
      break;

    // REMOVED: payout case

    default:
      return false;
  }

  return hasSufficientBalance(ADMIN_WALLET_ADDRESS, token, requiredAmount, chainId);
}

export async function getLowBalanceWarnings(chainId: number = 137): Promise<string[]> {
  const warnings: string[] = [];

  if (!ADMIN_WALLET_ADDRESS) {
    warnings.push('Admin wallet address not configured');
    return warnings;
  }

  const balances = await getAdminWalletBalances(chainId);

  // Check MATIC balance (for gas)
  const minMatic = BigInt(1000000000000000000);
  if (balances.balances.matic < minMatic) {
    warnings.push(
      `Low MATIC balance: ${balances.formatted.matic} MATIC (recommended: 1+ MATIC for gas)`
    );
  }

  // Check LINK balance (for VRF)
  const minLink = BigInt(1000000000000000000);
  if (balances.balances.link < minLink) {
    warnings.push(
      `Low LINK balance: ${balances.formatted.link} LINK (recommended: 1+ LINK for VRF requests)`
    );
  }

  // REMOVED: USDC balance check (admin doesn't pay winners)

  return warnings;
}
```

### Checklist
- [ ] Remove 'payout' operation from `validateSufficientBalance()`
- [ ] Remove USDC balance warning from `getLowBalanceWarnings()`
- [ ] Update function documentation
- [ ] Keep MATIC and LINK checks

---

## 5.4 Remove Manual Payout from Contract Write Service

- [ ] **MODIFY**: `lib/services/blockchain/contract-write.service.ts`

Delete `submitPayout()` function (lines 128-190):

```typescript
// DELETE ENTIRE FUNCTION:
export async function submitPayout(
  raffleId: string,
  recipient: string,
  amount: bigint,
  chainId: number = 137
): Promise<PayoutTransaction> {
  // ... entire function
}
```

Reason: Winners are paid automatically by contract in `fulfillRandomWords()` callback.

### Checklist
- [ ] Delete `submitPayout()` function
- [ ] Remove `PayoutTransaction` type if unused elsewhere
- [ ] Update exports

---

## 5.5 Optional: Pause/Unpause Contract

Emergency stop for critical bugs.

- [ ] **MODIFY**: `lib/services/blockchain/contract-write.service.ts`

```typescript
export async function pauseContract(chainId: number = 137) {
  const { walletClient } = await getClients(chainId);
  const addresses = getContractAddress(chainId);

  const hash = await walletClient.writeContract({
    address: addresses.raffle,
    abi: FAIRWIN_ABI,
    functionName: 'pause',
  });

  return { transactionHash: hash };
}

export async function unpauseContract(chainId: number = 137) {
  const { walletClient } = await getClients(chainId);
  const addresses = getContractAddress(chainId);

  const hash = await walletClient.writeContract({
    address: addresses.raffle,
    abi: FAIRWIN_ABI,
    functionName: 'unpause',
  });

  return { transactionHash: hash };
}
```

- [ ] **CREATE**: `app/api/admin/pause/route.ts`
- [ ] **CREATE**: `app/api/admin/unpause/route.ts`

### Checklist
- [ ] Add pause/unpause functions (optional)
- [ ] Create API endpoints (optional)
- [ ] Add confirmation UI (prevent accidental pause)

---

# PHASE 6: UPDATE API LAYER

## 6.1 Remove Payout API Endpoints

Already covered in Phase 1.1:
- [x] Delete `app/api/admin/payouts/route.ts`
- [x] Delete `app/api/admin/raffles/[id]/payouts/route.ts`

---

## 6.2 Update API Documentation

- [ ] **MODIFY**: API documentation (if exists)

Document removed endpoints:
- ❌ `POST /api/admin/payouts` - REMOVED (contract handles payouts)
- ❌ `GET /api/admin/raffles/[id]/payouts` - REMOVED (read from events)

Document new endpoints:
- ✅ `POST /api/admin/sync` - NEW (manual blockchain sync)

Document field changes:
- All raffle GET responses now include `displayStatus`
- Raffle objects include `contractState` (source of truth)
- `status` field deprecated but kept for backward compatibility

### Checklist
- [ ] Update API documentation
- [ ] Add migration notes for clients
- [ ] Document new `displayStatus` field
- [ ] Document deprecated `status` field

---

# PHASE 7: TESTING & VERIFICATION

## 7.1 Unit Tests

- [ ] **CREATE**: `lib/services/blockchain/__tests__/event-listener.test.ts`

Test event handling:
- [ ] Test `handleWinnersSelectedEvent()`
- [ ] Test `handleRaffleEnteredEvent()`
- [ ] Verify winner records created correctly
- [ ] Verify payout records created as "paid"

- [ ] **CREATE**: `lib/services/raffle/__tests__/raffle-status.test.ts`

Test status computation:
- [ ] Test `computeDisplayStatus()` with all states
- [ ] Test "scheduled" before startTime
- [ ] Test "ending" 5 min before endTime
- [ ] Test state priority (contract state > time-based)

### Checklist
- [ ] Write unit tests for event listeners
- [ ] Write unit tests for status computation
- [ ] Write unit tests for state sync
- [ ] Achieve >80% coverage on new code

---

## 7.2 Integration Tests

- [ ] **CREATE**: Integration test suite

Test flow:
1. Create raffle on contract
2. Verify event listener catches RaffleCreated
3. Enter raffle
4. Verify RaffleEntered event processed
5. Trigger draw (on testnet)
6. Verify DrawTriggered event
7. Wait for VRF callback
8. Verify WinnersSelected event
9. Check winners in database
10. Check payouts marked as "paid"
11. Verify raffle state = "completed"

### Checklist
- [ ] Setup testnet contract
- [ ] Fund with test USDC and LINK
- [ ] Write end-to-end integration test
- [ ] Test on Polygon Amoy testnet
- [ ] Verify all events processed correctly

---

## 7.3 Manual Testing Checklist

- [ ] Create raffle via admin API
- [ ] Verify raffle shows "scheduled" before startTime
- [ ] Wait until startTime, verify shows "active"
- [ ] Enter raffle, verify entry recorded
- [ ] Verify RaffleEntered event processed
- [ ] Wait until 4 min before endTime, verify shows "ending"
- [ ] Trigger draw after endTime
- [ ] Verify DrawTriggered event
- [ ] Wait for VRF callback (on testnet)
- [ ] Verify WinnersSelected event processed
- [ ] Check winners created in database
- [ ] Check payouts created with status="paid"
- [ ] Verify raffle contractState="completed"
- [ ] Test manual sync API
- [ ] Verify protocol fees sync correctly

### Admin Operations Testing
- [ ] Accumulate some protocol fees (complete a raffle)
- [ ] Check available fees via GET /api/admin/fees/withdraw
- [ ] Withdraw fees to admin wallet
- [ ] Verify USDC received in wallet
- [ ] Verify protocolFeesCollected reduced on-chain
- [ ] Test emergency cancel (simulate VRF failure on testnet)
- [ ] Verify 12-hour delay enforced
- [ ] Test that normal cancel doesn't work after draw
- [ ] Verify admin wallet balance checks (MATIC, LINK only, no USDC)

---

## 7.4 Verification Checklist

### Code Deletion Verified
- [ ] No manual payout processing code remains
- [ ] No off-chain winner selection code remains
- [ ] Payout API endpoints removed
- [ ] ~700 lines of code deleted

### Event Listening Implemented
- [ ] Event listener service created
- [ ] All events handled correctly
- [ ] Error handling in place
- [ ] Logging implemented

### State Management Fixed
- [ ] `contractState` field added
- [ ] Status computation service created
- [ ] All services use `contractState`
- [ ] Display status computed correctly
- [ ] API responses include `displayStatus`

### Protocol Fee Sync Working
- [ ] Fee reading from contract works
- [ ] Periodic sync implemented
- [ ] Manual sync API works
- [ ] Stats updated correctly

### No Regressions
- [ ] Build succeeds without errors
- [ ] All existing tests pass
- [ ] API endpoints still functional
- [ ] No breaking changes to clients

---

# IMPLEMENTATION ORDER

Follow this exact order to minimize issues:

## Week 1: Cleanup & Foundation
1. **Day 1**: Phase 1 - Delete incorrect code
2. **Day 2**: Phase 3.1 - Update raffle model with contractState
3. **Day 3**: Phase 3.2 - Create status service

## Week 2: Event System
4. **Day 4-5**: Phase 2.1 - Create event listener service
5. **Day 6**: Phase 2.2 - Update draw service
6. **Day 7**: Testing event listeners

## Week 3: State & Sync
7. **Day 8**: Phase 3.3 - Update repository
8. **Day 9**: Phase 3.4 - Update all services to use contractState
9. **Day 10**: Phase 3.5 - Update API responses
10. **Day 11**: Phase 4 - Protocol fee sync

## Week 4: Admin Operations (CRITICAL)
11. **Day 12**: Phase 5.1 - Add withdraw protocol fees (MUST HAVE)
12. **Day 13**: Phase 5.2 - Add emergency cancel
13. **Day 14**: Phase 5.3-5.4 - Fix admin wallet service, remove submitPayout
14. **Day 15**: Phase 5.5 - Optional pause/unpause (if time permits)

## Week 5: API & Documentation
15. **Day 16**: Phase 6 - Update API documentation
16. **Day 17**: Add all new API endpoints to documentation

## Week 6: Integration & Testing
17. **Day 18-19**: Phase 7.1-7.2 - Unit & integration tests
18. **Day 20**: Phase 7.3 - Manual testing on testnet
19. **Day 21**: Phase 7.4 - Final verification
20. **Day 22**: Test fee withdrawal on testnet

---

# ROLLBACK PLAN

If issues arise, rollback in reverse order:

1. Revert API changes (Phase 5)
2. Revert service updates (Phase 3.4)
3. Revert status service (Phase 3.2)
4. Revert event listeners (Phase 2)
5. Restore deleted files from git (Phase 1)

Git tags recommended:
- `before-business-logic-fix` - Tag current state
- `after-phase-1` - After deletions
- `after-phase-2` - After event system
- `after-phase-3` - After state fixes
- `after-phase-4` - After fee sync
- `production-ready` - After full testing

---

# SUCCESS CRITERIA

## Functional Requirements
- ✅ Winners selected on-chain, recorded via events
- ✅ No manual payout processing
- ✅ Contract state synced to database
- ✅ Display status computed correctly
- ✅ "scheduled" state works for admin pre-scheduling
- ✅ Protocol fees synced from contract
- ✅ All events processed correctly

## Technical Requirements
- ✅ ~700 lines of code deleted
- ✅ Event listener service implemented
- ✅ State management fixed
- ✅ Build succeeds
- ✅ Tests pass (>80% coverage)
- ✅ No breaking changes to existing clients

## Business Requirements
- ✅ Admin can pre-schedule raffles (using "scheduled" displayStatus)
- ✅ Users see correct raffle status
- ✅ Winners determined by contract (trustless)
- ✅ Payments automatic (no manual processing)
- ✅ Platform fees tracked accurately

---

# NOTES & CAVEATS

## "Scheduled" State Clarification

Per user feedback, **"scheduled" is needed for admin pre-scheduling**:

- Admin creates raffle in backend before announcing it
- Backend shows "scheduled" (not yet live to users)
- Contract is already `Active` (can accept entries if someone finds it)
- When admin activates, backend changes to show "active"
- This is purely a backend/UI state, not on-chain

**Implementation**:
- `contractState` = 'active' (source of truth from contract)
- `displayStatus` = 'scheduled' (computed, before startTime or manual activation)
- Admin can change raffle to "active" display before startTime if desired

## Event Listener Reliability

Event listeners should be:
- Run in a persistent process (not API routes)
- Have retry logic for missed events
- Support historical event catchup
- Log all events for debugging

Consider using a message queue (SQS, Redis) for production reliability.

## Rate Limiting

Blockchain RPC calls are rate limited:
- Use batch calls where possible
- Cache contract reads for 1-2 minutes
- Use events instead of polling

## Monitoring

Add monitoring for:
- Event listener uptime
- Event processing latency
- State sync success rate
- Missed events (gap detection)
- Contract state vs DB state divergence

---

# REFERENCE FILES

## Key Files to Keep Handy

1. **Contract**: `lib/blockchain/contracts/FairWinRaffle.sol`
   - Source of truth for events, states, logic

2. **Models**: `lib/db/models/raffle/raffle.model.ts`
   - Raffle data structure

3. **Errors**: `lib/services/errors.ts`
   - Error types used throughout

4. **API Errors**: `lib/api/error-handler.ts`
   - HTTP error mapping

## Contract Event Reference

```solidity
// From FairWinRaffle.sol lines 686-753

event RaffleCreated(
    uint256 indexed raffleId,
    uint256 entryPrice,
    uint256 startTime,
    uint256 endTime,
    uint256 maxEntries,
    uint256 winnerPercent,
    uint256 platformFeePercent
);

event RaffleEntered(
    uint256 indexed raffleId,
    address indexed user,
    uint256 numEntries,
    uint256 totalUserEntries,
    uint256 amountPaid
);

event DrawTriggered(
    uint256 indexed raffleId,
    uint256 vrfRequestId,
    uint256 expectedWinners
);

event WinnersSelected(
    uint256 indexed raffleId,
    address[] winners,
    uint256 prizePerWinner,
    uint256 totalPrize,
    uint256 protocolFee
);

event RaffleCancelled(
    uint256 indexed raffleId,
    string reason
);

event RefundClaimed(
    uint256 indexed raffleId,
    address indexed user,
    uint256 amount
);

event FeesWithdrawn(
    address indexed to,
    uint256 amount
);
```

---

# COMPLETION TRACKING

Track progress by checking off items in each phase.

**Estimated Timeline**: 22 days (4-5 weeks)
**Current Status**: Phase 4 - Protocol Fee Sync
**Last Updated**: 2026-01-30
**Completed Phases**:
- ✅ Phase 1: Delete Incorrect Code (COMPLETE)
- ✅ Phase 2: Create Event Listening System (COMPLETE)
- ✅ Phase 3: Fix State Management (COMPLETE)
- 🔄 Phase 4: Protocol Fee Sync (IN PROGRESS)
**Next Action**: Phase 4 - Implement protocol fee syncing from blockchain

---

# FINAL SUMMARY

## What Admin Can Do (After Fixes)

### ✅ On-Chain Operations (Triggers Contract Functions)
1. **Create Raffle** - Set up new raffle with parameters
2. **Cancel Raffle** - Cancel before draw
3. **Trigger Draw** - Initiate VRF random number request
4. **Emergency Cancel** - Cancel if VRF fails (12+ hour delay)
5. **Withdraw Protocol Fees** - **CRITICAL: Admin's revenue!**
6. **Pause/Unpause Contract** - Emergency stop (optional)
7. **Update VRF Config** - Technical maintenance (optional)
8. **Update Limits** - Safety rails (optional)

### ✅ Backend Operations (No Contract Interaction)
9. **Pre-schedule Raffle** - Create before public announcement
10. **Activate Scheduled Raffle** - Make visible to users
11. **View Stats** - Analytics and monitoring
12. **Check Wallet Balance** - MATIC and LINK (not USDC)

### ❌ What Admin CANNOT Do (Contract Controls)
- ❌ Select winners (contract does with VRF)
- ❌ Process payouts (automatic by contract)
- ❌ Delay/modify winner payments
- ❌ Access active raffle funds
- ❌ Change raffle params after creation

## Critical Files Created/Modified

### New Files (11)
1. `lib/services/blockchain/event-listener.service.ts` - Event listening
2. `lib/services/blockchain/payout-tracker.service.ts` - Track payments
3. `lib/services/blockchain/sync.service.ts` - Blockchain sync
4. `lib/services/raffle/raffle-status.service.ts` - Status computation
5. `lib/services/admin/admin-fees.service.ts` - Fee withdrawal
6. `app/api/admin/sync/route.ts` - Manual sync API
7. `app/api/admin/fees/withdraw/route.ts` - Fee withdrawal API
8. `app/api/admin/raffles/[id]/emergency-cancel/route.ts` - Emergency cancel API
9. `app/api/admin/pause/route.ts` - Pause contract (optional)
10. `app/api/admin/unpause/route.ts` - Unpause contract (optional)
11. `lib/services/blockchain/__tests__/event-listener.test.ts` - Tests

### Deleted Files (4)
1. ❌ `lib/services/raffle/raffle-payout.service.ts`
2. ❌ `lib/services/admin/admin-payout.service.ts`
3. ❌ `app/api/admin/payouts/route.ts`
4. ❌ `app/api/admin/raffles/[id]/payouts/route.ts`

### Modified Files (12)
1. `lib/db/models/raffle/raffle.model.ts` - Add contractState
2. `lib/services/raffle/raffle-draw.service.ts` - Event-driven
3. `lib/services/raffle/raffle-entry.service.ts` - Use contractState
4. `lib/services/raffle/raffle-validation.service.ts` - Use contractState
5. `lib/services/raffle/raffle-management.service.ts` - Use contractState
6. `lib/services/blockchain/contract-read.service.ts` - Add fee reading
7. `lib/services/blockchain/contract-write.service.ts` - Add admin ops, remove submitPayout
8. `lib/services/admin/admin-wallet.service.ts` - Remove USDC checks
9. `lib/db/repositories/raffle/raffle.repository.ts` - Add getActiveRaffles
10. `app/api/raffles/route.ts` - Add displayStatus
11. `app/api/raffles/[id]/route.ts` - Add displayStatus
12. `lib/api/error-handler.ts` - Handle new error types

## Code Impact
- **Lines Deleted**: ~720 lines (manual payout system)
- **Lines Added**: ~600 lines (event listeners, admin ops)
- **Net Change**: -120 lines (cleaner codebase!)
- **Files Changed**: 27 total (11 new, 4 deleted, 12 modified)

## Key Wins
✅ Blockchain is source of truth (trustless)
✅ Winners selected on-chain (provably fair)
✅ Payouts automatic (instant, no admin control)
✅ Admin can withdraw revenue (protocol fees)
✅ "Scheduled" state preserved (admin pre-scheduling)
✅ Simpler, more reliable architecture
✅ Gas savings (no manual payout txs)
✅ Real-time event-driven updates

---

**END OF TRACKER**
