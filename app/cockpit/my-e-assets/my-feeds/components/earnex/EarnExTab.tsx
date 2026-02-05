'use client';

import React, { useState, useEffect } from 'react';
import { Feed, PLATFORMS } from '../../types/feed';
import './earnex.css';

// ============================================
// TYPES
// ============================================

interface EarnExTabProps {
  feed?: Feed;
  feeds?: Feed[];
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  type: 'owned' | 'participating';
  budget?: number;
  spent?: number;
  earnings?: number;
  startDate: Date;
  endDate?: Date;
  platforms: string[];
  requirements?: CampaignRequirement[];
  analytics: CampaignAnalytics;
  members?: CampaignMember[];
  creatorHandle?: string;
  applicationStatus?: 'pending' | 'approved' | 'rejected';
}

interface CampaignRequirement {
  type: 'followers' | 'engagement' | 'posts' | 'platform' | 'niche';
  value: string | number;
  met?: boolean;
}

interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  conversions: number;
  reach: number;
  engagement: number;
}

interface CampaignMember {
  id: string;
  handle: string;
  platform: string;
  joinedAt: Date;
  postsCompleted: number;
  earnings: number;
  status: 'active' | 'pending' | 'completed';
}

interface Earning {
  id: string;
  campaignId: string;
  campaignName: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid';
  date: Date;
}

type EarnExView = 'overview' | 'owned' | 'find' | 'participating' | 'earnings' | 'create' | 'campaign-detail' | 'apply';

// ============================================
// MOCK DATA
// ============================================

const MOCK_OWNED_CAMPAIGNS: Campaign[] = [
  {
    id: 'owned-1',
    name: 'Summer Product Launch',
    description: 'Promote our new summer collection across social media',
    status: 'active',
    type: 'owned',
    budget: 5000,
    spent: 2340,
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    platforms: ['instagram', 'tiktok'],
    analytics: {
      impressions: 125000,
      clicks: 4500,
      conversions: 234,
      reach: 89000,
      engagement: 5.2,
    },
    members: [
      { id: 'm1', handle: '@influencer1', platform: 'instagram', joinedAt: new Date(), postsCompleted: 3, earnings: 450, status: 'active' },
      { id: 'm2', handle: '@creator2', platform: 'tiktok', joinedAt: new Date(), postsCompleted: 5, earnings: 720, status: 'active' },
    ],
  },
  {
    id: 'owned-2',
    name: 'Brand Awareness Q3',
    description: 'Increase brand visibility and engagement',
    status: 'draft',
    type: 'owned',
    budget: 3000,
    spent: 0,
    startDate: new Date('2024-07-15'),
    platforms: ['instagram', 'twitter'],
    analytics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      reach: 0,
      engagement: 0,
    },
  },
];

const MOCK_AVAILABLE_CAMPAIGNS: Campaign[] = [
  {
    id: 'find-1',
    name: 'Tech Review Partnership',
    description: 'Looking for tech enthusiasts to review our latest gadgets. Must have authentic engagement and tech-focused audience.',
    status: 'active',
    type: 'participating',
    earnings: 500,
    startDate: new Date('2024-06-15'),
    endDate: new Date('2024-09-15'),
    platforms: ['instagram', 'youtube'],
    creatorHandle: '@techbrand',
    requirements: [
      { type: 'followers', value: 5000, met: true },
      { type: 'engagement', value: 3, met: true },
      { type: 'niche', value: 'Technology', met: false },
    ],
    analytics: { impressions: 0, clicks: 0, conversions: 0, reach: 0, engagement: 0 },
  },
  {
    id: 'find-2',
    name: 'Fitness Challenge Sponsored',
    description: 'Join our 30-day fitness challenge and earn while promoting healthy lifestyle.',
    status: 'active',
    type: 'participating',
    earnings: 750,
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-07-31'),
    platforms: ['instagram', 'tiktok'],
    creatorHandle: '@fitnessbrand',
    requirements: [
      { type: 'followers', value: 2000, met: true },
      { type: 'engagement', value: 4, met: true },
      { type: 'posts', value: 10, met: true },
    ],
    analytics: { impressions: 0, clicks: 0, conversions: 0, reach: 0, engagement: 0 },
  },
  {
    id: 'find-3',
    name: 'Fashion Week Coverage',
    description: 'Cover fashion week events and showcase trending styles.',
    status: 'active',
    type: 'participating',
    earnings: 1200,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2024-09-15'),
    platforms: ['instagram'],
    creatorHandle: '@fashionhouse',
    requirements: [
      { type: 'followers', value: 10000, met: false },
      { type: 'engagement', value: 5, met: false },
      { type: 'niche', value: 'Fashion', met: false },
    ],
    analytics: { impressions: 0, clicks: 0, conversions: 0, reach: 0, engagement: 0 },
  },
];

