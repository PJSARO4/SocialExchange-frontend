'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  BrandListing,
  ShareHolding,
  EShareTransaction,
  E_SHARES_CONFIG,
} from '../../types/e-shares';

import {
  getBrandById,
  getUserHoldingForBrand,
  getTransactionsByBrand,
  buyShares,
  sellShares,
  applyMicroFluctuation,
  getHoldingsByBrand,
  seedESharesMarketIfEmpty,
} from '../../lib/e-shares-store';

import { getWallet, deductForPurchase, creditFromSale } from '../../lib/wallet-store';
import SharePriceChart from '../../components/SharePriceChart';
import '../../e-shares.css';
import './brand-detail.css';

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams<{ brandId: string }>();
  const searchParams = useSearchParams();

  const [brand, setBrand] = useState<BrandListing | null>(null);
  const [holding, setHolding] = useState<ShareHolding | null>(null);
  const [transactions, setTransactions] = useState<EShareTransaction[]>([]);
  const [holders, setHolders] = useState<ShareHolding[]>([]);

  const [activeModal, setActiveModal] = useState<'buy' | 'sell' | null>(null);
  const [shareAmount, setShareAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Demo user ID
  const currentUserId = 'demo-user-main';
  const currentUserName = 'You';

  // Guard against state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /* -----------------------------------------
     LOAD DATA
  ----------------------------------------- */
  const actionParam = searchParams?.get('action');
  useEffect(() => {
    loadData();

    // Check if we should open a modal from URL params
    if (actionParam === 'buy' || actionParam === 'sell') {
      setActiveModal(actionParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.brandId, actionParam]);

  function loadData() {
    // Ensure demo data is seeded (in case user navigates directly to this page)
    seedESharesMarketIfEmpty();
    const brandData = params?.brandId ? getBrandById(params.brandId) : undefined;
    setBrand(brandData || null);

    if (brandData) {
      setHolding(getUserHoldingForBrand(currentUserId, brandData.id) || null);
      setTransactions(getTransactionsByBrand(brandData.id).slice(-10).reverse());
      setHolders(getHoldingsByBrand(brandData.id));
    }
  }

  /* -----------------------------------------
     LIVE PRICE UPDATES (stable brandId ref to avoid re-creating interval)
  ----------------------------------------- */
  const brandIdRef = useRef(params?.brandId);
  brandIdRef.current = params?.brandId;

  useEffect(() => {
    if (!brand) return;

    const id = brand.id; // capture at effect creation time
    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      setBrand((prev) => {
        if (!prev || prev.id !== id) return prev;
        const { value, direction } = applyMicroFluctuation(prev.pricePerShare ?? 0.01);
        return {
          ...prev,
          pricePerShare: value,
          marketCap: (prev.totalShares ?? 0) * value,
          _priceDirection: direction,
        } as BrandListing & { _priceDirection?: string };
      });
    }, 4000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand?.id]);

  /* -----------------------------------------
     HANDLERS
  ----------------------------------------- */
  function handleBuy() {
    if (!brand || !shareAmount) return;

    const shares = parseInt(shareAmount);
    if (isNaN(shares) || shares <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid number of shares' });
      return;
    }

    if (shares > (brand.publicSharesAvailable ?? 0)) {
      setMessage({ type: 'error', text: `Only ${(brand.publicSharesAvailable ?? 0).toLocaleString()} shares available` });
      return;
    }

    // Wallet balance check
    const totalCost = shares * (brand.pricePerShare ?? 0) + shares * E_SHARES_CONFIG.PLATFORM_FEE_PER_SHARE;
    const wallet = getWallet('demo-user-main');
    if (wallet.balance < totalCost) {
      setMessage({ type: 'error', text: `Insufficient balance. You need $${totalCost.toFixed(2)} but have $${wallet.balance.toFixed(2)}` });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const result = buyShares({
      buyerId: currentUserId,
      buyerName: currentUserName,
      brandId: brand.id,
      shares,
    });

    setIsProcessing(false);

    if (result.success) {
      // Deduct funds from wallet
      deductForPurchase(currentUserId, totalCost, `Bought ${shares} shares of ${brand.brandName}`, brand.id);
      setMessage({ type: 'success', text: `Successfully purchased ${shares.toLocaleString()} shares!` });
      setShareAmount('');
      loadData();
      setTimeout(() => {
        setActiveModal(null);
        setMessage(null);
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Purchase failed' });
    }
  }

  function handleSell() {
    if (!brand || !shareAmount || !holding) return;

    const shares = parseInt(shareAmount);
    if (isNaN(shares) || shares <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid number of shares' });
      return;
    }

    if (shares > (holding.shares ?? 0)) {
      setMessage({ type: 'error', text: `You only own ${(holding.shares ?? 0).toLocaleString()} shares` });
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const result = sellShares({
      sellerId: currentUserId,
      brandId: brand.id,
      shares,
    });

    setIsProcessing(false);

    if (result.success) {
      // Credit sale proceeds to wallet (minus platform fee)
      const saleProceeds = shares * (brand.pricePerShare ?? 0);
      const platformFee = shares * E_SHARES_CONFIG.PLATFORM_FEE_PER_SHARE;
      creditFromSale(currentUserId, saleProceeds - platformFee, `Sold ${shares} shares of ${brand.brandName}`, brand.id);
      setMessage({ type: 'success', text: `Successfully sold ${shares.toLocaleString()} shares!` });
      setShareAmount('');
      loadData();
      setTimeout(() => {
        setActiveModal(null);
        setMessage(null);
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Sale failed' });
    }
  }

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */
  if (!brand) {
    return (
      <div className="brand-detail-root">
        <div className="e-shares-empty">
          <div className="e-shares-empty-icon">🔍</div>
          <div className="e-shares-empty-title">Brand Not Found</div>
          <Link href="/cockpit/my-e-assets/my-e-shares" className="e-shares-btn secondary">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const totalCost = shareAmount ? parseInt(shareAmount) * (brand.pricePerShare ?? 0) : 0;
  const platformFee = shareAmount ? parseInt(shareAmount) * E_SHARES_CONFIG.PLATFORM_FEE_PER_SHARE : 0;
  const lockExpiry = brand.lockExpiry ? new Date(brand.lockExpiry) : null;

  return (
    <div className="brand-detail-root">
      {/* Back Button */}
      <Link href="/cockpit/my-e-assets/my-e-shares" className="back-link">
        ← Back to Marketplace
      </Link>

      {/* Brand Header */}
      <div className="brand-detail-header">
        <div className="brand-detail-identity">
          <div className="brand-detail-avatar">
            {brand.brandName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="brand-detail-name">{brand.brandName}</h1>
            <div className="brand-detail-handle">{brand.handle}</div>
            <div className="brand-detail-badges">
              <span className={`platform-badge ${brand.platform}`}>{brand.platform}</span>
              <span className={`brand-status ${brand.status.toLowerCase()}`}>{brand.status}</span>
            </div>
          </div>
        </div>

        <div className="brand-detail-price">
          <div className="price-large">
            ${(brand.pricePerShare ?? 0).toFixed(4)}
            <span className={`price-direction ${(brand as BrandListing & { _priceDirection?: string })._priceDirection || ''}`}>
              {(brand as BrandListing & { _priceDirection?: string })._priceDirection === 'up' ? '↑' :
               (brand as BrandListing & { _priceDirection?: string })._priceDirection === 'down' ? '↓' : ''}
            </span>
          </div>
          <div className="price-label">per share</div>
        </div>
      </div>

      {/* Description */}
      <div className="brand-detail-description">
        <p>{brand.description}</p>
        <p className="founder-info">
          Founded by <strong>{brand.founderName}</strong>
        </p>
      </div>

      {/* Share Price Chart */}
      <SharePriceChart
        brandId={brand.id}
        currentPrice={brand.pricePerShare ?? 0}
        basePrice={brand.pricePerShare ?? 0}
      />

      {/* Stats Grid */}
      <div className="brand-stats-grid">
        <div className="brand-stat-card">
          <div className="brand-stat-value">${(brand.marketCap ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="brand-stat-label">Market Cap</div>
        </div>
        <div className="brand-stat-card">
          <div className="brand-stat-value">{(brand.totalShares ?? 0).toLocaleString()}</div>
          <div className="brand-stat-label">Total Shares</div>
        </div>
        <div className="brand-stat-card">
          <div className="brand-stat-value">{(brand.publicSharesAvailable ?? 0).toLocaleString()}</div>
          <div className="brand-stat-label">Available</div>
        </div>
        <div className="brand-stat-card">
          <div className="brand-stat-value">{(brand.publicSharesSold ?? 0).toLocaleString()}</div>
          <div className="brand-stat-label">Sold</div>
        </div>
        <div className="brand-stat-card">
          <div className="brand-stat-value">${(brand.volume24h ?? 0).toFixed(2)}</div>
          <div className="brand-stat-label">24h Volume</div>
        </div>
        <div className="brand-stat-card">
          <div className="brand-stat-value">{(brand.followers ?? 0).toLocaleString()}</div>
          <div className="brand-stat-label">Followers</div>
        </div>
      </div>

      {/* Lock Notice */}
      {lockExpiry && (
        <div className="lock-notice">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
          </svg>
          <span>
            Founder shares locked until <strong>{lockExpiry.toLocaleDateString()}</strong>
          </span>
        </div>
      )}

      {/* Your Position */}
      {holding && (
        <div className="your-position">
          <h3>Your Position</h3>
          <div className="position-stats">
            <div className="position-stat">
              <div className="position-stat-value">{(holding.shares ?? 0).toLocaleString()}</div>
              <div className="position-stat-label">Shares Owned</div>
            </div>
            <div className="position-stat">
              <div className="position-stat-value">${(holding.averageCost ?? 0).toFixed(4)}</div>
              <div className="position-stat-label">Avg Cost</div>
            </div>
            <div className="position-stat">
              <div className="position-stat-value">${((holding.shares ?? 0) * (brand.pricePerShare ?? 0)).toFixed(2)}</div>
              <div className="position-stat-label">Current Value</div>
            </div>
            <div className="position-stat">
              <div className={`position-stat-value ${(holding.unrealizedGain ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                {(holding.unrealizedGain ?? 0) >= 0 ? '+' : ''}${(holding.unrealizedGain ?? 0).toFixed(2)}
              </div>
              <div className="position-stat-label">Unrealized P/L</div>
            </div>
          </div>
          {holding.isLocked && (
            <div className="position-locked">
              Your shares are locked until {new Date(holding.lockExpiry!).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="brand-actions">
        <button className="e-shares-btn primary" onClick={() => setActiveModal('buy')}>
          Buy Shares
        </button>
        <button
          className="e-shares-btn secondary"
          onClick={() => setActiveModal('sell')}
          disabled={!holding || holding.shares === 0 || holding.isLocked}
        >
          Sell Shares
        </button>
      </div>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="recent-transactions">
          <h3>Recent Activity</h3>
          <div className="transaction-list">
            {transactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="transaction-info">
                  <div className={`transaction-icon ${tx.type.toLowerCase()}`}>
                    {tx.type === 'BUY' ? '↓' : tx.type === 'SELL' ? '↑' : '•'}
                  </div>
                  <div className="transaction-details">
                    <h4>{tx.type}</h4>
                    <p>{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="transaction-amount">
                  <div className={`transaction-amount-value ${tx.type === 'BUY' ? 'negative' : 'positive'}`}>
                    {tx.type === 'BUY' ? '-' : '+'}${(tx.totalAmount ?? 0).toFixed(2)}
                  </div>
                  <div className="transaction-amount-shares">{(tx.shares ?? 0).toLocaleString()} shares</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shareholder List */}
      {holders.length > 0 && (
        <div className="shareholders">
          <h3>Shareholders ({holders.length})</h3>
          <div className="shareholder-list">
            {holders.map((h) => (
              <div key={h.id} className="shareholder-item">
                <div className="shareholder-info">
                  <div className="shareholder-avatar">{h.userName.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="shareholder-name">
                      {h.userName}
                      {h.holderType === 'FOUNDER' && <span className="founder-badge">Founder</span>}
                    </div>
                    <div className="shareholder-shares">{(h.shares ?? 0).toLocaleString()} shares</div>
                  </div>
                </div>
                <div className="shareholder-percent">
                  {(((h.shares ?? 0) / (brand.totalShares ?? 1)) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {activeModal === 'buy' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Buy {brand.brandName} Shares</h2>

            <div className="modal-price-info">
              <span>Current Price:</span>
              <span>${(brand.pricePerShare ?? 0).toFixed(4)} per share</span>
            </div>

            <div className="modal-available">
              <span>Available:</span>
              <span>{(brand.publicSharesAvailable ?? 0).toLocaleString()} shares</span>
            </div>

            <div className="modal-input-group">
              <label>Number of Shares</label>
              <input
                type="number"
                value={shareAmount}
                onChange={(e) => setShareAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                max={brand.publicSharesAvailable}
              />
            </div>

            {shareAmount && parseInt(shareAmount) > 0 && (
              <div className="modal-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${totalCost.toFixed(4)}</span>
                </div>
                <div className="summary-row">
                  <span>Platform Fee (0.009¢/share):</span>
                  <span>${platformFee.toFixed(6)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Cost:</span>
                  <span>${(totalCost + platformFee).toFixed(4)}</span>
                </div>
              </div>
            )}

            {message && (
              <div className={`modal-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="e-shares-btn secondary"
                onClick={() => setActiveModal(null)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="e-shares-btn primary"
                onClick={handleBuy}
                disabled={isProcessing || !shareAmount || parseInt(shareAmount) <= 0}
              >
                {isProcessing ? 'Processing...' : 'Confirm Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {activeModal === 'sell' && holding && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Sell {brand.brandName} Shares</h2>

            <div className="modal-price-info">
              <span>Current Price:</span>
              <span>${(brand.pricePerShare ?? 0).toFixed(4)} per share</span>
            </div>

            <div className="modal-available">
              <span>You Own:</span>
              <span>{(holding.shares ?? 0).toLocaleString()} shares</span>
            </div>

            <div className="modal-input-group">
              <label>Number of Shares to Sell</label>
              <input
                type="number"
                value={shareAmount}
                onChange={(e) => setShareAmount(e.target.value)}
                placeholder="Enter amount"
                min="1"
                max={holding.shares}
              />
              <button
                className="max-btn"
                onClick={() => setShareAmount((holding.shares ?? 0).toString())}
              >
                MAX
              </button>
            </div>

            {shareAmount && parseInt(shareAmount) > 0 && (
              <div className="modal-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${totalCost.toFixed(4)}</span>
                </div>
                <div className="summary-row">
                  <span>Platform Fee (0.009¢/share):</span>
                  <span>-${platformFee.toFixed(6)}</span>
                </div>
                <div className="summary-row total">
                  <span>You Receive:</span>
                  <span>${(totalCost - platformFee).toFixed(4)}</span>
                </div>
              </div>
            )}

            {message && (
              <div className={`modal-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="e-shares-btn secondary"
                onClick={() => setActiveModal(null)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="e-shares-btn primary"
                onClick={handleSell}
                disabled={isProcessing || !shareAmount || parseInt(shareAmount) <= 0}
                style={{ background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)' }}
              >
                {isProcessing ? 'Processing...' : 'Confirm Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
