# Marketplace Implementation Guide

This document provides a complete API testing guide for the Trading Post (marketplace) and E-Shares (tokenized brand equity) systems.

## Overview

### Trading Post (Marketplace with Escrow)
- Social media account listings
- Secure 7-stage escrow transactions
- Dispute resolution system

### E-Shares (Tokenized Brand Equity)
- Creator IPO (go public)
- Automated Market Maker (AMM) pricing
- Share trading with 1% + 2% fees

### Wallet
- Deposit/withdrawal system
- Transaction history
- Balance tracking

---

## API Endpoints

### Trading Post APIs

#### 1. Create Listing
```bash
curl -X POST http://localhost:3000/api/marketplace/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION" \
  -d '{
    "title": "10K Followers Instagram Account - Fitness Niche",
    "description": "Established fitness influencer account with 10,000 engaged followers",
    "platform": "INSTAGRAM",
    "handle": "@fitnessguy",
    "profileUrl": "https://instagram.com/fitnessguy",
    "followers": 10000,
    "following": 500,
    "postsCount": 250,
    "engagementRate": 5.5,
    "avgLikesPerPost": 550,
    "avgCommentsPerPost": 45,
    "niche": "fitness",
    "contentCategory": "health_wellness",
    "price": 5000,
    "proofUrls": [
      "https://example.com/proof1.png",
      "https://example.com/proof2.png"
    ]
  }'
```

#### 2. Get All Listings (with filters)
```bash
# Get all active listings
curl "http://localhost:3000/api/marketplace/listings"

# With filters
curl "http://localhost:3000/api/marketplace/listings?platform=INSTAGRAM&niche=fitness&minFollowers=5000&maxPrice=10000&sortBy=price&sortOrder=asc"

# Parameters:
# - status: ACTIVE, PAUSED, EXPIRED, DELISTED
# - saleStatus: AVAILABLE, PENDING, SOLD, CANCELLED
# - platform: INSTAGRAM, TIKTOK, YOUTUBE, FACEBOOK, etc.
# - niche: fitness, fashion, tech, etc.
# - minFollowers: minimum followers count
# - maxFollowers: maximum followers count
# - minPrice: minimum price in USD
# - maxPrice: maximum price in USD
# - sortBy: createdAt, price, followers, views
# - sortOrder: asc, desc
# - limit: number of results (default 20)
# - offset: pagination offset (default 0)
```

#### 3. Get Listing Details
```bash
curl "http://localhost:3000/api/marketplace/listings/[listingId]"
```

#### 4. Update Listing
```bash
curl -X PATCH http://localhost:3000/api/marketplace/listings/[listingId] \
  -H "Content-Type: application/json" \
  -d '{
    "price": 4500,
    "followers": 10500,
    "engagementRate": 5.8
  }'
```

#### 5. Delete Listing
```bash
curl -X DELETE http://localhost:3000/api/marketplace/listings/[listingId]
```

#### 6. Initiate Purchase (Create Escrow)
```bash
curl -X POST http://localhost:3000/api/marketplace/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "[listingId]"
  }'

# Response includes escrow transaction with 10% platform fee:
# {
#   "id": "escrow_123",
#   "buyerId": "user_buyer",
#   "sellerId": "user_seller",
#   "listingPrice": 5000,
#   "platformFee": 500,
#   "sellerPayout": 4500,
#   "status": "PAYMENT_PENDING",
#   "paymentDeadline": "2026-03-23T20:58:00Z"
# }
```

#### 7. Confirm Payment (Buyer confirms funds sent)
```bash
curl -X POST http://localhost:3000/api/marketplace/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "escrowId": "[escrowId]",
    "credentialsDescription": "Credentials sent via secure chat"
  }'

# Seller sends account credentials to buyer
# Status: PAYMENT_PENDING -> FUNDS_HELD -> CREDENTIALS_SENT
# Timeline: 24 hours to pay, 7 days to transfer
```

#### 8. Confirm Receipt (Buyer verifies credentials work)
```bash
curl -X POST http://localhost:3000/api/marketplace/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "escrowId": "[escrowId]"
  }'

# Status: CREDENTIALS_SENT -> VERIFICATION_PENDING
# 48-hour lock period starts (prevents immediate chargeback)
```

