'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Feed } from '../../types/feed';
import { useToast } from '../../../../ui/toast/ToastProvider';
import {
  getScheduledPosts,
  addScheduledPost,
  removeScheduledPost,
  startSchedulerPolling,
  ScheduledPost as LocalScheduledPost,
} from '../../lib/scheduler-store';

interface DisplayScheduledPost {
  id: string;
  content: string;
  mediaUrl?: string;
  scheduledTime: Date;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  platform: string;
  error?: string;
}

interface SchedulerModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
}

export const SchedulerModal: React.FC<SchedulerModalProps> = ({ feed, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'queue' | 'create'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMediaUrl, setNewPostMediaUrl] = useState('');
  const [newPostTime, setNewPostTime] = useState('12:00');
  const [newPostMediaType, setNewPostMediaType] = useState<'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS'>('IMAGE');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<DisplayScheduledPost[]>([]);
  const { addToast } = useToast();

  // Load scheduled posts from localStorage
  const loadScheduledPosts = useCallback(() => {
    setIsLoading(true);
    try {
      const posts = getScheduledPosts(feed.id);
      setScheduledPosts(
        posts.map((post: LocalScheduledPost) => ({
          id: post.id,
          content: post.caption,
          mediaUrl: post.mediaUrls?.[0],
          scheduledTime: new Date(post.scheduledFor),
          status: post.status,
          platform: post.platform,
          error: post.error,
        }))
      );
    } catch (error) {
      console.error('Failed to load scheduled posts:', error);
      addToast('error', 'Failed to load scheduled posts');
    } finally {
      setIsLoading(false);
    }
  }, [feed.id, addToast]);

  useEffect(() => {
    if (isOpen) {
      loadScheduledPosts();
      // Start scheduler polling
      startSchedulerPolling();
    }
  }, [isOpen, loadScheduledPosts]);

  if (!isOpen) return null;

  const currentMonth = selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  };

  const days = getDaysInMonth(selectedDate);
  const today = new Date().getDate();
  const currentMonthCheck = new Date().getMonth() === selectedDate.getMonth();

  const getPostsForDay = (day: number) => {
    return scheduledPosts.filter(post => {
      const postDate = new Date(post.scheduledTime);
      return postDate.getDate() === day &&
             postDate.getMonth() === selectedDate.getMonth() &&
             postDate.getFullYear() === selectedDate.getFullYear();
    });
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const handleSchedulePost = async () => {
    if (!newPostContent.trim() || isSaving) return;

    const [hours, minutes] = newPostTime.split(':').map(Number);
    const scheduledTime = new Date(selectedDate);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Validate time is in future
    if (scheduledTime <= new Date()) {
      addToast('warning', 'Please select a time in the future');
      return;
    }

    // Validate media URL if not IMAGE
    if (newPostMediaType !== 'IMAGE' && !newPostMediaUrl.trim()) {
      addToast('warning', 'Please provide a media URL for this media type');
      return;
    }

    setIsSaving(true);

    try {
      const post = addScheduledPost({
        feedId: feed.id,
        platform: feed.platform,
        caption: newPostContent,
        mediaUrls: newPostMediaUrl.trim() ? [newPostMediaUrl] : [],
        mediaType: newPostMediaType,
        scheduledFor: scheduledTime.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: 'scheduled',
      });

      setScheduledPosts([...scheduledPosts, {
        id: post.id,
        content: post.caption,
        mediaUrl: post.mediaUrls[0],
        scheduledTime: new Date(post.scheduledFor),
        status: post.status,
        platform: post.platform,
      }]);

      setNewPostContent('');
      setNewPostMediaUrl('');
      setActiveTab('queue');
      addToast('success', 'Post scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule post:', error);
      addToast('error', 'Failed to schedule post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const removed = removeScheduledPost(postId);

      if (removed) {
        setScheduledPosts(scheduledPosts.filter(p => p.id !== postId));
        addToast('success', 'Scheduled post deleted');
      } else {
        addToast('error', 'Post not found');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      addToast('error', 'Failed to delete post. Please try again.');
    }
  };

  const optimalTimes = ['9:00 AM', '12:00 PM', '5:00 PM', '8:00 PM'];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'status-badge published';
      case 'publishing':
        return 'status-badge publishing';
      case 'failed':
        return 'status-badge failed';
      default:
        return 'status-badge scheduled';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="scheduler-modal" onClick={e => e.stopPropagation()}>
        <div className="scheduler-header">
          <div className="scheduler-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h2>Post Scheduler</h2>
            <span className="scheduler-account">@{feed.handle}</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="scheduler-tabs">
          <button
            className={`scheduler-tab ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Calendar
          </button>
          <button
            className={`scheduler-tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Queue ({scheduledPosts.length})
          </button>
          <button
            className={`scheduler-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Post
          </button>
        </div>

        <div className="scheduler-content">
          {activeTab === 'calendar' && (
            <div className="calendar-view">
              <div className="calendar-header">
                <button className="calendar-nav" onClick={handlePrevMonth}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <h3>{currentMonth}</h3>
                <button className="calendar-nav" onClick={handleNextMonth}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>

              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="weekday">{day}</div>
                  ))}
                </div>
                <div className="calendar-days">
                  {days.map((day, index) => {
                    const postsForDay = day ? getPostsForDay(day) : [];
                    const isToday = currentMonthCheck && day === today;
                    return (
                      <div
                        key={index}
                        className={`calendar-day ${day ? '' : 'empty'} ${isToday ? 'today' : ''} ${postsForDay.length > 0 ? 'has-posts' : ''}`}
                        onClick={() => day && setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                      >
                        {day && (
                          <>
                            <span className="day-number">{day}</span>
                            {postsForDay.length > 0 && (
                              <div className="day-posts-indicator">
                                {postsForDay.length} post{postsForDay.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="optimal-times">
                <h4>Best Times to Post</h4>
                <div className="times-grid">
                  {optimalTimes.map(time => (
                    <div key={time} className="optimal-time">{time}</div>
                  ))}
                </div>
                <p className="times-note">Based on your audience engagement patterns</p>
              </div>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="queue-view">
              {scheduledPosts.length === 0 ? (
                <div className="empty-queue">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <p>No scheduled posts</p>
                  <button className="create-post-btn" onClick={() => setActiveTab('create')}>
                    Schedule Your First Post
                  </button>
                </div>
              ) : (
                <div className="queue-list">
                  {scheduledPosts
                    .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                    .map(post => (
                      <div key={post.id} className="queue-item">
                        <div className="queue-item-time">
                          <div className="queue-date">
                            {new Date(post.scheduledTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="queue-time">
                            {new Date(post.scheduledTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </div>
                        </div>
                        <div className="queue-item-content">
                          <p>{post.content}</p>
                          {post.error && (
                            <div className="queue-item-error">
                              Error: {post.error}
                            </div>
                          )}
                          <div className="queue-item-meta">
                            <span className={getStatusBadgeClass(post.status)}>
                              {post.status === 'publishing' && (
                                <>
                                  <span className="status-spinner"></span>
                                  Publishing...
                                </>
                              ) || post.status}
                            </span>
                            <span className="platform-badge">{feed.platform}</span>
                          </div>
                        </div>
                        <div className="queue-item-actions">
                          {post.status === 'scheduled' && (
                            <button className="queue-action delete" title="Delete" onClick={() => handleDeletePost(post.id)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="create-view">
              <div className="create-form">
                <div className="form-group">
                  <label>Post Content</label>
                  <textarea
                    placeholder="What do you want to share?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={4}
                  />
                  <div className="char-count">{newPostContent.length}/2200</div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={newPostTime}
                      onChange={(e) => setNewPostTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Media Type</label>
                  <select
                    value={newPostMediaType}
                    onChange={(e) => setNewPostMediaType(e.target.value as any)}
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="REELS">Reels</option>
                    <option value="CAROUSEL">Carousel</option>
                  </select>
                </div>

                {newPostMediaType !== 'IMAGE' && (
                  <div className="form-group">
                    <label>Media URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/media.mp4"
                      value={newPostMediaUrl}
                      onChange={(e) => setNewPostMediaUrl(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Quick Schedule</label>
                  <div className="quick-times">
                    {optimalTimes.map(time => (
                      <button
                        key={time}
                        className="quick-time-btn"
                        onClick={() => {
                          const [hourStr, period] = time.split(' ');
                          const [hours] = hourStr.split(':').map(Number);
                          const adjustedHours = period === 'PM' && hours !== 12 ? hours + 12 : hours === 12 && period === 'AM' ? 0 : hours;
                          setNewPostTime(`${adjustedHours.toString().padStart(2, '0')}:00`);
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="schedule-btn"
                  onClick={handleSchedulePost}
                  disabled={!newPostContent.trim() || isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="loading-spinner"></span>
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Schedule Post
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulerModal;
