# FairWin - Final Project Structure

> Based on UI designs analysis. Feature-based architecture with game isolation.

---

## 📁 Directory Structure

```
fairwin-app/
│
├── app/                                    # Next.js App Router (PAGES ONLY)
│   ├── layout.tsx                          # Root layout + providers
│   ├── page.tsx                            # Home (01-home.html)
│   ├── globals.css                         # Global styles + Tailwind
│   │
│   ├── games/
│   │   └── raffle/
│   │       ├── page.tsx                    # Raffle Hub (02-raffle-hub.html)
│   │       └── [id]/
│   │           └── page.tsx                # Raffle Detail (03-06 states)
│   │
│   ├── account/
│   │   └── page.tsx                        # My Account (07-account.html)
│   │
│   ├── winners/
│   │   └── page.tsx                        # Winners (08-winners.html)
│   │
│   ├── how-it-works/
│   │   └── page.tsx                        # How It Works (09-how-it-works.html)
│   │
│   ├── verify/
│   │   └── page.tsx                        # Verify (10-verify.html)
│   │
│   ├── (legal)/
│   │   ├── terms/page.tsx                  # Terms (11-terms.html)
│   │   └── privacy/page.tsx                # Privacy (12-privacy.html)
│   │
│   ├── admin/
│   │   ├── layout.tsx                      # Admin layout (sidebar)
│   │   ├── page.tsx                        # Dashboard (01-dashboard.html)
│   │   ├── raffles/
│   │   │   ├── page.tsx                    # All Raffles (02-raffles.html)
│   │   │   ├── create/
│   │   │   │   └── page.tsx                # Create Raffle (03-create-raffle.html)
│   │   │   └── [id]/
│   │   │       └── page.tsx                # Raffle Detail (04-raffle-detail.html)
│   │   ├── winners/
│   │   │   └── page.tsx                    # Winners & Payouts (05-winners-payouts.html)
│   │   ├── wallet/
│   │   │   └── page.tsx                    # Operator Wallet (06-operator-wallet.html)
│   │   └── settings/
│   │       └── page.tsx                    # Settings (07-settings.html)
│   │
│   └── api/
│       ├── raffles/
│       │   ├── route.ts                    # GET list, POST create
│       │   └── [id]/
│       │       └── route.ts                # GET single, PATCH update
│       ├── user/
│       │   ├── route.ts                    # GET user profile
│       │   └── entries/route.ts            # GET user entries
│       └── socket/
│           └── quote/route.ts              # POST get bridge quote
│
├── features/                               # FEATURE MODULES (isolated)
│   │
│   ├── raffle/                             # 🎟️ RAFFLE GAME MODULE
│   │   ├── components/
│   │   │   ├── RaffleCard.tsx              # Card on hub page
│   │   │   ├── RaffleList.tsx              # Grid of cards
│   │   │   ├── RaffleDetail.tsx            # Full detail view
│   │   │   ├── RaffleHeader.tsx            # Title + status + timer
│   │   │   ├── PrizePoolCard.tsx           # Prize pool display
│   │   │   ├── PrizeBreakdown.tsx          # Prize distribution tiers
│   │   │   ├── RaffleStats.tsx             # Entries, participants, winners
│   │   │   ├── RaffleTimer.tsx             # Countdown timer
│   │   │   ├── EntryCard.tsx               # Entry form container
│   │   │   ├── EntryForm.tsx               # Entry form (connected)
│   │   │   ├── ConnectPrompt.tsx           # Connect wallet prompt
│   │   │   ├── QuantitySelector.tsx        # Entry quantity buttons
│   │   │   ├── ParticipantsList.tsx        # Participants tab
│   │   │   ├── WinnersList.tsx             # Winners display
│   │   │   ├── RaffleRules.tsx             # Rules banner
│   │   │   ├── PastWinners.tsx             # Past winners section
│   │   │   ├── RaffleInfo.tsx              # Contract info section
│   │   │   ├── DrawingState.tsx            # Drawing animation
│   │   │   ├── ResultModal.tsx             # Won/Lost modal
│   │   │   └── FilterTabs.tsx              # All/Daily/Weekly/Monthly
│   │   ├── hooks/
│   │   │   ├── useRaffle.ts                # Single raffle query
│   │   │   ├── useRaffles.ts               # List raffles query
│   │   │   ├── useRaffleParticipants.ts    # Participants query
│   │   │   ├── useEnterRaffle.ts           # Enter raffle mutation
│   │   │   └── useRaffleTimer.ts           # Countdown hook
│   │   ├── api.ts                          # API calls
│   │   ├── contract.ts                     # Contract interactions
│   │   ├── types.ts                        # Raffle types only
│   │   ├── constants.ts                    # Raffle constants
│   │   └── index.ts                        # Public exports
│   │
│   ├── account/                            # 👤 ACCOUNT MODULE
│   │   ├── components/
│   │   │   ├── AccountHeader.tsx           # Avatar + address + actions
│   │   │   ├── AccountStats.tsx            # Stats grid
│   │   │   ├── ActiveEntries.tsx           # Active entries tab
│   │   │   ├── EntryHistoryList.tsx        # History tab
│   │   │   ├── WinsList.tsx                # Wins tab
│   │   │   ├── HistoryItem.tsx             # Single history item
│   │   │   └── EmptyState.tsx              # No wins/entries state
│   │   ├── hooks/
│   │   │   ├── useUserStats.ts
│   │   │   ├── useUserEntries.ts
│   │   │   └── useUserHistory.ts
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── admin/                              # 🔐 ADMIN MODULE
│   │   ├── components/
│   │   │   ├── Sidebar.tsx                 # Admin sidebar nav
│   │   │   ├── DashboardStats.tsx          # Stats cards
│   │   │   ├── ActiveRafflesTable.tsx      # Active raffles table
│   │   │   ├── RecentWinners.tsx           # Recent winners list
│   │   │   ├── CreateRaffleForm.tsx        # Create form
│   │   │   ├── RafflePreview.tsx           # Form preview card
│   │   │   ├── RaffleManagement.tsx        # Manage single raffle
│   │   │   ├── TriggerDrawButton.tsx       # Trigger draw action
│   │   │   ├── WinnersPayoutTable.tsx      # Winners table
│   │   │   ├── OperatorWalletCard.tsx      # Wallet balance
│   │   │   ├── WithdrawFeesForm.tsx        # Withdraw form
│   │   │   └── SettingsForm.tsx            # Settings form
│   │   ├── hooks/
│   │   │   ├── useAdminStats.ts
│   │   │   ├── useAdminRaffles.ts
│   │   │   ├── useCreateRaffle.ts
│   │   │   ├── useTriggerDraw.ts
│   │   │   └── useWithdrawFees.ts
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── home/                               # 🏠 HOME MODULE
│       ├── components/
│       │   ├── Hero.tsx                    # Hero section
│       │   ├── HeroStats.tsx               # Stats on right
│       │   ├── GamesGrid.tsx               # Games selection
│       │   ├── GameCard.tsx                # Single game card
│       │   ├── LiveDraws.tsx               # Active draws list
│       │   ├── DrawRow.tsx                 # Single draw row
│       │   ├── RealtimeWins.tsx            # Earnings section
│       │   ├── WinFeedItem.tsx             # Single win item
│       │   ├── VerifySection.tsx           # Verify steps
│       │   ├── DifferenceSection.tsx       # Us vs them
│       │   ├── FAQ.tsx                     # FAQ accordion
│       │   └── CTASection.tsx              # Final CTA
│       └── index.ts
│
├── shared/                                 # SHARED COMPONENTS
│   │
│   ├── components/
│   │   ├── ui/                             # Base UI (shadcn-style)
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/
│   │   │   ├── Header.tsx                  # Main nav
│   │   │   ├── Footer.tsx                  # Footer
│   │   │   ├── Container.tsx               # Max-width container
│   │   │   └── PageHeader.tsx              # Breadcrumb + title
│   │   │
│   │   └── web3/
│   │       ├── ConnectButton.tsx           # Wallet connect
│   │       ├── WalletStatus.tsx            # Connected state
│   │       ├── ChainBadge.tsx              # Network indicator
│   │       ├── AddressDisplay.tsx          # Truncated address
│   │       └── TxStatus.tsx                # Transaction status
│   │
│   ├── hooks/
│   │   ├── useTokenBalance.ts
│   │   ├── useTokenApproval.ts
│   │   ├── useSocketQuote.ts
│   │   ├── useSocketBridge.ts
│   │   └── useCountdown.ts
│   │
│   └── utils/
│       ├── format.ts                       # formatUSDC, formatAddress, formatTime
│       ├── cn.ts                           # classNames utility
│       └── constants.ts                    # App-wide constants
│
├── lib/                                    # CORE INFRASTRUCTURE
│   │
│   ├── api/
│   │   └── client.ts                       # Base fetch wrapper
│   │
│   ├── contracts/
│   │   ├── abi/
│   │   │   └── FairWinRaffle.json
│   │   ├── addresses.ts                    # Contract addresses by chain
│   │   └── client.ts                       # Viem contract setup
│   │
│   ├── socket/
│   │   ├── client.ts                       # Socket API client
│   │   └── types.ts
│   │
│   ├── db/
│   │   ├── client.ts                       # DynamoDB client
│   │   └── queries.ts                      # DB operations
│   │
│   └── wagmi/
│       ├── config.ts                       # Wagmi + chains config
│       └── provider.tsx                    # Web3 provider wrapper
│
├── stores/                                 # ZUSTAND STORES
│   ├── useAppStore.ts                      # Global UI state
│   └── usePaymentStore.ts                  # Payment flow state
│
├── providers/
│   └── Providers.tsx                       # All providers combined
│
├── designs/                                # 📐 DESIGN FILES (reference)
│   ├── fairwin-bundle-desktop/             # User journey HTMLs
│   └── fairwin-admin-bundle/               # Admin journey HTMLs
│
├── DESIGN_SPEC.md                          # Design tokens & guidelines
├── PROJECT_STRUCTURE.md                    # This file
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🔑 Key Patterns

### Page Pattern (Thin)
```tsx
// app/games/raffle/page.tsx
import { RaffleHub } from '@/features/raffle'

