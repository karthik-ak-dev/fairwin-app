# FairWin Production Rewrite — Complete Task List

> Full production implementation. Real DynamoDB (Query only, NO Scans), real APIs, real contract integration.
> All config from env. Dummy values until deployment.

---

## Agreed Tech Stack
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **State:** TanStack Query (server) + Zustand (client, minimal)
- **Backend:** Next.js API routes (serverless, AWS Amplify)
- **Database:** DynamoDB — SEPARATE TABLES, NO single-table design, **NO SCANS EVER**
- **Hosting:** AWS Amplify
- **Secrets:** AWS Secrets Manager (fetch on-demand, never cache in memory)
- **Blockchain:** Polygon, Solidity, OpenZeppelin
- **Wallet:** RainbowKit + wagmi + viem
- **Randomness:** Chainlink VRF V2
- **Bridging:** Socket API (cross-chain deposits)

## Agreed Practices
1. DynamoDB: NO SCANS — always Query with proper keys + GSIs
2. No code duplication — extract shared logic
3. No scattered logic — centralized by domain
4. Standard patterns — same approach across all features
5. Strict TypeScript — don't over-create types, use inference
6. Minimal, neat, clean code
7. Extensibility — supports future games (slots, dice, etc.)
8. Desktop-first responsive — single codebase, CSS breakpoints

---

## Status Legend
- ✅ Not started
- 🔨 In progress
- ✅ Done

---

## Phase 1: Environment & Configuration (6 tasks)

- ✅ 1.1 `.env.example` — complete with ALL vars: DynamoDB tables (RAFFLES, ENTRIES, USERS, WINNERS, PAYOUTS), AWS region/creds, CONTRACT_ADDRESS, ADMIN_WALLET_ADDRESS, WALLETCONNECT_PROJECT_ID, USDC_CONTRACT, VRF config, SOCKET_API_KEY, APP_URL, POLYGONSCAN_URL
- ✅ 1.2 `lib/env.ts` — server + client env validation, typed access, requireEnv/optionalEnv helpers
- ✅ 1.3 `lib/db/client.ts` — DynamoDB DocumentClient + ALL table names from env (RAFFLES, ENTRIES, USERS, WINNERS, PAYOUTS)
- ✅ 1.4 `lib/secrets.ts` — AWS Secrets Manager client, fetchSecret(name) helper (fetch on-demand, never cache)
- ✅ 1.5 `next.config.js` — env exposure, image remotePatterns, webpack config for viem
- ✅ 1.6 `lib/contracts/addresses.ts` — contract address + USDC address from env, chain config

## Phase 2: DynamoDB Table Design & Models (7 tasks)

> SEPARATE tables. Each with proper PK/SK for Query access. GSIs for secondary access patterns. NO SCANS.

- ✅ 2.1 `lib/db/models/raffle.model.ts` — **Table: fairwin-raffles**
  - PK: `raffleId` (string, UUID)
  - GSI `status-endTime-index`: PK=`status`, SK=`endTime` (query active/ending raffles sorted by end time)
  - GSI `type-createdAt-index`: PK=`type`, SK=`createdAt` (query by raffle type)
  - Fields: raffleId, type, status, title, description, entryPrice, maxEntriesPerUser, totalEntries, totalParticipants, prizePool, protocolFee, winnerPayout, startTime, endTime, drawTime, vrfRequestId, vrfRandomWord, contractAddress, transactionHash, createdAt, updatedAt

