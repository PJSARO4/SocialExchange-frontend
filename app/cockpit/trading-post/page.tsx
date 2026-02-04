'use client';

import { useState } from 'react';
import Link from 'next/link';
import './trading-post.css';

// ============================================
// TYPES
// ============================================

interface MarketplaceCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  stats: {
    listings: number;
    avgPrice: string;
    trend: 'up' | 'down' | 'stable';
  };
  color: string;
  featured?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  href: string;
  color: string;
}

interface MarketTrend {
  niche: string;
  avgPrice: string;
  change: number;
  demand: 'high' | 'medium' | 'low';
}

// ============================================
// DATA
// ============================================

const MARKETPLACE_CATEGORIES: MarketplaceCategory[] = [
  {
    id: 'instagram-accounts',
    title: 'Instagram Accounts',
    description: 'Buy and sell verified Instagram accounts with real followers',
    icon: '📷',
    href: '/cockpit/my-e-assets/market?platform=instagram',
    stats: {
      listings: 1247,
      avgPrice: '$2,450',
      trend: 'up',
    },
    color: '#E1306C',
    featured: true,
  },
  {
    id: 'tiktok-accounts',
    title: 'TikTok Accounts',
    description: 'Monetizable TikTok accounts with established audiences',
    icon: '🎵',
    href: '/cockpit/my-e-assets/market?platform=tiktok',
    stats: {
      listings: 856,
      avgPrice: '$1,890',
      trend: 'up',
    },
    color: '#00F2EA',
  },
  {
    id: 'twitter-accounts',
    title: 'Twitter/X Accounts',
    description: 'Verified and established Twitter accounts',
    icon: '𝕏',
    href: '/cockpit/my-e-assets/market?platform=twitter',
    stats: {
      listings: 623,
      avgPrice: '$1,250',
      trend: 'stable',
    },
    color: '#1DA1F2',
  },
  {
    id: 'youtube-channels',
    title: 'YouTube Channels',
    description: 'Monetized YouTube channels with active subscribers',
    icon: '▶️',
    href: '/cockpit/my-e-assets/market?platform=youtube',
    stats: {
      listings: 412,
      avgPrice: '$5,670',
      trend: 'up',
    },
    color: '#FF0000',
  },
  {
    id: 'content-packs',
    title: 'Content Packs',
    description: 'Premium content bundles, templates, and presets',
    icon: '📦',
    href: '/cockpit/my-e-assets/market?type=content',
    stats: {
      listings: 2341,
      avgPrice: '$47',
      trend: 'stable',
    },
    color: '#8B5CF6',
  },
  {
    id: 'services',
    title: 'Growth Services',
    description: 'Professional social media management and growth services',
    icon: '🚀',
    href: '/cockpit/my-e-assets/market?type=services',
    stats: {
      listings: 534,
      avgPrice: '$299/mo',
      trend: 'up',
    },
    color: '#10B981',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'sell-account',
    label: 'Sell My Account',
    icon: '💰',
    description: 'List your social media account for sale',
    href: '/cockpit/my-e-assets/market?action=create',
    color: '#3fffdc',
  },
  {
    id: 'browse-all',
    label: 'Browse Marketplace',
    icon: '🛒',
    description: 'Explore all available listings',
    href: '/cockpit/my-e-assets/market',
    color: '#8B5CF6',
  },
  {
    id: 'my-listings',
    label: 'My Listings',
    icon: '📋',
    description: 'Manage your active listings',
    href: '/cockpit/my-e-assets/market?tab=selling',
    color: '#F59E0B',
  },
  {
    id: 'saved',
    label: 'Saved Items',
    icon: '❤️',
    description: 'View your saved listings',
    href: '/cockpit/my-e-assets/market?tab=saved',
    color: '#EF4444',
  },
];

const MARKET_TRENDS: MarketTrend[] = [
  { niche: 'Fashion/Style', avgPrice: '$3,200', change: 12.5, demand: 'high' },
  { niche: 'Fitness/Health', avgPrice: '$2,800', change: 8.3, demand: 'high' },
  { niche: 'Business/Finance', avgPrice: '$4,100', change: 15.2, demand: 'high' },
  { niche: 'Tech/Gaming', avgPrice: '$2,100', change: -2.1, demand: 'medium' },
  { niche: 'Food/Cooking', avgPrice: '$1,900', change: 5.7, demand: 'medium' },
  { niche: 'Travel', avgPrice: '$2,400', change: 3.2, demand: 'medium' },
  { niche: 'Beauty/Skincare', avgPrice: '$2,600', change: 9.8, demand: 'high' },
  { niche: 'Parenting/Family', avgPrice: '$1,700', change: 1.5, demand: 'low' },
];

// ============================================
// COMPONENT
// ============================================