const MOCK_PARTICIPATING_CAMPAIGNS: Campaign[] = [
  {
    id: 'part-1',
    name: 'Lifestyle Brand Collab',
    description: 'Ongoing partnership with lifestyle brand',
    status: 'active',
    type: 'participating',
    earnings: 320,
    startDate: new Date('2024-05-01'),
    platforms: ['instagram'],
    creatorHandle: '@lifestylebrand',
    applicationStatus: 'approved',
    analytics: { impressions: 45000, clicks: 890, conversions: 45, reach: 32000, engagement: 4.8 },
  },
];

const MOCK_EARNINGS: Earning[] = [
  { id: 'e1', campaignId: 'part-1', campaignName: 'Lifestyle Brand Collab', amount: 150, status: 'paid', date: new Date('2024-06-01') },
  { id: 'e2', campaignId: 'part-1', campaignName: 'Lifestyle Brand Collab', amount: 170, status: 'pending', date: new Date('2024-06-15') },
  { id: 'e3', campaignId: 'find-2', campaignName: 'Fitness Challenge Sponsored', amount: 250, status: 'processing', date: new Date('2024-06-20') },
];

// ============================================
// COMPONENT
// ============================================

export const EarnExTab: React.FC<EarnExTabProps> = ({ feed, feeds = [] }) => {
  const [currentView, setCurrentView] = useState<EarnExView>('overview');
  const [ownedCampaigns, setOwnedCampaigns] = useState<Campaign[]>(MOCK_OWNED_CAMPAIGNS);
  const [availableCampaigns] = useState<Campaign[]>(MOCK_AVAILABLE_CAMPAIGNS);
  const [participatingCampaigns] = useState<Campaign[]>(MOCK_PARTICIPATING_CAMPAIGNS);
  const [earnings] = useState<Earning[]>(MOCK_EARNINGS);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  // Calculate totals
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const pendingEarnings = earnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const paidEarnings = earnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCurrentView('campaign-detail');
  };

  const handleApplyCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCurrentView('apply');
  };

  const handleToggleCampaignStatus = (campaignId: string) => {
    setOwnedCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        return { ...c, status: c.status === 'active' ? 'paused' : 'active' };
      }
      return c;
    }));
  };

  // Filter available campaigns
  const filteredAvailable = availableCampaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || c.platforms.includes(filterPlatform);
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="earnex-container">
      {/* Navigation Breadcrumb */}
      {currentView !== 'overview' && (
        <div className="earnex-breadcrumb">
          <button onClick={() => setCurrentView('overview')}>EarnEx</button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">
            {currentView === 'owned' && 'Owned Campaigns'}
            {currentView === 'find' && 'Find Campaigns'}
            {currentView === 'participating' && 'Participating'}
            {currentView === 'earnings' && 'My Earnings'}
            {currentView === 'create' && 'Create Campaign'}
            {currentView === 'campaign-detail' && selectedCampaign?.name}
            {currentView === 'apply' && 'Apply to Campaign'}
          </span>
        </div>
      )}

      {/* OVERVIEW VIEW */}
      {currentView === 'overview' && (
        <div className="earnex-overview">
          <div className="earnex-header">
            <div className="earnex-header-content">
              <h1>EarnEx</h1>
              <p>Manage campaigns, find opportunities, and track your earnings</p>
            </div>
            <div className="earnex-header-stats">
              <div className="header-stat">
                <span className="header-stat-value">${totalEarnings.toLocaleString()}</span>
                <span className="header-stat-label">Total Earned</span>
              </div>
              <div className="header-stat pending">
                <span className="header-stat-value">${pendingEarnings.toLocaleString()}</span>
                <span className="header-stat-label">Pending</span>
              </div>
            </div>
          </div>

          {/* Main Navigation Cards */}
          <div className="earnex-nav-grid">
            {/* Owned Campaigns Card */}
            <div className="earnex-nav-card owned" onClick={() => setCurrentView('owned')}>
              <div className="nav-card-icon">📢</div>
              <div className="nav-card-content">
                <h3>Owned Campaigns</h3>
                <p>Create and manage your advertising campaigns</p>
                <div className="nav-card-stats">
                  <span>{ownedCampaigns.filter(c => c.status === 'active').length} Active</span>
                  <span>{ownedCampaigns.filter(c => c.status === 'draft').length} Drafts</span>
                </div>
              </div>
              <div className="nav-card-arrow">→</div>
            </div>

            {/* Find Campaigns Card */}
            <div className="earnex-nav-card find" onClick={() => setCurrentView('find')}>
              <div className="nav-card-icon">🔍</div>
              <div className="nav-card-content">
                <h3>Find Campaigns</h3>
                <p>Discover opportunities and apply to earn</p>
                <div className="nav-card-stats">
                  <span>{availableCampaigns.length} Available</span>
                  <span>New opportunities daily</span>
                </div>
              </div>
              <div className="nav-card-arrow">→</div>
            </div>

            {/* Participating Card */}
            <div className="earnex-nav-card participating" onClick={() => setCurrentView('participating')}>
              <div className="nav-card-icon">🤝</div>
              <div className="nav-card-content">
                <h3>Participating</h3>
                <p>Track campaigns you're part of</p>
                <div className="nav-card-stats">
                  <span>{participatingCampaigns.length} Active</span>
                  <span>${participatingCampaigns.reduce((s, c) => s + (c.earnings || 0), 0)} Earned</span>
                </div>
              </div>
              <div className="nav-card-arrow">→</div>
            </div>

            {/* My Earnings Card */}
            <div className="earnex-nav-card earnings" onClick={() => setCurrentView('earnings')}>
              <div className="nav-card-icon">💰</div>
              <div className="nav-card-content">
                <h3>My Earnings</h3>
                <p>View earnings and cash out</p>
                <div className="nav-card-stats">
                  <span>${paidEarnings} Paid</span>
                  <span>${pendingEarnings} Pending</span>
                </div>
              </div>
              <div className="nav-card-arrow">→</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="earnex-quick-actions">
            <button className="quick-action-btn primary" onClick={() => setCurrentView('create')}>
              <span>+</span> Create Campaign
            </button>
            <button className="quick-action-btn secondary" onClick={() => setCurrentView('find')}>
              <span>🔍</span> Browse Opportunities
            </button>
          </div>

          {/* Recent Activity */}
          <div className="earnex-recent">
            <h3>Recent Activity</h3>
            <div className="recent-list">
              {earnings.slice(0, 3).map(earning => (
                <div key={earning.id} className="recent-item">
                  <div className="recent-icon">💵</div>
                  <div className="recent-content">
                    <span className="recent-title">{earning.campaignName}</span>
                    <span className="recent-date">{earning.date.toLocaleDateString()}</span>
                  </div>
                  <div className={`recent-amount ${earning.status}`}>
                    +${earning.amount}
                    <span className="recent-status">{earning.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OWNED CAMPAIGNS VIEW */}
      {currentView === 'owned' && (
        <div className="earnex-owned">
          <div className="section-header">
            <div>
              <h2>Owned Campaigns</h2>
              <p>Campaigns you've created and manage</p>
            </div>
            <button className="create-btn" onClick={() => setCurrentView('create')}>
              + Create Campaign
            </button>
          </div>

          {ownedCampaigns.length > 0 ? (
            <div className="campaigns-list">
              {ownedCampaigns.map(campaign => (
                <div key={campaign.id} className="campaign-card owned">
                  <div className="campaign-card-header">
                    <div className="campaign-info">
                      <h3>{campaign.name}</h3>
                      <p>{campaign.description}</p>
                    </div>
                    <div className="campaign-status-toggle">
                      <span className={`status-badge ${campaign.status}`}>{campaign.status}</span>
                      {campaign.status !== 'draft' && (
                        <button
                          className={`toggle-btn ${campaign.status === 'active' ? 'active' : ''}`}
                          onClick={() => handleToggleCampaignStatus(campaign.id)}
                        >
                          <span className="toggle-knob" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="campaign-platforms">
                    {campaign.platforms.map(p => (
                      <span key={p} className="platform-badge">
                        {PLATFORMS[p as keyof typeof PLATFORMS]?.icon} {PLATFORMS[p as keyof typeof PLATFORMS]?.label}
                      </span>
                    ))}
                  </div>

                  <div className="campaign-metrics">
                    <div className="metric">
                      <span className="metric-value">${campaign.budget?.toLocaleString()}</span>
                      <span className="metric-label">Budget</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">${campaign.spent?.toLocaleString()}</span>
                      <span className="metric-label">Spent</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{campaign.analytics.impressions.toLocaleString()}</span>
                      <span className="metric-label">Impressions</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{campaign.members?.length || 0}</span>
                      <span className="metric-label">Members</span>
                    </div>
                  </div>

                  <div className="campaign-actions">
                    <button className="action-btn" onClick={() => handleViewCampaign(campaign)}>
                      View Details
                    </button>
                    <button className="action-btn secondary">Analytics</button>
                    <button className="action-btn secondary">Members</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📢</div>
              <h3>No Campaigns Yet</h3>
              <p>Create your first campaign to start promoting</p>
              <button className="create-btn" onClick={() => setCurrentView('create')}>
                + Create Campaign
              </button>
            </div>
          )}
        </div>
      )}

      {/* FIND CAMPAIGNS VIEW */}
      {currentView === 'find' && (
        <div className="earnex-find">
          <div className="section-header">
            <div>
              <h2>Find Campaigns</h2>
              <p>Discover opportunities to earn by participating in campaigns</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="find-filters">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          {/* Available Campaigns Grid */}
          <div className="campaigns-grid">
            {filteredAvailable.map(campaign => (
              <div key={campaign.id} className="campaign-card find">
                <div className="campaign-card-header">
                  <div className="campaign-creator">
                    <span className="creator-handle">{campaign.creatorHandle}</span>
                  </div>
                  <div className="campaign-payout">
                    <span className="payout-amount">${campaign.earnings}</span>
                    <span className="payout-label">Payout</span>
                  </div>
                </div>

                <h3 className="campaign-title">{campaign.name}</h3>
                <p className="campaign-desc">{campaign.description}</p>

                <div className="campaign-platforms">
                  {campaign.platforms.map(p => (
                    <span key={p} className="platform-badge small">
                      {PLATFORMS[p as keyof typeof PLATFORMS]?.icon}
                    </span>
                  ))}
                </div>

                <div className="campaign-requirements">
                  <span className="requirements-title">Requirements</span>
                  <div className="requirements-list">
                    {campaign.requirements?.map((req, i) => (
                      <div key={i} className={`requirement ${req.met ? 'met' : 'unmet'}`}>
                        <span className="req-icon">{req.met ? '✓' : '○'}</span>
                        <span className="req-text">
                          {req.type === 'followers' && `${req.value.toLocaleString()}+ followers`}
                          {req.type === 'engagement' && `${req.value}%+ engagement`}
                          {req.type === 'posts' && `${req.value}+ posts required`}
                          {req.type === 'niche' && `${req.value} niche`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="campaign-dates">
                  <span>📅 {campaign.startDate.toLocaleDateString()} - {campaign.endDate?.toLocaleDateString()}</span>
                </div>

                <button
                  className="apply-btn"
                  onClick={() => handleApplyCampaign(campaign)}
                  disabled={campaign.requirements?.some(r => !r.met)}
                >
                  {campaign.requirements?.every(r => r.met) ? 'Apply Now' : 'Requirements Not Met'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PARTICIPATING VIEW */}
      {currentView === 'participating' && (
        <div className="earnex-participating">
          <div className="section-header">
            <div>
              <h2>Participating Campaigns</h2>
              <p>Campaigns you're actively part of</p>
            </div>
          </div>

          {participatingCampaigns.length > 0 ? (
            <div className="campaigns-list">
              {participatingCampaigns.map(campaign => (
                <div key={campaign.id} className="campaign-card participating">
                  <div className="campaign-card-header">
                    <div className="campaign-info">
                      <span className="campaign-creator">{campaign.creatorHandle}</span>
                      <h3>{campaign.name}</h3>
                    </div>
                    <span className={`application-status ${campaign.applicationStatus}`}>
                      {campaign.applicationStatus}
                    </span>
                  </div>

                  <div className="campaign-progress">
                    <div className="progress-header">
                      <span>Campaign Progress</span>
                      <span>Earned: ${campaign.earnings}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '65%' }} />
                    </div>
                  </div>

                  <div className="campaign-metrics">
                    <div className="metric">
                      <span className="metric-value">{campaign.analytics.impressions.toLocaleString()}</span>
                      <span className="metric-label">Impressions</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{campaign.analytics.clicks.toLocaleString()}</span>
                      <span className="metric-label">Clicks</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">{campaign.analytics.engagement}%</span>
                      <span className="metric-label">Engagement</span>
                    </div>
                  </div>

                  <div className="campaign-actions">
                    <button className="action-btn" onClick={() => handleViewCampaign(campaign)}>
                      View Details
                    </button>
                    <button className="action-btn secondary">Submit Content</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🤝</div>
              <h3>Not Participating in Any Campaigns</h3>
              <p>Browse available campaigns and apply to start earning</p>
              <button className="create-btn" onClick={() => setCurrentView('find')}>
                Find Campaigns
              </button>
            </div>
          )}
        </div>
      )}

      {/* EARNINGS VIEW */}
      {currentView === 'earnings' && (
        <div className="earnex-earnings">
          <div className="section-header">
            <div>
              <h2>My Earnings</h2>
              <p>Track your income and cash out</p>
            </div>
          </div>

          {/* Earnings Summary */}
          <div className="earnings-summary">
            <div className="earnings-card total">
              <span className="earnings-icon">💰</span>
              <div className="earnings-info">
                <span className="earnings-value">${totalEarnings.toLocaleString()}</span>
                <span className="earnings-label">Total Earned</span>
              </div>
            </div>
            <div className="earnings-card pending">
              <span className="earnings-icon">⏳</span>
              <div className="earnings-info">
                <span className="earnings-value">${pendingEarnings.toLocaleString()}</span>
                <span className="earnings-label">Pending</span>
              </div>
            </div>
            <div className="earnings-card available">
              <span className="earnings-icon">✓</span>
              <div className="earnings-info">
                <span className="earnings-value">${paidEarnings.toLocaleString()}</span>
                <span className="earnings-label">Available</span>
              </div>
              <button className="cashout-btn">Cash Out</button>
            </div>
          </div>

          {/* Earnings History */}
          <div className="earnings-history">
            <h3>Transaction History</h3>
            <div className="earnings-table">
              <div className="table-header">
                <span>Campaign</span>
                <span>Date</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {earnings.map(earning => (
                <div key={earning.id} className="table-row">
                  <span className="campaign-name">{earning.campaignName}</span>
                  <span className="date">{earning.date.toLocaleDateString()}</span>
                  <span className="amount">${earning.amount}</span>
                  <span className={`status ${earning.status}`}>{earning.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN VIEW */}
      {currentView === 'create' && (
        <div className="earnex-create">
          <div className="section-header">
            <div>
              <h2>Create Campaign</h2>
              <p>Set up a new advertising campaign</p>
            </div>
          </div>

          <form className="create-form">
            <div className="form-group">
              <label>Campaign Name</label>
              <input type="text" placeholder="Enter campaign name" />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="Describe your campaign and what you're looking for..." rows={4} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Budget ($)</label>
                <input type="number" placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Payout per Creator ($)</label>
                <input type="number" placeholder="0.00" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" />
              </div>
            </div>

            <div className="form-group">
              <label>Platforms</label>
              <div className="platform-checkboxes">
                {Object.entries(PLATFORMS).map(([key, platform]) => (
                  <label key={key} className="platform-checkbox">
                    <input type="checkbox" value={key} />
                    <span className="checkbox-label">
                      {platform.icon} {platform.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Requirements</label>
              <div className="requirements-builder">
                <div className="requirement-row">
                  <select>
                    <option value="followers">Minimum Followers</option>
                    <option value="engagement">Minimum Engagement</option>
                    <option value="posts">Required Posts</option>
                  </select>
                  <input type="number" placeholder="Value" />
                  <button type="button" className="add-req-btn">+</button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setCurrentView('owned')}>
                Cancel
              </button>
              <button type="button" className="save-draft-btn">
                Save as Draft
              </button>
              <button type="submit" className="publish-btn">
                Publish Campaign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CAMPAIGN DETAIL VIEW */}
      {currentView === 'campaign-detail' && selectedCampaign && (
        <div className="earnex-detail">
          <div className="detail-header">
            <div className="detail-info">
              <span className={`status-badge ${selectedCampaign.status}`}>{selectedCampaign.status}</span>
              <h2>{selectedCampaign.name}</h2>
              <p>{selectedCampaign.description}</p>
            </div>
            {selectedCampaign.type === 'owned' && (
              <div className="detail-actions">
                <button className="edit-btn">Edit Campaign</button>
                <button className="pause-btn">
                  {selectedCampaign.status === 'active' ? 'Pause' : 'Activate'}
                </button>
              </div>
            )}
          </div>

          {/* Analytics Grid */}
          <div className="detail-analytics">
            <h3>Campaign Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <span className="analytics-value">{selectedCampaign.analytics.impressions.toLocaleString()}</span>
                <span className="analytics-label">Impressions</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-value">{selectedCampaign.analytics.reach.toLocaleString()}</span>
                <span className="analytics-label">Reach</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-value">{selectedCampaign.analytics.clicks.toLocaleString()}</span>
                <span className="analytics-label">Clicks</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-value">{selectedCampaign.analytics.conversions}</span>
                <span className="analytics-label">Conversions</span>
              </div>
              <div className="analytics-card">
                <span className="analytics-value">{selectedCampaign.analytics.engagement}%</span>
                <span className="analytics-label">Engagement</span>
              </div>
            </div>
          </div>

          {/* Members Section (for owned campaigns) */}
          {selectedCampaign.type === 'owned' && selectedCampaign.members && (
            <div className="detail-members">
              <h3>Campaign Members ({selectedCampaign.members.length})</h3>
              <div className="members-list">
                {selectedCampaign.members.map(member => (
                  <div key={member.id} className="member-card">
                    <div className="member-info">
                      <span className="member-handle">{member.handle}</span>
                      <span className="member-platform">{PLATFORMS[member.platform as keyof typeof PLATFORMS]?.icon}</span>
                    </div>
                    <div className="member-stats">
                      <span>{member.postsCompleted} posts</span>
                      <span>${member.earnings} earned</span>
                    </div>
                    <span className={`member-status ${member.status}`}>{member.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* APPLY VIEW */}
      {currentView === 'apply' && selectedCampaign && (
        <div className="earnex-apply">
          <div className="apply-header">
            <h2>Apply to Campaign</h2>
            <p>{selectedCampaign.name}</p>
          </div>

          <div className="apply-details">
            <div className="apply-info">
              <h3>Campaign Details</h3>
              <p>{selectedCampaign.description}</p>
              <div className="apply-payout">
                <span className="payout-label">Potential Earnings:</span>
                <span className="payout-value">${selectedCampaign.earnings}</span>
              </div>
            </div>

            <div className="apply-requirements">
              <h3>Requirements Check</h3>
              <div className="requirements-checklist">
                {selectedCampaign.requirements?.map((req, i) => (
                  <div key={i} className={`requirement-check ${req.met ? 'passed' : 'failed'}`}>
                    <span className="check-icon">{req.met ? '✓' : '✗'}</span>
                    <span className="check-text">
                      {req.type === 'followers' && `${req.value.toLocaleString()}+ followers`}
                      {req.type === 'engagement' && `${req.value}%+ engagement rate`}
                      {req.type === 'posts' && `Commit to ${req.value}+ posts`}
                      {req.type === 'niche' && `${req.value} content focus`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form className="apply-form">
            <div className="form-group">
              <label>Why do you want to join this campaign?</label>
              <textarea placeholder="Tell the campaign owner why you'd be a great fit..." rows={4} />
            </div>

            <div className="form-group">
              <label>Select Account to Apply With</label>
              <select>
                <option>Select an account...</option>
                {feeds.map(f => (
                  <option key={f.id} value={f.id}>
                    {PLATFORMS[f.platform]?.icon} @{f.handle}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setCurrentView('find')}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EarnExTab;
