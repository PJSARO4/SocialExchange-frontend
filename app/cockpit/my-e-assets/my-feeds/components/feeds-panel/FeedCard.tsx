'use client';

import { Feed, PLATFORMS } from '../../types/feed';

interface FeedCardProps {
  feed: Feed;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function FeedCard({
  feed,
  selected,
  onSelect,
  onRemove,
}: FeedCardProps) {
  const platform = PLATFORMS[feed.platform];
  const statusClass = feed.connectionStatus === 'active' ? 'active' :
                      feed.connectionStatus === 'error' ? 'error' : 'pending';

  return (
    <div
      className={`feed-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      {/* Platform indicator */}
      <div
        className="feed-card-platform-indicator"
        style={{ backgroundColor: platform.color }}
      />

      {/* Avatar */}
      <div className="feed-card-avatar">
        {feed.avatarUrl ? (
          <img src={feed.avatarUrl} alt={feed.displayName} />
        ) : (
          <span className="feed-card-avatar-fallback">
            {platform.icon}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="feed-card-info">
        <div className="feed-card-handle">{feed.handle}</div>
        <div className="feed-card-meta">
          <span className="feed-card-platform">{platform.label}</span>
          <span className="feed-card-separator">•</span>
          <span className={`feed-card-status ${statusClass}`}>
            {feed.connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="feed-card-stats">
        {feed.metrics.followers !== undefined && feed.metrics.followers > 0 && (
          <div className="feed-card-stat">
            <span className="feed-card-stat-value">
              {formatNumber(feed.metrics.followers)}
            </span>
          </div>
        )}
      </div>

      {/* Automation indicator */}
      <div className={`feed-card-automation ${feed.automationEnabled ? 'armed' : 'idle'}`}>
        <span className="feed-card-automation-dot">⦿</span>
      </div>

      {/* Remove button */}
      <button
        className="feed-card-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title="Remove account"
      >
        ×
      </button>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
