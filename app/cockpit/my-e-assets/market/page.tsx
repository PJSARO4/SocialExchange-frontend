'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MarketListing,
  MarketFilters,
  Platform,
  AccountNiche,
  formatFollowers,
  getPlatformIcon,
  getNicheLabel,
  MARKET_CONFIG,
} from './types/market';
import {
  getActiveListings,
  seedMarketplaceIfEmpty,
  toggleSaveListing,
  getSavedListings,
} from './lib/market-store';
import { getCurrentUser } from '@/app/lib/auth/auth-store';
import { EscrowListingModal } from './components/escrow/EscrowListingModal';
import { EscrowPurchaseModal } from './components/escrow/EscrowPurchaseModal';
import { EscrowVerificationModal } from './components/escrow/EscrowVerificationModal';
import { EscrowStatusCard } from './components/escrow/EscrowStatusCard';
import { EscrowListing, EscrowTransaction } from './types/escrow';
import {
  seedEscrowDataIfEmpty,
  getActiveEscrowListings,
  getTransactionsByBuyer,
  getTransactionsBySeller,
} from './lib/escrow-store';
import './components/escrow/escrow.css';
import './market.css';

type ViewMode = 'grid' | 'list';
type ActiveTab = 'browse' | 'selling' | 'buying' | 'saved';

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<MarketFilters>({
    sortBy: 'popular',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showListingModal, setShowListingModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedEscrowListing, setSelectedEscrowListing] = useState<EscrowListing | null>(null);
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);

  const currentUser = getCurrentUser();

  useEffect(() => {
    seedMarketplaceIfEmpty();
    seedEscrowDataIfEmpty();
    loadListings();
    loadEscrowTransactions();
    if (currentUser) {
      setSavedIds(getSavedListings(currentUser.id));
    }
  }, [filters]);

  const loadListings = () => {
    setIsLoading(true);
    // Simulate loading delay
    setTimeout(() => {
      const data = getActiveListings(filters);
      setListings(data);
      setIsLoading(false);
    }, 300);
  };

  const loadEscrowTransactions = () => {
    const userId = currentUser?.id || 'demo-user';
    const buyerTxns = getTransactionsByBuyer(userId);
    const sellerTxns = getTransactionsBySeller(userId);
    const allTxns = [...buyerTxns, ...sellerTxns].filter(
      (txn, i, arr) => arr.findIndex(t => t.id === txn.id) === i
    );
    setEscrowTransactions(allTxns);
  };

  const handleSave = (listingId: string) => {
    if (!currentUser) {
      alert('Please sign in to save listings');
      return;
    }
    const isSaved = toggleSaveListing(currentUser.id, listingId);
    if (isSaved) {
      setSavedIds([...savedIds, listingId]);
    } else {
      setSavedIds(savedIds.filter(id => id !== listingId));
    }
  };

  const handleFilterChange = (key: keyof MarketFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenEscrowPurchase = (listing: EscrowListing) => {
    setSelectedEscrowListing(listing);
    setShowPurchaseModal(true);
  };

  const clearFilters = () => {
    setFilters({ sortBy: 'popular' });
  };

  const marketStats = {
    totalListings: listings.length,
    totalValue: listings.reduce((sum, l) => sum + l.askingPrice, 0),
    avgPrice: listings.length > 0 ? Math.round(listings.reduce((sum, l) => sum + l.askingPrice, 0) / listings.length) : 0,
    avgEngagement: listings.length > 0 ? (listings.reduce((sum, l) => sum + l.metrics.engagementRate, 0) / listings.length).toFixed(2) : '0',
  };

  return (
    <div className="market-root">
      {/* Header */}
      <header className="market-header">
        <div className="market-header-left">
          <h1 className="market-title">Digital Asset Market</h1>
          <p className="market-subtitle">Buy and sell established social media accounts securely</p>
        </div>
        <div className="market-header-right">
          <Link href="/cockpit/my-e-assets/market/sell" className="market-sell-btn">
            + List Your Account
          </Link>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="market-stats-bar">
        <div className="market-stat">
          <span className="market-stat-value">{marketStats.totalListings}</span>
          <span className="market-stat-label">Active Listings</span>
        </div>
        <div className="market-stat-divider" />
        <div className="market-stat">
          <span className="market-stat-value">${marketStats.totalValue.toLocaleString()}</span>
          <span className="market-stat-label">Total Market Value</span>
        </div>
        <div className="market-stat-divider" />
        <div className="market-stat">
          <span className="market-stat-value">${marketStats.avgPrice.toLocaleString()}</span>
          <span className="market-stat-label">Avg. Listing Price</span>
        </div>
        <div className="market-stat-divider" />
        <div className="market-stat">
          <span className="market-stat-value">{marketStats.avgEngagement}%</span>
          <span className="market-stat-label">Avg. Engagement</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="market-tabs">
        <button
          className={`market-tab ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          🔍 Browse
        </button>
        <button
          className={`market-tab ${activeTab === 'selling' ? 'active' : ''}`}
          onClick={() => setActiveTab('selling')}
        >
          📤 My Listings
        </button>
        <button
          className={`market-tab ${activeTab === 'buying' ? 'active' : ''}`}
          onClick={() => setActiveTab('buying')}
        >
          📥 My Offers
        </button>
        <button
          className={`market-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          ❤️ Saved ({savedIds.length})
        </button>
      </div>

      {activeTab === 'browse' && (
        <>
          {/* Filters Bar */}
          <div className="market-filters-bar">
            <div className="market-filters-left">
              {/* Platform Filter */}
              <select
                className="market-filter-select"
                value={filters.platform?.[0] || ''}
                onChange={(e) => handleFilterChange('platform', e.target.value ? [e.target.value as Platform] : undefined)}
              >
                <option value="">All Platforms</option>
                <option value="instagram">📸 Instagram</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="twitter">𝕏 Twitter</option>
                <option value="youtube">▶️ YouTube</option>
              </select>

              {/* Niche Filter */}
              <select
                className="market-filter-select"
                value={filters.niche?.[0] || ''}
                onChange={(e) => handleFilterChange('niche', e.target.value ? [e.target.value as AccountNiche] : undefined)}
              >
                <option value="">All Niches</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="fashion">Fashion</option>
                <option value="fitness">Fitness</option>
                <option value="tech">Technology</option>
                <option value="food">Food</option>
                <option value="travel">Travel</option>
                <option value="entertainment">Entertainment</option>
                <option value="business">Business</option>
              </select>

              {/* Sort */}
              <select
                className="market-filter-select"
                value={filters.sortBy || 'popular'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="followers">Most Followers</option>
                <option value="engagement">Best Engagement</option>
              </select>

              <button
                className="market-filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                ⚙️ More Filters
              </button>

              {(filters.platform || filters.niche || filters.priceMin || filters.priceMax) && (
                <button className="market-clear-filters" onClick={clearFilters}>
                  ✕ Clear
                </button>
              )}
            </div>

            <div className="market-filters-right">
              <div className="market-view-toggle">
                <button
                  className={`market-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  ▦
                </button>
                <button
                  className={`market-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="market-filters-extended">
              <div className="market-filter-group">
                <label className="market-filter-label">Price Range</label>
                <div className="market-filter-range">
                  <input
                    type="number"
                    placeholder="Min"
                    className="market-filter-input"
                    value={filters.priceMin || ''}
                    onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <span className="market-filter-range-sep">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="market-filter-input"
                    value={filters.priceMax || ''}
                    onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="market-filter-group">
                <label className="market-filter-label">Followers</label>
                <div className="market-filter-range">
                  <input
                    type="number"
                    placeholder="Min"
                    className="market-filter-input"
                    value={filters.followersMin || ''}
                    onChange={(e) => handleFilterChange('followersMin', e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <span className="market-filter-range-sep">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="market-filter-input"
                    value={filters.followersMax || ''}
                    onChange={(e) => handleFilterChange('followersMax', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="market-filter-group">
                <label className="market-filter-label">Min Engagement</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.0"
                  className="market-filter-input"
                  value={filters.engagementMin || ''}
                  onChange={(e) => handleFilterChange('engagementMin', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div className="market-filter-group">
                <label className="market-filter-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly || false}
                    onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                  />
                  <span>Verified Only</span>
                </label>
              </div>
            </div>
          )}

          {/* Listings Grid */}
          {isLoading ? (
            <div className="market-loading">
              <div className="market-loading-spinner" />
              <span>Loading listings...</span>
            </div>
          ) : listings.length === 0 ? (
            <div className="market-empty">
              <div className="market-empty-icon">🔍</div>
              <h3>No listings found</h3>
              <p>Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className={`market-listings ${viewMode}`}>
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={savedIds.includes(listing.id)}
                  onSave={() => handleSave(listing.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}

          {/* Escrow-Protected Listings */}
          {(() => {
            const escrowListings = getActiveEscrowListings();
            if (escrowListings.length === 0) return null;
            return (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ color: '#fff', fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#3fffdc' }}>🔒</span> Escrow-Protected Listings
                </h3>
                <div className={`market-listings ${viewMode}`}>
                  {escrowListings.map((el) => (
                    <div
                      key={el.id}
                      className={`market-card ${viewMode}`}
                      onClick={() => handleOpenEscrowPurchase(el)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="market-card-header">
                        <div className="market-card-platform">
                          <span className="market-platform-icon">{getPlatformIcon(el.platform)}</span>
                          <span className="market-platform-name">{el.platform}</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(63, 255, 220, 0.15)', color: '#3fffdc', padding: '2px 8px', borderRadius: '4px' }}>ESCROW</span>
                      </div>
                      <div className="market-card-profile">
                        <div className="market-card-avatar">
                          {el.displayName[0]}
                        </div>
                        <div className="market-card-info">
                          <h3 className="market-card-handle">{el.handle}</h3>
                          <p className="market-card-name">{el.displayName}</p>
                        </div>
                        {el.sellerVerified && (
                          <span className="market-card-verified" title="Verified Seller">✓</span>
                        )}
                      </div>
                      <div className="market-card-metrics">
                        <div className="market-metric">
                          <span className="market-metric-value">{formatFollowers(el.metrics.followers)}</span>
                          <span className="market-metric-label">Followers</span>
                        </div>
                        <div className="market-metric">
                          <span className="market-metric-value">{el.metrics.engagementRate.toFixed(1)}%</span>
                          <span className="market-metric-label">Engagement</span>
                        </div>
                        <div className="market-metric">
                          <span className="market-metric-value">{el.metrics.posts}</span>
                          <span className="market-metric-label">Posts</span>
                        </div>
                      </div>
                      <p className="market-card-title">{el.title}</p>
                      <div className="market-card-footer">
                        <div className="market-card-price">
                          <span className="market-price-value">${el.askingPrice.toLocaleString()}</span>
                        </div>
                        <div className="market-card-stats">
                          <span className="market-card-stat">👁 {el.views}</span>
                          <span className="market-card-stat">💬 {el.inquiries}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {activeTab === 'saved' && (
        <div className="market-saved-section">
          {savedIds.length === 0 ? (
            <div className="market-empty">
              <div className="market-empty-icon">❤️</div>
              <h3>No saved listings</h3>
              <p>Save listings you're interested in to view them here</p>
            </div>
          ) : (
            <div className={`market-listings ${viewMode}`}>
              {listings
                .filter(l => savedIds.includes(l.id))
                .map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isSaved={true}
                    onSave={() => handleSave(listing.id)}
                    viewMode={viewMode}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'selling' && (
        <div className="market-empty">
          <div className="market-empty-icon">📤</div>
          <h3>No active listings</h3>
          <p>List your first account to start selling</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cockpit/my-e-assets/market/sell" className="market-cta-btn">
              + List Your Account
            </Link>
            <button
              className="market-cta-btn"
              onClick={() => setShowListingModal(true)}
              style={{ background: 'linear-gradient(135deg, #3fffdc 0%, #00d4ff 100%)', color: '#020409', border: 'none', cursor: 'pointer', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}
            >
              + List with Escrow Protection
            </button>
          </div>
        </div>
      )}

      {activeTab === 'buying' && (
        <>
          {escrowTransactions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ color: '#fff', fontSize: '1.125rem', margin: 0 }}>Active Escrow Transactions</h3>
              {escrowTransactions.map(txn => (
                <EscrowStatusCard
                  key={txn.id}
                  transaction={txn}
                  userRole={txn.buyerId === (currentUser?.id || 'demo-user') ? 'buyer' : 'seller'}
                  onAction={(action) => {
                    if (action === 'verify_account' && txn) {
                      setSelectedTransaction(txn);
                      setShowVerificationModal(true);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="market-empty">
              <div className="market-empty-icon">📥</div>
              <h3>No active offers</h3>
              <p>Browse listings and make offers to see them here</p>
            </div>
          )}
        </>
      )}

      {/* Trust & Safety Banner */}
      <div className="market-trust-banner">
        <div className="market-trust-item">
          <span className="market-trust-icon">🔒</span>
          <div className="market-trust-text">
            <strong>Secure Escrow</strong>
            <span>Funds held safely until transfer verified</span>
          </div>
        </div>
        <div className="market-trust-item">
          <span className="market-trust-icon">✓</span>
          <div className="market-trust-text">
            <strong>Verified Metrics</strong>
            <span>All stats independently confirmed</span>
          </div>
        </div>
        <div className="market-trust-item">
          <span className="market-trust-icon">🛡️</span>
          <div className="market-trust-text">
            <strong>Buyer Protection</strong>
            <span>7-day verification period</span>
          </div>
        </div>
        <div className="market-trust-item">
          <span className="market-trust-icon">💬</span>
          <div className="market-trust-text">
            <strong>24/7 Support</strong>
            <span>Help when you need it</span>
          </div>
        </div>
      </div>

      {/* Escrow Listing Modal */}
      <EscrowListingModal
        isOpen={showListingModal}
        onClose={() => setShowListingModal(false)}
        onSuccess={() => {
          setShowListingModal(false);
          loadListings();
          loadEscrowTransactions();
        }}
        sellerId={currentUser?.id || 'demo-user'}
        sellerUsername={currentUser?.username || 'demo_user'}
        sellerEmail={currentUser?.email || 'demo@socialexchange.com'}
      />

      {/* Escrow Purchase Modal */}
      {selectedEscrowListing && (
        <EscrowPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedEscrowListing(null);
          }}
          onSuccess={() => {
            setShowPurchaseModal(false);
            setSelectedEscrowListing(null);
            loadEscrowTransactions();
          }}
          listing={selectedEscrowListing}
          buyerId={currentUser?.id || 'demo-user'}
          buyerUsername={currentUser?.username || 'demo_user'}
          buyerEmail={currentUser?.email || 'demo@socialexchange.com'}
        />
      )}

      {/* Escrow Verification Modal */}
      {selectedTransaction && (
        <EscrowVerificationModal
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedTransaction(null);
          }}
          onComplete={() => {
            setShowVerificationModal(false);
            setSelectedTransaction(null);
            loadEscrowTransactions();
          }}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
}

// ============================================
// LISTING CARD COMPONENT
// ============================================

interface ListingCardProps {
  listing: MarketListing;
  isSaved: boolean;
  onSave: () => void;
  viewMode: ViewMode;
}

function ListingCard({ listing, isSaved, onSave, viewMode }: ListingCardProps) {
  return (
    <div className={`market-card ${viewMode}`}>
      <div className="market-card-header">
        <div className="market-card-platform">
          <span className="market-platform-icon">{getPlatformIcon(listing.platform)}</span>
          <span className="market-platform-name">{listing.platform}</span>
        </div>
        <button
          className={`market-card-save ${isSaved ? 'saved' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      <Link href={`/cockpit/my-e-assets/market/${listing.id}`} className="market-card-link">
        <div className="market-card-profile">
          <div
            className="market-card-avatar"
            style={{ backgroundImage: listing.profileImageUrl ? `url(${listing.profileImageUrl})` : undefined }}
          >
            {!listing.profileImageUrl && listing.displayName[0]}
          </div>
          <div className="market-card-info">
            <h3 className="market-card-handle">{listing.handle}</h3>
            <p className="market-card-name">{listing.displayName}</p>
          </div>
          {listing.verificationStatus === 'verified' && (
            <span className="market-card-verified" title="Verified Account">✓</span>
          )}
        </div>

        <div className="market-card-metrics">
          <div className="market-metric">
            <span className="market-metric-value">{formatFollowers(listing.metrics.followers)}</span>
            <span className="market-metric-label">Followers</span>
          </div>
          <div className="market-metric">
            <span className="market-metric-value">{listing.metrics.engagementRate.toFixed(1)}%</span>
            <span className="market-metric-label">Engagement</span>
          </div>
          <div className="market-metric">
            <span className="market-metric-value">{listing.metrics.posts}</span>
            <span className="market-metric-label">Posts</span>
          </div>
        </div>

        <div className="market-card-niches">
          {listing.niches.slice(0, 3).map((niche) => (
            <span key={niche} className="market-niche-tag">
              {getNicheLabel(niche)}
            </span>
          ))}
        </div>

        <p className="market-card-title">{listing.title}</p>

        {listing.monetization?.hasMonetization && (
          <div className="market-card-revenue">
            <span className="market-revenue-icon">💰</span>
            <span>${listing.monetization.monthlyRevenue?.toLocaleString()}/mo revenue</span>
          </div>
        )}

        <div className="market-card-footer">
          <div className="market-card-price">
            <span className="market-price-value">${listing.askingPrice.toLocaleString()}</span>
            <span className="market-price-per">${listing.pricePerFollower.toFixed(3)}/follower</span>
          </div>
          <div className="market-card-stats">
            <span className="market-card-stat">👁 {listing.views}</span>
            <span className="market-card-stat">💬 {listing.inquiries}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
