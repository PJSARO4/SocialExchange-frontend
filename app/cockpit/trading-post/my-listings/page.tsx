// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Camera,
  Music,
  Eye,
  Edit3,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  platform: string;
  handle: string;
  followers: number;
  price: number;
  niche: string;
  saleStatus: 'ACTIVE' | 'PENDING' | 'SOLD' | 'DELISTED' | 'EXPIRED';
  createdAt: string;
  views?: number;
  escrowId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVE: { label: 'Active', color: '#3fffdc', icon: CheckCircle },
  PENDING: { label: 'Pending Sale', color: '#F59E0B', icon: Clock },
  SOLD: { label: 'Sold', color: '#10B981', icon: CheckCircle },
  DELISTED: { label: 'Delisted', color: '#666', icon: XCircle },
  EXPIRED: { label: 'Expired', color: '#EF4444', icon: AlertCircle },
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E1306C',
  TikTok: '#00F2EA',
  'Twitter/X': '#1DA1F2',
  YouTube: '#FF0000',
  Facebook: '#1877F2',
};

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [delistingId, setDelistingId] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/my-listings');
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      } else if (res.status === 401) {
        setError('Please sign in to view your listings.');
      } else {
        setError('Failed to load listings.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function delistListing(id: string) {
    if (!confirm('Delist this account? It will be removed from the marketplace.')) return;
    setDelistingId(id);
    try {
      const res = await fetch(`/api/marketplace/listings/${id}/delist`, { method: 'POST' });
      if (res.ok) {
        setListings(prev => prev.map(l => l.id === id ? { ...l, saleStatus: 'DELISTED' } : l));
      } else {
        alert('Failed to delist listing. Please try again.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setDelistingId('');
    }
  }

  const ALL_STATUSES = ['ALL', 'ACTIVE', 'PENDING', 'SOLD', 'DELISTED'];
  const filtered = filter === 'ALL' ? listings : listings.filter(l => l.saleStatus === filter);

  const stats = {
    active: listings.filter(l => l.saleStatus === 'ACTIVE').length,
    pending: listings.filter(l => l.saleStatus === 'PENDING').length,
    sold: listings.filter(l => l.saleStatus === 'SOLD').length,
    totalValue: listings.filter(l => ['ACTIVE', 'PENDING'].includes(l.saleStatus)).reduce((s, l) => s + l.price, 0),
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{
        background: '#111',
        borderBottom: '1px solid #1e1e1e',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Link href="/cockpit/trading-post" style={{ color: '#555', fontSize: '13px', textDecoration: 'none' }}>Trading Post</Link>
            <span style={{ color: '#333' }}>›</span>
            <span style={{ color: '#aaa', fontSize: '13px' }}>My Listings</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>My Listings</h1>
        </div>
        <Link
          href="/cockpit/trading-post/sell"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#3fffdc',
            color: '#000',
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <Plus size={16} /> New Listing
        </Link>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Stats */}
        {!loading && listings.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}>
            {[
              { label: 'Active', value: stats.active, color: '#3fffdc' },
              { label: 'Pending Sale', value: stats.pending, color: '#F59E0B' },
              { label: 'Sold', value: stats.sold, color: '#10B981' },
              { label: 'Listed Value', value: `$${stats.totalValue.toLocaleString()}`, color: '#8B5CF6' },
            ].map(s => (
              <div key={s.label} style={{
                backgroundColor: '#111',
                border: '1px solid #1e1e1e',
                borderRadius: '10px',
                padding: '16px',
              }}>
                <div style={{ color: s.color, fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>{s.value}</div>
                <div style={{ color: '#555', fontSize: '12px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                backgroundColor: filter === s ? '#3fffdc18' : 'transparent',
                border: `1px solid ${filter === s ? '#3fffdc' : '#222'}`,
                borderRadius: '6px',
                padding: '6px 14px',
                color: filter === s ? '#3fffdc' : '#555',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: filter === s ? '600' : '400',
              }}
            >
              {s === 'ALL' ? `All (${listings.length})` : `${STATUS_CONFIG[s]?.label || s} (${listings.filter(l => l.saleStatus === s).length})`}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#444' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⟳</div>
            Loading your listings...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            backgroundColor: 'rgba(255,77,77,0.08)',
            border: '1px solid rgba(255,77,77,0.2)',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <AlertCircle size={18} color="#ff6b6b" />
            <span style={{ color: '#ff6b6b', fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && listings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ color: '#666', fontWeight: '500', marginBottom: '8px' }}>No listings yet</h3>
            <p style={{ color: '#444', fontSize: '14px', marginBottom: '24px' }}>List your first social media account and start selling.</p>
            <Link href="/cockpit/trading-post/sell" style={{
              backgroundColor: '#3fffdc', color: '#000',
              padding: '12px 24px', borderRadius: '8px',
              textDecoration: 'none', fontSize: '14px', fontWeight: '600',
            }}>
              + List an Account
            </Link>
          </div>
        )}

        {/* Listings */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(listing => {
              const accentColor = PLATFORM_COLORS[listing.platform] || '#888';
              const statusCfg = STATUS_CONFIG[listing.saleStatus] || STATUS_CONFIG.ACTIVE;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={listing.id}
                  style={{
                    backgroundColor: '#111',
                    border: '1px solid #1e1e1e',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Platform stripe */}
                  <div style={{
                    width: '4px',
                    backgroundColor: accentColor,
                    flexShrink: 0,
                  }} />

                  <div style={{ flex: 1, padding: '18px 20px', minWidth: '240px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>{listing.title}</h3>
                        <p style={{ color: '#555', fontSize: '13px' }}>
                          <span style={{ color: accentColor }}>{listing.platform}</span>
                          {' · '}@{listing.handle}
                          {' · '}{listing.niche}
                        </p>
                      </div>

                      {/* Status */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        backgroundColor: `${statusCfg.color}15`,
                        border: `1px solid ${statusCfg.color}33`,
                        borderRadius: '6px',
                        padding: '4px 10px',
                      }}>
                        <StatusIcon size={12} color={statusCfg.color} />
                        <span style={{ color: statusCfg.color, fontSize: '12px', fontWeight: '500' }}>{statusCfg.label}</span>
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} color="#555" />{formatFollowers(listing.followers)} followers
                      </span>
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DollarSign size={14} color="#3fffdc" />{listing.price.toLocaleString()}
                      </span>
                      {listing.views != null && (
                        <span style={{ color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={12} color="#555" />{listing.views} views
                        </span>
                      )}
                      <span style={{ color: '#333', fontSize: '12px' }}>{timeAgo(listing.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '18px 20px',
                    borderLeft: '1px solid #1a1a1a',
                    flexShrink: 0,
                  }}>
                    {listing.saleStatus === 'PENDING' && listing.escrowId && (
                      <Link
                        href={`/cockpit/trading-post/escrow/${listing.escrowId}`}
                        style={{
                          backgroundColor: '#F59E0B18',
                          border: '1px solid #F59E0B33',
                          borderRadius: '6px',
                          padding: '7px 12px',
                          color: '#F59E0B',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        View Escrow
                      </Link>
                    )}
                    <Link
                      href={`/cockpit/trading-post/listing/${listing.id}`}
                      style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        borderRadius: '6px',
                        padding: '7px 10px',
                        color: '#aaa',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <Eye size={14} /> View
                    </Link>
                    {listing.saleStatus === 'ACTIVE' && (
                      <button
                        onClick={() => delistListing(listing.id)}
                        disabled={delistingId === listing.id}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid #2a2a2a',
                          borderRadius: '6px',
                          padding: '7px 10px',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
