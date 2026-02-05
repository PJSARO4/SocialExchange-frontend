'use client';

import React, { useState } from 'react';
import { Feed, PLATFORMS } from '../../types/feed';

interface AnalyticsModalProps {
  feed: Feed;
  onClose: () => void;
}

export default function AnalyticsModal({ feed, onClose }: AnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'content' | 'audience' | 'compare'>('overview');
  const platform = PLATFORMS[feed.platform];

  // Calculate some derived metrics
  const engagementRate = feed.metrics.engagement || 4.2;
  const avgLikesPerPost = feed.metrics.avgLikes || Math.round((feed.metrics.followers || 1500) * (engagementRate / 100) * 0.8);
  const avgCommentsPerPost = feed.metrics.avgComments || Math.round((feed.metrics.followers || 1500) * (engagementRate / 100) * 0.2);

  // Growth data for chart
  const growthData = [
    { month: 'Aug', followers: 890 },
    { month: 'Sep', followers: 1050 },
    { month: 'Oct', followers: 1180 },
    { month: 'Nov', followers: 1320 },
    { month: 'Dec', followers: 1410 },
    { month: 'Jan', followers: feed.metrics.followers || 1520 }
  ];

  const contentPerformance = [
    { type: 'Reels', avgEngagement: 6.8, reach: '12.5K', posts: 15 },
    { type: 'Carousels', avgEngagement: 5.2, reach: '8.2K', posts: 23 },
    { type: 'Photos', avgEngagement: 3.9, reach: '5.1K', posts: 45 },
    { type: 'Stories', avgEngagement: 2.8, reach: '3.2K', posts: 120 }
  ];

  const audienceData = {
    demographics: {
      ages: [
        { range: '13-17', percent: 5 },
        { range: '18-24', percent: 35 },
        { range: '25-34', percent: 40 },
        { range: '35-44', percent: 15 },
        { range: '45+', percent: 5 }
      ],
      gender: { female: 62, male: 36, other: 2 },
      topCities: ['Los Angeles', 'New York', 'London', 'Miami', 'Chicago']
    }
  };

  const maxFollowers = Math.max(...growthData.map(d => d.followers));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content analytics-modal enhanced"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="analytics-modal-title">
            <span
              className="analytics-platform-badge"
              style={{ backgroundColor: platform.color }}
            >
              {platform.icon}
            </span>
            <div>
              <h2 className="modal-title">ANALYTICS</h2>
              <span className="analytics-handle">{feed.handle}</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="analytics-tabs">
          <button
            className={`analytics-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`analytics-tab ${activeTab === 'growth' ? 'active' : ''}`}
            onClick={() => setActiveTab('growth')}
          >
            📈 Growth
          </button>
          <button
            className={`analytics-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            📸 Content
          </button>
          <button
            className={`analytics-tab ${activeTab === 'audience' ? 'active' : ''}`}
            onClick={() => setActiveTab('audience')}
          >
            👥 Audience
          </button>
          <button
            className={`analytics-tab ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            ⚖️ Compare
          </button>
        </div>

        <div className="modal-body analytics-body">
          {activeTab === 'overview' && (
            <>
              {/* Overview Stats */}
              <section className="analytics-section">
                <h3 className="analytics-section-title">OVERVIEW</h3>
                <div className="analytics-stats-grid">
                  <div className="analytics-stat-card">
                    <div className="analytics-stat-value">
                      {formatNumber(feed.metrics.followers || 1520)}
                    </div>
                    <div className="analytics-stat-label">Followers</div>
                    <div className="analytics-stat-change positive">+2.4%</div>
                  </div>
                  <div className="analytics-stat-card">
                    <div className="analytics-stat-value">
                      {formatNumber(feed.metrics.following || 423)}
                    </div>
                    <div className="analytics-stat-label">Following</div>
                  </div>
                  <div className="analytics-stat-card">
                    <div className="analytics-stat-value">
                      {formatNumber(feed.metrics.totalPosts || 83)}
                    </div>
                    <div className="analytics-stat-label">Total Posts</div>
                  </div>
                  <div className="analytics-stat-card highlight">
                    <div className="analytics-stat-value">{engagementRate.toFixed(1)}%</div>
                    <div className="analytics-stat-label">Engagement Rate</div>
                    <div className="analytics-stat-change positive">+0.3%</div>
                  </div>
                </div>
              </section>

              {/* Engagement Breakdown */}
              <section className="analytics-section">
                <h3 className="analytics-section-title">ENGAGEMENT BREAKDOWN</h3>
                <div className="analytics-engagement-grid">
                  <div className="analytics-engagement-item">
                    <span className="analytics-engagement-icon">❤️</span>
                    <div className="analytics-engagement-info">
                      <span className="analytics-engagement-value">
                        {formatNumber(avgLikesPerPost)}
                      </span>
                      <span className="analytics-engagement-label">Avg. Likes/Post</span>
                    </div>
                  </div>
                  <div className="analytics-engagement-item">
                    <span className="analytics-engagement-icon">💬</span>
                    <div className="analytics-engagement-info">
                      <span className="analytics-engagement-value">
                        {formatNumber(avgCommentsPerPost)}
                      </span>
                      <span className="analytics-engagement-label">Avg. Comments/Post</span>
                    </div>
                  </div>
                  <div className="analytics-engagement-item">
                    <span className="analytics-engagement-icon">📤</span>
                    <div className="analytics-engagement-info">
                      <span className="analytics-engagement-value">
                        {feed.metrics.postsPerWeek || 3}
                      </span>
                      <span className="analytics-engagement-label">Posts/Week</span>
                    </div>
                  </div>
                  <div className="analytics-engagement-item">
                    <span className="analytics-engagement-icon">👁️</span>
                    <div className="analytics-engagement-info">
                      <span className="analytics-engagement-value">
                        {formatNumber(Math.round((feed.metrics.followers || 1500) * 0.35))}
                      </span>
                      <span className="analytics-engagement-label">Avg. Reach</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Best Posting Times */}
              <section className="analytics-section">
                <h3 className="analytics-section-title">BEST POSTING TIMES</h3>
                <div className="analytics-times-grid">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="analytics-day-col">
                      <div className="analytics-day-label">{day}</div>
                      <div className="analytics-day-blocks">
                        {[9, 12, 15, 18, 21].map((hour) => {
                          // Use consistent values based on day and hour
                          const intensity = ((day.charCodeAt(0) + hour) % 10) / 10;
                          return (
                            <div
                              key={hour}
                              className="analytics-time-block"
                              style={{
                                opacity: 0.2 + intensity * 0.8,
                                backgroundColor: intensity > 0.7 ? '#00ff88' : intensity > 0.4 ? '#00cc66' : '#004422',
                              }}
                              title={`${day} ${hour}:00 - ${Math.round(intensity * 100)}% engagement`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="analytics-times-legend">
                  <span className="analytics-legend-item">
                    <span className="analytics-legend-color" style={{ backgroundColor: '#004422' }} />
                    Low
                  </span>
                  <span className="analytics-legend-item">
                    <span className="analytics-legend-color" style={{ backgroundColor: '#00cc66' }} />
                    Medium
                  </span>
                  <span className="analytics-legend-item">
                    <span className="analytics-legend-color" style={{ backgroundColor: '#00ff88' }} />
                    High
                  </span>
                </div>
              </section>

              {/* Account Health */}
              <section className="analytics-section">
                <h3 className="analytics-section-title">ACCOUNT HEALTH</h3>
                <div className="analytics-health">
                  <div className="analytics-health-score">
                    <div className="analytics-health-ring">
                      <svg viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#1a2a3a"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#00ff88"
                          strokeWidth="3"
                          strokeDasharray="85, 100"
                        />
                      </svg>
                      <div className="analytics-health-value">85</div>
                    </div>
                    <div className="analytics-health-label">Health Score</div>
                  </div>
                  <div className="analytics-health-factors">
                    <div className="analytics-health-factor good">
                      <span className="factor-icon">✓</span>
                      <span className="factor-text">Consistent posting schedule</span>
                    </div>
                    <div className="analytics-health-factor good">
                      <span className="factor-icon">✓</span>
                      <span className="factor-text">Good engagement rate</span>
                    </div>
                    <div className="analytics-health-factor warning">
                      <span className="factor-icon">!</span>
                      <span className="factor-text">Could use more hashtags</span>
                    </div>
                    <div className="analytics-health-factor good">
                      <span className="factor-icon">✓</span>
                      <span className="factor-text">Active community interaction</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'growth' && (
            <>
              <section className="analytics-section">
                <h3 className="analytics-section-title">FOLLOWER GROWTH</h3>
                <div className="growth-summary">
                  <div className="growth-stat">
                    <span className="growth-value">+{formatNumber((feed.metrics.followers || 1520) - 890)}</span>
                    <span className="growth-label">Last 6 Months</span>
                  </div>
                  <div className="growth-stat">
                    <span className="growth-value">+70.8%</span>
                    <span className="growth-label">Growth Rate</span>
                  </div>
                  <div className="growth-stat">
                    <span className="growth-value">~105</span>
                    <span className="growth-label">Avg. New/Month</span>
                  </div>
                </div>
                <div className="growth-chart">
                  <div className="chart-container">
                    {growthData.map((data, index) => (
                      <div key={data.month} className="chart-bar-wrapper">
                        <div
                          className="chart-bar"
                          style={{ height: `${(data.followers / maxFollowers) * 100}%` }}
                        >
                          <span className="chart-value">{formatNumber(data.followers)}</span>
                        </div>
                        <span className="chart-label">{data.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="analytics-section">
                <h3 className="analytics-section-title">GROWTH PROJECTIONS</h3>
                <div className="projections-grid">
                  <div className="projection-card">
                    <span className="projection-icon">🎯</span>
                    <div className="projection-info">
                      <span className="projection-value">{formatNumber(Math.round((feed.metrics.followers || 1520) * 1.5))}</span>
                      <span className="projection-label">3-Month Projection</span>
                    </div>
                  </div>
                  <div className="projection-card">
                    <span className="projection-icon">🚀</span>
                    <div className="projection-info">
                      <span className="projection-value">{formatNumber(Math.round((feed.metrics.followers || 1520) * 2.2))}</span>
                      <span className="projection-label">6-Month Projection</span>
                    </div>
                  </div>
                  <div className="projection-card">
                    <span className="projection-icon">⭐</span>
                    <div className="projection-info">
                      <span className="projection-value">{formatNumber(Math.round((feed.metrics.followers || 1520) * 3.5))}</span>
                      <span className="projection-label">12-Month Projection</span>
                    </div>
                  </div>
                </div>
                <p className="projections-note">* Based on current growth trends. Actual results may vary.</p>
              </section>

              <section className="analytics-section">
                <h3 className="analytics-section-title">MILESTONES</h3>
                <div className="milestones-timeline">
                  <div className="milestone completed">
                    <span className="milestone-icon">✓</span>
                    <div className="milestone-info">
                      <span className="milestone-value">1K Followers</span>
                      <span className="milestone-date">Reached Dec 2025</span>
                    </div>
                  </div>
                  <div className="milestone current">
                    <span className="milestone-icon">●</span>
                    <div className="milestone-info">
                      <span className="milestone-value">2K Followers</span>
                      <span className="milestone-date">~480 to go</span>
                    </div>
                    <div className="milestone-progress">
                      <div className="milestone-bar" style={{ width: '76%' }}></div>
                    </div>
                  </div>
                  <div className="milestone upcoming">
                    <span className="milestone-icon">○</span>
                    <div className="milestone-info">
                      <span className="milestone-value">5K Followers</span>
                      <span className="milestone-date">Projected: Jul 2026</span>
                    </div>
                  </div>
                  <div className="milestone upcoming">
                    <span className="milestone-icon">○</span>
                    <div className="milestone-info">
                      <span className="milestone-value">10K Followers</span>
                      <span className="milestone-date">Projected: Jan 2027</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'content' && (
            <>
              <section className="analytics-section">
                <h3 className="analytics-section-title">CONTENT PERFORMANCE</h3>
                <div className="content-performance-table">
                  <div className="table-header">
                    <span>Content Type</span>
                    <span>Avg. Engagement</span>
                    <span>Avg. Reach</span>
                    <span>Total Posts</span>
                  </div>
                  {contentPerformance.map((item, index) => (
                    <div key={item.type} className={`table-row ${index === 0 ? 'top-performer' : ''}`}>
                      <span className="content-type">
                        {index === 0 && <span className="top-badge">🏆</span>}
                        {item.type}
                      </span>
                      <span className="engagement-rate">{item.avgEngagement}%</span>
                      <span className="reach">{item.reach}</span>
                      <span className="posts-count">{item.posts}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="analytics-section">
                <h3 className="analytics-section-title">TOP PERFORMING POSTS</h3>
                <div className="top-posts-grid">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="top-post-card">
                      <div className="post-thumbnail">
                        <img src={`https://picsum.photos/150/150?random=${i}`} alt="Top post" />
                        <span className="post-rank">#{i}</span>
                      </div>
                      <div className="post-stats">
                        <span>❤️ {formatNumber(Math.round(Math.random() * 500 + 100))}</span>
                        <span>💬 {Math.round(Math.random() * 50 + 10)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="analytics-section">
                <h3 className="analytics-section-title">CONTENT RECOMMENDATIONS</h3>
                <div className="recommendations-list">
                  <div className="recommendation-card">
                    <span className="rec-icon">🎬</span>
                    <div className="rec-content">
                      <h4>Post More Reels</h4>
                      <p>Your Reels get 74% more engagement than photos. Try posting 2-3 per week.</p>
                    </div>
                  </div>
                  <div className="recommendation-card">
                    <span className="rec-icon">📅</span>
                    <div className="rec-content">
                      <h4>Increase Posting Frequency</h4>
                      <p>Accounts posting 5+ times/week grow 40% faster. You're at 3/week.</p>
                    </div>
                  </div>
                  <div className="recommendation-card">
                    <span className="rec-icon">📑</span>
                    <div className="rec-content">
                      <h4>Try Carousel Posts</h4>
                      <p>Carousels get saved 3x more often. Great for educational content!</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'audience' && (
            <>
              <section className="analytics-section">
                <h3 className="analytics-section-title">AGE DISTRIBUTION</h3>
                <div className="age-chart">
                  {audienceData.demographics.ages.map((age) => (
                    <div key={age.range} className="age-bar-row">
                      <span className="age-label">{age.range}</span>
                      <div className="age-bar-container">
                        <div
                          className="age-bar"
                          style={{ width: `${age.percent}%` }}
                        ></div>
                      </div>
                      <span className="age-percent">{age.percent}%</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="analytics-section">
                <h3 className="analytics-section-title">GENDER SPLIT</h3>
                <div className="gender-chart">
                  <div className="gender-bar">
                    <div
                      className="gender-segment female"
                      style={{ width: `${audienceData.demographics.gender.female}%` }}
                    >
                      <span>Female {audienceData.demographics.gender.female}%</span>
                    </div>
                    <div
                      className="gender-segment male"
                      style={{ width: `${audienceData.demographics.gender.male}%` }}
                    >
                      <span>Male {audienceData.demographics.gender.male}%</span>
                    </div>
                    <div
                      className="gender-segment other"
                      style={{ width: `${audienceData.demographics.gender.other}%` }}
                    >
                    </div>
                  </div>
                </div>
              </section>

              <section className="analytics-section">
                <h3 className="analytics-section-title">TOP LOCATIONS</h3>
                <div className="locations-list">
                  {audienceData.demographics.topCities.map((city, index) => (
                    <div key={city} className="location-item">
                      <span className="location-rank">{index + 1}</span>
                      <span className="location-name">{city}</span>
                      <span className="location-percent">{Math.round(25 - index * 4)}%</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="analytics-section">
                <h3 className="analytics-section-title">AUDIENCE ACTIVITY</h3>
                <div className="activity-insights">
                  <div className="activity-card">
                    <span className="activity-icon">🌅</span>
                    <div className="activity-info">
                      <span className="activity-title">Most Active Time</span>
                      <span className="activity-value">5 PM - 9 PM</span>
                    </div>
                  </div>
                  <div className="activity-card">
                    <span className="activity-icon">📱</span>
                    <div className="activity-info">
                      <span className="activity-title">Most Active Day</span>
                      <span className="activity-value">Thursday</span>
                    </div>
                  </div>
                  <div className="activity-card">
                    <span className="activity-icon">🌍</span>
                    <div className="activity-info">
                      <span className="activity-title">Primary Timezone</span>
                      <span className="activity-value">PST (UTC-8)</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'compare' && (
            <>
              <section className="analytics-section">
                <h3 className="analytics-section-title">COMPARE ACCOUNTS</h3>
                <p className="analytics-section-desc">
                  Compare your metrics against competitors or your other accounts
                </p>

                <div className="compare-accounts-selector">
                  <div className="compare-account-card selected">
                    <span className="compare-account-avatar" style={{ backgroundColor: platform.color }}>
                      {platform.icon}
                    </span>
                    <div className="compare-account-info">
                      <span className="compare-account-handle">{feed.handle}</span>
                      <span className="compare-account-label">Your Account</span>
                    </div>
                    <span className="compare-account-check">✓</span>
                  </div>
                  <div className="compare-vs">VS</div>
                  <div className="compare-account-card add-account">
                    <span className="compare-account-avatar">+</span>
                    <div className="compare-account-info">
                      <span className="compare-account-handle">Add Account</span>
                      <span className="compare-account-label">Click to compare</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="analytics-section">
                <h3 className="analytics-section-title">BENCHMARKS</h3>
                <p className="analytics-section-desc">How you compare to average accounts in your niche</p>

                <div className="benchmark-grid">
                  <div className="benchmark-item">
                    <div className="benchmark-header">
                      <span className="benchmark-metric">Engagement Rate</span>
                      <span className="benchmark-badge above">Above Avg</span>
                    </div>
                    <div className="benchmark-bar-container">
                      <div className="benchmark-bar-bg">
                        <div className="benchmark-bar-avg" style={{ left: '50%' }}>
                          <span className="benchmark-avg-label">Avg: 3.5%</span>
                        </div>
                        <div className="benchmark-bar-yours" style={{ width: '70%' }}>
                          <span className="benchmark-yours-value">{engagementRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="benchmark-item">
                    <div className="benchmark-header">
                      <span className="benchmark-metric">Posting Frequency</span>
                      <span className="benchmark-badge at">At Avg</span>
                    </div>
                    <div className="benchmark-bar-container">
                      <div className="benchmark-bar-bg">
                        <div className="benchmark-bar-avg" style={{ left: '50%' }}>
                          <span className="benchmark-avg-label">Avg: 3/week</span>
                        </div>
                        <div className="benchmark-bar-yours" style={{ width: '50%' }}>
                          <span className="benchmark-yours-value">{feed.metrics.postsPerWeek || 3}/week</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="benchmark-item">
                    <div className="benchmark-header">
                      <span className="benchmark-metric">Follower Growth</span>
                      <span className="benchmark-badge above">Above Avg</span>
                    </div>
                    <div className="benchmark-bar-container">
                      <div className="benchmark-bar-bg">
                        <div className="benchmark-bar-avg" style={{ left: '50%' }}>
                          <span className="benchmark-avg-label">Avg: +5%</span>
                        </div>
                        <div className="benchmark-bar-yours" style={{ width: '80%' }}>
                          <span className="benchmark-yours-value">+12%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="analytics-section">
                <h3 className="analytics-section-title">COMPETITOR INSIGHTS</h3>
                <div className="competitor-insights-empty">
                  <span className="competitor-insights-icon">👁️</span>
                  <h4>Track Competitors</h4>
                  <p>Add accounts in Observe mode to see competitor analytics</p>
                  <button className="competitor-add-btn">+ Add Competitor</button>
                </div>
              </section>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-button secondary" onClick={onClose}>
            CLOSE
          </button>
          <button type="button" className="modal-button primary">
            EXPORT REPORT
          </button>
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}
