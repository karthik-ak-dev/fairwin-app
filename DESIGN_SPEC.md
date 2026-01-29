# FairWin Design Specification

> **IMPORTANT**: This document is the source of truth for UI design. Strictly follow these specifications.
> Design files location: `/designs/`

---

## Design Tokens

### Colors
```css
:root {
  /* Backgrounds */
  --bg: #000000;                     /* Main background */
  --bg-card: rgba(255,255,255,0.03); /* Card background */
  --bg-admin: #0a0a0a;               /* Admin background */
  --bg-sidebar: #0d0d0d;             /* Admin sidebar */
  
  /* Accent */
  --accent: #00ff88;                 /* Primary green */
  
  /* Text */
  --text: #ffffff;                   /* Primary text */
  --text-muted: #888888;             /* Secondary text */
  
  /* Borders */
  --border: rgba(255,255,255,0.08);  /* Default border */
  
  /* Status Colors */
  --gold: #FFD700;                   /* Grand prize */
  --silver: #C0C0C0;                 /* Runner-up */
  --success: #00ff88;                /* Success/Live */
  --warning: #f97316;                /* Ending soon */
  --danger: #ff4444;                 /* Error/Cancel */
}
```

### Typography
```css
/* Primary Font */
font-family: 'Outfit', sans-serif;

/* Monospace (addresses, code) */
font-family: 'JetBrains Mono', monospace;

/* Font Weights */
- Regular: 400
- Medium: 500
- SemiBold: 600
- Bold: 700
- ExtraBold: 800
- Black: 900
```

### Spacing
```
- Container max-width: 1200px
- Container padding: 0 32px
- Card padding: 24px
- Card border-radius: 16px (large), 12px (medium), 8px (small)
- Section padding: 64px 0
- Gap between cards: 20px
```

---

## Page Structure

### USER PAGES (Public)

| # | Page | Route | Design File |
|---|------|-------|-------------|
| 1 | Home | `/` | 01-home.html |
| 2 | Raffle Hub | `/games/raffle` | 02-raffle-hub.html |
| 3 | Raffle Detail (Guest) | `/games/raffle/[id]` | 03-raffle-detail-guest.html |
| 3a | Raffle Detail (Connected) | `/games/raffle/[id]` | 03a-raffle-detail-connected.html |
| 3b | Raffle Detail (Entered) | `/games/raffle/[id]` | 03b-raffle-detail-entered.html |
| 4 | Raffle Ending | `/games/raffle/[id]` | 04-raffle-ending-*.html |
| 5 | Raffle Drawing | `/games/raffle/[id]` | 05-raffle-drawing.html |
| 6 | Raffle Ended | `/games/raffle/[id]` | 06-raffle-ended.html |
| 6a | Result: Won | Modal | 06a-raffle-result-won.html |
| 6b | Result: Lost | Modal | 06b-raffle-result-lost.html |
| 7 | My Account | `/account` | 07-account.html |
| 8 | Winners | `/winners` | 08-winners.html |
| 9 | How It Works | `/how-it-works` | 09-how-it-works.html |
| 10 | Verify | `/verify` | 10-verify.html |
| 11 | Terms | `/terms` | 11-terms.html |
| 12 | Privacy | `/privacy` | 12-privacy.html |

### ADMIN PAGES

| # | Page | Route | Design File |
|---|------|-------|-------------|
| 1 | Dashboard | `/admin` | 01-dashboard.html |
| 2 | All Raffles | `/admin/raffles` | 02-raffles.html |
| 3 | Create Raffle | `/admin/raffles/create` | 03-create-raffle.html |
| 4 | Raffle Detail | `/admin/raffles/[id]` | 04-raffle-detail.html |
| 5 | Winners & Payouts | `/admin/winners` | 05-winners-payouts.html |
| 6 | Operator Wallet | `/admin/wallet` | 06-operator-wallet.html |
| 7 | Settings | `/admin/settings` | 07-settings.html |

---

## Component Reference

### Navigation (User)
```
┌────────────────────────────────────────────────────────────┐
│ FAIRWIN          Home  Raffle  Winners    [Connect Wallet] │
└────────────────────────────────────────────────────────────┘
- Logo: "FAIR" white, "WIN" accent green
- Nav links: uppercase, letter-spacing 1px, 14px
- Fixed position with blur backdrop
```

### Navigation (Admin)
```
┌──────────────┬─────────────────────────────────────────────┐
│ FAIRWIN      │                                             │
│ [Admin]      │                                             │
│──────────────│                                             │
│ 📊 Dashboard │                                             │
│ 🎟️ Raffles   │           Main Content Area                 │
│ ➕ Create    │                                             │
│ 🏆 Winners   │                                             │
│ 💰 Wallet    │                                             │
│ ⚙️ Settings  │                                             │
└──────────────┴─────────────────────────────────────────────┘
- Sidebar: 240px fixed width
- Active item: accent color with right border
```

