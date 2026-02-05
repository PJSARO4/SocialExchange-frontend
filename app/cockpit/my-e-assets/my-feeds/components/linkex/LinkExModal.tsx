'use client';

import React, { useState } from 'react';
import { Feed, PLATFORMS } from '../../types/feed';
import './linkex.css';

// ============================================
// TYPES
// ============================================

interface LinkExModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
}

interface BioLink {
  id: string;
  title: string;
  url: string;
  clicks: number;
  enabled: boolean;
  order: number;
  icon?: string;
  style?: 'default' | 'featured' | 'social';
}

interface LinkPage {
  id: string;
  name: string;
  slug: string;
  theme: 'default' | 'dark' | 'gradient' | 'minimal' | 'custom';
  links: BioLink[];
  analytics: {
    views: number;
    totalClicks: number;
    topLink?: string;
    avgTimeOnPage: number;
  };
  customization: {
    backgroundColor?: string;
    textColor?: string;
    buttonStyle?: 'rounded' | 'pill' | 'square';
    profileImage?: string;
    bio?: string;
  };
}

interface AffiliateLink {
  id: string;
  name: string;
  originalUrl: string;
  shortUrl: string;
  trackingCode: string;
  clicks: number;
  conversions: number;
  earnings: number;
  platform: string;
  createdAt: Date;
}

type LinkExView = 'overview' | 'bio-links' | 'affiliate' | 'tracking' | 'create-page' | 'edit-page';

// ============================================
// MOCK DATA
// ============================================

const MOCK_LINK_PAGE: LinkPage = {
  id: 'page-1',
  name: 'Main Bio Page',
  slug: 'johndoe',
  theme: 'gradient',
  links: [
    { id: 'l1', title: '🔥 My Latest Video', url: 'https://youtube.com/watch?v=xxx', clicks: 1234, enabled: true, order: 1, style: 'featured' },
    { id: 'l2', title: 'Shop My Favorites', url: 'https://amazon.com/shop/xxx', clicks: 892, enabled: true, order: 2, style: 'default' },
    { id: 'l3', title: 'Free E-Book Download', url: 'https://gumroad.com/xxx', clicks: 567, enabled: true, order: 3, style: 'default' },
    { id: 'l4', title: 'Book a Consultation', url: 'https://calendly.com/xxx', clicks: 234, enabled: true, order: 4, style: 'default' },
    { id: 'l5', title: 'Subscribe to Newsletter', url: 'https://newsletter.xxx', clicks: 456, enabled: false, order: 5, style: 'default' },
  ],
  analytics: {
    views: 15678,
    totalClicks: 3383,
    topLink: 'My Latest Video',
    avgTimeOnPage: 45,
  },
  customization: {
    backgroundColor: '#667eea',
    textColor: '#ffffff',
    buttonStyle: 'pill',
    bio: 'Content Creator | Tech Enthusiast | Follow for daily tips!',
  },
};

const MOCK_AFFILIATE_LINKS: AffiliateLink[] = [
  {
    id: 'aff-1',
    name: 'Amazon Product Review',
    originalUrl: 'https://amazon.com/dp/B08XXX',
    shortUrl: 'sxch.ng/amz1',
    trackingCode: 'AMZ-001',
    clicks: 1523,
    conversions: 89,
    earnings: 234.50,
    platform: 'amazon',
    createdAt: new Date('2024-05-15'),
  },
  {
    id: 'aff-2',
    name: 'Course Promotion',
    originalUrl: 'https://udemy.com/course/xxx',
    shortUrl: 'sxch.ng/udm1',
    trackingCode: 'UDM-001',
    clicks: 892,
    conversions: 45,
    earnings: 567.00,
    platform: 'udemy',
    createdAt: new Date('2024-06-01'),
  },
  {
    id: 'aff-3',
    name: 'Software Referral',
    originalUrl: 'https://notion.so/xxx',
    shortUrl: 'sxch.ng/ntn1',
    trackingCode: 'NTN-001',
    clicks: 456,
    conversions: 23,
    earnings: 115.00,
    platform: 'notion',
    createdAt: new Date('2024-06-10'),
  },
];

