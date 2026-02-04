/**
 * SExCOINS Trading Service
 *
 * Handles all trading operations:
 * - Market orders (instant execution via market maker)
 * - Limit orders (order book matching)
 * - Price updates based on supply/demand
 *
 * ⚠️ DEMO MODE - Uses simulated trading
 */

import {
  TRADING_FEE_PERCENT,
  CREATOR_ROYALTY_PERCENT,
  MARKET_MAKER_SPREAD_PERCENT,
  calculateTradingFees,
  calculateMarketMakerPrice,
  IS_DEMO_MODE,
} from './constants';
import { logger } from '@/lib/logging/activity-logger';
import {
  lockCoins,
  unlockCoins,
  spendLockedCoins,
  creditCoins,
  getOrCreateWallet,
} from './wallet-service';
import type {
  Brand,
  BrandListItem,
  MarketOrder,
  Trade,
  OrderResult,
  CreateOrderRequest,
  Shareholding,
  Portfolio,
  PricePoint,
  PriceInterval,
} from './types';

// In-memory stores for demo mode
const demoBrands = new Map<string, Brand>();
const demoOrders = new Map<string, MarketOrder>();
const demoTrades = new Map<string, Trade[]>();
const demoShareholdings = new Map<string, Map<string, Shareholding>>(); // userId -> brandId -> holding
const demoPriceHistory = new Map<string, PricePoint[]>();

// Initialize demo brands (empty - real brands come from IPO)
function initializeDemoBrands() {
  // No fake brands - market starts empty
  // Brands are created through the IPO process
}

// Generate price history for a brand (used after IPO)
function generatePriceHistory(currentPrice: number, days: number): PricePoint[] {
  const history: PricePoint[] = [];

  // Start with just the current price point
  history.push({
    timestamp: new Date(),
    open: currentPrice,
    high: currentPrice,
    low: currentPrice,
    close: currentPrice,
    volume: 0,
  });

  return history;
}

/**
 * Get all active brands for the trading floor
 */
export async function getActiveBrands(): Promise<BrandListItem[]> {
  initializeDemoBrands();

  const brands = Array.from(demoBrands.values())
    .filter(b => b.status === 'ACTIVE')
    .map(b => ({
      id: b.id,
      ticker: b.ticker,
      name: b.name,
      logoUrl: b.logoUrl,
      currentPrice: b.currentPrice,
      priceChange24h: b.priceChange24h,
      marketCap: b.marketCap,
      volume24h: b.volume24h,
    }))
    .sort((a, b) => b.marketCap - a.marketCap);

  return brands;
}

/**
 * Get a single brand by ID or ticker
 */
export async function getBrand(idOrTicker: string): Promise<Brand | null> {
  initializeDemoBrands();

  // Try by ID first
  if (demoBrands.has(idOrTicker)) {
    return demoBrands.get(idOrTicker)!;
  }

  // Try by ticker
  for (const brand of demoBrands.values()) {
    if (brand.ticker.toLowerCase() === idOrTicker.toLowerCase()) {
      return brand;
    }
  }

  return null;
}

/**
 * Execute a market order
 * Market orders execute immediately via the market maker
 */