### Raffle Card
```
┌─────────────────────────────────────────┐
│ 🎟️ Daily Raffle                [LIVE]  │
│     Draws every 24 hours                │
├─────────────────────────────────────────┤
│        ┌─────────────────────┐          │
│        │ Current Prize Pool  │          │
│        │      $2,375         │          │
│        │ Pool grows with each│          │
│        └─────────────────────┘          │
├────────────────┬────────────────────────┤
│ Entries: 500   │ Time Left: 6h 24m     │
├────────────────┴────────────────────────┤
│         Current Winners: 50             │
│         Top 10% • Updates...            │
├─────────────────────────────────────────┤
│ Entry: $5 USDC              [ENTER]     │
└─────────────────────────────────────────┘
```

### Prize Breakdown (Raffle Detail)
```
┌─────────────────────────────────────────────────────────────┐
│ Prize Distribution                                          │
├───────────────────┬─────────────────┬───────────────────────┤
│ 🥇 Grand Prize    │ 🥈 Runner-ups   │ 🎉 Lucky Winners      │
│ 40% of pool       │ 30% of pool     │ 30% of pool           │
│ 1 winner          │ 4 winners       │ Rest of top 10%       │
│ $950              │ $178 each       │ $16 each              │
└───────────────────┴─────────────────┴───────────────────────┘
```

### Stats Card
```
┌─────────────────────────┐
│ TOTAL WON               │
│ $2,628                  │
│ +$178 this week ↑       │
└─────────────────────────┘
- Label: 12px, uppercase, muted
- Value: 32px, bold
- Change: 13px, accent if positive
```

### Entry Form States

**Not Connected:**
```
┌─────────────────────────────┐
│ Enter This Raffle           │
│                             │
│         🔗                  │
│   Connect Your Wallet       │
│                             │
│  Connect to enter this      │
│  raffle and compete.        │
│                             │
│   [CONNECT WALLET]          │
└─────────────────────────────┘
```

**Connected:**
```
┌─────────────────────────────┐
│ Enter This Raffle           │
│                             │
│    Entry Price: $5 USDC     │
│                             │
│ Number of Entries           │
│ [1] [5] [10] [25]           │
│ [-] [   1   ] [+]           │
│                             │
│ ┌─────────────────────────┐ │
│ │ Entry × 1     $5        │ │
│ │ Total        $5 USDC    │ │
│ └─────────────────────────┘ │
│                             │
│ Your Chance: ~1 in 10       │
│                             │
│   [ENTER RAFFLE]            │
└─────────────────────────────┘
```

### Badges
```css
/* Live */
.badge.live {
  background: rgba(0,255,136,0.15);
  color: #00ff88;
}

/* Ending Soon */
.badge.ending {
  background: rgba(249,115,22,0.15);
  color: #f97316;
}

/* Ended */
.badge.ended {
  background: rgba(255,255,255,0.1);
  color: #888888;
}
```

### Buttons
```css
/* Primary */
.btn-primary {
  background: #00ff88;
  color: black;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5-1px;
  padding: 14-18px 28px;
  border-radius: 6-10px;
}

/* Secondary */
.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.08);
  color: #888888;
}

/* Hover: translateY(-2px) + brightness(1.1) */
```

---

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { ... }

/* Tablet */
@media (max-width: 1024px) { ... }

/* Desktop */
@media (min-width: 1025px) { ... }
```

**Mobile Adjustments:**
- Single column layouts
- Stacked cards
- Bottom nav or hamburger menu
- Smaller font sizes (reduce by 2-4px)
- Reduced padding (24px → 16px)
- Full-width buttons

---

## Animation Guidelines

```css
/* Hover transitions */
transition: all 0.2s ease;

/* Card hover */
transform: translateY(-4px);

/* Live pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
animation: pulse 1.5s infinite;

/* Countdown urgency */
color: #f97316; /* orange when < 1 hour */
```

---

## State Handling

### Raffle States
| State | Visual |
|-------|--------|
| Live | Green badge, pulsing dot |
| Ending Soon | Orange badge, timer urgent |
| Drawing | Spinner, "Drawing..." text |
| Completed | Gray badge, show winners |
| Cancelled | Red badge, refund available |

### User Entry States
| State | Entry Card Shows |
|-------|------------------|
| Guest (not connected) | Connect wallet prompt |
| Connected (no entry) | Entry form |
| Entered | Entry form + "Your entries: X" |
| Entered (ending) | Disabled form + countdown |

---

## Important Notes

1. **Dark theme only** - No light mode
2. **Accent color is #00ff88** - Use sparingly for emphasis
3. **JetBrains Mono** for all addresses and numbers in tables
4. **Live indicator** always has pulsing animation
5. **All monetary values** show with $ prefix and "USDC" suffix where appropriate
6. **Responsive** - Same design adapts to mobile, no separate mobile design
