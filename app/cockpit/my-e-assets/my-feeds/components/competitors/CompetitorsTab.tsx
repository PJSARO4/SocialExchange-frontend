'use client';

import React, { useState } from 'react';
import { Feed, PLATFORMS } from '../../types/feed';
import './competitors.css';

// ============================================
// TYPES
// ============================================

interface CompetitorsTabProps {
  feed?: Feed;
  feeds?: Feed[];
}

interface Competitor {
  id: string;
  handle: string;
  platform: string;
  displayName: string;
  avatarUrl?: string;
  addedAt: Date;
  metrics: {
    followers: number;
    following: number;
    posts: number;
    engagement: number;
    avgLikes: number;
    avgComments: number;
    postsPerWeek: number;
    followerGrowth: number;
  };
  topContent: ContentItem[];
  postingSchedule: PostingSchedule;
  contentMix: ContentMix;
  notes?: string;
}

interface ContentItem {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'reel';
  likes: number;
  comments: number;
  engagement: number;
  caption: string;
  postedAt: Date;
}

interface PostingSchedule {
  bestDays: string[];
  bestTimes: string[];
  frequency: number;
}

interface ContentMix {
  images: number;
  videos: number;
  carousels: number;
  reels: number;
}

interface Insight {
  id: string;
  type: 'opportunity' | 'threat' | 'trend' | 'tip';
  title: string;
  description: string;
  relatedCompetitor?: string;
  actionable: boolean;
}

type CompetitorView = 'overview' | 'detail' | 'add' | 'compare';

// ============================================
// MOCK DATA
// ============================================

const MOCK_COMPETITORS: Competitor[] = [
  {
    id: 'comp-1',
    handle: '@lifestyle_guru',
    platform: 'instagram',
    displayName: 'Lifestyle Guru',
    addedAt: new Date('2024-05-01'),
    metrics: {
      followers: 125000,
      following: 892,
      posts: 1543,
      engagement: 4.8,
      avgLikes: 5200,
      avgComments: 234,
      postsPerWeek: 7,
      followerGrowth: 2.3,
    },
    topContent: [
      { id: 'tc1', type: 'carousel', likes: 12400, comments: 456, engagement: 10.3, caption: 'Morning routine that changed my life...', postedAt: new Date() },
      { id: 'tc2', type: 'reel', likes: 28900, comments: 892, engagement: 23.8, caption: 'POV: When you finally get your life together', postedAt: new Date() },
      { id: 'tc3', type: 'image', likes: 8700, comments: 312, engagement: 7.2, caption: 'Golden hour hits different ✨', postedAt: new Date() },
    ],
    postingSchedule: {
      bestDays: ['Tuesday', 'Thursday', 'Saturday'],
      bestTimes: ['9:00 AM', '12:00 PM', '7:00 PM'],
      frequency: 7,
    },
    contentMix: { images: 30, videos: 15, carousels: 35, reels: 20 },
  },
  {
    id: 'comp-2',
    handle: '@creative_studio',
    platform: 'instagram',
    displayName: 'Creative Studio',
    addedAt: new Date('2024-04-15'),
    metrics: {
      followers: 89000,
      following: 456,
      posts: 892,
      engagement: 5.2,
      avgLikes: 4100,
      avgComments: 189,
      postsPerWeek: 5,
      followerGrowth: 3.1,
    },
    topContent: [
      { id: 'tc4', type: 'video', likes: 15600, comments: 567, engagement: 18.2, caption: 'Behind the scenes of our latest shoot', postedAt: new Date() },
      { id: 'tc5', type: 'carousel', likes: 9800, comments: 234, engagement: 11.3, caption: 'Before and after transformations', postedAt: new Date() },
    ],
    postingSchedule: {
      bestDays: ['Monday', 'Wednesday', 'Friday'],
      bestTimes: ['10:00 AM', '2:00 PM', '6:00 PM'],
      frequency: 5,
    },
    contentMix: { images: 25, videos: 30, carousels: 30, reels: 15 },
  },
  {
    id: 'comp-3',
    handle: '@tech_insider',
    platform: 'twitter',
    displayName: 'Tech Insider',
    addedAt: new Date('2024-06-01'),
    metrics: {
      followers: 245000,
      following: 1234,
      posts: 5678,
      engagement: 3.2,
      avgLikes: 2300,
      avgComments: 456,
      postsPerWeek: 14,
      followerGrowth: 1.8,
    },
    topContent: [
      { id: 'tc6', type: 'image', likes: 8900, comments: 789, engagement: 4.0, caption: 'Breaking: New AI development...', postedAt: new Date() },
    ],
    postingSchedule: {
      bestDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      bestTimes: ['8:00 AM', '12:00 PM', '5:00 PM'],
      frequency: 14,
    },
    contentMix: { images: 60, videos: 10, carousels: 20, reels: 10 },
  },
];

