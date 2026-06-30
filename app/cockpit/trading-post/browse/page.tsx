// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Camera,
  Music,
  ShieldCheck,
  Heart,
  TrendingUp,
  DollarSign,
  Users,
  ChevronDown,
  X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Listing {
  id: string;
  title: string;
  platform: string;
  handle: string;
  followers: number;
  price: number;
  niche: string;
  engagementRate?: number;
  monthlyIncome?: number;
  verified: boolean;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PLATFORMS = ['All', 'Instagram', 'TikTok', 'Twitter', 'YouTube', 'Facebook', 'Snapchat'];
const NICHES = ['All', 'Fashion', 'Fitness', 'Business', 'Gaming', 'Food', 'Travel', 'Beauty', 'Parenting', 'Tech'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'followers_desc', label: 'Most Followers' },
];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E1306C',
  TikTok: '#00F2EA',
  Twitter: '#1DA1F2',
  YouTube: '#FF0000',
  Facebook: '#1877F2',
  Snapchat: '#FFFC00',
};

const PLATFORM_ICONS: Record<string, any> = {
  Instagram: Camera,
  TikTok: Music,
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: '#111',
      border: '1px solid #1e1e1e',
      borderRadius: '12px',
      overflow: 'hidden',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: '80px', backgroundColor: '#1a1a1a' }} />
      <div style={{ padding: '16px' }}>
        <div style={{ height: '16px', backgroundColor: '#1a1a1a', borderRadius: '4px', marginBottom: '8px', width: '70%' }} />
        <div style={{ height: '12px', backgroundColor: '#1a1a1a', borderRadius: '4px', marginBottom: '16px', width: '40%' }} />
        <div style={{ height: '20px', backgroundColor: '#1a1a1a', borderRadius: '4px', width: '50%' }} />
      </div>
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: Listing }) {
  const color = PLATFORM_COLORS[listing.platform] || '#3fffdc';
  const Icon = PLATFORM_ICONS[listing.platform] || Camera;

  return (
    <Link
      href={`/cockpit/trading-post/listing/${listing.id}`}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        backgroundColor: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = color;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = '#1e1e1e';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Platform header */}
        <div style={{
          background: `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`,
          borderBottom: `1px solid ${color}22`,
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              backgroundColor: `${color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={16} color={color} />
            </div>
            <span style={{ color: color, fontSize: '12px', fontWeight: '600' }}>
              {listing.platform}
            </span>
          </div>
          {listing.verified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} color="#3fffdc" />
              <span style={{ color: '#3fffdc', fontSize: '11px' }}>Verified</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '16px' }}>
          <h3 style={{
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {listing.title}
          </h3>
          <p style={{ color: '#555', fontSize: '12px', marginBottom: '14px' }}>
            @{listing.handle} · {listing.niche}
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={12} color="#666" />
              <span style={{ color: '#aaa', fontSize: '12px' }}>
                {formatFollowers(listing.followers)}
              </span>
            </div>
            {listing.engagementRate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={12} color="#666" />
                <span style={{ color: '#aaa', fontSize: '12px' }}>
                  {listing.engagementRate}%
                </span>
              </div>
            )}
            {listing.monthlyIncome && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={12} color="#666" />
                <span style={{ color: '#aaa', fontSize: '12px' }}>
                  ${listing.monthlyIncome}/mo
                </span>
              </div>
            )}
          </div>

          {/* Price + CTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>
              ${listing.price.toLocaleString()}
            </span>
            <span style={{
              backgroundColor: `${color}18`,
              color: color,
              border: `1px solid ${color}33`,
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: '600',
            }}>
              View Deal
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BrowseMarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('All');
  const [niche, setNiche] = useState('All');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, [platform, niche, sort, minPrice, maxPrice]);

  async function fetchListings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (platform !== 'All') params.set('platform', platform);
      if (niche !== 'All') params.set('niche', niche);
      if (sort) params.set('sort', sort);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);

      const res = await fetch(`/api/marketplace/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      } else {
        setListings([]);
      }
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = listings.filter(l =>
    !search ||
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.handle.toLowerCase().includes(search.toLowerCase()) ||
    l.niche.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)',
        borderBottom: '1px solid #1e1e1e',
        padding: '28px 32px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <Link href="/cockpit/trading-post" style={{ color: '#555', fontSize: '13px', textDecoration: 'none' }}>
            Trading Post
          </Link>
          <span style={{ color: '#333' }}>›</span>
          <span style={{ color: '#aaa', fontSize: '13px' }}>Browse Marketplace</span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#fff', margin: 0 }}>
          Browse Marketplace
        </h1>
        <p style={{ color: '#555', fontSize: '14px', marginTop: '4px' }}>
          {loading ? '...' : `${filtered.length.toLocaleString()} listings available`}
        </p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Search + Filter Bar */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{
            flex: '1',
            minWidth: '240px',
            position: 'relative',
          }}>
            <Search size={16} color="#555" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, handle, niche..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#111',
                border: '1px solid #222',
                borderRadius: '8px',
                padding: '10px 12px 10px 36px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: showFilters ? '#1a2a1a' : '#111',
              border: `1px solid ${showFilters ? '#3fffdc' : '#222'}`,
              borderRadius: '8px',
              padding: '10px 16px',
              color: showFilters ? '#3fffdc' : '#aaa',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              backgroundColor: '#111',
              border: '1px solid #222',
              borderRadius: '8px',
              padding: '10px 16px',
              color: '#aaa',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{
            backgroundColor: '#111',
            border: '1px solid #1e1e1e',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
          }}>
            {/* Platform */}
            <div>
              <label style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '8px' }}>PLATFORM</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    style={{
                      backgroundColor: platform === p ? '#3fffdc18' : 'transparent',
                      border: `1px solid ${platform === p ? '#3fffdc' : '#2a2a2a'}`,
                      borderRadius: '6px',
                      padding: '5px 12px',
                      color: platform === p ? '#3fffdc' : '#666',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Niche */}
            <div>
              <label style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '8px' }}>NICHE</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {NICHES.map(n => (
                  <button
                    key={n}
                    onClick={() => setNiche(n)}
                    style={{
                      backgroundColor: niche === n ? '#8B5CF618' : 'transparent',
                      border: `1px solid ${niche === n ? '#8B5CF6' : '#2a2a2a'}`,
                      borderRadius: '6px',
                      padding: '5px 12px',
                      color: niche === n ? '#8B5CF6' : '#666',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '8px' }}>PRICE RANGE</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min $"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  style={{
                    width: '90px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <span style={{ color: '#444' }}>—</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  style={{
                    width: '90px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Reset */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => { setPlatform('All'); setNiche('All'); setMinPrice(''); setMaxPrice(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  backgroundColor: 'transparent',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: '#666',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <X size={12} /> Reset
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#444',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ color: '#666', fontWeight: '500', marginBottom: '8px' }}>No listings found</h3>
            <p style={{ fontSize: '14px' }}>Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {filtered.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        select option { background: #111; }
      `}</style>
    </div>
  );
}
