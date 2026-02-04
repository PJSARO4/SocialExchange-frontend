'use client';

import { ContentItem } from '../../types/content';

interface ContentCardProps {
  item: ContentItem;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function ContentCard({
  item,
  selected,
  onSelect,
  onRemove,
}: ContentCardProps) {
  const typeIcon = {
    image: '🖼',
    video: '🎬',
    carousel: '📑',
    text: '📝',
  }[item.type];

  const statusClass = {
    draft: 'draft',
    ready: 'ready',
    scheduled: 'scheduled',
    posted: 'posted',
    failed: 'failed',
  }[item.status];

  const hasThumbnail = item.thumbnailUrl || item.mediaUrls[0];

  return (
    <div
      className={`content-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      {/* Thumbnail */}
      <div className="content-card-thumbnail">
        {hasThumbnail ? (
          <img
            src={item.thumbnailUrl || item.mediaUrls[0]}
            alt={item.title}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="content-card-thumbnail-fallback">
            {typeIcon}
          </span>
        )}

        {/* Type badge */}
        <span className="content-card-type-badge">{typeIcon}</span>

        {/* Multi-media indicator */}
        {item.mediaUrls.length > 1 && (
          <span className="content-card-multi-badge">
            +{item.mediaUrls.length - 1}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="content-card-info">
        <div className="content-card-title" title={item.title}>
          {item.title}
        </div>
        <div className="content-card-meta">
          <span className={`content-card-status ${statusClass}`}>
            {item.status.toUpperCase()}
          </span>
          {item.scheduledFor && (
            <span className="content-card-scheduled">
              {formatScheduledDate(item.scheduledFor)}
            </span>
          )}
        </div>
      </div>

      {/* Caption preview */}
      {item.caption && (
        <div className="content-card-caption" title={item.caption}>
          {item.caption.slice(0, 60)}
          {item.caption.length > 60 ? '...' : ''}
        </div>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="content-card-tags">
          {item.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="content-card-tag">
              {tag}
            </span>
          ))}
          {item.tags.length > 2 && (
            <span className="content-card-tag-more">
              +{item.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Remove button */}
      <button
        className="content-card-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title="Remove content"
      >
        ×
      </button>
    </div>
  );
}

function formatScheduledDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