#### 9. Get Escrow Status
```bash
curl "http://localhost:3000/api/marketplace/escrow/[escrowId]"

# Response includes:
# {
#   "id": "escrow_123",
#   "status": "VERIFICATION_PENDING",
#   "stateFlow": {
#     "current": "VERIFICATION_PENDING",
#     "nextSteps": ["COMPLETED", "DISPUTED"],
#     "timeout": "2026-03-25T20:58:00Z",
#     "timeoutMinutes": 2880
#   }
# }
```

#### 10. Open Dispute
```bash
curl -X POST http://localhost:3000/api/marketplace/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "escrowId": "[escrowId]",
    "reason": "Account was suspended by Instagram",
    "evidence": "Detailed explanation of the issue",
    "evidenceUrls": [
      "https://example.com/screenshot.png"
    ]
  }'

# Only buyer or seller can open
# Status: OPEN -> IN_REVIEW -> RESOLVED_BUYER or RESOLVED_SELLER
```

#### 11. Get Disputes for Transaction
```bash
curl "http://localhost:3000/api/marketplace/disputes?escrowId=[escrowId]"
```

---

### E-Shares APIs

#### 1. Check IPO Requirements
```bash
curl -X GET http://localhost:3000/api/eshares/ipo \
  -H "Authorization: Bearer YOUR_SESSION"

# Response:
# {
#   "ipoFeeCoins": 1000,
#   "ipoFeeUSD": 100,
#   "walletBalance": 1500,
#   "canLaunchIPO": true,
#   "requirements": {
#     "minFollowers": 1000,
#     "minEngagement": 1
#   }
# }
```

#### 2. Launch IPO (Creator Goes Public)
```bash
curl -X POST http://localhost:3000/api/eshares/ipo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION" \
  -d '{
    "ticker": "MYTOKEN",
    "name": "My Creator Brand",
    "description": "Invest in my personal brand",
    "logoUrl": "https://example.com/logo.png",
    "bannerUrl": "https://example.com/banner.png",
    "instagramHandle": "@myhandle",
    "tiktokHandle": "@myhandle",
    "twitterHandle": "@myhandle",
    "youtubeHandle": "@myhandle",
    "sharesIssued": 10000,
    "initialPrice": 0.1
  }'

# Deducts 1000 coins ($100) from wallet
# Creator receives 20% of shares (2000 tokens)
# 80% available for public trading

# Response:
# {
#   "id": "brand_123",
#   "ticker": "MYTOKEN",
#   "name": "My Creator Brand",
#   "currentPrice": 0.1,
#   "status": "ACTIVE",
#   "ipoDate": "2026-03-22T20:58:00Z",
#   "sharesIssued": 10000,
#   "marketCap": 1000
# }
```

#### 3. Browse All Brands
```bash
curl "http://localhost:3000/api/eshares/brands"

# With filters:
curl "http://localhost:3000/api/eshares/brands?sortBy=marketCap&sortOrder=desc&limit=10"

# Parameters:
# - sortBy: marketCap, volume, price, ipoDate
# - sortOrder: asc, desc
# - limit: default 20
# - offset: pagination
```

#### 4. Get Brand Details (+ price history)
```bash
curl "http://localhost:3000/api/eshares/brands/[brandId]"

# Response includes last 24 hours of 1-minute price data
# for charting
```

#### 5. Buy Shares
```bash
curl -X POST http://localhost:3000/api/eshares/trade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION" \
  -d '{
    "brandId": "[brandId]",
    "side": "BUY",
    "quantity": 100,
    "maxPrice": 0.15
  }'

# AMM Pricing:
# - 1% platform fee
# - 2% creator royalty
# - 1% slippage per standard trade
# - Price impact if quantity is large

# Response:
# {
#   "trade": {
#     "id": "trade_123",
#     "side": "BUY",
#     "quantity": 100,
#     "price": 0.101,
#     "totalValue": 10.1
#   },
#   "shareholding": {
#     "quantity": 100,
#     "averageCost": 0.101,
#     "totalCost": 10.1
#   },
#   "newPrice": 0.101,
#   "costs": {
#     "subtotal": 10.1,
#     "tradingFee": 0.101,
#     "creatorRoyalty": 0.202,
#     "total": 10.403
#   }
# }
```

