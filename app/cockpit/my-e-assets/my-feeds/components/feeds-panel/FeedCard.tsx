'use client';

import { Feed, PLATFORMS, ControlMode } from '../../types/feed';

interface FeedCardProps {
  feed: Feed;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

// Mode configuration with icons and colors
const MODE_CONFIG: Record<ControlMode, { icon: string; label: string; color: string; description: string }> = {
  autopilot: {
    icon: '🤖',
    label: 'AUTO',
    color: '#00ff88',
    description: 'AI auto-curates and posts'
  },
  manual: {
    icon: '✋',
    label: 'MANUAL',
    color: '#00d4ff',
    description: 'User-driven content'
  },
  observation: {
    icon: '👁️',
    label: 'OBSERVE',
    color: '#ff9500',
    description: 'Track public metrics only'
  },
  escrow: {
    icon: '🔒',
    label: 'ESCROW',
    color: '#a855f7',
    description: 'Pending approval'
  }
};

export default function FeedCard({
  feed,
  selected,
  onSelect,
  onRemove,
}: FeedCardProps) {
  const platform = PLATFORMS[feed.platform];
  const statusClass = feed.connectionStatus === 'active' ? 'active' :
                      feed.connectionStatus === 'error' ? 'error' : 'pending';
  const modeConfig = MODE_CONFIG[feed.controlMode] || MODE_CONFIG.manual;

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
        {/* Mode badge on avatar */}
        <div
          className="feed-card-mode-badge"
          style={{
            backgroundColor: modeConfig.color + '20',
            borderColor: modeConfig.color
          }}
          title={`${modeConfig.label}: ${modeConfig.description}`}
        >
          <span>{modeConfig.icon}</span>
        </div>
      </div>

      {/* Info */}
      <div className="feed-card-info">
        <div className="feed-card-handle">{feed.handle}</div>
        <div className="feed-card-meta">
          <span className="feed-card-platform">{platform.label}</span>
          <span className="feed-card-separator">•</span>
          <span
            className="feed-card-mode"
            style={{ color: modeConfig.color }}
          >
            {modeConfig.label}
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
        <span
          className="feed-card-automation-dot"
          style={{ color: feed.automationEnabled ? modeConfig.color : undefined }}
        >
          ⦿
        </span>
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
