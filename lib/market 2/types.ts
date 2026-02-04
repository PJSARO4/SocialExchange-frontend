/**
 * SExCOINS Market System - Type Definitions
 */

// Wallet Types
export interface WalletBalance {
  available: number;      // Coins available to spend
  locked: number;         // Coins locked in pending orders
  total: number;          // available + locked
  usdValue: number;       // Total value in USD
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  usdAmount?: number;
  feeAmount?: number;
  description?: string;
  createdAt: Date;
}

export type WalletTransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'IPO_FEE'
  | 'BUY_SHARES'
  | 'SELL_SHARES'
  | 'TRADING_FEE'
  | 'CREATOR_ROYALTY'
  | 'MARKET_MAKER_BUY'
  | 'MARKET_MAKER_SELL'
  | 'REFUND';

// Brand Types
export interface Brand {
  id: string;
  ticker: string;
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  ownerId: string;

  // Social handles
  instagramHandle?: string;
  tiktokHandle?: string;
  twitterHandle?: string;
  youtubeHandle?: string;

  // Share info
  sharesIssued: number;
  sharesOutstanding: number;

  // Pricing
  currentPrice: number;
  previousPrice: number;
  ipoPrice: number;

  // Market metrics
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  allTimeHigh: number;
  allTimeLow: number;

  // Status
  status: BrandStatus;
  ipoDate: Date;
}

export type BrandStatus = 'PENDING_IPO' | 'ACTIVE' | 'HALTED' | 'DELISTED';

export interface BrandListItem {
  id: string;
  ticker: string;
  name: string;
  logoUrl?: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
}

// Shareholding Types
export interface Shareholding {
  id: string;
  brandId: string;
  brand: BrandListItem;
  quantity: number;
  lockedQuantity: number;
  totalCost: number;
  averageCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Portfolio {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdings: Shareholding[];
}

// Order Types
export interface MarketOrder {
  id: string;
  brandId: string;
  brand?: BrandListItem;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  limitPrice?: number;
  filledQuantity: number;
  averagePrice?: number;
  totalValue?: number;
  tradingFee: number;
  creatorRoyalty: number;
  status: OrderStatus;
  createdAt: Date;
  filledAt?: Date;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT';
export type OrderStatus = 'PENDING' | 'PARTIAL' | 'FILLED' | 'CANCELLED' | 'EXPIRED' | 'REJECTED';

export interface CreateOrderRequest {
  brandId: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  limitPrice?: number;  // Required for LIMIT orders
}

export interface OrderResult {
  success: boolean;
  order?: MarketOrder;
  error?: string;
  trade?: Trade;
}

// Trade Types
export interface Trade {
  id: string;
  brandId: string;
  orderId: string;
  side: OrderSide;
  quantity: number;
  price: number;
  totalValue: number;
  tradingFee: number;
  creatorRoyalty: number;
  netValue: number;
  counterpartyType: 'USER' | 'MARKET_MAKER';
  executedAt: Date;
}

// Price History Types
export interface PricePoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type PriceInterval = 'MINUTE_1' | 'MINUTE_5' | 'MINUTE_15' | 'HOUR_1' | 'HOUR_4' | 'DAY_1' | 'WEEK_1';

// IPO Types
export interface IPORequest {
  ticker: string;
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  twitterHandle?: string;
  youtubeHandle?: string;
  sharesIssued: number;
  initialPrice: number;  // Price per share in coins
}

export interface IPOResult {
  success: boolean;
  brand?: Brand;
  error?: string;
  transactionId?: string;
}

// Market Summary
export interface MarketSummary {
  totalBrands: number;
  totalMarketCap: number;
  total24hVolume: number;
  topGainers: BrandListItem[];
  topLosers: BrandListItem[];
  mostActive: BrandListItem[];
  recentIPOs: BrandListItem[];
}

// Deposit/Withdrawal Types
export interface DepositRequest {
  usdAmount: number;
  paymentMethod: 'stripe' | 'paypal' | 'demo';
}

export interface DepositResult {
  success: boolean;
  coinsReceived?: number;
  transactionId?: string;
  error?: string;
}

export interface WithdrawalRequest {
  coinAmount: number;
  payoutMethod: 'bank' | 'paypal' | 'demo';
}

export interface WithdrawalResult {
  success: boolean;
  usdReceived?: number;
  feeAmount?: number;
  transactionId?: string;
  error?: string;
}