// ============================================
// COMPONENT
// ============================================

export const LinkExModal: React.FC<LinkExModalProps> = ({ feed, isOpen, onClose }) => {
  const [currentView, setCurrentView] = useState<LinkExView>('overview');
  const [linkPage, setLinkPage] = useState<LinkPage>(MOCK_LINK_PAGE);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>(MOCK_AFFILIATE_LINKS);
  const [selectedLink, setSelectedLink] = useState<BioLink | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newAffiliateUrl, setNewAffiliateUrl] = useState('');
  const [newAffiliateName, setNewAffiliateName] = useState('');

  if (!isOpen) return null;

  const platform = PLATFORMS[feed.platform];
  const totalAffiliateEarnings = affiliateLinks.reduce((sum, l) => sum + l.earnings, 0);
  const totalAffiliateClicks = affiliateLinks.reduce((sum, l) => sum + l.clicks, 0);

  const handleAddLink = () => {
    if (!newLinkUrl.trim() || !newLinkTitle.trim()) return;

    const newLink: BioLink = {
      id: `l-${Date.now()}`,
      title: newLinkTitle,
      url: newLinkUrl,
      clicks: 0,
      enabled: true,
      order: linkPage.links.length + 1,
      style: 'default',
    };

    setLinkPage({
      ...linkPage,
      links: [...linkPage.links, newLink],
    });
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const handleToggleLink = (linkId: string) => {
    setLinkPage({
      ...linkPage,
      links: linkPage.links.map(l =>
        l.id === linkId ? { ...l, enabled: !l.enabled } : l
      ),
    });
  };

  const handleRemoveLink = (linkId: string) => {
    setLinkPage({
      ...linkPage,
      links: linkPage.links.filter(l => l.id !== linkId),
    });
  };

  const handleCreateAffiliateLink = () => {
    if (!newAffiliateUrl.trim() || !newAffiliateName.trim()) return;

    const newAffiliate: AffiliateLink = {
      id: `aff-${Date.now()}`,
      name: newAffiliateName,
      originalUrl: newAffiliateUrl,
      shortUrl: `sxch.ng/${Math.random().toString(36).substr(2, 5)}`,
      trackingCode: `TRK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      clicks: 0,
      conversions: 0,
      earnings: 0,
      platform: 'custom',
      createdAt: new Date(),
    };

    setAffiliateLinks([...affiliateLinks, newAffiliate]);
    setNewAffiliateUrl('');
    setNewAffiliateName('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  return (
    <div className="linkex-modal-overlay" onClick={onClose}>
      <div className="linkex-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="linkex-modal-header">
          <div className="linkex-header-content">
            <h2>LinkEx</h2>
            <p>Manage your bio links, affiliate tracking, and link pages</p>
          </div>
          <button className="linkex-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Navigation */}
        <nav className="linkex-nav">
          <button
            className={`linkex-nav-btn ${currentView === 'overview' ? 'active' : ''}`}
            onClick={() => setCurrentView('overview')}
          >
            Overview
          </button>
          <button
            className={`linkex-nav-btn ${currentView === 'bio-links' ? 'active' : ''}`}
            onClick={() => setCurrentView('bio-links')}
          >
            Bio Links
          </button>
          <button
            className={`linkex-nav-btn ${currentView === 'affiliate' ? 'active' : ''}`}
            onClick={() => setCurrentView('affiliate')}
          >
            Affiliate Links
          </button>
          <button
            className={`linkex-nav-btn ${currentView === 'tracking' ? 'active' : ''}`}
            onClick={() => setCurrentView('tracking')}
          >
            Analytics
          </button>
        </nav>

        {/* Content */}
        <div className="linkex-modal-content">
          {/* OVERVIEW VIEW */}
          {currentView === 'overview' && (
            <div className="linkex-overview">
              {/* Quick Stats */}
              <div className="linkex-stats-grid">
                <div className="linkex-stat-card">
                  <span className="stat-icon">👁️</span>
                  <div className="stat-info">
                    <span className="stat-value">{linkPage.analytics.views.toLocaleString()}</span>
                    <span className="stat-label">Page Views</span>
                  </div>
                </div>
                <div className="linkex-stat-card">
                  <span className="stat-icon">🔗</span>
                  <div className="stat-info">
                    <span className="stat-value">{linkPage.analytics.totalClicks.toLocaleString()}</span>
                    <span className="stat-label">Total Clicks</span>
                  </div>
                </div>
                <div className="linkex-stat-card">
                  <span className="stat-icon">💰</span>
                  <div className="stat-info">
                    <span className="stat-value">${totalAffiliateEarnings.toFixed(2)}</span>
                    <span className="stat-label">Affiliate Earnings</span>
                  </div>
                </div>
                <div className="linkex-stat-card">
                  <span className="stat-icon">📊</span>
                  <div className="stat-info">
                    <span className="stat-value">{((linkPage.analytics.totalClicks / linkPage.analytics.views) * 100).toFixed(1)}%</span>
                    <span className="stat-label">Click Rate</span>
                  </div>
                </div>
              </div>

              {/* Your Link Page Card */}
              <div className="linkex-page-card">
                <div className="page-card-header">
                  <h3>Your Link Page</h3>
                  <span className="page-url">sxch.ng/{linkPage.slug}</span>
                </div>
                <div className="page-card-preview">
                  <div className="preview-mock" style={{ background: linkPage.customization.backgroundColor }}>
                    <div className="preview-avatar">
                      {feed.avatarUrl ? (
                        <img src={feed.avatarUrl} alt={feed.handle} />
                      ) : (
                        <span>{feed.handle[1]?.toUpperCase()}</span>
                      )}
                    </div>
                    <span className="preview-handle">{feed.handle}</span>
                    <span className="preview-bio">{linkPage.customization.bio}</span>
                    <div className="preview-links">
                      {linkPage.links.filter(l => l.enabled).slice(0, 3).map(link => (
                        <div key={link.id} className="preview-link-item">{link.title}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="page-card-actions">
                  <button className="page-action-btn primary" onClick={() => setCurrentView('bio-links')}>
                    Edit Links
                  </button>
                  <button className="page-action-btn" onClick={() => copyToClipboard(`https://sxch.ng/${linkPage.slug}`)}>
                    Copy URL
                  </button>
                  <button className="page-action-btn">Customize</button>
                </div>
              </div>

              {/* Top Performing Links */}
              <div className="linkex-top-links">
                <h3>Top Performing Links</h3>
                <div className="top-links-list">
                  {linkPage.links
                    .filter(l => l.enabled)
                    .sort((a, b) => b.clicks - a.clicks)
                    .slice(0, 3)
                    .map((link, index) => (
                      <div key={link.id} className="top-link-item">
                        <span className="top-link-rank">#{index + 1}</span>
                        <div className="top-link-info">
                          <span className="top-link-title">{link.title}</span>
                          <span className="top-link-clicks">{link.clicks.toLocaleString()} clicks</span>
                        </div>
                        <div className="top-link-bar">
                          <div
                            className="top-link-fill"
                            style={{ width: `${(link.clicks / linkPage.links[0].clicks) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* BIO LINKS VIEW */}
          {currentView === 'bio-links' && (
            <div className="linkex-bio-links">
              <div className="bio-links-header">
                <div>
                  <h3>Bio Links</h3>
                  <p>Manage the links on your bio page</p>
                </div>
                <span className="links-count">{linkPage.links.length} links</span>
              </div>

              {/* Add New Link */}
              <div className="add-link-form">
                <h4>Add New Link</h4>
                <div className="add-link-inputs">
                  <input
                    type="text"
                    placeholder="Link title (e.g., My YouTube Channel)"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                  />
                  <input
                    type="url"
                    placeholder="URL (e.g., https://youtube.com/...)"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                  />
                  <button className="add-link-btn" onClick={handleAddLink}>
                    + Add Link
                  </button>
                </div>
              </div>

              {/* Links List */}
              <div className="bio-links-list">
                {linkPage.links.map((link, index) => (
                  <div key={link.id} className={`bio-link-item ${!link.enabled ? 'disabled' : ''}`}>
                    <div className="link-drag-handle">⋮⋮</div>
                    <div className="link-content">
                      <span className="link-title">{link.title}</span>
                      <span className="link-url">{link.url}</span>
                    </div>
                    <div className="link-stats">
                      <span className="link-clicks">{link.clicks.toLocaleString()} clicks</span>
                    </div>
                    <div className="link-actions">
                      <button
                        className={`link-toggle ${link.enabled ? 'on' : 'off'}`}
                        onClick={() => handleToggleLink(link.id)}
                      >
                        <span className="toggle-knob" />
                      </button>
                      <button className="link-edit-btn">✏️</button>
                      <button
                        className="link-delete-btn"
                        onClick={() => handleRemoveLink(link.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Page Preview Link */}
              <div className="bio-page-preview-link">
                <span>Preview your page:</span>
                <a href={`https://sxch.ng/${linkPage.slug}`} target="_blank" rel="noopener noreferrer">
                  sxch.ng/{linkPage.slug} ↗
                </a>
              </div>
            </div>
          )}

          {/* AFFILIATE LINKS VIEW */}
          {currentView === 'affiliate' && (
            <div className="linkex-affiliate">
              <div className="affiliate-header">
                <div>
                  <h3>Affiliate Links</h3>
                  <p>Track and manage your affiliate links with custom short URLs</p>
                </div>
                <div className="affiliate-summary">
                  <span className="summary-item">
                    <span className="summary-value">${totalAffiliateEarnings.toFixed(2)}</span>
                    <span className="summary-label">Total Earnings</span>
                  </span>
                  <span className="summary-item">
                    <span className="summary-value">{totalAffiliateClicks.toLocaleString()}</span>
                    <span className="summary-label">Total Clicks</span>
                  </span>
                </div>
              </div>

              {/* Create Affiliate Link */}
              <div className="create-affiliate-form">
                <h4>Create Tracked Link</h4>
                <div className="affiliate-inputs">
                  <input
                    type="text"
                    placeholder="Link name (for your reference)"
                    value={newAffiliateName}
                    onChange={(e) => setNewAffiliateName(e.target.value)}
                  />
                  <input
                    type="url"
                    placeholder="Destination URL"
                    value={newAffiliateUrl}
                    onChange={(e) => setNewAffiliateUrl(e.target.value)}
                  />
                  <button className="create-affiliate-btn" onClick={handleCreateAffiliateLink}>
                    Create Short Link
                  </button>
                </div>
              </div>

              {/* Affiliate Links Table */}
              <div className="affiliate-links-table">
                <div className="table-header">
                  <span>Name</span>
                  <span>Short URL</span>
                  <span>Clicks</span>
                  <span>Conv.</span>
                  <span>Earnings</span>
                  <span>Actions</span>
                </div>
                {affiliateLinks.map(link => (
                  <div key={link.id} className="table-row">
                    <span className="link-name">{link.name}</span>
                    <span className="link-short-url">
                      <code>{link.shortUrl}</code>
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(`https://${link.shortUrl}`)}
                      >
                        📋
                      </button>
                    </span>
                    <span className="link-clicks">{link.clicks.toLocaleString()}</span>
                    <span className="link-conversions">{link.conversions}</span>
                    <span className="link-earnings">${link.earnings.toFixed(2)}</span>
                    <span className="link-actions">
                      <button className="action-btn">📊</button>
                      <button className="action-btn">✏️</button>
                      <button className="action-btn delete">🗑️</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRACKING/ANALYTICS VIEW */}
          {currentView === 'tracking' && (
            <div className="linkex-tracking">
              <div className="tracking-header">
                <h3>Link Analytics</h3>
                <p>Detailed performance metrics for all your links</p>
              </div>

              {/* Time Period Selector */}
              <div className="tracking-period">
                <button className="period-btn active">7 Days</button>
                <button className="period-btn">30 Days</button>
                <button className="period-btn">90 Days</button>
                <button className="period-btn">All Time</button>
              </div>

              {/* Overall Stats */}
              <div className="tracking-stats">
                <div className="tracking-stat-card large">
                  <h4>Bio Page Performance</h4>
                  <div className="stat-metrics">
                    <div className="metric">
                      <span className="metric-value">{linkPage.analytics.views.toLocaleString()}</span>
                      <span className="metric-label">Page Views</span>
                      <span className="metric-change positive">+12.5%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{linkPage.analytics.totalClicks.toLocaleString()}</span>
                      <span className="metric-label">Total Clicks</span>
                      <span className="metric-change positive">+8.3%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{linkPage.analytics.avgTimeOnPage}s</span>
                      <span className="metric-label">Avg Time</span>
                      <span className="metric-change negative">-2.1%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Click Distribution Chart Placeholder */}
              <div className="tracking-chart">
                <h4>Click Distribution</h4>
                <div className="chart-placeholder">
                  <div className="chart-bars">
                    {linkPage.links.filter(l => l.enabled).map((link, i) => (
                      <div key={link.id} className="chart-bar-item">
                        <div
                          className="chart-bar"
                          style={{
                            height: `${(link.clicks / Math.max(...linkPage.links.map(l => l.clicks))) * 100}%`,
                            background: `hsl(${i * 50}, 70%, 60%)`,
                          }}
                        />
                        <span className="chart-bar-label">{link.title.substring(0, 10)}...</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Geographic Data Placeholder */}
              <div className="tracking-geo">
                <h4>Top Locations</h4>
                <div className="geo-list">
                  <div className="geo-item">
                    <span className="geo-flag">🇺🇸</span>
                    <span className="geo-country">United States</span>
                    <span className="geo-percent">45%</span>
                  </div>
                  <div className="geo-item">
                    <span className="geo-flag">🇬🇧</span>
                    <span className="geo-country">United Kingdom</span>
                    <span className="geo-percent">18%</span>
                  </div>
                  <div className="geo-item">
                    <span className="geo-flag">🇨🇦</span>
                    <span className="geo-country">Canada</span>
                    <span className="geo-percent">12%</span>
                  </div>
                  <div className="geo-item">
                    <span className="geo-flag">🇦🇺</span>
                    <span className="geo-country">Australia</span>
                    <span className="geo-percent">8%</span>
                  </div>
                  <div className="geo-item">
                    <span className="geo-flag">🌍</span>
                    <span className="geo-country">Other</span>
                    <span className="geo-percent">17%</span>
                  </div>
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="tracking-devices">
                <h4>Device Breakdown</h4>
                <div className="devices-list">
                  <div className="device-item">
                    <span className="device-icon">📱</span>
                    <span className="device-name">Mobile</span>
                    <div className="device-bar">
                      <div className="device-fill" style={{ width: '68%' }} />
                    </div>
                    <span className="device-percent">68%</span>
                  </div>
                  <div className="device-item">
                    <span className="device-icon">💻</span>
                    <span className="device-name">Desktop</span>
                    <div className="device-bar">
                      <div className="device-fill" style={{ width: '28%' }} />
                    </div>
                    <span className="device-percent">28%</span>
                  </div>
                  <div className="device-item">
                    <span className="device-icon">📟</span>
                    <span className="device-name">Tablet</span>
                    <div className="device-bar">
                      <div className="device-fill" style={{ width: '4%' }} />
                    </div>
                    <span className="device-percent">4%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkExModal;
