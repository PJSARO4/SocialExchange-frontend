// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import '../../trading-post.css';

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#e1306c',
  TikTok: '#69c9d0',
  YouTube: '#ff0000',
  Twitter: '#1da1f2',
  X: '#1da1f2',
  Facebook: '#1877f2',
  LinkedIn: '#0a66c2',
  Snapchat: '#fffc00',
  Pinterest: '#e60023',
  Twitch: '#9147ff',
};

const PLATFORM_ICONS: Record<string, string> = {
  Instagram: '📸',
  TikTok: '🎵',
  YouTube: '▶️',
  Twitter: '🐦',
  X: '𝕏',
  Facebook: '👥',
  LinkedIn: '💼',
  Snapchat: '👻',
  Pinterest: '📌',
  Twitch: '🎮',
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '245, 158, 11';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function StatCard({ label, value, color = '#f59e0b' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      padding: '1rem 1.25rem',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '10px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

function PurchaseModal({ listing, onClose, onConfirm, loading, error }: {
  listing: any;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string;
}) {
  const fee = Math.round((listing.askingPrice ?? 0) * 0.1);
  const total = listing.askingPrice ?? 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#0d1117', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '2rem', maxWidth: '440px', width: '100%' }}>
        <h2 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.25rem' }}>🔒 Confirm Purchase</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          This will open an escrow transaction. Funds are held securely until you verify account access.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[
            ['Listing', listing.title],
            ['Platform', listing.platform],
            ['Asking Price', `$${total.toFixed(2)}`],
            ['Platform Fee (10%)', `$${fee.toFixed(2)}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{label}</span>
              <span style={{ color: label === 'Asking Price' ? '#f59e0b' : '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0.5rem', background: 'rgba(245,158,11,0.07)', borderRadius: '8px', marginTop: '0.25rem' }}>
            <span style={{ color: '#fff', fontWeight: 700 }}>Total Deducted</span>
            <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1.1rem' }}>${total.toFixed(2)}</span>
          </div>
        </div>
        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.82rem', marginBottom: '1rem' }}>
            ⚠ {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, padding: '0.85rem', background: loading ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Opening Escrow...' : '🔒 Open Escrow'}
          </button>
          <button
            onClick={onClose}
            style={{ padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.95rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/marketplace/listings/${params.id}`);
      if (!res.ok) throw new Error('Listing not found');
      const data = await res.json();
      setListing(data);
    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchListing(); }, [fetchListing]);

  const handlePurchase = async () => {
    setPurchasing(true);
    setPurchaseError('');
    try {
      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: params.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Purchase failed');
      router.push(`/cockpit/trading-post/escrow/${data.id}`);
    } catch (err: any) {
      setPurchaseError(err.message);
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="trading-post">
        <div className="trading-post-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '3rem', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Loading listing...</span>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !listing) {
    return (
      <div className="trading-post">
        <div className="trading-post-container">
          <Link href="/cockpit/trading-post" style={{ color: '#f59e0b', textDecoration: 'none', marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
            ← Back to Trading Post
          </Link>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Listing Not Found</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>{fetchError}</p>
          </div>
        </div>
      </div>
    );
  }

  const platformColor = PLATFORM_COLORS[listing.platform] ?? '#f59e0b';
  const platformIcon = PLATFORM_ICONS[listing.platform] ?? '📱';
  const isOwnListing = session && (
    listing.sellerId === (session as any)?.user?.id ||
    listing.seller?.email === session?.user?.email
  );
  const isAvailable = listing.saleStatus === 'AVAILABLE';

  return (
    <>
      {showModal && (
        <PurchaseModal
          listing={listing}
          onClose={() => { setShowModal(false); setPurchaseError(''); }}
          onConfirm={handlePurchase}
          loading={purchasing}
          error={purchaseError}
        />
      )}

      <div className="trading-post">
        <div className="trading-post-container">
          <Link href="/cockpit/trading-post" style={{ color: '#f59e0b', textDecoration: 'none', marginBottom: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            ← Back to Trading Post
          </Link>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.9rem',
                background: `rgba(${hexToRgb(platformColor)}, 0.15)`,
                border: `1px solid rgba(${hexToRgb(platformColor)}, 0.3)`,
                borderRadius: '999px',
                fontSize: '0.8rem', fontWeight: 700, color: platformColor,
                marginBottom: '0.75rem',
              }}>
                {platformIcon} {listing.platform}
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.2 }}>
                {listing.title}
              </h1>
              {listing.niche && (
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {listing.niche}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Asking Price</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>${(listing.askingPrice ?? 0).toFixed(2)}</div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {listing.followerCount != null && <StatCard label="Followers" value={formatNumber(listing.followerCount)} color={platformColor} />}
            {listing.engagementRate != null && <StatCard label="Engagement" value={`${listing.engagementRate.toFixed(1)}%`} color="#22c55e" />}
            {listing.monthlyRevenue != null && listing.monthlyRevenue > 0 && <StatCard label="Monthly Rev." value={`$${listing.monthlyRevenue.toLocaleString()}`} color="#a78bfa" />}
            {listing.averageViews != null && listing.averageViews > 0 && <StatCard label="Avg. Views" value={formatNumber(listing.averageViews)} color="#06b6d4" />}
            {listing.postCount != null && listing.postCount > 0 && <StatCard label="Posts" value={formatNumber(listing.postCount)} color="#f87171" />}
            {listing.accountAge != null && listing.accountAge > 0 && <StatCard label="Acct. Age" value={`${listing.accountAge}y`} color="#fbbf24" />}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(270px, 320px)', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {listing.description && (
                <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                  <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>About This Account</h3>
                  <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, fontSize: '0.9rem' }}>{listing.description}</p>
                </div>
              )}
              {listing.includedAssets && listing.includedAssets.length > 0 && (
                <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                  <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What&apos;s Included</h3>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {listing.includedAssets.map((asset: string, i: number) => (
                      <li key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: '#22c55e' }}>✓</span> {asset}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: buy card */}
            <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Asking Price</div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.25rem' }}>${(listing.askingPrice ?? 0).toFixed(2)}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: '1.25rem' }}>USD · +10% platform fee</div>

                {!isAvailable ? (
                  <div style={{ padding: '0.85rem', background: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.3)', borderRadius: '10px', color: '#9ca3af', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                    {listing.saleStatus === 'SOLD' ? '✓ Sold' : 'Not Available'}
                  </div>
                ) : isOwnListing ? (
                  <div style={{ padding: '0.85rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', color: '#93c5fd', textAlign: 'center', fontSize: '0.875rem' }}>
                    This is your listing
                  </div>
                ) : authStatus === 'unauthenticated' ? (
                  <Link href="/auth/signin" style={{ display: 'block', padding: '0.85rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', textAlign: 'center', textDecoration: 'none' }}>
                    Sign In to Buy
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowModal(true)}
                    style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
                  >
                    🔒 Buy via Escrow
                  </button>
                )}

                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['Funds held in secure escrow', 'AES-256 encrypted credentials', '48-hour buyer protection', 'Dispute resolution available'].map(item => (
                    <div key={item} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                      <span style={{ color: '#22c55e', marginTop: '1px' }}>✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>

              {listing.seller && (
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Seller</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                    {listing.seller.name || listing.seller.email?.split('@')[0] || 'Anonymous'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
