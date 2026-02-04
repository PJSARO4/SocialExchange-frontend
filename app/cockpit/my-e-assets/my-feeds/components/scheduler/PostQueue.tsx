'use client';

import { useState } from 'react';
import { ScheduledPost, ScheduleFilters } from '../../types/schedule';
import { PLATFORMS } from '../../types/feed';

interface PostQueueProps {
  posts: ScheduledPost[];
  onPostClick: (post: ScheduledPost) => void;
  onCancelPost: (postId: string) => void;
  onReschedule: (post: ScheduledPost) => void;
}

export default function PostQueue({
  posts,
  onPostClick,
  onCancelPost,
  onReschedule,
}: PostQueueProps) {
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const now = new Date();

  const filteredPosts = posts
    .filter((post) => {
      const postDate = new Date(post.scheduledFor);
      if (filter === 'upcoming') return postDate > now && post.status === 'scheduled';
      if (filter === 'past') return postDate <= now || post.status === 'posted';
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduledFor);
      const dateB = new Date(b.scheduledFor);
      return filter === 'past'
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

  const groupedPosts = groupPostsByDate(filteredPosts);

  return (
    <div className="post-queue">
      {/* Header */}
      <div className="post-queue-header">
        <h3 className="post-queue-title">POST QUEUE</h3>
        <div className="post-queue-filters">
          {(['upcoming', 'past', 'all'] as const).map((f) => (
            <button
              key={f}
              className={`post-queue-filter ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Queue List */}
      <div className="post-queue-list">
        {filteredPosts.length === 0 ? (
          <div className="post-queue-empty">
            <span className="post-queue-empty-icon">📅</span>
            <span className="post-queue-empty-text">
              {filter === 'upcoming'
                ? 'No upcoming posts scheduled'
                : filter === 'past'
                ? 'No past posts'
                : 'No posts in queue'}
            </span>
          </div>
        ) : (
          Object.entries(groupedPosts).map(([dateKey, datePosts]) => (
            <div key={dateKey} className="post-queue-group">
              <div className="post-queue-date">{dateKey}</div>
              {datePosts.map((post) => (
                <PostQueueItem
                  key={post.id}
                  post={post}
                  isExpanded={expandedId === post.id}
                  onToggle={() =>
                    setExpandedId(expandedId === post.id ? null : post.id)
                  }
                  onClick={() => onPostClick(post)}
                  onCancel={() => onCancelPost(post.id)}
                  onReschedule={() => onReschedule(post)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="post-queue-footer">
        <span className="post-queue-stat">
          {posts.filter((p) => p.status === 'scheduled').length} scheduled
        </span>
        <span className="post-queue-separator">•</span>
        <span className="post-queue-stat">
          {posts.filter((p) => p.status === 'posted').length} posted
        </span>
      </div>
    </div>
  );
}

// ============================================
// POST QUEUE ITEM
// ============================================

interface PostQueueItemProps {
  post: ScheduledPost;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  onCancel: () => void;
  onReschedule: () => void;
}

function PostQueueItem({
  post,
  isExpanded,
  onToggle,
  onClick,
  onCancel,
  onReschedule,
}: PostQueueItemProps) {
  const platform = PLATFORMS[post.platform];
  const postDate = new Date(post.scheduledFor);
  const isPast = postDate < new Date();

  return (
    <div className={`post-queue-item ${post.status}`}>
      <div className="post-queue-item-main" onClick={onToggle}>
        {/* Platform */}
        <div
          className="post-queue-item-platform"
          style={{ backgroundColor: platform?.color }}
        >
          {platform?.icon || '📱'}
        </div>

        {/* Info */}
        <div className="post-queue-item-info">
          <div className="post-queue-item-time">
            {postDate.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
          <div className="post-queue-item-caption">
            {post.caption?.slice(0, 50) || 'No caption'}
            {(post.caption?.length || 0) > 50 ? '...' : ''}
          </div>
        </div>

        {/* Status */}
        <div className={`post-queue-item-status ${post.status}`}>
          {post.status === 'scheduled' && '⏳'}
          {post.status === 'posting' && '🔄'}
          {post.status === 'posted' && '✓'}
          {post.status === 'failed' && '✕'}
          {post.status === 'cancelled' && '⊘'}
        </div>

        {/* Expand */}
        <button className="post-queue-item-expand">
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="post-queue-item-expanded">
          {/* Preview */}
          {post.mediaUrls.length > 0 && (
            <div className="post-queue-item-media">
              <img
                src={post.mediaUrls[0]}
                alt="Post preview"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {post.mediaUrls.length > 1 && (
                <span className="post-queue-item-media-count">
                  +{post.mediaUrls.length - 1}
                </span>
              )}
            </div>
          )}

          {/* Full Caption */}
          <div className="post-queue-item-full-caption">
            {post.caption || 'No caption'}
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="post-queue-item-hashtags">
              {post.hashtags.map((tag) => (
                <span key={tag} className="post-queue-item-hashtag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Error Message */}
          {post.status === 'failed' && post.errorMessage && (
            <div className="post-queue-item-error">
              <span className="post-queue-item-error-icon">⚠</span>
              {post.errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="post-queue-item-actions">
            <button
              className="post-queue-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              VIEW
            </button>
            {post.status === 'scheduled' && (
              <>
                <button
                  className="post-queue-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReschedule();
                  }}
                >
                  RESCHEDULE
                </button>
                <button
                  className="post-queue-action-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                  }}
                >
                  CANCEL
                </button>
              </>
            )}
            {post.status === 'failed' && (
              <button
                className="post-queue-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule();
                }}
              >
                RETRY
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function groupPostsByDate(
  posts: ScheduledPost[]
): Record<string, ScheduledPost[]> {
  const groups: Record<string, ScheduledPost[]> = {};
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  posts.forEach((post) => {
    const postDate = new Date(post.scheduledFor);
    let key: string;

    if (isSameDaySimple(postDate, today)) {
      key = 'TODAY';
    } else if (isSameDaySimple(postDate, tomorrow)) {
      key = 'TOMORROW';
    } else {
      key = postDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(post);
  });

  return groups;
}

function isSameDaySimple(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
