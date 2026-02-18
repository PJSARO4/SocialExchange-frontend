# SOCIAL EXCHANGE - QA Testing Checklist
## Day 3: Lock & Load

**Dev Server:** http://localhost:3004
**Branch:** overnight-sprint
**Date:** 2026-02-17

---

## 1. AUTH FLOW
| # | Test | Steps | Pass? | Notes |
|---|------|-------|-------|-------|
| 1.1 | Login page loads | Go to `/auth/login` | | |
| 1.2 | Demo login works | Click "Demo Login" or enter demo credentials | | |
| 1.3 | Signup page loads | Go to `/auth/signup` | | |
| 1.4 | Auth redirects work | Try accessing `/cockpit/dashboard` without login | | |
| 1.5 | Logout works | Click "Exit Cockpit" from topbar | | |

## 2. COCKPIT DASHBOARD
| # | Test | Steps | Pass? | Notes |
|---|------|-------|-------|-------|
| 2.1 | Dashboard loads | Navigate to `/cockpit/dashboard` | | |
| 2.2 | Sidebar navigation | Click each sidebar link — all should load without errors | | |
| 2.3 | Wallet badge shows | Check topbar — should show "X,XXX.XX SExC" in green | | |
| 2.4 | Wallet badge links | Click wallet badge — should navigate to E-Shares page | | |
| 2.5 | Topbar layout | Verify "Exit Cockpit" button is visible and wallet badge doesn't overlap | | |

## 3. E-SHARES MARKETPLACE (Priority - Day 2 feature)
| # | Test | Steps | Pass? | Notes |
|---|------|-------|-------|-------|
| 3.1 | Marketplace loads | Go to `/cockpit/my-e-assets/my-e-shares` | | |
| 3.2 | 8 brands display | Verify all 8 demo brands show (Urban Signal, Tech Insights, Fitness Revolution, Neon Beats, Wanderlust Eats, CodeCraft, Velvet Thread, The Daily Take) | | |
| 3.3 | Price ticker animates | Watch prices — should fluctuate up/down with green/red indicators | | |
| 3.4 | Brand cards show data | Each card should show: name, handle, platform, price, market cap, 24h change | | |
| 3.5 | Buy shares flow | Click a brand → Buy tab → Enter share amount → Submit | | |
| 3.6 | Sell shares flow | Click a brand you own → Sell tab → Enter amount → Submit | | |
| 3.7 | Portfolio tab | Click "Portfolio" tab — should show your holdings with unrealized P&L | | |
| 3.8 | Wallet tab loads | Click "Wallet" tab — should show balance card | | |
| 3.9 | Deposit flow | Wallet tab → Enter amount ($25+) → Click Deposit → Balance updates | | |
| 3.10 | Withdrawal flow | Wallet tab → Enter amount → See 10% fee preview → Click Withdraw | | |
| 3.11 | Quick deposit buttons | Click $25, $50, $100, $250, $500 buttons — amount field should populate | | |
| 3.12 | Transaction ledger | Wallet tab → Scroll down → Should show transaction history | | |
| 3.13 | List Brand tab | Click "List Brand" tab → Form should load for creating new brand | | |
| 3.14 | Brand detail page | Click brand name → Should navigate to `/cockpit/my-e-assets/my-e-shares/brand/[id]` | | |

## 4. MY FEEDS
| # | Test | Steps | Pass? | Notes |
|---|------|-------|-------|-------|
| 4.1 | Feeds page loads | Go to `/cockpit/my-e-assets/my-feeds` | | |
| 4.2 | Add demo feed | Click "Add Feed" → Fill form → Submit | | |
| 4.3 | Feed card displays | New feed should appear with platform icon, handle, metrics | | |
| 4.4 | Select feed | Click a feed card — should highlight and show details | | |
| 4.5 | Remove feed | Select feed → Click delete/remove → Feed disappears | | |
| 4.6 | Content management | Add content to a feed → Should appear in content list | | |
| 4.7 | Automation page | Navigate to `/cockpit/my-e-assets/my-feeds/automation` | | |
| 4.8 | Scheduler page | Navigate to `/cockpit/my-e-assets/my-feeds/scheduler` | | |

## 5. TRADING POST
| # | Test | Steps | Pass? | Notes |
|---|------|-------|-------|-------|
| 5.1 | Trading Post loads | Go to `/cockpit/trading-post` | | |
| 5.2 | Buy page loads | Go to `/cockpit/trading-post/buy` | | |
| 5.3 | Sell page loads | Go to `/cockpit/trading-post/sell` | | |

## 6. FOUNDER PANEL
| # | Test | Steps | Pass? | Notes |
|---|------|-------|-------|-------|
| 6.1 | Founder home loads | Go to `/founder` | | |
| 6.2 | Instruments page | Go to `/founder/instruments` | | |
| 6.3 | Logs page | Go to `/founder/logs` | | |
| 6.4 | Market page | Go to `/founder/market` | | |
| 6.5 | Treasury page | Go to `/founder/treasury` | | |

## 7. OTHER PAGES
| # | Test | Steps | Pass? | Notes |
|---|------|-------|-------|-------|
| 7.1 | Landing page | Go to `/` (root) | | |
| 7.2 | Privacy page | Go to `/privacy` | | |
| 7.3 | Exchange page | Go to `/exchange` | | |
| 7.4 | Comms page | Go to `/cockpit/comms` | | |
| 7.5 | Operations page | Go to `/cockpit/operations` | | |
| 7.6 | Systems page | Go to `/cockpit/systems` | | |
| 7.7 | About page | Go to `/cockpit/about` | | |

## 8. CROSS-CUTTING CONCERNS
| # | Test | Steps | Pass? | Notes |
|---|------|-------|-------|-------|
| 8.1 | No console errors | Open DevTools Console — check for red errors on each page | | |
| 8.2 | Mobile responsive | Resize browser to ~375px width — layouts shouldn't break | | |
| 8.3 | Dark theme consistent | All pages should use the dark theme consistently | | |
| 8.4 | Navigation breadcrumbs | Verify breadcrumbs/back navigation work on sub-pages | | |
| 8.5 | localStorage persists | Refresh page — E-Shares data, wallet balance, feeds should persist | | |
| 8.6 | Fresh user experience | Clear localStorage → Refresh → Demo data should seed automatically | | |

---

## BUG REPORT TEMPLATE
```
Bug #:
Page:
Steps to reproduce:
Expected:
Actual:
Screenshot: (if applicable)
Console errors: (copy/paste)
```

---

**Total tests: 52**
**Tested by:** _______________
**Date completed:** _______________