export default function TradingPostPage() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="trading-post">
      {/* Header */}
      <header className="trading-post-header">
        <div className="trading-post-header-content">
          <div className="trading-post-header-text">
            <h1 className="trading-post-title">
              <span className="trading-post-title-icon">🏪</span>
              Trading Post
            </h1>
            <p className="trading-post-subtitle">
              The trusted marketplace for buying and selling social media accounts, content, and services
            </p>
          </div>
          <div className="trading-post-header-stats">
            <div className="header-stat">
              <span className="header-stat-value">5,800+</span>
              <span className="header-stat-label">Active Listings</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">$2.4M</span>
              <span className="header-stat-label">Monthly Volume</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-value">99.2%</span>
              <span className="header-stat-label">Safe Trades</span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <section className="trading-post-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map(action => (
            <Link
              key={action.id}
              href={action.href}
              className="quick-action-card"
              style={{ '--accent-color': action.color } as React.CSSProperties}
            >
              <span className="quick-action-icon">{action.icon}</span>
              <div className="quick-action-content">
                <span className="quick-action-label">{action.label}</span>
                <span className="quick-action-desc">{action.description}</span>
              </div>
              <span className="quick-action-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured: Instagram Accounts */}
      <section className="trading-post-section featured-section">
        <div className="featured-badge">🔥 Most Popular</div>
        <Link
          href="/cockpit/my-e-assets/market?platform=instagram"
          className="featured-instagram-card"
        >
          <div className="featured-instagram-bg" />
          <div className="featured-instagram-content">
            <div className="featured-instagram-header">
              <span className="featured-instagram-icon">📷</span>
              <div>
                <h3 className="featured-instagram-title">Instagram Account Marketplace</h3>
                <p className="featured-instagram-subtitle">Buy & sell verified Instagram accounts with real, engaged followers</p>
              </div>
            </div>
            <div className="featured-instagram-stats">
              <div className="featured-stat">
                <span className="featured-stat-value">1,247</span>
                <span className="featured-stat-label">Accounts Listed</span>
              </div>
              <div className="featured-stat">
                <span className="featured-stat-value">$2,450</span>
                <span className="featured-stat-label">Avg. Price</span>
              </div>
              <div className="featured-stat">
                <span className="featured-stat-value trending-up">↑ 18%</span>
                <span className="featured-stat-label">This Month</span>
              </div>
            </div>
            <div className="featured-instagram-cta">
              <span>Browse Instagram Accounts</span>
              <span className="cta-arrow">→</span>
            </div>
          </div>
        </Link>
      </section>

      {/* Marketplace Categories */}
      <section className="trading-post-section">
        <h2 className="section-title">Browse by Category</h2>
        <div className="categories-grid">
          {MARKETPLACE_CATEGORIES.map(category => (
            <Link
              key={category.id}
              href={category.href}
              className={`category-card ${hoveredCategory === category.id ? 'hovered' : ''}`}
              style={{ '--category-color': category.color } as React.CSSProperties}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="category-header">
                <span className="category-icon">{category.icon}</span>
                <div className="category-trend-badge" data-trend={category.stats.trend}>
                  {category.stats.trend === 'up' && '↑'}
                  {category.stats.trend === 'down' && '↓'}
                  {category.stats.trend === 'stable' && '→'}
                </div>
              </div>
              <h3 className="category-title">{category.title}</h3>
              <p className="category-description">{category.description}</p>
              <div className="category-stats">
                <div className="category-stat">
                  <span className="category-stat-value">{category.stats.listings.toLocaleString()}</span>
                  <span className="category-stat-label">Listings</span>
                </div>
                <div className="category-stat">
                  <span className="category-stat-value">{category.stats.avgPrice}</span>
                  <span className="category-stat-label">Avg. Price</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Market Trends */}
      <section className="trading-post-section">
        <h2 className="section-title">
          <span>📈</span>
          Market Trends
        </h2>
        <div className="trends-container">
          <div className="trends-table">
            <div className="trends-header">
              <span>Niche</span>
              <span>Avg. Price</span>
              <span>30d Change</span>
              <span>Demand</span>
            </div>
            {MARKET_TRENDS.map(trend => (
              <div key={trend.niche} className="trends-row">
                <span className="trend-niche">{trend.niche}</span>
                <span className="trend-price">{trend.avgPrice}</span>
                <span className={`trend-change ${trend.change >= 0 ? 'positive' : 'negative'}`}>
                  {trend.change >= 0 ? '+' : ''}{trend.change}%
                </span>
                <span className={`trend-demand ${trend.demand}`}>
                  <span className="demand-dot" />
                  {trend.demand.charAt(0).toUpperCase() + trend.demand.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="trading-post-section trust-section">
        <h2 className="section-title">
          <span>🛡️</span>
          Safe Trading Guaranteed
        </h2>
        <div className="trust-grid">
          <div className="trust-card">
            <span className="trust-icon">🔒</span>
            <h3 className="trust-title">Escrow Protection</h3>
            <p className="trust-description">
              All transactions are protected by our secure escrow system. Funds are only released after successful transfer verification.
            </p>
          </div>
          <div className="trust-card">
            <span className="trust-icon">✅</span>
            <h3 className="trust-title">Verified Sellers</h3>
            <p className="trust-description">
              All sellers undergo identity verification and account authenticity checks before listing.
            </p>
          </div>
          <div className="trust-card">
            <span className="trust-icon">💬</span>
            <h3 className="trust-title">Dispute Resolution</h3>
            <p className="trust-description">
              Our dedicated support team handles any issues with a fair and transparent resolution process.
            </p>
          </div>
          <div className="trust-card">
            <span className="trust-icon">📊</span>
            <h3 className="trust-title">Analytics Verified</h3>
            <p className="trust-description">
              All account metrics are independently verified through official API integrations.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="trading-post-section cta-section">
        <div className="cta-banner">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Trade?</h2>
            <p className="cta-subtitle">
              Join thousands of creators buying and selling social media accounts securely
            </p>
          </div>
          <div className="cta-buttons">
            <Link href="/cockpit/my-e-assets/market?action=create" className="cta-btn primary">
              <span>💰</span>
              Sell Your Account
            </Link>
            <Link href="/cockpit/my-e-assets/market" className="cta-btn secondary">
              <span>🛒</span>
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
