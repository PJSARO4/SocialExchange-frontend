'use client';

import { useState, useMemo } from 'react';
import CalendarView from './CalendarView';
import PostQueue from './PostQueue';
import SchedulePostModal from './SchedulePostModal';
import { ScheduledPost, CreateSchedulePayload } from '../../types/schedule';
import { ContentItem } from '../../types/content';
import { Feed, PLATFORMS } from '../../types/feed';
import { useFeeds } from '../../context/FeedsContext';

interface SchedulerProps {
  feedId?: string;
}

export default function Scheduler({ feedId }: SchedulerProps) {
  const { feeds, content, selectedFeed } = useFeeds();

  // Mock scheduled posts (will be replaced with context/API)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  // Filter posts by feed if provided
  const filteredPosts = useMemo(() => {
    if (!feedId) return scheduledPosts;
    return scheduledPosts.filter((p) => p.feedId === feedId);
  }, [scheduledPosts, feedId]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePostClick = (post: ScheduledPost) => {
    // Find the content and open for editing
    const postContent = content.find((c) => c.id === post.contentId);
    if (postContent) {
      setSelectedContent(postContent);
      setShowScheduleModal(true);
    }
  };

  const handleSchedule = async (payload: CreateSchedulePayload) => {
    setIsScheduling(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const feed = feeds.find((f) => f.id === payload.feedId);
      const contentItem = content.find((c) => c.id === payload.contentId);

      if (!feed || !contentItem) throw new Error('Invalid feed or content');

      const newPost: ScheduledPost = {
        id: `post-${Date.now()}`,
        contentId: payload.contentId,
        feedId: payload.feedId,
        platform: feed.platform,
        scheduledFor: payload.scheduledFor,
        timezone: payload.timezone || 'UTC',
        caption: payload.caption || contentItem.caption || '',
        mediaUrls: contentItem.mediaUrls,
        hashtags: payload.hashtags || contentItem.hashtags,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setScheduledPosts((prev) => [...prev, newPost]);
      setShowScheduleModal(false);
      setSelectedContent(null);
    } catch (err) {
      throw err;
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelPost = async (postId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    setScheduledPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const handleReschedule = (post: ScheduledPost) => {
    const postContent = content.find((c) => c.id === post.contentId);
    if (postContent) {
      setSelectedContent(postContent);
      setSelectedDate(new Date(post.scheduledFor));
      setShowScheduleModal(true);
    }
  };

  const handleQuickSchedule = () => {
    // Open modal to select content
    setSelectedContent(content[0] || null);
    setShowScheduleModal(true);
  };

  return (
    <div className="scheduler">
      {/* Header */}
      <div className="scheduler-header">
        <h2 className="scheduler-title">SCHEDULER</h2>
        <div className="scheduler-actions">
          <button
            className="scheduler-action-btn primary"
            onClick={handleQuickSchedule}
            disabled={content.length === 0 || feeds.length === 0}
          >
            + SCHEDULE POST
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="scheduler-body">
        {/* Calendar */}
        <div className="scheduler-calendar">
          <CalendarView
            posts={filteredPosts}
            selectedDate={selectedDate || undefined}
            onDayClick={handleDayClick}
            onPostClick={handlePostClick}
          />
        </div>

        {/* Queue */}
        <div className="scheduler-queue">
          <PostQueue
            posts={filteredPosts}
            onPostClick={handlePostClick}
            onCancelPost={handleCancelPost}
            onReschedule={handleReschedule}
          />
        </div>
      </div>

      {/* Content Picker (if no content selected but modal open) */}
      {showScheduleModal && !selectedContent && content.length > 0 && (
        <ContentPickerModal
          content={content}
          onSelect={(c) => setSelectedContent(c)}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedContent && (
        <SchedulePostModal
          content={selectedContent}
          feeds={feeds}
          selectedFeedId={feedId}
          initialDate={selectedDate || undefined}
          onSchedule={handleSchedule}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedContent(null);
          }}
          isLoading={isScheduling}
        />
      )}

      {/* Empty State */}
      {feeds.length === 0 && (
        <div className="scheduler-empty-overlay">
          <div className="scheduler-empty">
            <span className="scheduler-empty-icon">📡</span>
            <span className="scheduler-empty-title">NO ACCOUNTS</span>
            <span className="scheduler-empty-text">
              Connect a social account to start scheduling
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// CONTENT PICKER MODAL
// ============================================

interface ContentPickerModalProps {
  content: ContentItem[];
  onSelect: (content: ContentItem) => void;
  onClose: () => void;
}

function ContentPickerModal({
  content,
  onSelect,
  onClose,
}: ContentPickerModalProps) {
  const [search, setSearch] = useState('');

  const filtered = content.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caption?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content content-picker-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 className="modal-title">SELECT CONTENT</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal-body">
          <input
            type="text"
            className="modal-input"
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="content-picker-grid">
            {filtered.length === 0 ? (
              <div className="content-picker-empty">
                No content found. Upload some content first.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="content-picker-item"
                  onClick={() => onSelect(item)}
                >
                  {item.mediaUrls[0] ? (
                    <img
                      src={item.mediaUrls[0]}
                      alt={item.title}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                      }}
                    />
                  ) : (
                    <div className="content-picker-item-fallback">
                      {item.type === 'video' ? '🎬' : '📝'}
                    </div>
                  )}
                  <div className="content-picker-item-title">{item.title}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
