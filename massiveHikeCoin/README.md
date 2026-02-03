# MassiveHikeCoin - MLM Staking Platform

MVP for USDT staking with 5-level referral rewards on Binance Smart Chain.

## Features
- Stake USDT ($50-$10,000 per stake, unlimited stakes)
- 8% monthly returns for 24 months
- 5-level MLM referral system (8%, 3%, 2%, 1%, 1%)
- Monthly withdrawals (1st of each month)
- Web3 integration (BSC/USDT)

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Wagmi + RainbowKit + Viem (Web3)
- React Query + Zustand (State)
- AWS DynamoDB (Database)
- Tailwind CSS

## Architecture
Service-Repository pattern with layered architecture:
- Models → Repositories (CRUD) → Services (Business Logic) → API Routes → Hooks → UI

## Setup
1. Copy `.env.example` to `.env.local` and fill in values
2. `npm install`
3. `npm run dev`

## Project Structure
- `/app` - Next.js pages and API routes
- `/lib` - Backend logic (services, repositories, DB)
- `/stores` - Zustand state management
- `/shared` - Shared utilities and types
- `/designs/user` - UI design mockups

## Key Files
- Models: User, Stake, Referral, Withdrawal
- Services: stake-entry, stake-query, referral-tree, reward-calculation, withdrawal, auth
- API Routes: /api/auth, /api/stakes, /api/referrals, /api/withdrawals
