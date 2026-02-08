# 🔧 API Testing with cURL

Simple curl commands to test all MassiveHikeCoin APIs.

---

## 🔐 Setup

### 1. Get Your Session Token (for protected APIs)

1. Start your app: `npm run dev`
2. Login at http://localhost:3000
3. Open browser DevTools (F12) → Application → Cookies
4. Copy value of `next-auth.session-token`
5. Replace `YOUR_SESSION_TOKEN` in commands below

### 2. Get Your CRON API Key

From your `.env.local`:
```bash
CRON_API_KEY=CRON_API_KEY
```

---

## 📡 Public APIs (No Auth)

### Get Landing Page Data
```bash
curl http://localhost:3000/api/landing
```

---

## 🔒 Protected APIs (Require Login)

### Get Dashboard Data
```bash
curl http://localhost:3000/api/dashboard \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Get Referrals Data
```bash
curl http://localhost:3000/api/referrals \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

---

## 💰 Stake APIs

### Create Stake
```bash
curl -X POST http://localhost:3000/api/stakes/create \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "amount": 100
  }'
```

### Submit Transaction Hash
```bash
curl -X POST http://localhost:3000/api/stakes/submit-txhash \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "stakeId": "stake_1234567890abc",
    "txHash": "0xtest123456789abcdef"
  }'
```

---

## 💸 Withdrawal APIs

### Create Withdrawal Request
```bash
curl -X POST http://localhost:3000/api/withdrawals/create \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "amount": 50,
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

---

## ⏰ Cron Jobs (Require API Key)

### Verify Stakes
```bash
curl -X POST http://localhost:3000/api/cron/verify-stakes \
  -H "x-api-key: CRON_API_KEY"
```

### Complete Stakes
```bash
curl -X POST http://localhost:3000/api/cron/complete-stakes \
  -H "x-api-key: CRON_API_KEY"
```

### Process Withdrawals
```bash
curl -X POST http://localhost:3000/api/cron/process-withdrawals \
  -H "x-api-key: CRON_API_KEY"
```

---

## 🧪 Complete Testing Flow

### Step 1: Create a Stake
```bash
curl -X POST http://localhost:3000/api/stakes/create \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"amount": 100}'
```

**Save the `stakeId` from response!**

### Step 2: Submit Transaction Hash
```bash
curl -X POST http://localhost:3000/api/stakes/submit-txhash \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "stakeId": "YOUR_STAKE_ID_HERE",
    "txHash": "0xtest123456789"
  }'
```

### Step 3: Verify the Stake (Cron)
```bash
curl -X POST http://localhost:3000/api/cron/verify-stakes \
  -H "x-api-key: CRON_API_KEY"
```

**With `SKIP_BLOCKCHAIN_VALIDATION=true`, this will activate the stake!**

### Step 4: Check Dashboard
```bash
curl http://localhost:3000/api/dashboard \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Stake should now be "active"!**

---

## 💡 Pretty Print JSON (Optional)

Add `| jq` to format output (requires jq installed):

```bash
curl http://localhost:3000/api/landing | jq
```

Or use Python:
```bash
curl http://localhost:3000/api/landing | python3 -m json.tool
```

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Make sure you're logged in
- Get fresh session token from browser cookies
- Replace `YOUR_SESSION_TOKEN` in curl command

### Invalid API Key
- Check `CRON_API_KEY` in `.env.local`
- Make sure header is: `x-api-key: CRON_API_KEY`

### Connection Refused
- Start dev server: `npm run dev`
- Check server is running on port 3000

---

## 📝 Quick Reference

### All Endpoints

**Public:**
- `GET /api/landing` - No auth

**Protected (need session token):**
- `GET /api/dashboard`
- `GET /api/referrals`
- `POST /api/stakes/create`
- `POST /api/stakes/submit-txhash`
- `POST /api/withdrawals/create`

**Cron (need API key):**
- `POST /api/cron/verify-stakes`
- `POST /api/cron/complete-stakes`
- `POST /api/cron/process-withdrawals`

---

## 🎯 Testing Checklist

- [ ] Start dev server (`npm run dev`)
- [ ] Test landing page API
- [ ] Login via browser
- [ ] Get session token from cookies
- [ ] Test dashboard API
- [ ] Create a stake
- [ ] Submit tx hash
- [ ] Run verify-stakes cron
- [ ] Check dashboard - stake should be active!

**Done! 🎉**
