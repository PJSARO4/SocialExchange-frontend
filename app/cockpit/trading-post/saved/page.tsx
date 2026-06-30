// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Camera,
  Music,
  ShieldCheck,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface SavedListing {
  id: string;
  listingId: string;
  savedAt: string;
  listing: {
    id: string;
    title: string;
    platform: string;
    handle: string;
    followers: number;
    price: number;
    niche: string;
    engagementRate?: number;
    verified: boolean;
    saleStatus: string;
  };
}

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

export default function SavedItemsPage() {
  const [savedItems, setSavedItems] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState('');

  useEffect(() => {
    fetchSaved();
  }, []);

  async function fetchSaved() {
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedItems(data.saved || []);
      } else if (res.status === 401) {
        setError('Please sign in to view saved items.');
      } else {
        setError('Failed to load saved items.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function removeSaved(savedId: string) {
    setRemovingId(savedId);
    try {
      const res = await fetch(`/api/marketplace/saved/${savedId}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedItems(prev => prev.filter(s => s.id !== savedId));
      }
    } catch {
      // silent fail
    } finally {
      setRemovingId('');
    }
  }

  const activeItems = savedItems.filter(s => s.listing?.saleStatus === 'ACTIVE');
  const soldItems = savedItems.filter(s => s.listing?.saleStatus === 'SOLD');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{
        background: '#111',
        borderBottom: '1px solid #1e1e1e',
        padding: '24px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Link href="/cockpit/trading-post" style={{ color: '#555', fontSize: '13px', textDecoration: 'none' }}>Trading Post</Link>
          <span style={{ color: '#333' }}>›</span>
          <span style={{ color: '#aaa', fontSize: '13px' }}>Saved Items</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Heart size={22} color="#EF4444" fill="#EF4444" />
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Saved Items</h1>
        </div>
        <p style={{ color: '#555', fontSize: '14px', marginTop: '4px' }}>
          {loading ? '' : `${savedItems.length} saved listing${savedItems.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#444' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⟳</div>
            Loading saved items...
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
        {!loading && !error && savedItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
            <h3 style={{ color: '#666', fontWeight: '500', marginBottom: '8px' }}>No saved items yet</h3>
            <p style={{ color: '#444', fontSize: '14px', marginBottom: '24px' }}>
              Browse the marketplace and save listings you&apos;re interested in.
            </p>
            <Link href="/cockpit/trading-post/browse" style={{
              backgroundColor: '#3fffdc', color: '#000',
              padding: '12px 24px', borderRadius: '8px',
              textDecoration: 'none', fontSize: '14px', fontWeight: '600',
            }}>
              Browse Marketplace
            </Link>
          </div>
        )}

        {/* Active items */}
        {!loading && activeItems.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#aaa', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
              Available ({activeItems.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '14px',
            }}>
              {activeItems.map(item => {
                const { listing } = item;
                const color = PLATFORM_COLORS[listing.platform] || '#3fffdc';
                return (
                  <div key={item.id} style={{
                    backgroundColor: '#111',
                    border: '1px solid #1e1e1e',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}>
                    {/* Platform header */}
                    <div style={{
                      background: `linear-gradient(135deg, ${color}20 0%, ${color}08 100%)`,
                      borderBottom: `1px solid ${color}20`,
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ color: color, fontSize: '12px', fontWeight: '600' }}>{listing.platform}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {listing.verified && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <ShieldCheck size={11} color="#3fffdc" />
                            <span style={{ color: '#3fffdc', fontSize: '10px' }}>Verified</span>
                          </div>
                        )}
                        <button
                          onClick={() => removeSaved(item.id)}
                          disabled={removingId === item.id}
                          style={{
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '5px',
                            padding: '3px 6px',
                            color: '#EF4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11px',
                          }}
                        >
                          <Trash2 size={11} /> Remove
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '14px' }}>
                      <h3 style={{
                        color: '#fff', fontSize: '14px', fontWeight: '600',
                        marginBottom: '3px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {listing.title}
                      </h3>
                      <p style={{ color: '#555', fontSize: '12px', marginBottom: '12px' }}>
                        @{listing.handle} · {listing.niche}
                      </p>

                      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#aaa', fontSize: '12px' }}>
                          <Users size={11} color="#555" />{formatFollowers(listing.followers)}
                        </span>
                        {listing.engagementRate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#aaa', fontSize: '12px' }}>
                            <TrendingUp size={11} color="#555" />{listing.engagementRate}%
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>
                          ${listing.price.toLocaleString()}
                        </span>
                        <Link
                          href={`/cockpit/trading-post/listing/${listing.id}`}
                          style={{
                            backgroundColor: `${color}15`,
                            border: `1px solid ${color}33`,
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: color,
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ShoppingCart size={12} /> Buy Now
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sold items */}
        {!loading && soldItems.length > 0 && (
          <div>
            <h2 style={{ color: '#444', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
              No Longer Available ({soldItems.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {soldItems.map(item => {
                const { listing } = item;
                const color = PLATFORM_COLORS[listing.platform] || '#444';
                return (
                  <div key={item.id} style={{
                    backgroundColor: '#0d0d0d',
                    border: '1px solid #1a1a1a',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: 0.6,
                  }}>
                    <div>
                      <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                        <span style={{ color }}>{listing.platform}</span> · {listing.title}
                      </p>
                      <p style={{ color: '#444', fontSize: '12px', margin: '2px 0 0' }}>
                        ${listing.price.toLocaleString()} · SOLD
                      </p>
                    </div>
                    <button
                      onClick={() => removeSaved(item.id)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#333',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
