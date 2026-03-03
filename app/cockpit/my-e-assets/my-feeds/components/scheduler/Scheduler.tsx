'use client';

import { useState, useMemo, useCallback } from 'react';
import CalendarView from './CalendarView';
import PostQueue from './PostQueue';
import SchedulePostModal from './SchedulePostModal';
import { ScheduledPost, CreateSchedulePayload } from '../../types/schedule';
import { ContentItem } from '../../types/content';
import { Feed, PLATFORMS } from '../../types/feed';
import { useFeeds } from '../../context/FeedsContext';
import { useWorkflowEvents, WorkflowEvent } from '../../context/WorkflowEventsContext';

interface SchedulerProps {
  feedId?: string;
}

export default function Scheduler({ feedId }: SchedulerProps) {
  const { feeds, content, selectedFeed } = useFeeds();

  // Try to use workflow events context (may not be available)
  let workflowEvents: WorkflowEvent[] = [];
  try {
    const workflowContext = useWorkflowEvents();
    workflowEvents = workflowContext.events;
  } catch {
    // Context not available, use empty array
  }

  // Scheduled posts from database
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  // Load scheduled posts from API on mount
  const loadScheduledPosts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (feedId) params.set('feed_id', feedId);
      const res = await fetch(`/api/scheduler?${params}`);
      if (res.ok) {
        const data = await res.json();
        const posts = (data.posts || []).map((p: any) => ({
          id: p.id,
          contentId: '',
          feedId: p.feedId || p.feed_id,
          platform: p.feed?.platform?.toLowerCase() || 'instagram',
          scheduledFor: p.scheduledFor || p.scheduled_for,
          timezone: p.timezone || 'UTC',
          caption: p.caption || '',
          mediaUrls: p.mediaUrls || p.media_urls || [],
          hashtags: [],
          status: (p.status || 'PENDING').toLowerCase(),
          postedAt: p.publishedAt || p.published_at,
          errorMessage: p.lastError || p.last_error,
          createdAt: p.createdAt || p.created_at,
          updatedAt: p.updatedAt || p.updated_at,
        }));
        setScheduledPosts(posts);
      }
    } catch (err) {
      console.error('Failed to load scheduled posts:', err);
    }
  }, [feedId]);

  // Load on mount
  useState(() => { loadScheduledPosts(); });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedWorkflowEvent, setSelectedWorkflowEvent] = useState<WorkflowEvent | null>(null);

  // Filter posts by feed if provided
  const filteredPosts = useMemo(() => {
    if (!feedId) return scheduledPosts;
    return scheduledPosts.filter((p) => p.feedId === feedId);
  }, [scheduledPosts, feedId]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    // If there's content available, open the schedule modal with this date
    if (content.length > 0 && feeds.length > 0) {
      setShowScheduleModal(true);
    }
  };

  const handleWorkflowEventClick = useCallback((event: WorkflowEvent) => {
    setSelectedWorkflowEvent(event);
    // Could open a workflow event details modal here
    console.log('Workflow event clicked:', event);
  }, []);

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
      const feed = feeds.find((f) => f.id === payload.feedId);
      const contentItem = content.find((c) => c.id === payload.contentId);

      if (!feed || !contentItem) throw new Error('Invalid feed or content');

      // Call real scheduler API
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feed_id: payload.feedId,
          platform: feed.platform?.toLowerCase() || 'instagram',
          content: payload.caption || contentItem.caption || '',
          media_urls: contentItem.mediaUrls,
          media_type: contentItem.type === 'video' ? 'VIDEO' : contentItem.type === 'carousel' ? 'CAROUSEL' : 'IMAGE',
          scheduled_time: payload.scheduledFor,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Scheduling failed' }));
        throw new Error(errData.error || 'Scheduling failed');
      }

      // Refresh from API
      await loadScheduledPosts();
      setShowScheduleModal(false);
      setSelectedContent(null);
    } catch (err) {
      throw err;
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelPost = async (postId: string) => {
    try {
      // Call scheduler API to cancel
      const res = await fetch('/api/scheduler', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, status: 'CANCELLED' }),
      });

      if (res.ok) {
        setScheduledPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, status: 'cancelled' as const, updatedAt: new Date().toISOString() }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to cancel post:', err);
    }
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
            workflowEvents={workflowEvents}
            selectedDate={selectedDate || undefined}
            onDayClick={handleDayClick}
            onPostClick={handlePostClick}
            onWorkflowEventClick={handleWorkflowEventClick}
            showWorkflowEvents={true}
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
