# MassiveHikeCoin - MLM Staking Platform

MVP for USDT staking with 5-level referral rewards on Binance Smart Chain.

## Features
- Stake USDT ($50-$10,000 per stake, unlimited stakes)
- 8% monthly returns for 24 months
- 5-level MLM referral system (8%, 5%, 3%, 2%, 1%)
- Monthly withdrawals (1st of each month)
- Blockchain integration (BSC/USDT)

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- NextAuth (Google OAuth)
- Ethers.js (Blockchain)
- AWS DynamoDB (Database)
- Tailwind CSS

## Architecture
2-layer architecture (API → Utils → Repositories):
- Models → Repositories (CRUD) → Utils (Business Logic) → API Routes → Hooks → UI

## Quick Start

### 1. Setup (First Time)
```bash
# Install dependencies
npm install

# .env.local is pre-configured for BSC Testnet!
# Just add your testnet wallet addresses:
# - NEXT_PUBLIC_DEPOSIT_WALLET_ADDRESS (your MetaMask testnet address)
# - BSC_PRIVATE_KEY (your testnet private key from MetaMask)
```

### 2. Get Testnet Tokens
- **BNB**: https://testnet.binance.org/faucet-smart
- **USDT**: Swap BNB on PancakeSwap Testnet

### 3. Run Application
```bash
npm run dev
# App runs on http://localhost:3000
```

### 4. Test the Flow
1. Sign in with Google
2. Create a stake ($100 USDT)
3. Send test USDT from MetaMask
4. Submit transaction hash
5. Run verify-stakes cron (see below)

### 5. Run Cron Jobs (Manual Testing)
```bash
# Verify stakes & clean up abandoned ones
curl -X POST http://localhost:3000/api/cron/verify-stakes \
  -H "x-api-key: dev_cron_key_for_testing_only"

# Process withdrawals (1st of month)
curl -X POST http://localhost:3000/api/cron/process-withdrawals \
  -H "x-api-key: dev_cron_key_for_testing_only"
```

## Testing
- **Local**: Uses BSC Testnet (free test tokens, no real money)
- **Production**: Uses BSC Mainnet (real USDT, real transactions)

**See [TESTING_GUIDE.md](TESTING_GUIDE.md) for complete testing instructions**

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
