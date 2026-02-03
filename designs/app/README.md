# FairWin UI Bundle - Complete User Journey

All pages with wallet connected / not connected states captured.

---

## 📁 Complete File List

### 🏠 Core Pages
| # | File | Description |
|---|------|-------------|
| 01 | `01-home.html` | Landing page |
| 02 | `02-raffle-hub.html` | Browse all raffles |

### 🎟️ Raffle Detail - All States
| # | File | Wallet State | Raffle State |
|---|------|-------------|--------------|
| 03 | `03-raffle-detail-guest.html` | **Not connected** | Active |
| 03a | `03a-raffle-detail-connected.html` | Connected, no entries | Active |
| 03b | `03b-raffle-detail-entered.html` | Connected, has entries | Active |

### ⚡ Raffle Ending - All States
| # | File | Wallet State | Notes |
|---|------|-------------|-------|
| 04 | `04-raffle-ending-guest.html` | **Not connected** | Urgency UI |
| 04a | `04a-raffle-ending-connected.html` | Connected | Urgency UI |

### 🎰 Drawing & Results
| # | File | Description |
|---|------|-------------|
| 05 | `05-raffle-drawing.html` | VRF in progress (same for all) |
| 06 | `06-raffle-ended.html` | General result (shows winner) |
| 06a | `06a-raffle-result-won.html` | 🎉 **YOU WON** - Celebration |
| 06b | `06b-raffle-result-lost.html` | Better luck next time |

### 👤 User Pages
| # | File | Description |
|---|------|-------------|
| 07 | `07-account.html` | My Account dashboard (requires connection) |
| 08 | `08-winners.html` | Public winners leaderboard |

### 📚 Utility Pages
| # | File | Description |
|---|------|-------------|
| 09 | `09-how-it-works.html` | Explainer + FAQ |
| 10 | `10-verify.html` | Transaction verification tool |
| 11 | `11-terms.html` | Terms of Service |
| 12 | `12-privacy.html` | Privacy Policy |

---

## 🔐 State Summary

### Wallet States
- **Guest** = Not connected → Shows "Connect Wallet" button in nav
- **Connected** = Wallet linked → Shows wallet pill (🟢 0x4fA1...2e8C)

### Raffle States
- **Active** = Accepting entries
- **Ending** = <1 hour left (urgency UI)
- **Drawing** = VRF in progress
- **Ended** = Winner announced

### User Entry States
- **No entries** = Fresh user, can enter
- **Has entries** = Shows "Your entries: X"

---

## 🗺️ User Flows

### First-time User (Guest)
```
01-home → 02-raffle-hub → 03-raffle-detail-guest → 
[Connect Wallet] → 03a-raffle-detail-connected → 
[Enter] → 03b-raffle-detail-entered
```

### Returning User Checks Result
```
07-account → [Click raffle] → 06-raffle-ended
  ├─ If won → 06a-raffle-result-won
  └─ If lost → 06b-raffle-result-lost
```

---

## 📊 Total: 16 Pages

- 8 existing (finalized designs)
- 8 new (matching style, capturing states)

---

**Open `01-home.html` in browser to start exploring.**
