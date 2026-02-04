# E-Shares System Documentation

## Overview

E-Shares is a digital brand equity system that allows:
1. **Brand Owners** to tokenize their social presence and raise community support
2. **Investors** to purchase shares in brands they believe in
3. **Social Exchange** to earn 0.009 cents per share on every transaction

## Key Features Implemented

### 1. Brand Listing Flow (`/my-e-assets/my-e-shares` → "List Your Brand" tab)

- **Minimum deposit**: $100
- **Share creation**: 100 shares per $1 deposited ($0.01 per share)
- **Share distribution**: 60% locked to founder, 40% available for public
- **Lock-in period**: 1 year (prevents rug-pulls)
- **Required information**: Brand name, handle, platform, description, founder name

### 2. Transparency Agreement

Before going public, founders must acknowledge:
- No guaranteed profit
- Community support focus (not investment)
- 1-year lock-in period
- Platform fees (0.009 cents per share)
- Risk disclosure

### 3. Marketplace (`/my-e-assets/my-e-shares` → "Browse Marketplace" tab)

- View all public brands
- See real-time price fluctuations (ticker effect)
- View market cap, available shares, and trading volume
- Click to view brand details and buy shares

### 4. Brand Detail Page (`/my-e-assets/my-e-shares/brand/[brandId]`)

- Full brand information
- Price chart (live micro-fluctuations)
- Your current position (if holding shares)
- Buy/Sell modals with fee calculations
- Transaction history
- Shareholder list

### 5. Portfolio View (`/my-e-assets/my-e-shares` → "My Portfolio" tab)

- Portfolio value summary
- Total invested vs current value
- Unrealized gains/losses
- Holdings table with quick buy/sell actions

### 6. Fee Structure

- **Platform fee**: $0.00009 per share (0.009 cents)
- Applied on both buy and sell transactions
- Buyers pay: share price + fee
- Sellers receive: share price - fee

## File Structure

```
app/cockpit/my-e-assets/my-e-shares/
├── page.tsx                    # Main E-Shares dashboard (3 tabs)
├── e-shares.css               # Core styles
├── E-SHARES-README.md         # This file
├── types/
│   └── e-shares.ts            # TypeScript types and constants
├── lib/
│   └── e-shares-store.ts      # Data management (localStorage)
└── brand/
    └── [brandId]/
        ├── page.tsx           # Brand detail page
        └── brand-detail.css   # Brand detail styles
```

## Data Models

### BrandListing
- Brand identity (name, handle, platform, description)
- Financial structure (deposit, shares, price)
- Market metrics (market cap, volume, price changes)
- Social metrics (followers, engagement, growth)
- Status (PRIVATE, PUBLIC, LOCKED, TRADING)
- Lock-in expiry timestamp

### ShareHolding
- Ownership details (user, brand, shares)
- Position info (average cost, total invested, current value)
- Unrealized gains/losses
- Lock status for founders

### EShareTransaction
- Transaction type (DEPOSIT, MINT, BUY, SELL, TRANSFER)
- Parties involved
- Share and price details
- Platform fee calculation
- Timestamp and status

## Pricing Algorithm (Hybrid Model)

As requested, the price uses a hybrid model:
1. **Base price**: Set by founder at $0.01/share initially
2. **Demand factor**: Price increases slightly when shares are bought
3. **Supply factor**: Price decreases slightly when shares are sold
4. **Bounds**: Price cannot exceed 10x or drop below 0.1x of base price

## Demo Data

The system seeds 3 demo brands on first load:
- Urban Signal (Instagram, $500 deposit)
- Tech Insights Daily (Twitter, $1000 deposit)
- Fitness Revolution (TikTok, $250 deposit)

Each has simulated investor purchases to show market activity.

## Next Steps / Future Enhancements

1. **Backend Integration**: Replace localStorage with actual database
2. **Authentication**: Connect to user auth system
3. **Payment Processing**: Integrate actual payment for deposits/purchases
4. **Price Algorithm Enhancement**: Add social metrics API integration
5. **Notifications**: Alert users on price changes, transactions
6. **Charts**: Add historical price charts using recharts
7. **Search/Filter**: Add marketplace search and filter capabilities
8. **Mobile Optimization**: Further responsive design work

## Testing the System

1. Navigate to `/cockpit/my-e-assets/my-e-shares`
2. Browse demo brands in the marketplace
3. Click a brand to view details and buy shares
4. Try listing your own brand via "List Your Brand" tab
5. Complete the transparency agreement
6. View your portfolio after making purchases

## Configuration Constants

Located in `types/e-shares.ts`:

```typescript
E_SHARES_CONFIG = {
  MIN_DEPOSIT: 100,                    // $100 minimum
  SHARES_PER_DOLLAR: 100,              // 100 shares per $1
  FOUNDER_LOCK_PERIOD_MS: 365 * 24 * 60 * 60 * 1000,  // 1 year
  PLATFORM_FEE_PER_SHARE: 0.00009,     // 0.009 cents
  PRICE_WEIGHT_BASE: 0.4,              // 40% base price weight
  PRICE_WEIGHT_DEMAND: 0.3,            // 30% demand weight
  PRICE_WEIGHT_SOCIAL: 0.3,            // 30% social metrics weight
  MAX_PRICE_MULTIPLIER: 10,            // Max 10x base
  MIN_PRICE_MULTIPLIER: 0.1,           // Min 0.1x base
  MICRO_FLUCTUATION_PERCENT: 0.5,      // ±0.5% ticker fluctuation
}
```
