'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Zap } from 'lucide-react';

import type {
  BrandListing,
  ShareHolding,
  CreditTransaction,
} from '../../types/e-shares';

import {
  getBrandById,
  getUserHoldingForBrand,
  getTransactionsByBrand,
  getHoldingsByBrand,
  buyShares,
  sellShares,
  applyMicroFluctuation,
  seedESharesMarketIfEmpty,
  recordPricePoint,
  getPublicBrands,
} from '../../lib/e-shares-api';

import {
  getWallet,
  deductForPurchase,
  creditFromSale,
} from '../../lib/wallet-store';

import ErrorBoundary from '@/components/ErrorBoundary';
import PriceChart from '../../components/SharePriceChart';
import '../../e-shares.css';

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams<{ brandId: string }>();
  const searchParams = useSearchParams();

  const [brand, setBrand] = useState<BrandListing | null>(null);
  const [holding, setHolding] = useState<ShareHolding | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [holders, setHolders] = useState<ShareHolding[]>([]);

  const [tradeMode, setTradeMode] = useState<'buy' | 'sell' | null>(null);
  const [quantity, setQuantity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = 'demo-user-main';
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load data
  const loadData = useCallback(() => {
    if (!params?.brandId) return;

    seedESharesMarketIfEmpty();
    const brandData = getBrandById(params.brandId);

    if (brandData) {
      setBrand(brandData);
      setHolding(getUserHoldingForBrand(currentUserId, params.brandId) || null);
      setTransactions(getTransactionsByBrand(params.brandId).slice(-10).reverse());
      setHolders(getHoldingsByBrand(params.brandId));
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [params?.brandId, currentUserId]);

  useEffect(() => {
    loadData();

    const actionParam = searchParams?.get('action');
    if (actionParam === 'buy' || actionParam === 'sell') {
      setTradeMode(actionParam);
    }
  }, [params?.brandId, searchParams, loadData]);

  // Live price updates
  useEffect(() => {
    if (!brand) return;

    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount++;
      setBrand((prev) => {
        if (!prev) return null;

        const currentPrice = prev.pricePerShare ?? 0.01;
        const { value, direction } = applyMicroFluctuation(
          currentPrice,
          prev.basePrice,
          prev.engagement
        );

        if (tickCount % 5 === 0) {
          recordPricePoint(prev.id, value);
        }

        return {
          ...prev,
          pricePerShare: value,
          marketCap: (prev.totalShares ?? 0) * value,
          _direction: direction,
        } as BrandListing & { _direction?: string };
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [brand?.id]);

  // Trade handlers
  const handleBuy = async () => {
    if (!brand || !quantity) return;

    const shares = parseFloat(quantity);
    const totalCost = shares * (brand.pricePerShare ?? 0);

    if (isNaN(shares) || shares <= 0) {
      setMessage({ type: 'error', text: 'Invalid quantity' });
      return;
    }

    setIsProcessing(true);
    try {
      const wallet = getWallet(currentUserId);
      if (!wallet || wallet.balance < totalCost) {
        setMessage({ type: 'error', text: 'Insufficient balance' });
        setIsProcessing(false);
        return;
      }

      buyShares({
        buyerId: currentUserId,
        buyerName: 'Demo User',
        brandId: brand.id,
        shares,
      });
      deductForPurchase(currentUserId, totalCost, `Buy ${shares.toFixed(0)} shares of ${brand.brandName}`, brand.id);

      setMessage({ type: 'success', text: `Purchased ${shares.toFixed(0)} shares!` });
      setQuantity('');
      setTradeMode(null);
      loadData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Transaction failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSell = async () => {
    if (!brand || !quantity || !holding) return;

    const shares = parseFloat(quantity);
    if (isNaN(shares) || shares <= 0 || shares > (holding.shares ?? 0)) {
      setMessage({ type: 'error', text: 'Invalid quantity' });
      return;
    }

    setIsProcessing(true);
    try {
      const totalProceeds = shares * (brand.pricePerShare ?? 0);

      sellShares({
        sellerId: currentUserId,
        brandId: brand.id,
        shares,
      });
      creditFromSale(currentUserId, totalProceeds, `Sell ${shares.toFixed(0)} shares of ${brand.brandName}`, brand.id);

      setMessage({ type: 'success', text: `Sold ${shares.toFixed(0)} shares!` });
      setQuantity('');
      setTradeMode(null);
      loadData();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Transaction failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="e-shares-root">
        <div className="arena-loading">
          <div className="arena-spinner"></div>
          <p>Loading brand...</p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="e-shares-root">
        <button
          onClick={() => router.back()}
          className="holding-action"
          style={{ marginBottom: '2rem' }}
        >
          <ArrowLeft style={{ width: 14, height: 14, marginRight: 4 }} />
          Back
        </button>
        <div className="arena-empty-state">
          <Zap style={{ width: 64, height: 64, opacity: 0.3 }} />
          <div className="arena-empty-title">Brand Not Found</div>
          <div className="arena-empty-description">
            This brand doesn't exist or has been delisted.
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = brand.pricePerShare ?? 0;
  const priceChange = brand.priceChange24h ?? 0;
  const isUp = priceChange >= 0;
  const holdingValue = holding ? (holding.shares ?? 0) * currentPrice : 0;
  const holdingGain = holdingValue - (holding?.totalInvested ?? 0);
  const holdingGainPercent =
    (holding?.totalInvested ?? 0) > 0 ? (holdingGain / (holding?.totalInvested ?? 0)) * 100 : 0;

  return (
    <ErrorBoundary>
      <div className="e-shares-root">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="holding-action"
          style={{ marginBottom: '2rem' }}
        >
          <ArrowLeft style={{ width: 14, height: 14, marginRight: 4 }} />
          Back to Market
        </button>

        <div className="brand-detail-container">
          {/* Brand Header */}
          <div className="brand-detail-header">
            <div className="brand-detail-avatar">
              {brand.brandName?.charAt(0).toUpperCase() || 'B'}
            </div>

            <div className="brand-detail-info">
              <div className="brand-detail-name">{brand.brandName}</div>
              <div className="brand-detail-ticker">
                ${brand.id?.substring(0, 4).toUpperCase()}
              </div>
              <div className="brand-detail-platform">
                {brand.platform && brand.platform.charAt(0).toUpperCase() + brand.platform.slice(1)} ·{' '}
                {brand.followers?.toLocaleString() ?? 0} followers
              </div>
              {brand.description && (
                <div className="brand-detail-description">{brand.description}</div>
              )}
            </div>

            <div className="brand-detail-price-box">
              <div className="brand-detail-price-label">Current Price</div>
              <div className="brand-detail-price">${currentPrice.toFixed(4)}</div>
              <div className={`brand-detail-change ${isUp ? 'positive' : 'negative'}`}>
                {isUp ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="brand-metrics-grid">
            <div className="brand-metric-card">
              <div className="brand-metric-label">Market Cap</div>
              <div className="brand-metric-value">
                ${((brand.marketCap ?? 0) / 1000000).toFixed(2)}M
              </div>
            </div>

            <div className="brand-metric-card">
              <div className="brand-metric-label">24h Volume</div>
              <div className="brand-metric-value">
                ${((brand.volume24h ?? 0) / 1000).toFixed(1)}K
              </div>
            </div>

            <div className="brand-metric-card">
              <div className="brand-metric-label">Total Holders</div>
              <div className="brand-metric-value">{holders.length}</div>
            </div>

            <div className="brand-metric-card">
              <div className="brand-metric-label">Shares Outstanding</div>
              <div className="brand-metric-value">{(brand.totalShares ?? 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Holding Summary */}
          {holding && (
            <div className="brand-metrics-grid" style={{ marginBottom: '2rem' }}>
              <div className="brand-metric-card" style={{ backgroundColor: 'rgba(0, 255, 136, 0.05)' }}>
                <div className="brand-metric-label">Your Shares</div>
                <div className="brand-metric-value">{(holding.shares ?? 0).toFixed(0)}</div>
              </div>

              <div className="brand-metric-card">
                <div className="brand-metric-label">Position Value</div>
                <div className="brand-metric-value">
                  ${holdingValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div
                className="brand-metric-card"
                style={{
                  backgroundColor: holdingGain >= 0 ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 68, 68, 0.05)',
                }}
              >
                <div className="brand-metric-label">Gain/Loss</div>
                <div
                  className="brand-metric-value"
                  style={{
                    color: holdingGain >= 0 ? 'var(--neon-green)' : 'var(--neon-red)',
                  }}
                >
                  {holdingGain >= 0 ? '+' : ''}${Math.abs(holdingGain).toFixed(2)}
                </div>
              </div>

              <div
                className="brand-metric-card"
                style={{
                  backgroundColor: holdingGainPercent >= 0 ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 68, 68, 0.05)',
                }}
              >
                <div className="brand-metric-label">Return %</div>
                <div
                  className="brand-metric-value"
                  style={{
                    color: holdingGainPercent >= 0 ? 'var(--neon-green)' : 'var(--neon-red)',
                  }}
                >
                  {holdingGainPercent >= 0 ? '+' : ''}{holdingGainPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Price Chart */}
          <div className="brand-chart-container">
            <div className="brand-chart-title">Price History</div>
            <PriceChart brandId={brand.id} />
          </div>

          {/* Trading Panel */}
          <div className="trading-panel">
            {/* Buy Form */}
            <div className="trade-form">
              <div className="trade-form-title">Buy Shares</div>

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Number of shares"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isProcessing}
                />
              </div>

              {quantity && (
                <div className="form-summary">
                  <div className="form-summary-label">Total Cost</div>
                  <div className="form-summary-value">
                    ${(parseFloat(quantity) * currentPrice).toFixed(2)}
                  </div>
                </div>
              )}

              <button
                className="trade-button"
                onClick={handleBuy}
                disabled={isProcessing || !quantity}
              >
                {isProcessing ? 'Processing...' : 'Buy Now'}
              </button>

              {message && tradeMode === 'buy' && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: message.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                  color: message.type === 'success' ? 'var(--neon-green)' : 'var(--neon-red)',
                  fontSize: '0.875rem',
                }}
                >
                  {message.text}
                </div>
              )}
            </div>

            {/* Sell Form */}
            <div className="trade-form">
              <div className="trade-form-title">Sell Shares</div>

              <div className="form-group">
                <label className="form-label">
                  Quantity
                  {holding && (
                    <span style={{ float: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Available: {(holding.shares ?? 0).toFixed(0)}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Number of shares"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isProcessing || !holding || (holding.shares ?? 0) === 0}
                />
              </div>

              {quantity && (
                <div className="form-summary">
                  <div className="form-summary-label">Proceeds</div>
                  <div className="form-summary-value">
                    ${(parseFloat(quantity) * currentPrice).toFixed(2)}
                  </div>
                </div>
              )}

              <button
                className="trade-button sell"
                onClick={handleSell}
                disabled={isProcessing || !quantity || !holding || (holding.shares ?? 0) === 0}
              >
                {isProcessing ? 'Processing...' : 'Sell Now'}
              </button>

              {message && tradeMode === 'sell' && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: message.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                  color: message.type === 'success' ? 'var(--neon-green)' : 'var(--neon-red)',
                  fontSize: '0.875rem',
                }}
                >
                  {message.text}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <div className="activity-feed">
              <div className="activity-title">Recent Transactions</div>
              <div className="activity-list">
                {transactions.map((tx) => (
                  <div key={tx.id} className="activity-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {tx.type === 'BUY' ? 'Buy' : tx.type === 'SELL' ? 'Sell' : tx.type}
                      </div>
                      <div className="activity-timestamp">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div>{(tx.shares ?? 0).toFixed(0)} shares</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>
                        ${((tx.shares ?? 0) * (tx.pricePerShare ?? 0)).toFixed(2)}
                      </div>
                      <div className="activity-timestamp">
                        @ ${(tx.pricePerShare ?? 0).toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