#### 6. Sell Shares
```bash
curl -X POST http://localhost:3000/api/eshares/trade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION" \
  -d '{
    "brandId": "[brandId]",
    "side": "SELL",
    "quantity": 50,
    "minPrice": 0.09
  }'

# Fees are deducted from sale proceeds
```

#### 7. Get Trade History
```bash
curl "http://localhost:3000/api/eshares/trade?brandId=[brandId]&limit=20"
```

#### 8. Get Portfolio (Holdings + P&L)
```bash
curl -X GET http://localhost:3000/api/eshares/portfolio \
  -H "Authorization: Bearer YOUR_SESSION"

# Response:
# {
#   "wallet": {
#     "balance": 500.5,
#     "lockedBalance": 50
#   },
#   "portfolio": {
#     "totalValue": 1500,
#     "totalCost": 1200,
#     "totalProfitLoss": 300,
#     "totalProfitLossPercent": 25,
#     "holdings": [
#       {
#         "ticker": "MYTOKEN",
#         "quantity": 100,
#         "averageCost": 0.10,
#         "currentPrice": 0.15,
#         "currentValue": 15,
#         "cost": 10,
#         "profitLoss": 5,
#         "profitLossPercent": 50
#       }
#     ]
#   }
# }
```

---

### Wallet APIs

#### 1. Get Balance & Recent Transactions
```bash
curl -X GET http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_SESSION"

# Response:
# {
#   "wallet": {
#     "balance": 1500.5,
#     "lockedBalance": 100,
#     "totalDeposited": 2000,
#     "totalWithdrawn": 500,
#     "totalTradingVolume": 1500
#   },
#   "recentTransactions": [
#     {
#       "id": "txn_123",
#       "type": "DEPOSIT",
#       "amount": 1000,
#       "description": "Deposit 100 USD",
#       "createdAt": "2026-03-22T20:00:00Z"
#     }
#   ]
# }
```

#### 2. Deposit Funds (Demo Mode)
```bash
curl -X POST http://localhost:3000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION" \
  -d '{
    "usdAmount": 100,
    "paymentMethod": "demo"
  }'

# Demo mode: instantly adds coins at $0.10 per coin
# So $100 = 1000 coins
# Production: integrate with Stripe, PayPal, etc.

# Response:
# {
#   "wallet": {
#     "balance": 1100,
#     "lockedBalance": 0
#   },
#   "transaction": {
#     "id": "txn_deposit_123",
#     "usdAmount": 100,
#     "coinsReceived": 1000,
#     "timestamp": "2026-03-22T20:58:00Z"
#   }
# }
```

---

## Testing Workflow

### Complete Trading Post Flow

1. **Create Account** (via NextAuth)
   ```bash
   # Navigate to /api/auth/signin
   ```

2. **Deposit Demo Coins**
   ```bash
   curl -X POST http://localhost:3000/api/wallet/deposit \
     -d '{"usdAmount": 500, "paymentMethod": "demo"}'
   # Receive: 5000 coins
   ```

3. **Seller: Create Listing**
   ```bash
   curl -X POST http://localhost:3000/api/marketplace/listings \
     -d '{"title": "10K Instagram", "platform": "INSTAGRAM", ...}'
   # Response: listing_123
   ```

4. **Buyer: Browse & Purchase**
   ```bash
   curl http://localhost:3000/api/marketplace/listings
   curl -X POST http://localhost:3000/api/marketplace/purchase \
     -d '{"listingId": "listing_123"}'
   # Response: escrow_456
   ```

5. **Buyer: Confirm Payment**
   ```bash
   # In real scenario: process payment through Stripe
   # Mock: confirm immediately
   curl -X POST http://localhost:3000/api/marketplace/transfer \
     -d '{"escrowId": "escrow_456"}'
   # Status: FUNDS_HELD
   ```

6. **Seller: Send Credentials**
   ```bash
   curl -X POST http://localhost:3000/api/marketplace/transfer \
     -d '{"escrowId": "escrow_456", "credentialsDescription": "..."}'
   # Status: CREDENTIALS_SENT
   ```

