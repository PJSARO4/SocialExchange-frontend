'use client';

import { useState, useEffect } from 'react';
import { Feed, PLATFORMS, ControlMode } from '../../types/feed';
import { useFeeds } from '../../context/FeedsContext';
import ModeSelector from '../ModeSelector';

interface InstagramPost {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
}

interface FeedWorkspaceProps {
  feed: Feed;
  onNavigate?: (tab: 'workspace' | 'content' | 'scheduler') => void;
  onCreatePost?: () => void;
  onOpenAnalytics?: () => void;
  onOpenSettings?: () => void;
  onOpenScheduler?: () => void;
  onOpenCopilot?: () => void;
  onOpenAutomation?: () => void;
  onOpenContentFinder?: () => void;
  onOpenLinkEx?: () => void;
}

export default function FeedWorkspace({
  feed,
  onNavigate,
  onCreatePost,
  onOpenAnalytics,
  onOpenSettings,
  onOpenScheduler,
  onOpenCopilot,
  onOpenAutomation,
  onOpenContentFinder,
  onOpenLinkEx,
}: FeedWorkspaceProps) {
  const { updateFeed, toggleAutomation, setControlMode, removeFeed } = useFeeds();
  const platform = PLATFORMS[feed.platform];
  const [isEditing, setIsEditing] = useState(false);
  const [recentPosts, setRecentPosts] = useState<InstagramPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  // Fetch recent posts when feed changes (for OAuth accounts)
  useEffect(() => {
    if (feed.isOAuth && feed.accessToken && feed.platform === 'instagram') {
      setPostsLoading(true);
      fetch(`/api/instagram/media?access_token=${encodeURIComponent(feed.accessToken)}&limit=6`)
        .then(res => res.json())
        .then(data => {
          if (data.posts) {
            setRecentPosts(data.posts);
          }
        })
        .catch(err => console.error('Failed to fetch posts:', err))
        .finally(() => setPostsLoading(false));
    }
  }, [feed.id, feed.isOAuth, feed.accessToken, feed.platform]);

  const handleControlModeChange = async (mode: ControlMode) => {
    await setControlMode(feed.id, mode);
  };

  const handleToggleAutomation = async () => {
    await toggleAutomation(feed.id);
  };

  const controlModes: { mode: ControlMode; label: string; description: string }[] = [
    { mode: 'autopilot', label: 'AUTOPILOT', description: 'Full automation enabled' },
    { mode: 'escrow', label: 'ESCROW', description: 'Queued for review' },
    { mode: 'manual', label: 'MANUAL', description: 'Manual posting only' },
    { mode: 'observation', label: 'OBSERVE', description: 'Monitor only, no actions' },
  ];

  return (
    <div className="feed-workspace">
      {/* Header */}
      <div className="feed-workspace-header">
        <div className="feed-workspace-identity">
          {feed.avatarUrl ? (
            <div className="feed-workspace-avatar-container">
              <img
                src={feed.avatarUrl}
                alt={feed.displayName || feed.handle}
                className="feed-workspace-avatar"
              />
              <div
                className="feed-workspace-platform-indicator"
                style={{ backgroundColor: platform.color }}
              >
                {platform.icon}
              </div>
            </div>
          ) : (
            <div
              className="feed-workspace-platform-badge"
              style={{ backgroundColor: platform.color }}
            >
              {platform.icon}
            </div>
          )}
          <div className="feed-workspace-info">
            <h2 className="feed-workspace-handle">{feed.handle}</h2>
            <span className="feed-workspace-display-name">{feed.displayName}</span>
          </div>
        </div>

        <div className="feed-workspace-status">
          <span
            className={`feed-workspace-connection ${feed.connectionStatus}`}
          >
            {feed.connectionStatus.toUpperCase()}
          </span>
          {feed.lastSync && (
            <span className="feed-workspace-sync">
              Last sync: {formatRelativeTime(feed.lastSync)}
            </span>
          )}
        </div>
      </div>

      {/* Telemetry Section */}
      <section className="feed-workspace-section">
        <div className="feed-workspace-section-header">
          <h3 className="feed-workspace-section-title">TELEMETRY</h3>
        </div>
        <div className="feed-workspace-telemetry">
          <div className="telemetry-grid">
            <TelemetryCard
              label="FOLLOWERS"
              value={feed.metrics.followers}
              format="number"
            />
            <TelemetryCard
              label="ENGAGEMENT"
              value={feed.metrics.engagement}
              format="percent"
            />
            <TelemetryCard
              label="POSTS/WEEK"
              value={feed.metrics.postsPerWeek}
              format="number"
            />
            <TelemetryCard
              label="UPTIME"
              value={feed.metrics.uptime}
              format="percent"
            />
          </div>
        </div>
      </section>

      {/* Automation Section */}
      <section className="feed-workspace-section">
        <div className="feed-workspace-section-header">
          <h3 className="feed-workspace-section-title">AUTOMATION</h3>
        </div>
        <div className="feed-workspace-automation">
          {/* Arm/Disarm Toggle */}
          <div className="automation-toggle">
            <button
              className={`automation-toggle-btn ${feed.automationEnabled ? 'armed' : 'idle'}`}
              onClick={handleToggleAutomation}
            >
              <span className="automation-toggle-indicator">⦿</span>
              <span className="automation-toggle-label">
                {feed.automationEnabled ? 'ARMED' : 'IDLE'}
              </span>
            </button>
            <span className="automation-toggle-hint">
              {feed.automationEnabled
                ? 'Automation is active'
                : 'Click to enable automation'}
            </span>
          </div>

          {/* Control Mode Selection - Enhanced */}
          <div className="control-mode-selector">
            <div className="control-mode-label">OPERATING MODE</div>
            <ModeSelector
              currentMode={feed.controlMode}
              onModeChange={handleControlModeChange}
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="feed-workspace-section">
        <div className="feed-workspace-section-header">
          <h3 className="feed-workspace-section-title">QUICK ACTIONS</h3>
        </div>
        <div className="feed-workspace-actions">
          <button
            className="workspace-action-btn"
            onClick={onCreatePost}
          >
            <span className="workspace-action-icon">📝</span>
            <span className="workspace-action-label">Create Post</span>
          </button>
          <button
            className="workspace-action-btn"
            onClick={onOpenScheduler}
          >
            <span className="workspace-action-icon">📅</span>
            <span className="workspace-action-label">Scheduler</span>
          </button>
          <button
            className="workspace-action-btn"
            onClick={onOpenAnalytics}
          >
            <span className="workspace-action-icon">📊</span>
            <span className="workspace-action-label">Analytics</span>
          </button>
          <button
            className="workspace-action-btn"
            onClick={onOpenSettings}
          >
            <span className="workspace-action-icon">⚙️</span>
            <span className="workspace-action-label">Settings</span>
          </button>
        </div>
        <div className="feed-workspace-actions" style={{ marginTop: '0.75rem' }}>
          <button
            className="workspace-action-btn copilot"
            onClick={onOpenCopilot}
          >
            <span className="workspace-action-icon">🤖</span>
            <span className="workspace-action-label">AI Copilot</span>
          </button>
          <button
            className="workspace-action-btn automation"
            onClick={onOpenAutomation}
          >
            <span className="workspace-action-icon">⚡</span>
            <span className="workspace-action-label">Automation</span>
          </button>
          <button
            className="workspace-action-btn finder"
            onClick={onOpenContentFinder}
          >
            <span className="workspace-action-icon">🔍</span>
            <span className="workspace-action-label">Content Finder</span>
          </button>
          <button
            className="workspace-action-btn linkex"
            onClick={onOpenLinkEx}
          >
            <span className="workspace-action-icon">🔗</span>
            <span className="workspace-action-label">LinkEx</span>
          </button>
        </div>
      </section>

      {/* Recent Posts Section (for OAuth accounts) */}
      {feed.isOAuth && (
        <section className="feed-workspace-section">
          <div className="feed-workspace-section-header">
            <h3 className="feed-workspace-section-title">RECENT POSTS</h3>
            <button
              className="feed-workspace-section-action"
              onClick={() => onNavigate?.('content')}
            >
              VIEW ALL →
            </button>
          </div>
          <div className="feed-workspace-posts">
            {postsLoading ? (
              <div className="posts-loading">
                <div className="posts-loading-spinner" />
                <span>Loading posts...</span>
              </div>
            ) : recentPosts.length > 0 ? (
              <div className="posts-grid">
                {recentPosts.map((post) => (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="post-card"
                  >
                    <div className="post-card-media">
                      <img
                        src={post.thumbnailUrl || post.mediaUrl}
                        alt={post.caption?.substring(0, 50) || 'Instagram post'}
                      />
                      {post.mediaType === 'VIDEO' && (
                        <span className="post-card-type">▶️</span>
                      )}
                      {post.mediaType === 'CAROUSEL_ALBUM' && (
                        <span className="post-card-type">📑</span>
                      )}
                    </div>
                    <div className="post-card-stats">
                      <span className="post-stat">❤️ {formatNumber(post.likeCount)}</span>
                      <span className="post-stat">💬 {formatNumber(post.commentsCount)}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="posts-empty">
                <span className="posts-empty-icon">📷</span>
                <span className="posts-empty-text">No posts yet</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Scheduler Preview */}
      <section className="feed-workspace-section">
        <div className="feed-workspace-section-header">
          <h3 className="feed-workspace-section-title">UPCOMING</h3>
          <button
            className="feed-workspace-section-action"
            onClick={() => onNavigate?.('scheduler')}
          >
            VIEW ALL →
          </button>
        </div>
        <div className="feed-workspace-schedule-preview">
          <div className="schedule-empty">
            <span className="schedule-empty-icon">📭</span>
            <span className="schedule-empty-text">No scheduled posts</span>
            <button
              className="schedule-empty-btn"
              onClick={onCreatePost}
            >
              + Schedule Post
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// Telemetry Card Component
interface TelemetryCardProps {
  label: string;
  value?: number;
  format: 'number' | 'percent';
}

function TelemetryCard({ label, value, format }: TelemetryCardProps) {
  const displayValue =
    value === undefined
      ? '—'
      : format === 'percent'
      ? `${value.toFixed(1)}%`
      : formatNumber(value);

  return (
    <div className="telemetry-card">
      <div className="telemetry-card-value">{displayValue}</div>
      <div className="telemetry-card-label">{label}</div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
