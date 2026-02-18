'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
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
} from './lib/e-shares-api';

import { recordPricePoint } from './lib/e-shares-store';

import { getWallet, deposit, withdraw, type Wallet, type WalletTransaction } from './lib/wallet-store';

import UpperTicker from './components/UpperTicker';
import ErrorBoundary from '@/components/ErrorBoundary';
import './e-shares.css';

type TabType = 'marketplace' | 'portfolio' | 'wallet' | 'list-brand';

export default function MyESharesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('marketplace');
  const [brands, setBrands] = useState<BrandListing[]>([]);
  const [holdings, setHoldings] = useState<ShareHolding[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // Demo user ID (in production this would come from auth)
  const currentUserId = 'demo-user-main';

  /* -----------------------------------------
     INITIAL LOAD
  ----------------------------------------- */
  useEffect(() => {
    seedESharesMarketIfEmpty();
    loadData();
  }, []);

  function loadData() {
    setBrands(getPublicBrands());
    setHoldings(getMyHoldings(currentUserId));
    setStats(getMarketStats());
    setWallet(getWallet(currentUserId));
  }

  /* -----------------------------------------
     LIVE PRICE FLUCTUATION (for ticker feel)
     - Price updates every 6s (was 4s) to reduce render pressure
     - localStorage recording every ~30s per brand (was ~40s)
  ----------------------------------------- */
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
          // Record price point for history charts — only every 5th tick (~30s)
          // and only one brand per tick to avoid localStorage thrashing
          if (tickCount % 5 === 0 && brand.id === prev[tickCount % prev.length]?.id) {
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

  /* -----------------------------------------
     PORTFOLIO CALCULATIONS
  ----------------------------------------- */
  const portfolioValue = holdings.reduce((sum, h) => {
    const brand = h.brandId ? getBrandById(h.brandId) : undefined;
    return sum + (brand ? (h.shares ?? 0) * (brand.pricePerShare ?? 0) : (h.currentValue ?? 0));
  }, 0);

  const totalInvested = holdings.reduce((sum, h) => sum + (h.totalInvested ?? 0), 0);
  const totalGain = portfolioValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */
  return (
    <ErrorBoundary>
    <div className="e-shares-root">
      {/* Live Price Ticker */}
      <UpperTicker />

      {/* Header */}
      <div className="e-shares-header">
        <h1 className="e-shares-title">E-Shares</h1>
        <p className="e-shares-subtitle">
          Invest in digital brands · Support creators · Grow together
        </p>
      </div>

      {/* Market Stats Bar */}
      {stats && (
        <div className="market-stats-bar">
          <div className="market-stat">
            <div className="market-stat-value">{stats.totalBrandsListed ?? 0}</div>
            <div className="market-stat-label">Listed Brands</div>
          </div>
          <div className="market-stat">
            <div className="market-stat-value">
              ${(stats.totalMarketCap ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="market-stat-label">Total Market Cap</div>
          </div>
          <div className="market-stat">
            <div className="market-stat-value">
              ${(stats.totalVolume24h ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className="market-stat-label">24h Volume</div>
          </div>
          <div className="market-stat">
            <div className="market-stat-value">{stats.totalInvestors ?? 0}</div>
            <div className="market-stat-label">Active Investors</div>
          </div>
          <div className="market-stat">
            <div className="market-stat-value">
              ${(stats.platformFeesCollected ?? 0).toFixed(4)}
            </div>
            <div className="market-stat-label">Platform Fees</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="e-shares-tabs">
        <button
          className={`e-shares-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplace')}
        >
          Browse Marketplace
        </button>
        <button
          className={`e-shares-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          My Portfolio
        </button>
        <button
          className={`e-shares-tab ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet {wallet && wallet.balance > 0 && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.8 }}>
              ${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </button>
        <button
          className={`e-shares-tab ${activeTab === 'list-brand' ? 'active' : ''}`}
          onClick={() => setActiveTab('list-brand')}
        >
          List Your Brand
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'marketplace' && (
        <MarketplaceView
          brands={brands}
          onSelectBrand={(id) => router.push(`/cockpit/my-e-assets/my-e-shares/brand/${id}`)}
        />
      )}

      {activeTab === 'portfolio' && (
        <PortfolioView
          holdings={holdings}
          portfolioValue={portfolioValue}
          totalInvested={totalInvested}
          totalGain={totalGain}
          totalGainPercent={totalGainPercent}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'wallet' && (
        <WalletView
          wallet={wallet}
          userId={currentUserId}
          onUpdate={loadData}
        />
      )}

      {activeTab === 'list-brand' && (
        <ListBrandView
          onSuccess={() => {
            loadData();
            setActiveTab('marketplace');
          }}
          currentUserId={currentUserId}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}

/* =========================================
   MARKETPLACE VIEW
========================================= */

function MarketplaceView({
  brands,
  onSelectBrand,
}: {
  brands: (BrandListing & { _direction?: string })[];
  onSelectBrand: (id: string) => void;
}) {
  if (brands.length === 0) {
    return (
      <div className="e-shares-empty">
        <div className="e-shares-empty-icon">📊</div>
        <div className="e-shares-empty-title">No Brands Listed Yet</div>
        <div className="e-shares-empty-text">
          Be the first to list your brand and let your community invest in your growth!
        </div>
      </div>
    );
  }

  return (
    <div className="brands-grid">
      {brands.map((brand) => (
        <div
          key={brand.id}
          className="brand-card"
          onClick={() => onSelectBrand(brand.id)}
        >
          <div className="brand-card-header">
            <div className="brand-identity">
              <div className="brand-avatar">
                {brand.brandName.charAt(0).toUpperCase()}
              </div>
              <div className="brand-info">
                <h3>{brand.brandName}</h3>
                <span className="brand-handle">{brand.handle}</span>
              </div>
            </div>
            <span className={`brand-status ${brand.status.toLowerCase()}`}>
              {brand.status}
            </span>
          </div>

          <p className="brand-description">{brand.description}</p>

          <div className="brand-metrics">
            <div className="brand-metric">
              <div
                className={`brand-metric-value ${
                  (brand as BrandListing & { _direction?: string })._direction === 'up'
                    ? 'up'
                    : (brand as BrandListing & { _direction?: string })._direction === 'down'
                    ? 'down'
                    : ''
                }`}
              >
                ${(brand.pricePerShare ?? 0).toFixed(4)}
              </div>
              <div className="brand-metric-label">Price/Share</div>
            </div>
            <div className="brand-metric">
              <div className="brand-metric-value">
                ${(brand.marketCap ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="brand-metric-label">Market Cap</div>
            </div>
            <div className="brand-metric">
              <div className="brand-metric-value">
                {(brand.publicSharesAvailable ?? 0).toLocaleString()}
              </div>
              <div className="brand-metric-label">Available</div>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <span className={`platform-badge ${brand.platform}`}>
              {brand.platform}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================
   PORTFOLIO VIEW
========================================= */

function PortfolioView({
  holdings,
  portfolioValue,
  totalInvested,
  totalGain,
  totalGainPercent,
  onRefresh,
}: {
  holdings: ShareHolding[];
  portfolioValue: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
  onRefresh: () => void;
}) {
  const router = useRouter();

  if (holdings.length === 0) {
    return (
      <div className="e-shares-empty">
        <div className="e-shares-empty-icon">💼</div>
        <div className="e-shares-empty-title">Your Portfolio is Empty</div>
        <div className="e-shares-empty-text">
          Start investing in brands you believe in. Browse the marketplace to find
          opportunities.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="portfolio-stat-card">
          <div className="portfolio-stat-label">Portfolio Value</div>
          <div className="portfolio-stat-value">
            ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="portfolio-stat-card">
          <div className="portfolio-stat-label">Total Invested</div>
          <div className="portfolio-stat-value">
            ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="portfolio-stat-card">
          <div className="portfolio-stat-label">Total Gain/Loss</div>
          <div className={`portfolio-stat-value ${totalGain >= 0 ? 'positive' : 'negative'}`}>
            {totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)}
          </div>
          <div className={`portfolio-stat-change ${totalGain >= 0 ? 'positive' : 'negative'}`}>
            {totalGain >= 0 ? '↑' : '↓'} {Math.abs(totalGainPercent).toFixed(2)}%
          </div>
        </div>
        <div className="portfolio-stat-card">
          <div className="portfolio-stat-label">Holdings</div>
          <div className="portfolio-stat-value">{holdings.length}</div>
        </div>
      </div>

      {/* Holdings Table */}
      <table className="holdings-table">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Shares</th>
            <th>Avg Cost</th>
            <th>Current Value</th>
            <th>Gain/Loss</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const brand = holding.brandId ? getBrandById(holding.brandId) : undefined;
            const shares = holding.shares ?? 0;
            const totalInv = holding.totalInvested ?? 0;
            const currentValue = brand
              ? shares * (brand.pricePerShare ?? 0)
              : (holding.currentValue ?? 0);
            const gain = currentValue - totalInv;
            const gainPercent =
              totalInv > 0
                ? (gain / totalInv) * 100
                : 0;

            return (
              <tr key={holding.id}>
                <td>
                  <div className="holding-brand">
                    <div className="holding-brand-avatar">
                      {(holding.brandName ?? 'B').charAt(0).toUpperCase()}
                    </div>
                    <span className="holding-brand-name">{holding.brandName ?? 'Unknown'}</span>
                  </div>
                </td>
                <td className="holding-shares">
                  {(holding.shares ?? 0).toLocaleString()}
                  {holding.isLocked && (
                    <span className="lock-indicator">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                      Locked
                    </span>
                  )}
                </td>
                <td className="holding-value">${(holding.averageCost ?? 0).toFixed(4)}</td>
                <td className="holding-value">${currentValue.toFixed(2)}</td>
                <td className={`holding-gain ${gain >= 0 ? 'positive' : 'negative'}`}>
                  {gain >= 0 ? '+' : ''}${gain.toFixed(2)} ({gainPercent.toFixed(1)}%)
                </td>
                <td>
                  <div className="holding-actions">
                    <button
                      className="holding-action-btn buy"
                      onClick={() =>
                        router.push(`/cockpit/my-e-assets/my-e-shares/brand/${holding.brandId}?action=buy`)
                      }
                    >
                      Buy
                    </button>
                    <button
                      className="holding-action-btn sell"
                      onClick={() =>
                        router.push(`/cockpit/my-e-assets/my-e-shares/brand/${holding.brandId}?action=sell`)
                      }
                      disabled={holding.isLocked}
                    >
                      Sell
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/* =========================================
   WALLET VIEW
========================================= */

function WalletView({
  wallet,
  userId,
  onUpdate,
}: {
  wallet: Wallet | null;
  userId: string;
  onUpdate: () => void;
}) {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | null>(null);

  const balance = wallet?.balance ?? 0;
  const transactions = wallet?.transactions ?? [];

  function handleDeposit() {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount' });
      return;
    }
    const result = deposit(userId, amount);
    if (result.success) {
      setMessage({ type: 'success', text: `Deposited $${amount.toFixed(2)} successfully` });
      setDepositAmount('');
      setActiveAction(null);
      onUpdate();
    } else {
      setMessage({ type: 'error', text: result.error || 'Deposit failed' });
    }
  }

  function handleWithdraw() {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount' });
      return;
    }
    const result = withdraw(userId, amount);
    if (result.success) {
      setMessage({ type: 'success', text: `Withdrew $${amount.toFixed(2)} (10% fee applied)` });
      setWithdrawAmount('');
      setActiveAction(null);
      onUpdate();
    } else {
      setMessage({ type: 'error', text: result.error || 'Withdrawal failed' });
    }
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(63, 255, 220, 0.08), rgba(99, 102, 241, 0.08))',
        border: '1px solid rgba(63, 255, 220, 0.2)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
          Available Balance
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3fffdc', marginBottom: '0.5rem' }}>
          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6b7280' }}>
          <span>Deposited: ${(wallet?.totalDeposited ?? 0).toFixed(2)}</span>
          <span>Withdrawn: ${(wallet?.totalWithdrawn ?? 0).toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            className="e-shares-btn primary"
            onClick={() => { setActiveAction(activeAction === 'deposit' ? null : 'deposit'); setMessage(null); }}
            style={{ flex: 1 }}
          >
            Deposit Funds
          </button>
          <button
            className="e-shares-btn secondary"
            onClick={() => { setActiveAction(activeAction === 'withdraw' ? null : 'withdraw'); setMessage(null); }}
            style={{ flex: 1 }}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444',
        }}>
          {message.text}
        </div>
      )}

      {/* Deposit Form */}
      {activeAction === 'deposit' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>Deposit Funds</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Add funds to your wallet to buy E-Shares. Minimum deposit: $10.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>$</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="100.00"
                min="10"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingLeft: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
            </div>
            <button className="e-shares-btn primary" onClick={handleDeposit}>
              Deposit
            </button>
          </div>
          {/* Quick amount buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            {[25, 50, 100, 250, 500].map((amt) => (
              <button
                key={amt}
                onClick={() => setDepositAmount(String(amt))}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: depositAmount === String(amt) ? 'rgba(63, 255, 220, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${depositAmount === String(amt) ? 'rgba(63, 255, 220, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '4px',
                  color: depositAmount === String(amt) ? '#3fffdc' : '#9ca3af',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw Form */}
      {activeAction === 'withdraw' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>Withdraw Funds</h3>
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            Withdraw funds from your wallet. A 10% platform fee applies.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '1rem' }}>
            Available: ${balance.toFixed(2)} | Max withdrawal: ${balance.toFixed(2)}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>$</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="50.00"
                min="1"
                step="0.01"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingLeft: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
            </div>
            <button className="e-shares-btn secondary" onClick={handleWithdraw}>
              Withdraw
            </button>
          </div>
          {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.5rem' }}>
              Fee: ${(parseFloat(withdrawAmount) * 0.10).toFixed(2)} | You receive: ${(parseFloat(withdrawAmount) * 0.90).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Transaction Ledger */}
      <div>
        <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.1rem' }}>
          Transaction History
        </h3>
        {transactions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6b7280',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
          }}>
            No transactions yet. Deposit funds to start trading.
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            {transactions.slice().reverse().slice(0, 25).map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    background:
                      tx.type === 'deposit' ? 'rgba(16, 185, 129, 0.15)' :
                      tx.type === 'withdrawal' ? 'rgba(239, 68, 68, 0.15)' :
                      tx.type === 'buy' ? 'rgba(99, 102, 241, 0.15)' :
                      tx.type === 'sell' ? 'rgba(245, 158, 11, 0.15)' :
                      'rgba(156, 163, 175, 0.15)',
                    color:
                      tx.type === 'deposit' ? '#10b981' :
                      tx.type === 'withdrawal' ? '#ef4444' :
                      tx.type === 'buy' ? '#6366f1' :
                      tx.type === 'sell' ? '#f59e0b' :
                      '#9ca3af',
                  }}>
                    {tx.type === 'deposit' ? '+' : tx.type === 'withdrawal' ? '-' : tx.type === 'buy' ? 'B' : tx.type === 'sell' ? 'S' : '?'}
                  </div>
                  <div>
                    <div style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>{tx.description}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: tx.amount >= 0 ? '#10b981' : '#ef4444',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================
   LIST BRAND VIEW
========================================= */

import {
  createBrandListing,
  signTransparencyAgreement,
  goPublic,
} from './lib/e-shares-api';

import { E_SHARES_CONFIG } from './types/e-shares';

function ListBrandView({
  onSuccess,
  currentUserId,
}: {
  onSuccess: () => void;
  currentUserId: string;
}) {
  const [step, setStep] = useState<'form' | 'agreement' | 'success'>('form');
  const [formData, setFormData] = useState({
    brandName: '',
    handle: '',
    platform: 'instagram' as const,
    description: '',
    founderName: '',
    depositAmount: 100,
    followers: 0,
  });
  const [createdBrandId, setCreatedBrandId] = useState<string | null>(null);
  const [agreementChecks, setAgreementChecks] = useState({
    noProfit: false,
    communitySupport: false,
    lockIn: false,
    fees: false,
    risk: false,
  });

  function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();

    if (formData.depositAmount < E_SHARES_CONFIG.MIN_DEPOSIT) {
      alert(`Minimum deposit is $${E_SHARES_CONFIG.MIN_DEPOSIT}`);
      return;
    }

    const brand = createBrandListing({
      brandName: formData.brandName,
      handle: formData.handle,
      platform: formData.platform,
      description: formData.description,
      founderId: currentUserId,
      founderName: formData.founderName,
      depositAmount: formData.depositAmount,
      followers: formData.followers,
    });

    setCreatedBrandId(brand.id);
    setStep('agreement');
  }

  function handleSignAgreement() {
    if (!createdBrandId) return;

    const allChecked = Object.values(agreementChecks).every(Boolean);
    if (!allChecked) {
      alert('Please acknowledge all clauses before signing.');
      return;
    }

    signTransparencyAgreement({
      brandId: createdBrandId,
      founderId: currentUserId,
      founderSignature: formData.founderName,
    });

    goPublic(createdBrandId);
    setStep('success');
  }

  if (step === 'success') {
    return (
      <div className="e-shares-empty">
        <div className="e-shares-empty-icon">🎉</div>
        <div className="e-shares-empty-title">Brand Listed Successfully!</div>
        <div className="e-shares-empty-text">
          Your brand is now live on the E-Shares marketplace. Investors can now
          purchase shares and support your growth!
        </div>
        <button className="e-shares-btn primary" onClick={onSuccess}>
          View Marketplace
        </button>
      </div>
    );
  }

  if (step === 'agreement') {
    return (
      <div style={{ maxWidth: '700px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff' }}>
          Transparency Agreement
        </h2>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ color: '#9ca3af', marginBottom: '1rem', lineHeight: 1.6 }}>
            Before listing your brand on E-Shares, you must acknowledge and agree
            to the following transparency clauses. These protect both you and your
            investors.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreementChecks.noProfit}
                onChange={(e) =>
                  setAgreementChecks({ ...agreementChecks, noProfit: e.target.checked })
                }
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <strong>No Guaranteed Profit:</strong> I understand that E-Shares
                are not traditional investments. Share values may fluctuate and
                there is no guarantee of financial return.
              </span>
            </label>

            <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreementChecks.communitySupport}
                onChange={(e) =>
                  setAgreementChecks({
                    ...agreementChecks,
                    communitySupport: e.target.checked,
                  })
                }
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <strong>Community Support Focus:</strong> E-Shares are designed to
                allow community members to support creators they believe in, not
                primarily as a profit-making instrument.
              </span>
            </label>

            <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreementChecks.lockIn}
                onChange={(e) =>
                  setAgreementChecks({ ...agreementChecks, lockIn: e.target.checked })
                }
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <strong>1-Year Lock-In Period:</strong> As the founder, I agree that
                my founder shares will be locked for 1 year from the listing date.
                I cannot sell or withdraw these shares during this period.
              </span>
            </label>

            <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreementChecks.fees}
                onChange={(e) =>
                  setAgreementChecks({ ...agreementChecks, fees: e.target.checked })
                }
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <strong>Platform Fees:</strong> I understand that Social Exchange
                collects a fee of $0.00009 (0.009 cents) per share on every buy/sell
                transaction.
              </span>
            </label>

            <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreementChecks.risk}
                onChange={(e) =>
                  setAgreementChecks({ ...agreementChecks, risk: e.target.checked })
                }
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.5 }}>
                <strong>Risk Disclosure:</strong> I acknowledge that my deposit is
                used to mint shares, and the value of these shares depends on market
                activity. I accept full responsibility for this decision.
              </span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="e-shares-btn secondary" onClick={() => setStep('form')}>
            Back
          </button>
          <button
            className="e-shares-btn primary"
            onClick={handleSignAgreement}
            disabled={!Object.values(agreementChecks).every(Boolean)}
          >
            Sign & Go Public
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>
        List Your Brand
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
        Turn your social presence into digital equity. Let your community invest
        in your success.
      </p>

      <form onSubmit={handleSubmitForm}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Brand Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Brand Name
            </label>
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) =>
                setFormData({ ...formData, brandName: e.target.value })
              }
              required
              placeholder="e.g., Urban Signal"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Handle */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Social Handle
            </label>
            <input
              type="text"
              value={formData.handle}
              onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
              required
              placeholder="e.g., @urban_signal"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Platform */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Primary Platform
            </label>
            <select
              value={formData.platform}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  platform: e.target.value as typeof formData.platform,
                })
              }
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
              }}
            >
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter/X</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="multi">Multi-Platform</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              placeholder="Tell investors about your brand and vision..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Founder Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Your Name (Founder)
            </label>
            <input
              type="text"
              value={formData.founderName}
              onChange={(e) =>
                setFormData({ ...formData, founderName: e.target.value })
              }
              required
              placeholder="e.g., Marcus Chen"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Deposit Amount */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Initial Deposit (min ${E_SHARES_CONFIG.MIN_DEPOSIT})
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                }}
              >
                $
              </span>
              <input
                type="number"
                value={formData.depositAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    depositAmount: parseFloat(e.target.value) || 0,
                  })
                }
                required
                min={E_SHARES_CONFIG.MIN_DEPOSIT}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingLeft: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
              This will create{' '}
              <strong style={{ color: '#3fffdc' }}>
                {(formData.depositAmount * E_SHARES_CONFIG.SHARES_PER_DOLLAR).toLocaleString()}
              </strong>{' '}
              shares at $0.01 each. 60% will be locked for 1 year.
            </p>
          </div>

          {/* Current Followers (optional) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Current Followers (optional)
            </label>
            <input
              type="number"
              value={formData.followers || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  followers: parseInt(e.target.value) || 0,
                })
              }
              placeholder="e.g., 50000"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <button
            type="submit"
            className="e-shares-btn primary"
            style={{ marginTop: '0.5rem' }}
          >
            Continue to Agreement
          </button>
        </div>
      </form>
    </div>
  );
}
