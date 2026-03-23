'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Star } from 'lucide-react';
import '../../trading-post.css';

const LISTINGS: Record<string, any> = {
  '1': {
    id: '1',
    platform: 'Instagram',
    handle: '@fashionista_daily',
    followers: 125000,
    following: 8900,
    posts: 542,
    engagement: 4.2,
    avgLikes: 5200,
    avgComments: 890,
    niche: 'Fashion & Style',
    price: 2800,
    description: 'Highly engaged Instagram fashion account with a dedicated audience. Consistent posting schedule and strong community engagement.',
    seller: {
      name: 'Alex Fashion',
      rep: '98%',
      sales: 42,
      rating: 4.9,
    },
  },
  '2': {
    id: '2',
    platform: 'TikTok',
    handle: '@dance_moves_pro',
    followers: 340000,
    following: 1200,
    posts: 287,
    engagement: 7.8,
    avgLikes: 28000,
    avgComments: 3200,
    niche: 'Dance & Entertainment',
    price: 4200,
    description: 'Viral dance content creator with rapidly growing TikTok presence. Strong engagement from Gen Z audience.',
    seller: {
      name: 'Creative Studios',
      rep: '99%',
      sales: 156,
      rating: 4.95,
    },
  },
};

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = LISTINGS[params.id];
  const [showBuyConfirm, setShowBuyConfirm] = useState(false);

  if (!listing) {
    return <div className="trading-post"><div style={{ padding: '2rem', textAlign: 'center' }}><h2 style={{ color: '#fff' }}>Listing Not Found</h2></div></div>;
  }

  return (
    <div className="trading-post">
      <div className="trading-post-container">
        <Link href="/cockpit/trading-post" style={{ color: '#f59e0b', textDecoration: 'none', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ← Back to Marketplace
        </Link>

        <div className="listing-detail">
          <div className="listing-detail-main">
            <div className="listing-detail-image">📸</div>
            <div className="detail-section">
              <h2 className="detail-section-title">Account Overview</h2>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff', margin: '0 0 0.5rem 0' }}>{listing.handle}</h3>
              <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.65)' }}>{listing.platform} Account</p>

              <div className="detail-metrics">
                <div className="detail-metric">
                  <div className="detail-metric-label">Followers</div>
                  <div className="detail-metric-value">{(listing.followers / 1000).toFixed(0)}K</div>
                </div>
                <div className="detail-metric">
                  <div className="detail-metric-label">Following</div>
                  <div className="detail-metric-value">{listing.following}</div>
                </div>
                <div className="detail-metric">
                  <div className="detail-metric-label">Posts</div>
                  <div className="detail-metric-value">{listing.posts}</div>
                </div>
                <div className="detail-metric">
                  <div className="detail-metric-label">Engagement</div>
                  <div className="detail-metric-value">{listing.engagement}%</div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h2 className="detail-section-title">About Account</h2>
              <p className="detail-description">{listing.description}</p>
            </div>
          </div>

          <div className="listing-detail-sidebar">
            <div className="sidebar-card price-section">
              <div className="price-label">Price</div>
              <div className="price-display">${listing.price.toLocaleString()}</div>
              {showBuyConfirm ? (
                <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.15)', borderRadius: '8px', textAlign: 'center', color: '#22c55e', fontWeight: '600' }}>✓ Checkout</div>
              ) : (
                <button className="buy-button" onClick={() => setShowBuyConfirm(true)}>Buy Now</button>
              )}
              <div className="escrow-badge"><Shield size={16} />Escrow Protected</div>
            </div>

            <div className="seller-info">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: '0 0 1rem 0' }}>Seller Info</h3>
              <div className="seller-header">
                <div className="seller-avatar">👤</div>
                <div className="seller-details">
                  <h3>{listing.seller.name}</h3>
                  <div className="seller-rep"><Star size={14} style={{ fill: '#f59e0b' }} />{listing.seller.rep}</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div className="seller-stat"><span>Sales</span><span className="seller-stat-value">{listing.seller.sales}</span></div>
                <div className="seller-stat"><span>Rating</span><span className="seller-stat-value">{listing.seller.rating}/5</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
