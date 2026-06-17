'use client';

/**
 * SOCIAL EXCHANGE - DIGITAL ASSET MARKET
 * Fully wired to real Neon DB via API routes.
 * Tabs: Browse | My Listings | My Purchases | Wallet
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Search, Upload, Download, Lock, Eye,
  MessageSquare, Shield, DollarSign, Camera, Music, Play,
  BookOpen, X, CheckCircle, AlertCircle, Wallet, Plus,
  RefreshCw, Filter, ExternalLink,
} from 'lucide-react';
import {
  fetchListings,
  fetchMyListings,
  fetchMyEscrows,
  fetchWallet,
  createListing,
  purchaseListing,
  createDepositSession,
  ApiListing,
  ApiEscrow,
  ApiWallet,
  ApiWalletTransaction,
  ListingFilters,
  CreateListingInput,
} from './lib/api-client';
import './market.css';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function fmtFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function platformIcon(p: string) {
  const map: Record<string, any> = {
    instagram: <Camera size={14} />,
    tiktok: <Music size={14} />,
    youtube: <Play size={14} />,
    twitter: <span style={{ fontWeight: 700, fontSize: 13 }}>𝕏</span>,
    facebook: <BookOpen size={14} />,
  };
  return map[p?.toLowerCase()] ?? <Camera size={14} />;
}

function platformColor(p: string): string {
  const map: Record<string, string> = {
    instagram: '#E1306C',
    tiktok: '#00F2EA',
    youtube: '#FF0000',
    twitter: '#1DA1F2',
    facebook: '#1877F2',
  };
  return map[p?.toLowerCase()] ?? '#8B5CF6';
}

type Tab = 'browse' | 'selling' | 'buying' | 'wallet';
type ViewMode = 'grid' | 'list';

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function MarketplacePage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id ?? '';

  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Browse state
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingListings, setLoadingListings] = useState(true);
  const [filters, setFilters] = useState<ListingFilters>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  // My listings
  const [myListings, setMyListings] = useState<ApiListing[]>([]);
  const [loadingMyListings, setLoadingMyListings] = useState(false);

  // My purchases (escrow)
  const [myEscrows, setMyEscrows] = useState<ApiEscrow[]>([]);
  const [loadingEscrows, setLoadingEscrows] = useState(false);

  // Wallet
  const [wallet, setWallet] = useState<ApiWallet | null>(null);
  const [transactions, setTransactions] = useState<ApiWalletTransaction[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState<ApiListing | null>(null);

  // ── Browse ──
  const loadListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const res = await fetchListings(filters);
      setListings(res.listings ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, [filters]);

  useEffect(() => { loadListings(); }, [loadListings]);

  // Also load wallet balance for the stats bar
  useEffect(() => {
    fetchWallet().then(res => setWallet(res.wallet)).catch(() => {});
  }, []);

  // ── My listings ──
  const loadMyListings = useCallback(async () => {
    setLoadingMyListings(true);
    try { setMyListings(await fetchMyListings()); }
    catch { setMyListings([]); }
    finally { setLoadingMyListings(false); }
  }, []);

  // ── My purchases ──
  const loadEscrows = useCallback(async () => {
    setLoadingEscrows(true);
    try { setMyEscrows(await fetchMyEscrows()); }
    catch { setMyEscrows([]); }
    finally { setLoadingEscrows(false); }
  }, []);

  // ── Wallet ──
  const loadWallet = useCallback(async () => {
    setLoadingWallet(true);
    try {
      const res = await fetchWallet();
      setWallet(res.wallet);
      setTransactions(res.recentTransactions);
    } catch { /* not authenticated */ }
    finally { setLoadingWallet(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'selling') loadMyListings();
    if (activeTab === 'buying') loadEscrows();
    if (activeTab === 'wallet') loadWallet();
  }, [activeTab, loadMyListings, loadEscrows, loadWallet]);

  const setFilter = (key: keyof ListingFilters, value: any) =>
    setFilters(prev => ({ ...prev, [key]: value || undefined }));

  const clearFilters = () => setFilters({ sortBy: 'createdAt', sortOrder: 'desc' });

  return (
    <div className="market-root">
      {/* Header */}
      <header className="market-header">
        <div className="market-header-left">
          <h1 className="market-title">Digital Asset Market</h1>
          <p className="market-subtitle">Buy and sell established social media accounts securely</p>
        </div>
        <div className="market-header-right">
          <button className="market-sell-btn" onClick={() => setShowCreateModal(true)}>
            + List Your Account
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="market-stats-bar">
        <div className="market-stat">
          <span className="market-stat-value">{total.toLocaleString()}</span>
          <span className="market-stat-label">Active Listings</span>
        </div>
        <div className="market-stat-divider" />
        <div className="market-stat">
          <span className="market-stat-value">
            ${listings.reduce((s, l) => s + l.price, 0).toLocaleString()}
          </span>
          <span className="market-stat-label">Market Value</span>
        </div>
        <div className="market-stat-divider" />
        <div className="market-stat">
          <span className="market-stat-value">
            {listings.length > 0
              ? '$' + Math.round(listings.reduce((s, l) => s + l.price, 0) / listings.length).toLocaleString()
              : '—'}
          </span>
          <span className="market-stat-label">Avg. Price</span>
        </div>
        <div className="market-stat-divider" />
        <div className="market-stat">
          <span className="market-stat-value" style={{ color: '#3fffdc', cursor: 'pointer' }} onClick={() => setActiveTab('wallet')}>
            {wallet ? '$' + wallet.balance.toFixed(2) : '—'}
          </span>
          <span className="market-stat-label">Your Balance</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="market-tabs">
        <button className={`market-tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
          <Search size={14} /> Browse
        </button>
        <button className={`market-tab ${activeTab === 'selling' ? 'active' : ''}`} onClick={() => setActiveTab('selling')}>
          <Upload size={14} /> My Listings
        </button>
        <button className={`market-tab ${activeTab === 'buying' ? 'active' : ''}`} onClick={() => setActiveTab('buying')}>
          <Download size={14} /> My Purchases
        </button>
        <button className={`market-tab ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>
          <Wallet size={14} /> Wallet
        </button>
      </div>

      {/* ── BROWSE TAB ── */}
      {activeTab === 'browse' && (
        <>
          <div className="market-filters-bar">
            <div className="market-filters-left">
              <select className="market-filter-select" value={filters.platform ?? ''} onChange={e => setFilter('platform', e.target.value)}>
                <option value="">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
                <option value="TWITTER">Twitter / X</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="FACEBOOK">Facebook</option>
              </select>
              <select className="market-filter-select" value={filters.niche ?? ''} onChange={e => setFilter('niche', e.target.value)}>
                <option value="">All Niches</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="fashion">Fashion</option>
                <option value="fitness">Fitness</option>
                <option value="tech">Technology</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="entertainment">Entertainment</option>
                <option value="business">Business</option>
                <option value="beauty">Beauty</option>
                <option value="gaming">Gaming</option>
              </select>
              <select className="market-filter-select"
                value={`${filters.sortBy ?? 'createdAt'}_${filters.sortOrder ?? 'desc'}`}
                onChange={e => {
                  const [by, order] = e.target.value.split('_');
                  setFilters(prev => ({ ...prev, sortBy: by, sortOrder: order as 'asc' | 'desc' }));
                }}>
                <option value="createdAt_desc">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="followers_desc">Most Followers</option>
              </select>
              <button className="market-filter-toggle" onClick={() => setShowFilters(s => !s)}>
                <Filter size={14} /> More Filters
              </button>
              {(filters.platform || filters.niche || filters.minPrice || filters.maxPrice) && (
                <button className="market-clear-filters" onClick={clearFilters}>✕ Clear</button>
              )}
            </div>
            <div className="market-filters-right">
              <div className="market-view-toggle">
                <button className={`market-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>▦</button>
                <button className={`market-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="market-filters-extended">
              <div className="market-filter-group">
                <label className="market-filter-label">Price Range ($)</label>
                <div className="market-filter-range">
                  <input type="number" placeholder="Min" className="market-filter-input" value={filters.minPrice ?? ''} onChange={e => setFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)} />
                  <span className="market-filter-range-sep">to</span>
                  <input type="number" placeholder="Max" className="market-filter-input" value={filters.maxPrice ?? ''} onChange={e => setFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>
              <div className="market-filter-group">
                <label className="market-filter-label">Followers</label>
                <div className="market-filter-range">
                  <input type="number" placeholder="Min" className="market-filter-input" value={filters.minFollowers ?? ''} onChange={e => setFilter('minFollowers', e.target.value ? Number(e.target.value) : undefined)} />
                  <span className="market-filter-range-sep">to</span>
                  <input type="number" placeholder="Max" className="market-filter-input" value={filters.maxFollowers ?? ''} onChange={e => setFilter('maxFollowers', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
              </div>
            </div>
          )}

          {loadingListings ? (
            <div className="market-loading"><div className="market-loading-spinner" /><span>Loading listings...</span></div>
          ) : listings.length === 0 ? (
            <div className="market-empty">
              <div className="market-empty-icon"><Search size={24} /></div>
              <h3>No listings found</h3>
              <p>Try adjusting your filters, or be the first to list an account!</p>
              <button className="market-cta-btn" onClick={() => setShowCreateModal(true)}>+ List Your Account</button>
            </div>
          ) : (
            <div className={`market-listings ${viewMode}`}>
              {listings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onBuy={() => setShowBuyModal(listing)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MY LISTINGS TAB ── */}
      {activeTab === 'selling' && (
        <div className="market-my-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#fff', margin: 0 }}>My Listings</h2>
            <button className="market-sell-btn" onClick={() => setShowCreateModal(true)}>+ New Listing</button>
          </div>
          {loadingMyListings ? (
            <div className="market-loading"><div className="market-loading-spinner" /><span>Loading...</span></div>
          ) : myListings.length === 0 ? (
            <div className="market-empty">
              <div className="market-empty-icon"><Upload size={24} /></div>
              <h3>No active listings</h3>
              <p>List your first social media account to start selling</p>
              <button className="market-cta-btn" onClick={() => setShowCreateModal(true)}>+ List Your Account</button>
            </div>
          ) : (
            <div className={`market-listings ${viewMode}`}>
              {myListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} viewMode={viewMode} isOwner />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MY PURCHASES TAB ── */}
      {activeTab === 'buying' && (
        <div className="market-my-section">
          <h2 style={{ color: '#fff', marginBottom: '1.5rem' }}>My Purchases</h2>
          {loadingEscrows ? (
            <div className="market-loading"><div className="market-loading-spinner" /><span>Loading purchases...</span></div>
          ) : myEscrows.length === 0 ? (
            <div className="market-empty">
              <div className="market-empty-icon"><Download size={24} /></div>
              <h3>No purchases yet</h3>
              <p>Browse listings and buy an account to see your purchases here</p>
              <button className="market-cta-btn" onClick={() => setActiveTab('browse')}>Browse Marketplace</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myEscrows.map(escrow => (
                <EscrowCard key={escrow.id} escrow={escrow} userId={userId} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WALLET TAB ── */}
      {activeTab === 'wallet' && (
        <WalletTab
          wallet={wallet}
          transactions={transactions}
          loading={loadingWallet}
          userId={userId}
          onDeposit={() => setShowDepositModal(true)}
          onRefresh={loadWallet}
        />
      )}

      {/* Trust Banner */}
      <div className="market-trust-banner">
        <div className="market-trust-item">
          <span className="market-trust-icon"><Lock size={18} /></span>
          <div className="market-trust-text"><strong>Secure Escrow</strong><span>Funds held until transfer verified</span></div>
        </div>
        <div className="market-trust-item">
          <span className="market-trust-icon">✓</span>
          <div className="market-trust-text"><strong>Verified Metrics</strong><span>Stats independently confirmed</span></div>
        </div>
        <div className="market-trust-item">
          <span className="market-trust-icon"><Shield size={18} /></span>
          <div className="market-trust-text"><strong>Buyer Protection</strong><span>7-day verification period</span></div>
        </div>
        <div className="market-trust-item">
          <span className="market-trust-icon"><MessageSquare size={18} /></span>
          <div className="market-trust-text"><strong>24/7 Support</strong><span>Help when you need it</span></div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateListingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadListings();
            if (activeTab === 'selling') loadMyListings();
          }}
        />
      )}
      {showBuyModal && (
        <BuyModal
          listing={showBuyModal}
          onClose={() => setShowBuyModal(null)}
          onSuccess={() => { setShowBuyModal(null); loadListings(); }}
        />
      )}
      {showDepositModal && (
        <DepositModal userId={userId} onClose={() => setShowDepositModal(false)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// LISTING CARD
// ─────────────────────────────────────────────

function ListingCard({ listing, onBuy, viewMode, isOwner }: {
  listing: ApiListing;
  onBuy?: () => void;
  viewMode: ViewMode;
  isOwner?: boolean;
}) {
  const color = platformColor(listing.platform);
  return (
    <div className={`market-card ${viewMode}`}>
      <div className="market-card-header">
        <div className="market-card-platform" style={{ color }}>
          <span className="market-platform-icon">{platformIcon(listing.platform)}</span>
          <span className="market-platform-name" style={{ textTransform: 'capitalize' }}>
            {listing.platform.toLowerCase()}
          </span>
        </div>
        {isOwner && (
          <span style={{ fontSize: '0.7rem', background: 'rgba(63,255,220,0.15)', color: '#3fffdc', padding: '2px 8px', borderRadius: 4 }}>
            YOUR LISTING
          </span>
        )}
      </div>

      <div className="market-card-profile">
        <div className="market-card-avatar" style={{ background: `${color}22`, color, fontSize: 18, fontWeight: 700 }}>
          {listing.handle?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="market-card-info">
          <h3 className="market-card-handle">@{listing.handle}</h3>
          <p className="market-card-name">{listing.title}</p>
        </div>
      </div>

      <div className="market-card-metrics">
        <div className="market-metric">
          <span className="market-metric-value">{fmtFollowers(listing.followers)}</span>
          <span className="market-metric-label">Followers</span>
        </div>
        {listing.engagementRate != null && (
          <div className="market-metric">
            <span className="market-metric-value">{listing.engagementRate.toFixed(1)}%</span>
            <span className="market-metric-label">Engagement</span>
          </div>
        )}
        {listing.postsCount != null && (
          <div className="market-metric">
            <span className="market-metric-value">{listing.postsCount.toLocaleString()}</span>
            <span className="market-metric-label">Posts</span>
          </div>
        )}
      </div>

      {listing.niche && (
        <div className="market-card-niches">
          <span className="market-niche-tag">{listing.niche}</span>
          {listing.contentCategory && listing.contentCategory !== listing.niche && (
            <span className="market-niche-tag">{listing.contentCategory}</span>
          )}
        </div>
      )}

      {listing.description && (
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginTop: '0.5rem', lineHeight: 1.4 }}>
          {listing.description.slice(0, 100)}{listing.description.length > 100 ? '…' : ''}
        </p>
      )}

      <div className="market-card-footer">
        <div className="market-card-price">
          <span className="market-price-value">${listing.price.toLocaleString()}</span>
          {listing.followers > 0 && (
            <span className="market-price-per">
              ${(listing.price / listing.followers * 1000).toFixed(2)}/K followers
            </span>
          )}
        </div>
        <span className="market-card-stat"><Eye size={14} /> {listing.views ?? 0}</span>
      </div>

      {!isOwner && onBuy && (
        <button
          className="market-sell-btn"
          style={{ width: '100%', marginTop: '0.75rem', padding: '0.6rem', fontSize: '0.85rem' }}
          onClick={onBuy}
        >
          Buy Now — ${listing.price.toLocaleString()}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ESCROW CARD
// ─────────────────────────────────────────────

function EscrowCard({ escrow, userId }: { escrow: ApiEscrow; userId: string }) {
  const role = escrow.buyerId === userId ? 'buyer' : 'seller';
  const statusColor: Record<string, string> = {
    PENDING: '#ffd700',
    PAYMENT_HELD: '#3fffdc',
    CREDENTIALS_SENT: '#00d4ff',
    COMPLETED: '#10B981',
    DISPUTED: '#EF4444',
    CANCELLED: '#6B7280',
    REFUNDED: '#8B5CF6',
  };
  const color = statusColor[escrow.status] ?? '#6B7280';
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
            {role === 'buyer' ? 'Purchase' : 'Sale'} · Escrow
          </span>
          <p style={{ color: '#fff', fontWeight: 600, margin: '0.25rem 0 0' }}>
            {escrow.listing?.title ?? `Listing #${escrow.listingId.slice(0, 8)}`}
          </p>
          {escrow.listing && (
            <span style={{ fontSize: '0.75rem', color: '#888' }}>
              @{escrow.listing.handle} · {escrow.listing.platform.toLowerCase()}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20, background: `${color}22`, color, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {escrow.status.replace(/_/g, ' ')}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>Amount</span><br />
          <strong style={{ color: '#fff' }}>${escrow.amount.toLocaleString()}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>Platform Fee</span><br />
          <strong style={{ color: '#fff' }}>${escrow.platformFee.toLocaleString()}</strong>
        </div>
        {role === 'seller' && (
          <div>
            <span style={{ fontSize: '0.7rem', color: '#888' }}>Your Payout</span><br />
            <strong style={{ color: '#3fffdc' }}>${escrow.sellerPayout.toLocaleString()}</strong>
          </div>
        )}
        <div>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>Date</span><br />
          <strong style={{ color: '#fff' }}>{new Date(escrow.createdAt).toLocaleDateString()}</strong>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// WALLET TAB
// ─────────────────────────────────────────────

function WalletTab({ wallet, transactions, loading, userId, onDeposit, onRefresh }: {
  wallet: ApiWallet | null;
  transactions: ApiWalletTransaction[];
  loading: boolean;
  userId: string;
  onDeposit: () => void;
  onRefresh: () => void;
}) {
  if (loading) return <div className="market-loading"><div className="market-loading-spinner" /><span>Loading wallet...</span></div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(63,255,220,0.1) 0%, rgba(0,212,255,0.1) 100%)', border: '1px solid rgba(63,255,220,0.2)', borderRadius: 16, padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>Available Balance</p>
            <p style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>
              ${wallet ? wallet.balance.toFixed(2) : '0.00'}
            </p>
            {wallet && wallet.lockedBalance > 0 && (
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                + ${wallet.lockedBalance.toFixed(2)} locked in escrow
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={onRefresh} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#888', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={16} />
            </button>
            <button className="market-sell-btn" onClick={onDeposit}>
              <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Add Funds
            </button>
          </div>
        </div>
        {wallet && (
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: '0.7rem', color: '#888', display: 'block' }}>Total Deposited</span><strong style={{ color: '#fff' }}>${wallet.totalDeposited.toFixed(2)}</strong></div>
            <div><span style={{ fontSize: '0.7rem', color: '#888', display: 'block' }}>Total Withdrawn</span><strong style={{ color: '#fff' }}>${wallet.totalWithdrawn.toFixed(2)}</strong></div>
            <div><span style={{ fontSize: '0.7rem', color: '#888', display: 'block' }}>Trading Volume</span><strong style={{ color: '#fff' }}>${wallet.totalTradingVolume.toFixed(2)}</strong></div>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className="market-empty" style={{ padding: '2rem' }}>
            <p>No transactions yet. Add funds to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {transactions.map(tx => {
              const isCredit = ['DEPOSIT', 'SALE_PAYOUT', 'REFUND', 'BONUS', 'WALLET_DEPOSIT'].includes(tx.type);
              return (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.875rem 1rem' }}>
                  <div>
                    <p style={{ color: '#fff', margin: 0, fontWeight: 500, fontSize: '0.9rem' }}>
                      {tx.description ?? tx.type.replace(/_/g, ' ')}
                    </p>
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: isCredit ? '#3fffdc' : '#EF4444' }}>
                    {isCredit ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CREATE LISTING MODAL
// ─────────────────────────────────────────────

const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TWITTER', 'FACEBOOK'];
const NICHES = ['lifestyle', 'fashion', 'fitness', 'tech', 'food', 'travel', 'entertainment', 'business', 'beauty', 'gaming', 'music', 'art', 'other'];

function CreateListingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<Partial<CreateListingInput>>({ platform: 'INSTAGRAM' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key: keyof CreateListingInput, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.platform || !form.handle || !form.followers || !form.price) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createListing(form as CreateListingInput);
      setSuccess(true);
      setTimeout(onSuccess, 1500);
    } catch (err: any) {
      setError(err.message ?? 'Failed to create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="market-modal-overlay" onClick={onClose}>
      <div className="market-modal" onClick={e => e.stopPropagation()}>
        <div className="market-modal-header">
          <h2>List Your Account</h2>
          <button className="market-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="market-modal-body">
          {success ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <CheckCircle size={48} color="#3fffdc" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: '#fff' }}>Listing Published!</h3>
              <p style={{ color: '#888' }}>Your account is now live on the marketplace.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="market-form-row">
                <label>Listing Title *</label>
                <input className="market-form-input" placeholder="e.g. Fashion Instagram – 50K engaged followers" value={form.title ?? ''} onChange={e => set('title', e.target.value)} required />
              </div>
              <div className="market-form-row">
                <label>Platform *</label>
                <select className="market-form-input" value={form.platform ?? 'INSTAGRAM'} onChange={e => set('platform', e.target.value)}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div className="market-form-row">
                <label>Handle / Username *</label>
                <input className="market-form-input" placeholder="yourusername (no @)" value={form.handle ?? ''} onChange={e => set('handle', e.target.value.replace('@', ''))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="market-form-row">
                  <label>Followers *</label>
                  <input type="number" className="market-form-input" placeholder="50000" value={form.followers ?? ''} onChange={e => set('followers', Number(e.target.value))} required min={1} />
                </div>
                <div className="market-form-row">
                  <label>Following</label>
                  <input type="number" className="market-form-input" placeholder="1000" value={form.following ?? ''} onChange={e => set('following', Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="market-form-row">
                  <label>Posts</label>
                  <input type="number" className="market-form-input" placeholder="342" value={form.postsCount ?? ''} onChange={e => set('postsCount', Number(e.target.value))} />
                </div>
                <div className="market-form-row">
                  <label>Engagement (%)</label>
                  <input type="number" step="0.1" className="market-form-input" placeholder="3.5" value={form.engagementRate ?? ''} onChange={e => set('engagementRate', Number(e.target.value))} />
                </div>
                <div className="market-form-row">
                  <label>Avg Likes</label>
                  <input type="number" className="market-form-input" placeholder="1200" value={form.avgLikesPerPost ?? ''} onChange={e => set('avgLikesPerPost', Number(e.target.value))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="market-form-row">
                  <label>Niche</label>
                  <select className="market-form-input" value={form.niche ?? ''} onChange={e => set('niche', e.target.value)}>
                    <option value="">Select a niche</option>
                    {NICHES.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                  </select>
                </div>
                <div className="market-form-row">
                  <label>Content Category</label>
                  <input className="market-form-input" placeholder="e.g. Reels, Shorts" value={form.contentCategory ?? ''} onChange={e => set('contentCategory', e.target.value)} />
                </div>
              </div>
              <div className="market-form-row">
                <label>Profile URL</label>
                <input className="market-form-input" placeholder="https://instagram.com/yourusername" value={form.profileUrl ?? ''} onChange={e => set('profileUrl', e.target.value)} />
              </div>
              <div className="market-form-row">
                <label>Description</label>
                <textarea className="market-form-input" rows={3} placeholder="Describe the account, audience, and why it's valuable..." value={form.description ?? ''} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div className="market-form-row">
                <label>Asking Price (USD) *</label>
                <input type="number" step="0.01" className="market-form-input" placeholder="2500" value={form.price ?? ''} onChange={e => set('price', Number(e.target.value))} required min={1} />
              </div>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EF4444', fontSize: '0.85rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: '0.5rem' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <button type="submit" className="market-sell-btn" style={{ width: '100%', padding: '0.875rem', marginTop: '0.25rem' }} disabled={submitting}>
                {submitting ? 'Publishing...' : 'Publish Listing'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BUY MODAL
// ─────────────────────────────────────────────

function BuyModal({ listing, onClose, onSuccess }: { listing: ApiListing; onClose: () => void; onSuccess: () => void }) {
  const [buying, setBuying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleBuy = async () => {
    setBuying(true);
    setError('');
    try {
      await purchaseListing(listing.id);
      setDone(true);
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      setError(err.message ?? 'Purchase failed.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="market-modal-overlay" onClick={onClose}>
      <div className="market-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="market-modal-header">
          <h2>Confirm Purchase</h2>
          <button className="market-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="market-modal-body">
          {done ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <CheckCircle size={48} color="#3fffdc" style={{ marginBottom: '1rem' }} />
              <h3 style={{ color: '#fff' }}>Purchase Initiated!</h3>
              <p style={{ color: '#888' }}>Escrow created. The seller will be notified to send credentials.</p>
            </div>
          ) : (
            <>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: `${platformColor(listing.platform)}22`, color: platformColor(listing.platform), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                    {listing.handle?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color: '#fff', margin: 0, fontWeight: 600 }}>@{listing.handle}</p>
                    <p style={{ color: '#888', margin: 0, fontSize: '0.8rem' }}>
                      {listing.platform.toLowerCase()} · {fmtFollowers(listing.followers)} followers
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Listing Price</span>
                  <strong style={{ color: '#fff' }}>${listing.price.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Platform Fee (5%)</span>
                  <strong style={{ color: '#fff' }}>${(listing.price * 0.05).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>Total</span>
                  <strong style={{ color: '#3fffdc', fontSize: '1.1rem' }}>${(listing.price * 1.05).toFixed(2)}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: 'rgba(63,255,220,0.08)', border: '1px solid rgba(63,255,220,0.15)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
                <Lock size={16} color="#3fffdc" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ color: '#3fffdc', margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
                  Funds will be held in escrow until you verify the account credentials. You have 7 days to confirm the transfer.
                </p>
              </div>
              {error && (
                <div style={{ color: '#EF4444', fontSize: '0.85rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={onClose} style={{ flex: 1, padding: '0.875rem', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Cancel
                </button>
                <button onClick={handleBuy} disabled={buying} className="market-sell-btn" style={{ flex: 2, padding: '0.875rem' }}>
                  {buying ? 'Processing…' : 'Confirm Purchase'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEPOSIT MODAL
// ─────────────────────────────────────────────

const QUICK_AMOUNTS = [25, 50, 100, 250, 500, 1000];

function DepositModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeposit = async () => {
    const usd = Number(amount);
    if (!usd || usd < 5) { setError('Minimum deposit is $5.'); return; }
    if (usd > 10000) { setError('Maximum deposit is $10,000.'); return; }
    if (!userId) { setError('You must be signed in to deposit.'); return; }
    setLoading(true);
    setError('');
    try {
      const { url } = await createDepositSession(usd, userId);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message ?? 'Failed to start deposit.');
      setLoading(false);
    }
  };

  return (
    <div className="market-modal-overlay" onClick={onClose}>
      <div className="market-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="market-modal-header">
          <h2>Add Funds</h2>
          <button className="market-modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="market-modal-body">
          <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Funds are added to your wallet and can be used to purchase accounts on the marketplace.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {QUICK_AMOUNTS.map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                style={{ padding: '0.65rem', background: amount === String(a) ? 'rgba(63,255,220,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${amount === String(a) ? 'rgba(63,255,220,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, color: amount === String(a) ? '#3fffdc' : '#fff', cursor: 'pointer', fontWeight: 600 }}>
                ${a}
              </button>
            ))}
          </div>
          <div className="market-form-row">
            <label>Custom Amount (USD)</label>
            <input type="number" className="market-form-input" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} min={5} max={10000} />
          </div>
          {amount && Number(amount) >= 5 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.875rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888' }}>
                <span>Deposit Amount</span><span style={{ color: '#fff' }}>${Number(amount).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ color: '#fff' }}>Added to Wallet</span><span style={{ color: '#3fffdc' }}>${Number(amount).toFixed(2)}</span>
              </div>
            </div>
          )}
          {error && (
            <div style={{ color: '#EF4444', fontSize: '0.85rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <button onClick={handleDeposit} disabled={loading || !amount || Number(amount) < 5} className="market-sell-btn" style={{ width: '100%', padding: '0.875rem' }}>
            {loading ? 'Redirecting to Stripe…' : 'Pay with Card →'}
          </button>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
            <Lock size={12} color="#666" />
            <span style={{ color: '#666', fontSize: '0.75rem' }}>Secured by Stripe · No fees</span>
            <ExternalLink size={12} color="#666" />
          </div>
        </div>
      </div>
    </div>
  );
}