7. **Buyer: Confirm Receipt**
   ```bash
   curl -X POST http://localhost:3000/api/marketplace/confirm \
     -d '{"escrowId": "escrow_456"}'
   # Status: VERIFICATION_PENDING (48h lock starts)
   ```

8. **Auto-Complete (48h later)**
   ```bash
   # System automatically completes after 48 hours
   # Status: COMPLETED
   ```

---

### Complete E-Shares Flow

1. **Creator: Launch IPO**
   ```bash
   curl -X POST http://localhost:3000/api/eshares/ipo \
     -d '{
       "ticker": "CREATOR",
       "name": "My Brand",
       "sharesIssued": 10000,
       "initialPrice": 0.1
     }'
   # Costs: 1000 coins ($100)
   # Creator gets: 2000 shares
   ```

2. **Investor: Browse Brands**
   ```bash
   curl http://localhost:3000/api/eshares/brands?sortBy=marketCap
   ```

3. **Investor: Buy Shares**
   ```bash
   curl -X POST http://localhost:3000/api/eshares/trade \
     -d '{
       "brandId": "brand_123",
       "side": "BUY",
       "quantity": 100,
       "maxPrice": 0.15
     }'
   # Costs: quantity * price + 1% fee + 2% royalty
   # Price: adjusted 1% higher due to buy pressure
   ```

4. **Investor: Check Portfolio**
   ```bash
   curl http://localhost:3000/api/eshares/portfolio
   # Shows holdings with P&L
   ```

5. **Investor: Sell Shares**
   ```bash
   curl -X POST http://localhost:3000/api/eshares/trade \
     -d '{
       "brandId": "brand_123",
       "side": "SELL",
       "quantity": 50,
       "minPrice": 0.09
     }'
   # Receives: quantity * price - 1% fee - 2% royalty
   # Price: adjusted 1% lower due to sell pressure
   ```

---

## Database Schema

### Key Models Used

1. **Listing** - Account listings
   - Fields: title, platform, handle, price, followers, niche, status
   - Relations: seller (User), escrow (EscrowTransaction)

2. **EscrowTransaction** - Purchase escrow
   - Status: PAYMENT_PENDING → FUNDS_HELD → CREDENTIALS_SENT → VERIFICATION_PENDING → COMPLETED
   - Includes: buyerId, sellerId, listingPrice, platformFee, sellerPayout

3. **Dispute** - Transaction disputes
   - Status: OPEN → IN_REVIEW → RESOLVED_BUYER/RESOLVED_SELLER
   - Relations: escrow, opener (User)

4. **Brand** - Creator IPOs
   - Fields: ticker, name, sharesIssued, currentPrice, marketCap
   - Relations: shareholdings, trades, priceHistory

5. **Shareholding** - User's brand shares
   - Fields: quantity, averageCost, totalCost

6. **Trade** - Share trades
   - Fields: side, quantity, price, tradingFee, creatorRoyalty

7. **Wallet** - User balance
   - Fields: balance, lockedBalance, totalDeposited, totalWithdrawn

8. **WalletTransaction** - Balance movements
   - Types: DEPOSIT, BUY_SHARES, SELL_SHARES, IPO_FEE, TRADING_FEE, CREATOR_ROYALTY

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Detailed error message"
}
```

Common status codes:
- 400: Bad request (missing fields, validation)
- 401: Unauthorized (need to log in)
- 403: Forbidden (don't have permission)
- 404: Not found (resource doesn't exist)
- 500: Server error

---

## Performance Considerations

1. **Indexing**: Database queries are indexed on:
   - status, createdAt (listings, orders)
   - brandId, walletId (trades, shareholdings)
   - ticker (brands)

2. **Pagination**: All list endpoints support limit/offset

3. **Caching**: Consider caching:
   - Brand list (updated every minute)
   - Price history (immutable after creation)

4. **Background Jobs** (recommended):
   - Auto-expire listings (daily)
   - Auto-complete escrows (48h after verification)
   - Calculate 24h metrics (hourly)

---

## Next Steps

1. **Implement Frontend UI** for all endpoints
2. **Add Payment Integration** (Stripe, PayPal)
3. **Implement Dispute Resolution** staff dashboard
4. **Add Fraud Detection** (velocity checks, pattern analysis)
5. **Set Up Monitoring** (error logs, transaction tracking)
6. **Legal Review** before production launch