export async function executeMarketOrder(
  userId: string,
  request: CreateOrderRequest
): Promise<OrderResult> {
  initializeDemoBrands();

  const { brandId, side, quantity } = request;

  // Validate brand exists
  const brand = demoBrands.get(brandId);
  if (!brand) {
    return { success: false, error: 'Brand not found' };
  }

  if (brand.status !== 'ACTIVE') {
    return { success: false, error: 'Trading is halted for this brand' };
  }

  if (quantity <= 0) {
    return { success: false, error: 'Quantity must be positive' };
  }

  // Get market maker price (includes spread)
  const executionPrice = calculateMarketMakerPrice(brand.currentPrice, side);
  const grossValue = quantity * executionPrice;

  // Calculate fees
  const { tradingFee, creatorRoyalty, netValue } = calculateTradingFees(grossValue);

  if (side === 'BUY') {
    // BUYING: User pays grossValue + fees
    const totalCost = grossValue + tradingFee + creatorRoyalty;

    // Check wallet balance
    const wallet = await getOrCreateWallet(userId);
    if (wallet.available < totalCost) {
      return {
        success: false,
        error: `Insufficient balance. Need ${totalCost.toFixed(2)} coins, have ${wallet.available.toFixed(2)}`,
      };
    }

    // Lock funds
    const locked = await lockCoins(userId, totalCost);
    if (!locked) {
      return { success: false, error: 'Failed to lock funds' };
    }

    // Execute trade
    const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tradeId = `trade-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Spend the locked coins
    await spendLockedCoins(
      userId,
      totalCost,
      `Bought ${quantity} shares of $${brand.ticker} @ ${executionPrice.toFixed(4)} coins`
    );

    // Credit royalty to creator
    if (brand.ownerId) {
      await creditCoins(
        brand.ownerId,
        creatorRoyalty,
        'CREATOR_ROYALTY',
        `Royalty from ${quantity} shares traded on $${brand.ticker}`
      );
    }

    // Update shareholding
    updateShareholding(userId, brandId, quantity, totalCost);

    // Update brand metrics
    updateBrandAfterTrade(brandId, quantity, executionPrice, 'BUY');

    // Create order record
    const order: MarketOrder = {
      id: orderId,
      brandId,
      side: 'BUY',
      orderType: 'MARKET',
      quantity,
      filledQuantity: quantity,
      averagePrice: executionPrice,
      totalValue: grossValue,
      tradingFee,
      creatorRoyalty,
      status: 'FILLED',
      createdAt: new Date(),
      filledAt: new Date(),
    };
    demoOrders.set(orderId, order);

    // Create trade record
    const trade: Trade = {
      id: tradeId,
      brandId,
      orderId,
      side: 'BUY',
      quantity,
      price: executionPrice,
      totalValue: grossValue,
      tradingFee,
      creatorRoyalty,
      netValue,
      counterpartyType: 'MARKET_MAKER',
      executedAt: new Date(),
    };
    demoTrades.get(brandId)?.push(trade);

    // Log the trade
    logger.market.trade(userId, 'Demo User', 'BUY', brand.ticker, quantity, executionPrice);

    return { success: true, order, trade };
  } else {
    // SELLING: User receives netValue (after fees)
    // Check shareholding
    const holding = getShareholding(userId, brandId);
    if (!holding || holding.quantity < quantity) {
      const available = holding?.quantity || 0;
      return {
        success: false,
        error: `Insufficient shares. Have ${available}, trying to sell ${quantity}`,
      };
    }

    // Execute trade
    const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tradeId = `trade-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Update shareholding (reduce)
    updateShareholding(userId, brandId, -quantity, 0);

    // Credit proceeds to seller
    await creditCoins(
      userId,
      netValue,
      'SELL_SHARES',
      `Sold ${quantity} shares of $${brand.ticker} @ ${executionPrice.toFixed(4)} coins`
    );

    // Credit royalty to creator
    if (brand.ownerId) {
      await creditCoins(
        brand.ownerId,
        creatorRoyalty,
        'CREATOR_ROYALTY',
        `Royalty from ${quantity} shares traded on $${brand.ticker}`
      );
    }

    // Update brand metrics
    updateBrandAfterTrade(brandId, quantity, executionPrice, 'SELL');

    // Create order record
    const order: MarketOrder = {
      id: orderId,
      brandId,
      side: 'SELL',
      orderType: 'MARKET',
      quantity,
      filledQuantity: quantity,
      averagePrice: executionPrice,
      totalValue: grossValue,
      tradingFee,
      creatorRoyalty,
      status: 'FILLED',
      createdAt: new Date(),
      filledAt: new Date(),
    };
    demoOrders.set(orderId, order);

    // Create trade record
    const trade: Trade = {
      id: tradeId,
      brandId,
      orderId,
      side: 'SELL',
      quantity,
      price: executionPrice,
      totalValue: grossValue,
      tradingFee,
      creatorRoyalty,
      netValue,
      counterpartyType: 'MARKET_MAKER',
      executedAt: new Date(),
    };
    demoTrades.get(brandId)?.push(trade);

    // Log the trade
    logger.market.trade(userId, 'Demo User', 'SELL', brand.ticker, quantity, executionPrice);

    return { success: true, order, trade };
  }
}

/**
 * Update shareholding after trade
 */