const MOCK_INSIGHTS: Insight[] = [
  {
    id: 'ins-1',
    type: 'opportunity',
    title: 'Carousel content gap',
    description: '@lifestyle_guru gets 2x engagement on carousels but you rarely post them. Consider increasing carousel content.',
    relatedCompetitor: '@lifestyle_guru',
    actionable: true,
  },
  {
    id: 'ins-2',
    type: 'trend',
    title: 'Reels are dominating',
    description: 'Competitors are seeing 3x higher reach on Reels. Your current Reels make up only 10% of content.',
    actionable: true,
  },
  {
    id: 'ins-3',
    type: 'tip',
    title: 'Optimal posting time',
    description: 'Most competitors post between 6-8 PM. Consider shifting your schedule to match peak engagement hours.',
    actionable: true,
  },
  {
    id: 'ins-4',
    type: 'threat',
    title: '@creative_studio growing fast',
    description: 'This competitor has 3.1% weekly growth, significantly higher than average. Monitor their strategy.',
    relatedCompetitor: '@creative_studio',
    actionable: false,
  },
];

// ============================================
// COMPONENT
// ============================================

export const CompetitorsTab: React.FC<CompetitorsTabProps> = ({ feed, feeds = [] }) => {
  const [currentView, setCurrentView] = useState<CompetitorView>('overview');
  const [competitors, setCompetitors] = useState<Competitor[]>(MOCK_COMPETITORS);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [insights] = useState<Insight[]>(MOCK_INSIGHTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCompetitorHandle, setNewCompetitorHandle] = useState('');
  const [newCompetitorPlatform, setNewCompetitorPlatform] = useState('instagram');

  const handleViewCompetitor = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setCurrentView('detail');
  };

  const handleAddCompetitor = () => {
    if (!newCompetitorHandle.trim()) return;

    const newCompetitor: Competitor = {
      id: `comp-${Date.now()}`,
      handle: newCompetitorHandle.startsWith('@') ? newCompetitorHandle : `@${newCompetitorHandle}`,
      platform: newCompetitorPlatform,
      displayName: newCompetitorHandle.replace('@', ''),
      addedAt: new Date(),
      metrics: {
        followers: Math.floor(Math.random() * 100000) + 10000,
        following: Math.floor(Math.random() * 1000) + 100,
        posts: Math.floor(Math.random() * 1000) + 100,
        engagement: Math.random() * 5 + 2,
        avgLikes: Math.floor(Math.random() * 5000) + 500,
        avgComments: Math.floor(Math.random() * 200) + 50,
        postsPerWeek: Math.floor(Math.random() * 10) + 3,
        followerGrowth: Math.random() * 3 + 0.5,
      },
      topContent: [],
      postingSchedule: {
        bestDays: ['Monday', 'Wednesday', 'Friday'],
        bestTimes: ['9:00 AM', '6:00 PM'],
        frequency: 5,
      },
      contentMix: { images: 40, videos: 20, carousels: 25, reels: 15 },
    };

    setCompetitors([...competitors, newCompetitor]);
    setNewCompetitorHandle('');
    setCurrentView('overview');
  };

  const handleRemoveCompetitor = (competitorId: string) => {
    setCompetitors(competitors.filter(c => c.id !== competitorId));
    if (selectedCompetitor?.id === competitorId) {
      setSelectedCompetitor(null);
      setCurrentView('overview');
    }
  };

  // Calculate comparison metrics
  const avgCompetitorFollowers = competitors.length > 0
    ? Math.round(competitors.reduce((sum, c) => sum + c.metrics.followers, 0) / competitors.length)
    : 0;
  const avgCompetitorEngagement = competitors.length > 0
    ? (competitors.reduce((sum, c) => sum + c.metrics.engagement, 0) / competitors.length).toFixed(1)
    : '0';

  const userFollowers = feed?.metrics?.followers || 0;
  const userEngagement = feed?.metrics?.engagement || 0;

  return (
    <div className="competitors-container">
      {/* Breadcrumb */}
      {currentView !== 'overview' && (
        <div className="competitors-breadcrumb">
          <button onClick={() => setCurrentView('overview')}>Competitors</button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">
            {currentView === 'detail' && selectedCompetitor?.handle}
            {currentView === 'add' && 'Add Competitor'}
            {currentView === 'compare' && 'Compare'}
          </span>
        </div>
      )}

      {/* OVERVIEW VIEW */}
      {currentView === 'overview' && (
        <div className="competitors-overview">
          <div className="competitors-header">
            <div className="header-content">
              <h1>Competitors</h1>
              <p>Track and analyze your competition</p>
            </div>
            <div className="header-actions">
              <button className="compare-btn" onClick={() => setCurrentView('compare')} disabled={competitors.length < 2}>
                📊 Compare All
              </button>
              <button className="add-btn" onClick={() => setCurrentView('add')}>
                + Add Competitor
              </button>
            </div>
          </div>

          {/* Quick Stats Comparison */}
          {feed && competitors.length > 0 && (
            <div className="comparison-summary">
              <h3>Your Position vs Competitors</h3>
              <div className="comparison-cards">
                <div className="comparison-card">
                  <span className="comparison-label">Your Followers</span>
                  <span className="comparison-value yours">{userFollowers.toLocaleString()}</span>
                  <span className={`comparison-diff ${userFollowers > avgCompetitorFollowers ? 'positive' : 'negative'}`}>
                    {userFollowers > avgCompetitorFollowers ? '+' : ''}{((userFollowers - avgCompetitorFollowers) / avgCompetitorFollowers * 100).toFixed(1)}% vs avg
                  </span>
                </div>
                <div className="comparison-card">
                  <span className="comparison-label">Avg Competitor</span>
                  <span className="comparison-value">{avgCompetitorFollowers.toLocaleString()}</span>
                  <span className="comparison-sublabel">followers</span>
                </div>
                <div className="comparison-card">
                  <span className="comparison-label">Your Engagement</span>
                  <span className="comparison-value yours">{userEngagement.toFixed(1)}%</span>
                  <span className={`comparison-diff ${userEngagement > parseFloat(avgCompetitorEngagement) ? 'positive' : 'negative'}`}>
                    {userEngagement > parseFloat(avgCompetitorEngagement) ? '+' : ''}{(userEngagement - parseFloat(avgCompetitorEngagement)).toFixed(1)}% vs avg
                  </span>
                </div>
                <div className="comparison-card">
                  <span className="comparison-label">Avg Competitor</span>
                  <span className="comparison-value">{avgCompetitorEngagement}%</span>
                  <span className="comparison-sublabel">engagement</span>
                </div>
              </div>
            </div>
          )}

          {/* Insights Section */}
          {insights.length > 0 && (
            <div className="insights-section">
              <h3>💡 AI Insights</h3>
              <div className="insights-list">
                {insights.map(insight => (
                  <div key={insight.id} className={`insight-card ${insight.type}`}>
                    <div className="insight-icon">
                      {insight.type === 'opportunity' && '🎯'}
                      {insight.type === 'threat' && '⚠️'}
                      {insight.type === 'trend' && '📈'}
                      {insight.type === 'tip' && '💡'}
                    </div>
                    <div className="insight-content">
                      <h4>{insight.title}</h4>
                      <p>{insight.description}</p>
                      {insight.relatedCompetitor && (
                        <span className="insight-competitor">{insight.relatedCompetitor}</span>
                      )}
                    </div>
                    {insight.actionable && (
                      <button className="insight-action">Take Action</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitors List */}
          <div className="competitors-list-section">
            <div className="list-header">
              <h3>Tracked Competitors ({competitors.length})</h3>
              <div className="list-search">
                <input
                  type="text"
                  placeholder="Search competitors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {competitors.length > 0 ? (
              <div className="competitors-grid">
                {competitors
                  .filter(c => c.handle.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(competitor => (
                    <div key={competitor.id} className="competitor-card" onClick={() => handleViewCompetitor(competitor)}>
                      <div className="competitor-card-header">
                        <div className="competitor-identity">
                          <div className="competitor-avatar">
                            {competitor.avatarUrl ? (
                              <img src={competitor.avatarUrl} alt={competitor.handle} />
                            ) : (
                              <span>{competitor.handle[1]?.toUpperCase()}</span>
                            )}
                          </div>
                          <div className="competitor-info">
                            <span className="competitor-handle">{competitor.handle}</span>
                            <span className="competitor-platform">
                              {PLATFORMS[competitor.platform as keyof typeof PLATFORMS]?.icon}
                              {PLATFORMS[competitor.platform as keyof typeof PLATFORMS]?.label}
                            </span>
                          </div>
                        </div>
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCompetitor(competitor.id);
                          }}
                        >
                          ×
                        </button>
                      </div>

                      <div className="competitor-metrics">
                        <div className="metric">
                          <span className="metric-value">{competitor.metrics.followers.toLocaleString()}</span>
                          <span className="metric-label">Followers</span>
                        </div>
                        <div className="metric">
                          <span className="metric-value">{competitor.metrics.engagement.toFixed(1)}%</span>
                          <span className="metric-label">Engagement</span>
                        </div>
                        <div className="metric">
                          <span className="metric-value">{competitor.metrics.postsPerWeek}/wk</span>
                          <span className="metric-label">Posts</span>
                        </div>
                        <div className="metric">
                          <span className={`metric-value growth ${competitor.metrics.followerGrowth > 2 ? 'high' : ''}`}>
                            +{competitor.metrics.followerGrowth.toFixed(1)}%
                          </span>
                          <span className="metric-label">Growth</span>
                        </div>
                      </div>

                      <div className="competitor-card-footer">
                        <span className="added-date">Added {competitor.addedAt.toLocaleDateString()}</span>
                        <span className="view-link">View Details →</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👁️</div>
                <h3>No Competitors Tracked Yet</h3>
                <p>Start tracking competitor accounts to gain insights into their strategies</p>
                <button className="add-btn" onClick={() => setCurrentView('add')}>
                  + Add Your First Competitor
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD COMPETITOR VIEW */}
      {currentView === 'add' && (
        <div className="add-competitor-view">
          <div className="add-header">
            <h2>Add Competitor</h2>
            <p>Track a new competitor account</p>
          </div>

          <div className="add-form">
            <div className="form-group">
              <label>Platform</label>
              <div className="platform-options">
                {Object.entries(PLATFORMS).map(([key, platform]) => (
                  <button
                    key={key}
                    className={`platform-option ${newCompetitorPlatform === key ? 'selected' : ''}`}
                    onClick={() => setNewCompetitorPlatform(key)}
                  >
                    <span className="platform-icon">{platform.icon}</span>
                    <span className="platform-name">{platform.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Username / Handle</label>
              <div className="handle-input">
                <span className="handle-prefix">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={newCompetitorHandle.replace('@', '')}
                  onChange={(e) => setNewCompetitorHandle(e.target.value)}
                />
              </div>
              <span className="input-hint">Enter the competitor's username without the @ symbol</span>
            </div>

            <div className="form-actions">
              <button className="cancel-btn" onClick={() => setCurrentView('overview')}>
                Cancel
              </button>
              <button
                className="add-btn"
                onClick={handleAddCompetitor}
                disabled={!newCompetitorHandle.trim()}
              >
                Add Competitor
              </button>
            </div>
          </div>

          <div className="add-suggestions">
            <h3>Suggested Competitors</h3>
            <p>Based on your niche and audience</p>
            <div className="suggestions-list">
              {['@similar_creator', '@niche_leader', '@rising_star'].map(handle => (
                <button
                  key={handle}
                  className="suggestion-item"
                  onClick={() => setNewCompetitorHandle(handle)}
                >
                  <span className="suggestion-handle">{handle}</span>
                  <span className="suggestion-add">+ Add</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMPETITOR DETAIL VIEW */}
      {currentView === 'detail' && selectedCompetitor && (
        <div className="competitor-detail-view">
          <div className="detail-header">
            <div className="detail-identity">
              <div className="detail-avatar">
                {selectedCompetitor.avatarUrl ? (
                  <img src={selectedCompetitor.avatarUrl} alt={selectedCompetitor.handle} />
                ) : (
                  <span>{selectedCompetitor.handle[1]?.toUpperCase()}</span>
                )}
              </div>
              <div className="detail-info">
                <h2>{selectedCompetitor.handle}</h2>
                <span className="detail-platform">
                  {PLATFORMS[selectedCompetitor.platform as keyof typeof PLATFORMS]?.icon}
                  {PLATFORMS[selectedCompetitor.platform as keyof typeof PLATFORMS]?.label}
                </span>
              </div>
            </div>
            <div className="detail-actions">
              <button className="action-btn">Visit Profile</button>
              <button className="action-btn secondary" onClick={() => handleRemoveCompetitor(selectedCompetitor.id)}>
                Remove
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="detail-metrics">
            <h3>Account Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-value">{selectedCompetitor.metrics.followers.toLocaleString()}</span>
                <span className="metric-label">Followers</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{selectedCompetitor.metrics.following.toLocaleString()}</span>
                <span className="metric-label">Following</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{selectedCompetitor.metrics.posts.toLocaleString()}</span>
                <span className="metric-label">Posts</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{selectedCompetitor.metrics.engagement.toFixed(1)}%</span>
                <span className="metric-label">Engagement</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{selectedCompetitor.metrics.avgLikes.toLocaleString()}</span>
                <span className="metric-label">Avg Likes</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{selectedCompetitor.metrics.avgComments.toLocaleString()}</span>
                <span className="metric-label">Avg Comments</span>
              </div>
              <div className="metric-card highlight">
                <span className="metric-value">+{selectedCompetitor.metrics.followerGrowth.toFixed(1)}%</span>
                <span className="metric-label">Weekly Growth</span>
              </div>
              <div className="metric-card">
                <span className="metric-value">{selectedCompetitor.metrics.postsPerWeek}/wk</span>
                <span className="metric-label">Post Frequency</span>
              </div>
            </div>
          </div>

          {/* Content Mix */}
          <div className="detail-content-mix">
            <h3>Content Mix</h3>
            <div className="content-mix-bars">
              <div className="mix-bar">
                <span className="mix-label">Images</span>
                <div className="mix-progress">
                  <div className="mix-fill images" style={{ width: `${selectedCompetitor.contentMix.images}%` }} />
                </div>
                <span className="mix-percent">{selectedCompetitor.contentMix.images}%</span>
              </div>
              <div className="mix-bar">
                <span className="mix-label">Videos</span>
                <div className="mix-progress">
                  <div className="mix-fill videos" style={{ width: `${selectedCompetitor.contentMix.videos}%` }} />
                </div>
                <span className="mix-percent">{selectedCompetitor.contentMix.videos}%</span>
              </div>
              <div className="mix-bar">
                <span className="mix-label">Carousels</span>
                <div className="mix-progress">
                  <div className="mix-fill carousels" style={{ width: `${selectedCompetitor.contentMix.carousels}%` }} />
                </div>
                <span className="mix-percent">{selectedCompetitor.contentMix.carousels}%</span>
              </div>
              <div className="mix-bar">
                <span className="mix-label">Reels</span>
                <div className="mix-progress">
                  <div className="mix-fill reels" style={{ width: `${selectedCompetitor.contentMix.reels}%` }} />
                </div>
                <span className="mix-percent">{selectedCompetitor.contentMix.reels}%</span>
              </div>
            </div>
          </div>

          {/* Posting Schedule */}
          <div className="detail-schedule">
            <h3>Posting Schedule</h3>
            <div className="schedule-info">
              <div className="schedule-item">
                <span className="schedule-label">Best Days</span>
                <div className="schedule-values">
                  {selectedCompetitor.postingSchedule.bestDays.map(day => (
                    <span key={day} className="schedule-tag">{day}</span>
                  ))}
                </div>
              </div>
              <div className="schedule-item">
                <span className="schedule-label">Best Times</span>
                <div className="schedule-values">
                  {selectedCompetitor.postingSchedule.bestTimes.map(time => (
                    <span key={time} className="schedule-tag">{time}</span>
                  ))}
                </div>
              </div>
              <div className="schedule-item">
                <span className="schedule-label">Frequency</span>
                <span className="schedule-frequency">{selectedCompetitor.postingSchedule.frequency} posts/week</span>
              </div>
            </div>
          </div>

          {/* Top Content */}
          {selectedCompetitor.topContent.length > 0 && (
            <div className="detail-top-content">
              <h3>Top Performing Content</h3>
              <div className="top-content-list">
                {selectedCompetitor.topContent.map(content => (
                  <div key={content.id} className="top-content-item">
                    <div className="content-type">
                      {content.type === 'image' && '📷'}
                      {content.type === 'video' && '🎬'}
                      {content.type === 'carousel' && '📚'}
                      {content.type === 'reel' && '🎞️'}
                      <span>{content.type}</span>
                    </div>
                    <div className="content-preview">
                      <p>{content.caption}</p>
                    </div>
                    <div className="content-stats">
                      <span>❤️ {content.likes.toLocaleString()}</span>
                      <span>💬 {content.comments.toLocaleString()}</span>
                      <span className="engagement">{content.engagement.toFixed(1)}% eng</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMPARE VIEW */}
      {currentView === 'compare' && (
        <div className="compare-view">
          <div className="compare-header">
            <h2>Compare Competitors</h2>
            <p>Side-by-side analysis of all tracked competitors</p>
          </div>

          <div className="compare-table">
            <div className="compare-row header">
              <div className="compare-cell label">Metric</div>
              {feed && <div className="compare-cell you">You</div>}
              {competitors.map(c => (
                <div key={c.id} className="compare-cell">{c.handle}</div>
              ))}
            </div>
            <div className="compare-row">
              <div className="compare-cell label">Followers</div>
              {feed && <div className="compare-cell you">{(feed.metrics?.followers || 0).toLocaleString()}</div>}
              {competitors.map(c => (
                <div key={c.id} className="compare-cell">{c.metrics.followers.toLocaleString()}</div>
              ))}
            </div>
            <div className="compare-row">
              <div className="compare-cell label">Engagement</div>
              {feed && <div className="compare-cell you">{(feed.metrics?.engagement || 0).toFixed(1)}%</div>}
              {competitors.map(c => (
                <div key={c.id} className="compare-cell">{c.metrics.engagement.toFixed(1)}%</div>
              ))}
            </div>
            <div className="compare-row">
              <div className="compare-cell label">Posts/Week</div>
              {feed && <div className="compare-cell you">{feed.metrics?.postsPerWeek || 0}</div>}
              {competitors.map(c => (
                <div key={c.id} className="compare-cell">{c.metrics.postsPerWeek}</div>
              ))}
            </div>
            <div className="compare-row">
              <div className="compare-cell label">Avg Likes</div>
              {feed && <div className="compare-cell you">--</div>}
              {competitors.map(c => (
                <div key={c.id} className="compare-cell">{c.metrics.avgLikes.toLocaleString()}</div>
              ))}
            </div>
            <div className="compare-row">
              <div className="compare-cell label">Growth Rate</div>
              {feed && <div className="compare-cell you">{(feed.metrics?.recentGrowth || 0).toFixed(1)}%</div>}
              {competitors.map(c => (
                <div key={c.id} className="compare-cell">+{c.metrics.followerGrowth.toFixed(1)}%</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorsTab;