- ✅ 2.2 `lib/db/models/entry.model.ts` — **Table: fairwin-entries**
  - PK: `raffleId` (string), SK: `entryId` (string, UUID)
  - GSI `walletAddress-createdAt-index`: PK=`walletAddress`, SK=`createdAt` (query user's entries across raffles)
  - GSI `raffleId-walletAddress-index`: PK=`raffleId`, SK=`walletAddress` (query user's entries in specific raffle)
  - Fields: raffleId, entryId, walletAddress, numEntries, totalPaid, transactionHash, blockNumber, status, createdAt

- ✅ 2.3 `lib/db/models/user.model.ts` — **Table: fairwin-users**
  - PK: `walletAddress` (string, lowercase)
  - No GSI needed (always query by wallet address)
  - Fields: walletAddress, totalWon, totalSpent, rafflesEntered, rafflesWon, winRate, activeEntries, lastActive, createdAt, updatedAt

- ✅ 2.4 `lib/db/models/winner.model.ts` — **Table: fairwin-winners**
  - PK: `raffleId` (string), SK: `rank` (number)
  - GSI `walletAddress-createdAt-index`: PK=`walletAddress`, SK=`createdAt` (query user's wins)
  - Fields: raffleId, rank, walletAddress, prize, tier, transactionHash, paidAt, createdAt

- ✅ 2.5 `lib/db/models/payout.model.ts` — **Table: fairwin-payouts**
  - PK: `payoutId` (string, UUID)
  - GSI `raffleId-createdAt-index`: PK=`raffleId`, SK=`createdAt` (payouts per raffle)
  - GSI `status-createdAt-index`: PK=`status`, SK=`createdAt` (query by payout status)
  - GSI `walletAddress-createdAt-index`: PK=`walletAddress`, SK=`createdAt` (user's payouts)
  - Fields: payoutId, raffleId, walletAddress, amount, status, transactionHash, error, createdAt, updatedAt

- ✅ 2.6 `lib/db/models/platform-stats.model.ts` — **Table: fairwin-raffles (special item)**
  - PK: `PLATFORM_STATS` (singleton item in raffles table for aggregated counters)
  - Fields: totalRevenue, totalPaidOut, totalRaffles, totalEntries, totalPlayers, totalWinners
  - Updated atomically via UpdateCommand ADD on each entry/win

- ✅ 2.7 `lib/db/models/index.ts` — barrel exports for all models

## Phase 3: Repository Layer (7 tasks)

> Every repo method uses Query or Get. NO Scan. Pagination via LastEvaluatedKey/ExclusiveStartKey.

- ✅ 3.1 `lib/db/repositories/raffle.repository.ts`
  - `getById(raffleId)` → GetCommand on PK
  - `getByStatus(status, limit?, startKey?)` → QueryCommand on status-endTime-index
  - `getByType(type, limit?, startKey?)` → QueryCommand on type-createdAt-index
  - `getActiveAndEnding(limit?)` → QueryCommand on status-endTime-index for status='active' + separate query for 'ending'
  - `create(data)` → PutCommand, generate UUID
  - `update(raffleId, updates)` → UpdateCommand with expression builder
  - `incrementEntries(raffleId, numEntries, amount, isNewParticipant)` → UpdateCommand with ADD

- ✅ 3.2 `lib/db/repositories/entry.repository.ts`
  - `create(data)` → PutCommand with PK=raffleId, SK=entryId
  - `getByRaffle(raffleId, limit?, startKey?)` → QueryCommand on PK, ScanIndexForward=false (newest first)
  - `getByUser(walletAddress, limit?, startKey?)` → QueryCommand on walletAddress-createdAt-index
  - `getUserEntriesForRaffle(raffleId, walletAddress)` → QueryCommand on raffleId-walletAddress-index
  - `countByRaffle(raffleId)` → QueryCommand with Select='COUNT'

- ✅ 3.3 `lib/db/repositories/user.repository.ts`
  - `getByAddress(walletAddress)` → GetCommand
  - `create(walletAddress)` → PutCommand with defaults (zeros)
  - `getOrCreate(walletAddress)` → Get, conditionally Put
  - `update(walletAddress, updates)` → UpdateCommand
  - `incrementEntries(walletAddress, spent, numEntries)` → UpdateCommand ADD
  - `recordWin(walletAddress, prize)` → UpdateCommand ADD totalWon, rafflesWon, recalc winRate

- ✅ 3.4 `lib/db/repositories/winner.repository.ts`
  - `create(data)` → PutCommand with PK=raffleId, SK=rank
  - `getByRaffle(raffleId)` → QueryCommand on PK (returns all winners sorted by rank)
  - `getByUser(walletAddress, limit?, startKey?)` → QueryCommand on walletAddress-createdAt-index
  - `updatePayout(raffleId, rank, txHash)` → UpdateCommand

- ✅ 3.5 `lib/db/repositories/payout.repository.ts`
  - `create(data)` → PutCommand, generate UUID
  - `getById(payoutId)` → GetCommand
  - `getByRaffle(raffleId, limit?, startKey?)` → QueryCommand on raffleId-createdAt-index
  - `getByStatus(status, limit?, startKey?)` → QueryCommand on status-createdAt-index
  - `getByUser(walletAddress, limit?, startKey?)` → QueryCommand on walletAddress-createdAt-index
  - `updateStatus(payoutId, status, txHash?)` → UpdateCommand

- ✅ 3.6 `lib/db/repositories/stats.repository.ts`
  - `getPlatformStats()` → GetCommand on PLATFORM_STATS singleton
  - `incrementEntryStats(entryAmount, isNewPlayer)` → UpdateCommand ADD
  - `incrementWinStats(payoutAmount)` → UpdateCommand ADD
  - `incrementRaffleCount()` → UpdateCommand ADD

- ✅ 3.7 `lib/db/repositories/index.ts` — barrel exports + singleton instances

## Phase 4: Auth & Middleware (3 tasks)

- ✅ 4.1 `lib/api/admin-auth.ts` — isAdmin(request) checks x-wallet-address header vs ADMIN_WALLET_ADDRESS env, unauthorized() helper
- ✅ 4.2 `lib/api/validate.ts` — shared validation helpers: validateAddress(addr), validatePositiveNumber(n), validateRaffleType(type), validateRequired(fields), badRequest(msg) helper
- ✅ 4.3 `shared/hooks/useAdmin.ts` — frontend hook: useAccount() + compare to NEXT_PUBLIC_ADMIN_WALLET_ADDRESS env

## Phase 5: API Routes — Raffle (8 tasks)

- ✅ 5.1 `app/api/raffles/route.ts` GET — query raffles by status/type via repo (NO scan), pagination
- ✅ 5.2 `app/api/raffles/route.ts` POST — create raffle, admin auth, input validation, repo.create()
- ✅ 5.3 `app/api/raffles/[id]/route.ts` GET — repo.getById(), 404 if not found, include recent entries + winners if completed
- ✅ 5.4 `app/api/raffles/[id]/route.ts` PATCH — update raffle, admin auth, repo.update()
- ✅ 5.5 `app/api/raffles/[id]/enter/route.ts` POST — validate raffle active, validate entry limits, repo.create entry, increment raffle stats, increment user stats, increment platform stats
- ✅ 5.6 `app/api/raffles/[id]/participants/route.ts` GET — repo.getByRaffle(), pagination
- ✅ 5.7 `app/api/raffles/[id]/winners/route.ts` GET — winnerRepo.getByRaffle()
- ✅ 5.8 `app/api/raffles/[id]/draw/route.ts` POST — admin auth, trigger draw, update raffle status to 'drawing'

## Phase 6: API Routes — User (3 tasks)

- ✅ 6.1 `app/api/user/route.ts` GET — userRepo.getOrCreate(address), address required query param
- ✅ 6.2 `app/api/user/entries/route.ts` GET — entryRepo.getByUser(address), pagination
- ✅ 6.3 `app/api/user/wins/route.ts` GET — winnerRepo.getByUser(address), pagination

## Phase 7: API Routes — Admin (3 tasks)

- ✅ 7.1 `app/api/admin/stats/route.ts` GET — statsRepo.getPlatformStats(), admin auth
- ✅ 7.2 `app/api/admin/winners/route.ts` GET — payoutRepo.getByStatus(filter), admin auth, pagination
- ✅ 7.3 `app/api/admin/wallet/route.ts` GET — admin wallet address from env, placeholder for chain balance reads

## Phase 8: Feature API Client Layer (4 tasks)

- ✅ 8.1 `lib/api/client.ts` — typed apiClient<T>(endpoint, options) with error handling, auth headers, base URL
- ✅ 8.2 `features/raffle/api.ts` — getRaffles(filter), getRaffle(id), enterRaffle(id, data), getParticipants(id), getWinners(id) → real endpoints
- ✅ 8.3 `features/account/api.ts` — getUserProfile(address), getUserEntries(address), getUserWins(address) → real endpoints
- ✅ 8.4 `features/admin/api.ts` — getAdminStats(), getAdminWinners(filter), getWalletInfo(), createRaffle(data), updateRaffle(id, data) → real endpoints with admin header

## Phase 9: Smart Contract Integration (5 tasks)

- ✅ 9.1 `features/raffle/contract.ts` — real ABI (enterRaffle, triggerDraw, withdrawFees, getRaffle, getUserEntries, approve USDC), contract address from env
- ✅ 9.2 `shared/hooks/useTokenBalance.ts` — real ERC20 balanceOf via useReadContract, USDC address from env
- ✅ 9.3 `shared/hooks/useTokenApproval.ts` — real allowance check + approve via useReadContract/useWriteContract
- ✅ 9.4 `lib/contracts/addresses.ts` — contract + USDC addresses from env, chain config
- ✅ 9.5 `features/raffle/events.ts` — contract event ABIs for on-chain listening (RaffleCreated, EntrySubmitted, WinnerSelected, etc.)

## Phase 10: Frontend Hooks — Raffle (5 tasks)

- ✅ 10.1 `features/raffle/hooks/useRaffles.ts` — useQuery → api.getRaffles(filter), no mock data
- ✅ 10.2 `features/raffle/hooks/useRaffle.ts` — useQuery → api.getRaffle(id), enabled when id exists
- ✅ 10.3 `features/raffle/hooks/useRaffleParticipants.ts` — useQuery → api.getParticipants(id)
- ✅ 10.4 `features/raffle/hooks/useEnterRaffle.ts` — useMutation: approve USDC → call contract enterRaffle → POST API with tx details → invalidate queries
- ✅ 10.5 `features/raffle/hooks/useRaffleTimer.ts` — client-side countdown, uses shared/hooks/useCountdown

## Phase 11: Frontend Hooks — Account (3 tasks)

- ✅ 11.1 `features/account/hooks/useUserStats.ts` — useQuery → api.getUserProfile(address)
- ✅ 11.2 `features/account/hooks/useUserEntries.ts` — useQuery → api.getUserEntries(address)
- ✅ 11.3 `features/account/hooks/useUserHistory.ts` — useQuery → api.getUserWins(address)

## Phase 12: Frontend Hooks — Admin (5 tasks)

- ✅ 12.1 `features/admin/hooks/useAdminStats.ts` — useQuery → api.getAdminStats()
- ✅ 12.2 `features/admin/hooks/useAdminRaffles.ts` — useQuery → api.getRaffles() with admin context
- ✅ 12.3 `features/admin/hooks/useCreateRaffle.ts` — useMutation → api.createRaffle(), invalidate raffles
- ✅ 12.4 `features/admin/hooks/useTriggerDraw.ts` — useMutation → contract triggerDraw + PATCH API
- ✅ 12.5 `features/admin/hooks/useWithdrawFees.ts` — useMutation → contract withdrawFees

## Phase 13: Component Rewrites — Raffle Pages (10 tasks)

- ✅ 13.1 `app/games/raffle/page.tsx` — useRaffles() hook, loading skeleton, error state, remove all hardcoded data
- ✅ 13.2 `features/raffle/components/RaffleDetail.tsx` — useRaffle(id), loading/error, pass real data to children
- ✅ 13.3 `features/raffle/components/RaffleDetailView.tsx` — accept raffle prop, pass real data to sub-components
- ✅ 13.4 `features/raffle/components/ParticipantsList.tsx` — useRaffleParticipants(), loading skeleton
- ✅ 13.5 `features/raffle/components/EntryCard.tsx` — useAccount() for wallet state, useEnterRaffle() for submission
- ✅ 13.6 `features/raffle/components/EntryForm.tsx` — real entry submission: approve → contract call → API post
- ✅ 13.7 `features/raffle/components/PrizePoolCard.tsx` — accept real prizePool/totalEntries props
- ✅ 13.8 `features/raffle/components/RaffleStats.tsx` — accept real stats props from raffle data
- ✅ 13.9 `features/raffle/components/PastWinners.tsx` — accept real winners array from API
- ✅ 13.10 Delete `features/raffle/mockData.ts`

## Phase 14: Component Rewrites — Account (6 tasks)

- ✅ 14.1 `app/account/page.tsx` — useAccount() for wallet, useUserStats/useUserEntries for data, loading states
- ✅ 14.2 `features/account/components/AccountHeader.tsx` — real wallet address from useAccount()
- ✅ 14.3 `features/account/components/AccountStats.tsx` — accept stats props, no hardcoded values
- ✅ 14.4 `features/account/components/ActiveEntries.tsx` — accept entries props, loading state
- ✅ 14.5 `features/account/components/EntryHistoryList.tsx` — accept history props, loading state
- ✅ 14.6 `features/account/components/WinsList.tsx` — accept wins props, loading state

## Phase 15: Component Rewrites — Admin (8 tasks)

- ✅ 15.1 `app/admin/page.tsx` — useAdmin() guard, useAdminStats() for data, unauthorized state
- ✅ 15.2 `features/admin/components/DashboardStats.tsx` — accept stats props
- ✅ 15.3 `features/admin/components/ActiveRafflesTable.tsx` — useAdminRaffles(), real data
- ✅ 15.4 `features/admin/components/RecentDrawsTable.tsx` — accept winners data
- ✅ 15.5 `features/admin/components/CreateRaffleForm.tsx` — useCreateRaffle() mutation, real submission
- ✅ 15.6 `app/admin/raffles/[id]/page.tsx` — useRaffle(id), real data to children
- ✅ 15.7 `app/admin/winners/page.tsx` — admin winners API, real payout data
- ✅ 15.8 `app/admin/wallet/page.tsx` — admin wallet API, real balance data

## Phase 16: Component Rewrites — Home Page (3 tasks)

- ✅ 16.1 `features/home/components/GamesGrid.tsx` — useRaffles({ status: 'active' }) for real active raffles
- ✅ 16.2 `features/home/components/HeroStats.tsx` — fetch real platform stats
- ✅ 16.3 `features/home/components/LiveDraws.tsx` — real raffle data for active draws

## Phase 17: Socket API Integration (4 tasks)

- ✅ 17.1 `lib/socket/client.ts` — Socket API client, getQuote(), getBridgeStatus()
- ✅ 17.2 `lib/socket/types.ts` — Socket API types (Quote, Route, BridgeStatus)
- ✅ 17.3 `shared/hooks/useSocketQuote.ts` — fetch bridge quote for cross-chain entry
- ✅ 17.4 `shared/hooks/useSocketBridge.ts` — execute bridge transaction

## Phase 18: Cleanup & Validation (5 tasks)

- ✅ 18.1 Delete all mock data files and inline mock arrays
- ✅ 18.2 Verify no ScanCommand anywhere in codebase (grep check)
- ✅ 18.3 TypeScript check — zero errors
- ✅ 18.4 Production build — `npm run build` passes clean
- ✅ 18.5 Review all API routes return proper status codes + error responses

---

## Progress Summary

| Phase | Tasks | Done | % |
|-------|-------|------|---|
| 1. Environment & Config | 6 | DONE | 100% |
| 2. DynamoDB Models | 7 | DONE | 100% |
| 3. Repository Layer | 7 | DONE | 100% |
| 4. Auth & Middleware | 3 | DONE | 100% |
| 5. API Routes — Raffle | 8 | DONE | 100% |
| 6. API Routes — User | 3 | DONE | 100% |
| 7. API Routes — Admin | 3 | DONE | 100% |
| 8. Feature API Clients | 4 | DONE | 100% |
| 9. Contract Integration | 5 | DONE | 100% |
| 10. Hooks — Raffle | 5 | DONE | 100% |
| 11. Hooks — Account | 3 | DONE | 100% |
| 12. Hooks — Admin | 5 | DONE | 100% |
| 13. Components — Raffle | 10 | DONE | 100% |
| 14. Components — Account | 6 | DONE | 100% |
| 15. Components — Admin | 8 | DONE | 100% |
| 16. Components — Home | 3 | DONE | 100% |
| 17. Socket API | 4 | DONE | 100% |
| 18. Cleanup & Validation | 5 | DONE | 100% |
| **TOTAL** | **95** | **0** | **0%** |

---

## Architecture

```
User Browser
  └── React Components (features/*/components/)
        └── TanStack Query Hooks (features/*/hooks/)
              └── Feature API Clients (features/*/api.ts)
                    └── Base API Client (lib/api/client.ts)
                          └── fetch() → Next.js API Routes (app/api/*)
                                └── Admin Auth (lib/api/admin-auth.ts)
                                └── Input Validation (lib/api/validate.ts)
                                └── Repository Layer (lib/db/repositories/)
                                      └── DynamoDB DocumentClient (lib/db/client.ts)
                                            └── AWS DynamoDB (table names from env)

  └── wagmi Hooks (contract interactions)
        └── Contract ABI + Address (features/raffle/contract.ts)
              └── Polygon RPC → Smart Contract

  └── Socket API Hooks (cross-chain bridging)
        └── Socket Client (lib/socket/client.ts)
```

## DynamoDB Table Design (NO SCANS — Query only)

### fairwin-raffles
| Access Pattern | Key | Index |
|---|---|---|
| Get raffle by ID | PK=raffleId | Table |
| List by status (sorted by endTime) | PK=status, SK=endTime | GSI: status-endTime-index |
| List by type (sorted by created) | PK=type, SK=createdAt | GSI: type-createdAt-index |
| Platform stats singleton | PK='PLATFORM_STATS' | Table |

### fairwin-entries
| Access Pattern | Key | Index |
|---|---|---|
| Entries for a raffle | PK=raffleId, SK=entryId | Table |
| User's entries across all raffles | PK=walletAddress, SK=createdAt | GSI: walletAddress-createdAt-index |
| User's entries in specific raffle | PK=raffleId, SK=walletAddress | GSI: raffleId-walletAddress-index |

### fairwin-users
| Access Pattern | Key | Index |
|---|---|---|
| Get user by wallet | PK=walletAddress | Table |

### fairwin-winners
| Access Pattern | Key | Index |
|---|---|---|
| Winners for a raffle (by rank) | PK=raffleId, SK=rank | Table |
| User's wins | PK=walletAddress, SK=createdAt | GSI: walletAddress-createdAt-index |

### fairwin-payouts
| Access Pattern | Key | Index |
|---|---|---|
| Get payout by ID | PK=payoutId | Table |
| Payouts for a raffle | PK=raffleId, SK=createdAt | GSI: raffleId-createdAt-index |
| Payouts by status | PK=status, SK=createdAt | GSI: status-createdAt-index |
| User's payouts | PK=walletAddress, SK=createdAt | GSI: walletAddress-createdAt-index |