function updateShareholding(
  userId: string,
  brandId: string,
  quantityChange: number,
  costChange: number
) {
  if (!demoShareholdings.has(userId)) {
    demoShareholdings.set(userId, new Map());
  }

  const userHoldings = demoShareholdings.get(userId)!;
  const existing = userHoldings.get(brandId);

  if (existing) {
    const newQuantity = existing.quantity + quantityChange;

    if (newQuantity <= 0) {
      // Remove holding entirely
      userHoldings.delete(brandId);
    } else {
      const newTotalCost = quantityChange > 0
        ? existing.totalCost + costChange
        : existing.totalCost * (newQuantity / existing.quantity);

      existing.quantity = newQuantity;
      existing.totalCost = newTotalCost;
      existing.averageCost = newTotalCost / newQuantity;
    }
  } else if (quantityChange > 0) {
    // Create new holding
    const brand = demoBrands.get(brandId)!;
    userHoldings.set(brandId, {
      id: `holding-${Date.now()}`,
      brandId,
      brand: {
        id: brand.id,
        ticker: brand.ticker,
        name: brand.name,
        logoUrl: brand.logoUrl,
        currentPrice: brand.currentPrice,
        priceChange24h: brand.priceChange24h,
        marketCap: brand.marketCap,
        volume24h: brand.volume24h,
      },
      quantity: quantityChange,
      lockedQuantity: 0,
      totalCost: costChange,
      averageCost: costChange / quantityChange,
      currentValue: quantityChange * brand.currentPrice,
      profitLoss: 0,
      profitLossPercent: 0,
    });
  }
}

/**
 * Get user's shareholding in a brand
 */
function getShareholding(userId: string, brandId: string): Shareholding | null {
  const userHoldings = demoShareholdings.get(userId);
  if (!userHoldings) return null;
  return userHoldings.get(brandId) || null;
}

/**
 * Update brand metrics after a trade
 */
function updateBrandAfterTrade(
  brandId: string,
  quantity: number,
  price: number,
  side: 'BUY' | 'SELL'
) {
  const brand = demoBrands.get(brandId);
  if (!brand) return;

  // Update volume
  brand.volume24h += quantity * price;

  // Update price based on supply/demand
  // Buys push price up, sells push price down
  const priceImpact = (quantity / brand.sharesOutstanding) * 0.5; // 0.5% impact per 1% of float traded
  const direction = side === 'BUY' ? 1 : -1;

  brand.previousPrice = brand.currentPrice;
  brand.currentPrice = Math.max(0.01, brand.currentPrice * (1 + (priceImpact * direction)));

  // Update ATH/ATL
  if (brand.currentPrice > brand.allTimeHigh) {
    brand.allTimeHigh = brand.currentPrice;
  }
  if (brand.currentPrice < brand.allTimeLow) {
    brand.allTimeLow = brand.currentPrice;
  }

  // Update market cap
  brand.marketCap = brand.currentPrice * brand.sharesOutstanding;

  // Update 24h change
  brand.priceChange24h = ((brand.currentPrice - brand.previousPrice) / brand.previousPrice) * 100;
}

/**
 * Get user's portfolio
 */
export async function getPortfolio(userId: string): Promise<Portfolio> {
  initializeDemoBrands();

  const userHoldings = demoShareholdings.get(userId);

  if (!userHoldings || userHoldings.size === 0) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalProfitLoss: 0,
      totalProfitLossPercent: 0,
      holdings: [],
    };
  }

  const holdings: Shareholding[] = [];
  let totalValue = 0;
  let totalCost = 0;

  for (const [brandId, holding] of userHoldings) {
    const brand = demoBrands.get(brandId);
    if (!brand) continue;

    const currentValue = holding.quantity * brand.currentPrice;
    const profitLoss = currentValue - holding.totalCost;
    const profitLossPercent = (profitLoss / holding.totalCost) * 100;

    holdings.push({
      ...holding,
      brand: {
        id: brand.id,
        ticker: brand.ticker,
        name: brand.name,
        logoUrl: brand.logoUrl,
        currentPrice: brand.currentPrice,
        priceChange24h: brand.priceChange24h,
        marketCap: brand.marketCap,
        volume24h: brand.volume24h,
      },
      currentValue,
      profitLoss,
      profitLossPercent,
    });

    totalValue += currentValue;
    totalCost += holding.totalCost;
  }

  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalProfitLoss,
    totalProfitLossPercent,
    holdings: holdings.sort((a, b) => b.currentValue - a.currentValue),
  };
}

/**
 * Get price history for charts
 */
export async function getPriceHistory(
  brandId: string,
  interval: PriceInterval = 'DAY_1',
  limit = 30
): Promise<PricePoint[]> {
  initializeDemoBrands();

  const history = demoPriceHistory.get(brandId);
  if (!history) return [];

  return history.slice(-limit);
}

/**
 * Get recent trades for a brand
 */
export async function getRecentTrades(brandId: string, limit = 20): Promise<Trade[]> {
  initializeDemoBrands();

  const trades = demoTrades.get(brandId);
  if (!trades) return [];

  return trades.slice(-limit).reverse();
}

/**
 * Get user's order history
 */
export async function getOrderHistory(userId: string, limit = 50): Promise<MarketOrder[]> {
  // For demo, just return all orders (in production, filter by userId)
  return Array.from(demoOrders.values())
    .slice(-limit)
    .reverse();
}