export default function RafflePage() {
  return <RaffleHub />
}
```

### Feature Component Pattern
```tsx
// features/raffle/components/RaffleCard.tsx
import { type Raffle } from '../types'
import { Card, Badge, Button } from '@/shared/components/ui'
import { formatUSDC } from '@/shared/utils/format'

interface Props {
  raffle: Raffle
}

export function RaffleCard({ raffle }: Props) {
  return (
    <Card className="...">
      {/* Component content */}
    </Card>
  )
}
```

### Hook Pattern (TanStack Query)
```tsx
// features/raffle/hooks/useRaffles.ts
import { useQuery } from '@tanstack/react-query'
import { getRaffles } from '../api'

export function useRaffles(filter?: string) {
  return useQuery({
    queryKey: ['raffles', filter],
    queryFn: () => getRaffles(filter),
  })
}
```

### Store Pattern (Zustand)
```tsx
// stores/useAppStore.ts
import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    
    "@tanstack/react-query": "5.x",
    "zustand": "4.x",
    
    "wagmi": "2.x",
    "viem": "2.x",
    "@rainbow-me/rainbowkit": "2.x",
    
    "@aws-sdk/client-dynamodb": "3.x",
    "@aws-sdk/lib-dynamodb": "3.x",
    
    "tailwindcss": "3.x",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    
    "date-fns": "latest"
  }
}
```

---

## 🎮 Adding New Games

To add **Coin Toss** game:

1. Create `features/coin-toss/` following raffle structure
2. Add pages under `app/games/coin-toss/`
3. Add API routes under `app/api/coin-toss/`
4. Contract ABI to `lib/contracts/abi/`

**No changes needed to shared components or other features.**
