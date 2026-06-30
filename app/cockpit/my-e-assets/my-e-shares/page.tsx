'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Zap, Wallet as WalletIcon, Plus, ChevronRight } from 'lucide-react';

import type {
  BrandListing,
  ShareHolding,
  MarketStats,
} from './types/e-shares';

import {
  seedESharesMarketIfEmpty,
  getPublicBrands,
  getMyHoldings,
  getMarketStats,
  applyMicroFluctuation,
  getBrandById,
  getTransactionsByUser,
} from './lib/e-shares-api';

import {
  recordPricePoint,
} from './lib/e-shares-api';

import type {
  CreditTransaction,
} from './types/e-shares';

import {
  getWallet,
  deposit,
  type Wallet,
} from './lib/wallet-store';

import ErrorBoundary from '@/components/ErrorBoundary';
import './e-shares.css';

type TabType = 'portfolio' | 'marketplace';

export default function MyESharesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [brands, setBrands] = useState<BrandListing[]>([]);
  const [holdings, setHoldings] = useState<ShareHolding[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'trending' | 'gainers' | 'new'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Demo user ID
  const currentUserId = 'demo-user-main';

  // Load initial data
  useEffect(() => {
    const initializeMarket = () => {
      setIsLoading(true);
      seedESharesMarketIfEmpty();
      loadData();
      setIsLoading(false);
    };
    initializeMarket();
  }, []);

  const loadData = useCallback(() => {
    const allBrands = getPublicBrands();
    setBrands(allBrands);
    setHoldings(getMyHoldings(currentUserId));
    setStats(getMarketStats());
    setWallet(getWallet(currentUserId));
    setTransactions(getTransactionsByUser(currentUserId));
  }, [currentUserId]);

  // Live price fluctuation with micro-animations
  useEffect(() => {
    let tickCount = 0;
    const interval = setInterval(() => {
      tickCount++;
      setBrands((prev) =>
        prev.map((brand) => {
          const currentPrice = brand.pricePerShare ?? 0.01;
          const { value, direction } = applyMicroFluctuation(
            currentPrice,
            brand.basePrice,
            brand.engagement
          );

          // Record price every 5th tick (~30s)
          if (
            tickCount % 5 === 0 &&
            brand.id === prev[tickCount % prev.length]?.id
          ) {
            recordPricePoint(brand.id, value);
          }

          return {
            ...brand,
            pricePerShare: value,
            marketCap: (brand.totalShares ?? 0) * value,
            _direction: direction,
          } as BrandListing & { _direction?: string };
        })
      );
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Portfolio calculations
  const portfolioValue = holdings.reduce((sum, h) => {
    const brand = h.brandId ? getBrandById(h.brandId) : undefined;
    return sum + (brand ? (h.shares ?? 0) * (brand.pricePerShare ?? 0) : h.currentValue ?? 0);
  }, 0);

  const totalInvested = holdings.reduce((sum, h) => sum + (h.totalInvested ?? 0), 0);
  const totalGain = portfolioValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  // Filter and search brands
  const filteredBrands = brands
    .filter((brand) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        brand.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.handle?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Type filter
      if (filterType === 'trending') {
        return (brand.volume24h ?? 0) > (stats?.totalVolume24h ?? 0) / 50;
      }
      if (filterType === 'gainers') {
        return (brand.priceChange24h ?? 0) > 0;
      }
      if (filterType === 'new') {
        const now = Date.now();
        const listedAt = brand.listedAt ?? now;
        return now - listedAt < 7 * 24 * 60 * 60 * 1000; // Last 7 days
      }

      return true;
    })
    .sort((a, b) => {
      if (filterType === 'gainers') {
        return (b.priceChange24h ?? 0) - (a.priceChange24h ?? 0);
      }
      if (filterType === 'trending') {
        return (b.volume24h ?? 0) - (a.volume24h ?? 0);
      }
      return (b.marketCap ?? 0) - (a.marketCap ?? 0);
    });

  // Recent activity (last 5 transactions)
  const recentActivity = [...transactions]
    .reverse()
    .slice(0, 5)
    .map((tx) => ({
      ...tx,
      brandName: tx.brandName || 'Unknown',
      shares: tx.shares || 0,
      pricePerShare: tx.pricePerShare || 0,
      timestamp: tx.timestamp || 0,
    }));

  const handleNavigateToBrand = (brandId: string) => {
    router.push(`/cockpit/my-e-assets/my-e-shares/brand/${brandId}`);
  };

  const handleNavigateToIPO = () => {
    router.push('/cockpit/my-e-assets/my-e-shares/ipo');
  };

  const handleAddFunds = async () => {
    const amountStr = prompt('Enter amount to deposit (USD):', '100');
    if (!amountStr || isNaN(parseFloat(amountStr))) return;
    const amountUsd = parseFloat(amountStr);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout session');
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      alert(`Deposit error: ${err.message}`);
    }
  };

  const handleHoldingClick = (holding: ShareHolding) => {
    if (holding.brandId) {
      handleNavigateToBrand(holding.brandId);
    }
  };

  if (isLoading) {
    return (
      <div className="e-shares-root">
        <div className="arena-loading">
          <div className="arena-spinner"></div>
          <p>Initializing Investment Arena...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="e-shares-root">
        {/* Header */}
        <div className="e-shares-header">
          <h1 className="e-shares-title">Investment Arena</h1>
          <p className="e-shares-subtitle">
            Trade creator brands · Support digital equity · Build wealth together
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="e-shares-tabs">
          <button
            className={`e-shares-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <TrendingUp className="icon" style={{ width: 16, height: 16 }} />
            Portfolio
          </button>
          <button
            className={`e-shares-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setActiveTab('marketplace')}
          >
            <Zap className="icon" style={{ width: 16, height: 16 }} />
            Market
          </button>
        </div>

        {/* PORTFOLIO TAB */}
        {activeTab === 'portfolio' && (
          <div className="portfolio-container">
            {/* Portfolio Stats Grid */}
            <div className="portfolio-stats-grid">
              <div className="portfolio-stat-card">
                <div className="portfolio-stat-label">Portfolio Value</div>
                <div className="portfolio-stat-value">
                  ${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className={`portfolio-stat-change ${totalGain >= 0 ? 'positive' : 'negative'}`}>
                  {totalGain >= 0 ? '↑' : '↓'} ${Math.abs(totalGain).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="portfolio-stat-card">
                <div className="portfolio-stat-label">Total Invested</div>
                <div className="portfolio-stat-value">
                  ${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="portfolio-stat-change neutral">
                  {holdings.length} position{holdings.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="portfolio-stat-card">
                <div className="portfolio-stat-label">Daily Return</div>
                <div className={`portfolio-stat-value ${totalGainPercent >= 0 ? '' : ''}`}>
                  {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
                </div>
                <div className={`portfolio-stat-change ${totalGainPercent >= 0 ? 'positive' : 'negative'}`}>
                  ${Math.abs(totalGain).toFixed(2)}
                </div>
              </div>

              <div className="portfolio-stat-card">
                <div className="portfolio-stat-label">Available Balance</div>
                <div className="portfolio-stat-value">
                  ${(wallet?.balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <button
                  className="holding-action"
                  onClick={handleAddFunds}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  <Plus style={{ width: 14, height: 14, marginRight: 4 }} />
                  Add Funds
                </button>
              </div>
            </div>

            {/* Holdings Section */}
            <div className="holdings-section">
              <div className="holdings-header">
                <h2 className="holdings-title">Your Holdings</h2>
                <button
                  className="holding-action"
                  onClick={handleNavigateToIPO}
                >
                  Launch Brand
                  <ChevronRight style={{ width: 14, height: 14, marginLeft: 4 }} />
                </button>
              </div>

              {holdings.length === 0 ? (
                <div className="arena-empty-state">
                  <WalletIcon style={{ width: 64, height: 64, opacity: 0.3 }} />
                  <div className="arena-empty-title">No Holdings Yet</div>
                  <div className="arena-empty-description">
                    Explore the market and start investing in creator brands. Your portfolio will appear here.
                  </div>
                </div>
              ) : (
                <div className="holdings-list">
                  {holdings.map((holding) => {
                    const brand = holding.brandId ? getBrandById(holding.brandId) : null;
                    const currentValue =
                      brand && holding.shares
                        ? holding.shares * (brand.pricePerShare ?? 0)
                        : holding.currentValue ?? 0;
                    const gain = currentValue - (holding.totalInvested ?? 0);
                    const gainPercent =
                      (holding.totalInvested ?? 0) > 0
                        ? (gain / (holding.totalInvested ?? 0)) * 100
                        : 0;

                    return (
                      <div
                        key={holding.id}
                        className="holding-row"
                        onClick={() => handleHoldingClick(holding)}
                      >
                        <div className="holding-brand-info">
                          <div className="holding-brand-name">
                            {brand?.brandName || holding.brandName || 'Unknown'}
                          </div>
                          <div className="holding-brand-ticker">
                            {(holding.shares ?? 0).toFixed(0)} shares
                          </div>
                        </div>

                        <div className="holding-stat value">
                          ${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>

                        <div className={`holding-stat gain ${gain >= 0 ? 'positive' : 'negative'}`}>
                          {gain >= 0 ? '+' : ''}${Math.abs(gain).toFixed(2)}
                        </div>

                        <div className={`holding-stat gain ${gainPercent >= 0 ? 'positive' : 'negative'}`}>
                          {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%
                        </div>

                        <button
                          className="holding-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (holding.brandId) handleNavigateToBrand(holding.brandId);
                          }}
                        >
                          Trade
                          <ChevronRight style={{ width: 14, height: 14, marginLeft: 4 }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity Feed */}
            {recentActivity.length > 0 && (
              <div className="activity-feed">
                <div className="activity-title">Recent Activity</div>
                <div className="activity-list">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {activity.type === 'BUY' ? 'Bought' : activity.type === 'SELL' ? 'Sold' : 'Traded'}
                        </div>
                        <div className="activity-timestamp">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div>{activity.brandName}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>
                          {activity.shares} shares @ ${activity.pricePerShare.toFixed(4)}
                        </div>
                        <div className="activity-timestamp">
                          ${(activity.shares * activity.pricePerShare).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MARKETPLACE TAB */}
        {activeTab === 'marketplace' && (
          <div className="market-browser">
            {/* Search & Filters */}
            <div className="market-controls">
              <div className="market-search-box">
                <svg
                  className="market-search-icon"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM14.293 13.293l4.25 4.25-1.414 1.414-4.25-4.25.414-.414z" />
                </svg>
                <input
                  type="text"
                  className="market-search-input"
                  placeholder="Search brands, creators, tickers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="market-filter-group">
                <button
                  className={`market-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button
                  className={`market-filter-btn ${filterType === 'trending' ? 'active' : ''}`}
                  onClick={() => setFilterType('trending')}
                >
                  Trending
                </button>
                <button
                  className={`market-filter-btn ${filterType === 'gainers' ? 'active' : ''}`}
                  onClick={() => setFilterType('gainers')}
                >
                  Gainers
                </button>
                <button
                  className={`market-filter-btn ${filterType === 'new' ? 'active' : ''}`}
                  onClick={() => setFilterType('new')}
                >
                  New
                </button>
              </div>
            </div>

            {/* Brand Grid */}
            <div className="brand-grid">
              {filteredBrands.length === 0 ? (
                <div className="arena-empty-state" style={{ gridColumn: '1 / -1' }}>
                  <Zap style={{ width: 64, height: 64, opacity: 0.3 }} />
                  <div className="arena-empty-title">No Brands Found</div>
                  <div className="arena-empty-description">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'No brands available in this category'}
                  </div>
                </div>
              ) : (
                filteredBrands.map((brand) => {
                  const priceChange = brand.priceChange24h ?? 0;
                  const isUp = priceChange >= 0;
                  const direction = (brand as any)._direction;

                  return (
                    <div
                      key={brand.id}
                      className="brand-card"
                      onClick={() => handleNavigateToBrand(brand.id)}
                    >
                      <div className="brand-card-header">
                        <div className="brand-card-avatar">
                          {(brand.brandName || 'B').charAt(0).toUpperCase()}
                        </div>
                        <div className="brand-card-price">
                          {direction === 'up' && '↑'} {direction === 'down' && '↓'}
                        </div>
                      </div>

                      <div className="brand-card-info">
                        <div className="brand-card-name">{brand.brandName}</div>
                        <div className="brand-card-ticker">${brand.id?.substring(0, 4).toUpperCase()}</div>
                      </div>

                      <div className="brand-card-stats">
                        <div className="brand-card-stat">
                          <div className="brand-card-stat-label">Price</div>
                          <div className="brand-card-stat-value">
                            ${(brand.pricePerShare ?? 0).toFixed(4)}
                          </div>
                        </div>
                        <div className="brand-card-stat">
                          <div className="brand-card-stat-label">24h Change</div>
                          <div
                            className={`brand-card-stat-value ${isUp ? 'positive' : 'negative'}`}
                          >
                            {isUp ? '+' : ''}{priceChange.toFixed(2)}%
                          </div>
                        </div>
                        <div className="brand-card-stat">
                          <div className="brand-card-stat-label">Market Cap</div>
                          <div className="brand-card-stat-value">
                            ${((brand.marketCap ?? 0) / 1000).toFixed(1)}K
                          </div>
                        </div>
                        <div className="brand-card-stat">
                          <div className="brand-card-stat-label">Volume</div>
                          <div className="brand-card-stat-value">
                            ${((brand.volume24h ?? 0) / 1000).toFixed(1)}K
                          </div>
                        </div>
                      </div>

                      <button className="brand-card-action">
                        Trade Now →
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
