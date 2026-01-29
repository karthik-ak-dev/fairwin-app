# FairWin Admin Bundle

Admin dashboard UI designs for the FairWin raffle platform.

---

## 📁 Pages (7 Total)

| # | File | Description |
|---|------|-------------|
| 01 | `01-dashboard.html` | Overview stats, active raffles, recent winners |
| 02 | `02-raffles.html` | All raffles list with filters & search |
| 03 | `03-create-raffle.html` | Create new raffle form with preview |
| 04 | `04-raffle-detail.html` | Single raffle control panel (entries, stats, draw) |
| 05 | `05-winners-payouts.html` | All payouts history with verification |
| 06 | `06-operator-wallet.html` | Wallet balances, withdraw, fund gas |
| 07 | `07-settings.html` | VRF config, pool limits, pause controls |

---

## 🎨 Design System

### Layout
- **Sidebar:** Fixed 240px left sidebar with navigation
- **Main content:** Fluid width with 32px padding
- **Cards:** 12px border radius, subtle border

### Colors
- **Background:** #0a0a0a (main), #111111 (cards)
- **Accent:** #00ff88 (FairWin green)
- **Text:** #ffffff (primary), #888888 (muted)
- **Status:** Green (success), Orange (warning), Red (danger)

### Typography
- **Font:** Outfit (headings/body), JetBrains Mono (addresses/code)
- **Headings:** 800 weight, tight letter-spacing
- **Body:** 400-600 weight

### Components
- Data tables with hover states
- Status badges (Active, Ending, Ended, etc.)
- Toggle switches
- Form inputs with units
- Action buttons (primary, secondary, danger)
- Stats cards with highlights

---

## 🔗 Navigation Structure

```
Dashboard (01)
├── Raffles (02)
│   ├── Create Raffle (03)
│   └── Raffle Detail (04)
├── Winners & Payouts (05)
├── Operator Wallet (06)
└── Settings (07)
```

---

## 💡 Key Features by Page

### Dashboard (01)
- TVL, active raffles, entries today, revenue
- Active raffles table
- Recent winners list

### Raffles (02)
- Filter by status (All, Active, Ending, Drawing, Ended)
- Search raffles
- Quick actions (View, Edit, Trigger Draw)

### Create Raffle (03)
- Raffle type selector
- Duration presets
- Entry price & limits
- Toggle options (auto-draw, recurring)
- Live preview panel

### Raffle Detail (04)
- Full stats (pool, entries, participants)
- Countdown timer
- Recent entries table with TX links
- Entry distribution chart
- Manual draw trigger

### Winners & Payouts (05)
- Total payout stats
- All payouts with verification links
- Filter by time period
- Export CSV

### Operator Wallet (06)
- MATIC, USDC, LINK balances
- Withdraw revenue
- Fund gas
- Transaction history

### Settings (07)
- Contract info (read-only)
- VRF configuration
- Pool limits
- Operation toggles
- Danger zone (pause, emergency)

---

## 📱 Responsive

These are **desktop-first** admin designs. Same approach as user pages:
- Build with responsive CSS
- Collapse sidebar to hamburger on mobile
- Stack columns on smaller screens

---

**Open `01-dashboard.html` in browser to start exploring.**
