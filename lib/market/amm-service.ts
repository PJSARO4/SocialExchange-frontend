// @ts-nocheck
/**
 * Automated Market Maker Service for E-Shares
 * Uses constant product formula: x * y = k
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const PRICE_ADJUSTMENT_PERCENT = 1;
const TRADING_FEE_PERCENT = 1;
const CREATOR_ROYALTY_PERCENT = 2;

export function calculateAMMPrice(
  reserveCoins: number,
  reserveShares: number,
  tradeAmount: number,
  side: 'BUY' | 'SELL'
): {
  outAmount: number;
  spotPrice: number;
  executionPrice: number;
  priceImpact: number;
} {
  const k = reserveCoins * reserveShares;

  if (side === 'BUY') {
    const newReserveCoins = reserveCoins + tradeAmount;
    const newReserveShares = k / newReserveCoins;
    const sharesOut = reserveShares - newReserveShares;
    const spotPrice = reserveCoins / reserveShares;
    const executionPrice = tradeAmount / sharesOut;
    return { outAmount: sharesOut, spotPrice, executionPrice, priceImpact: ((executionPrice - spotPrice) / spotPrice) * 100 };
  } else {
    const newReserveShares = reserveShares + tradeAmount;
    const newReserveCoins = k / newReserveShares;
    const coinsOut = reserveCoins - newReserveCoins;
    const spotPrice = reserveCoins / reserveShares;
    const executionPrice = coinsOut / tradeAmount;
    return { outAmount: coinsOut, spotPrice, executionPrice, priceImpact: ((spotPrice - executionPrice) / spotPrice) * 100 };
  }
}

export function calculateSimplePriceAdjustment(
  currentPrice: number,
  side: 'BUY' | 'SELL',
  quantity: number,
  volume: number
): number {
  const adjustment = (currentPrice * PRICE_ADJUSTMENT_PERCENT) / 100;
  const volumeRatio = quantity / Math.max(volume, 1);
  const scaledAdjustment = adjustment * Math.min(volumeRatio, 1);
  if (side === 'BUY') {
    return currentPrice + scaledAdjustment;
  } else {
    return Math.max(currentPrice - scaledAdjustment, 0.0001);
  }
}

export function calculateTradeCost(amount: number, executionPrice: number): {
  subtotal: number;
  tradingFee: number;
  creatorRoyalty: number;
  total: number;
} {
  const subtotal = amount * executionPrice;
  const tradingFee = subtotal * (TRADING_FEE_PERCENT / 100);
  const creatorRoyalty = subtotal * (CREATOR_ROYALTY_PERCENT / 100);
  const total = subtotal + tradingFee + creatorRoyalty;
  return { subtotal, tradingFee, creatorRoyalty, total };
}

export function calculateSaleProceeds(quantity: number, executionPrice: number): {
  subtotal: number;
  tradingFee: number;
  creatorRoyalty: number;
  net: number;
} {
  const subtotal = quantity * executionPrice;
  const tradingFee = subtotal * (TRADING_FEE_PERCENT / 100);
  const creatorRoyalty = subtotal * (CREATOR_ROYALTY_PERCENT / 100);
  const net = subtotal - tradingFee - creatorRoyalty;
  return { subtotal, tradingFee, creatorRoyalty, net };
}

export async function executeBuyTrade(
  userId: string,
  brandId: string,
  orderId: string,
  quantity: number,
  maxPrice: number
) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) throw new Error('Brand not found');

  const newPrice = calculateSimplePriceAdjustment(
    Number(brand.currentPrice),
    'BUY',
    quantity,
    Number(brand.volume24h)
  );

  if (newPrice > maxPrice) {
    throw new Error(`Price impact too high: ${newPrice} exceeds max ${maxPrice}`);
  }

  const costs = calculateTradeCost(quantity, newPrice);

  const trade = await prisma.trade.create({
    data: {
      brandId,
      orderId,
      side: 'BUY',
      quantity: new Decimal(quantity),
      price: new Decimal(newPrice),
      totalValue: new Decimal(costs.subtotal),
      tradingFee: new Decimal(costs.tradingFee),
      creatorRoyalty: new Decimal(costs.creatorRoyalty),
      netValue: new Decimal(costs.subtotal),
      counterpartyType: 'MARKET_MAKER',
    },
  });

  await prisma.brand.update({
    where: { id: brandId },
    data: {
      previousPrice: brand.currentPrice,
      currentPrice: new Decimal(newPrice),
      volume24h: { increment: new Decimal(costs.subtotal) },
    },
  });

  await prisma.priceHistory.create({
    data: {
      brandId,
      interval: 'MINUTE_1',
      open: brand.currentPrice,
      high: new Decimal(newPrice),
      low: brand.currentPrice,
      close: new Decimal(newPrice),
      volume: new Decimal(quantity),
    },
  });

  let shareholding = await prisma.shareholding.findFirst({
    where: { wallet: { userId }, brandId },
  });

  if (shareholding) {
    const newTotalCost = Number(shareholding.totalCost) + costs.subtotal;
    const newQuantity = Number(shareholding.quantity) + quantity;
    const newAverageCost = newTotalCost / newQuantity;
    shareholding = await prisma.shareholding.update({
      where: { id: shareholding.id },
      data: {
        quantity: new Decimal(newQuantity),
        totalCost: new Decimal(newTotalCost),
        averageCost: new Decimal(newAverageCost),
      },
    });
  } else {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found');
    shareholding = await prisma.shareholding.create({
      data: {
        walletId: wallet.id,
        brandId,
        quantity: new Decimal(quantity),
        totalCost: new Decimal(costs.subtotal),
        averageCost: new Decimal(newPrice),
      },
    });
  }

  return { trade, shareholding, newPrice, costs };
}

export async function executeSellTrade(
  userId: string,
  brandId: string,
  orderId: string,
  quantity: number,
  minPrice: number
) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) throw new Error('Brand not found');

  const newPrice = calculateSimplePriceAdjustment(
    Number(brand.currentPrice),
    'SELL',
    quantity,
    Number(brand.volume24h)
  );

  if (newPrice < minPrice) {
    throw new Error(`Price impact too high: ${newPrice} below min ${minPrice}`);
  }

  const proceeds = calculateSaleProceeds(quantity, newPrice);

  const trade = await prisma.trade.create({
    data: {
      brandId,
      orderId,
      side: 'SELL',
      quantity: new Decimal(quantity),
      price: new Decimal(newPrice),
      totalValue: new Decimal(proceeds.subtotal),
      tradingFee: new Decimal(proceeds.tradingFee),
      creatorRoyalty: new Decimal(proceeds.creatorRoyalty),
      netValue: new Decimal(proceeds.net),
      counterpartyType: 'MARKET_MAKER',
    },
  });

  await prisma.brand.update({
    where: { id: brandId },
    data: {
      previousPrice: brand.currentPrice,
      currentPrice: new Decimal(newPrice),
      volume24h: { increment: new Decimal(proceeds.subtotal) },
    },
  });

  await prisma.priceHistory.create({
    data: {
      brandId,
      interval: 'MINUTE_1',
      open: brand.currentPrice,
      high: brand.currentPrice,
      low: new Decimal(newPrice),
      close: new Decimal(newPrice),
      volume: new Decimal(quantity),
    },
  });

  const shareholding = await prisma.shareholding.findFirst({
    where: { wallet: { userId }, brandId },
  });

  if (!shareholding || Number(shareholding.quantity) < quantity) {
    throw new Error('Insufficient shares to sell');
  }

  const newQuantity = Number(shareholding.quantity) - quantity;
  const updatedHolding = await prisma.shareholding.update({
    where: { id: shareholding.id },
    data: { quantity: new Decimal(newQuantity) },
  });

  return { trade, shareholding: updatedHolding, newPrice, proceeds };
}

export async function update24hMetrics(brandId: string) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const pricePoints = await prisma.priceHistory.findMany({
    where: { brandId, interval: 'MINUTE_1', createdAt: { gte: oneDayAgo } },
    orderBy: { createdAt: 'asc' },
    take: 1440,
  });

  if (pricePoints.length === 0) return;

  const open = Number(pricePoints[0].open);
  const close = Number(pricePoints[pricePoints.length - 1].close);
  const high = Math.max(...pricePoints.map((p) => Number(p.high)));
  const low = Math.min(...pricePoints.map((p) => Number(p.low)));
  const volume = pricePoints.reduce((sum, p) => sum + Number(p.volume), 0);
  const priceChange = ((close - open) / open) * 100;

  return prisma.brand.update({
    where: { id: brandId },
    data: {
      volume24h: new Decimal(volume),
      priceChange24h: new Decimal(priceChange),
      allTimeHigh: { set: new Decimal(Math.max(Number(high))) },
      allTimeLow: { set: new Decimal(Math.min(Number(low))) },
    },
  });
}
