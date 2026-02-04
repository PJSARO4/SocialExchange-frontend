'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Feed } from '../../types/feed';

interface ScheduledPost {
  id: string;
  content: string;
  mediaUrl?: string;
  scheduledTime: Date;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  platform: string;
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
  const [newPostTime, setNewPostTime] = useState('12:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  // Fetch scheduled posts from API
  const fetchScheduledPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/scheduler?feed_id=${feed.id}`);
      const data = await response.json();

      if (data.posts) {
        setScheduledPosts(data.posts.map((post: any) => ({
          id: post.id,
          content: post.content,
          mediaUrl: post.media_urls?.[0],
          scheduledTime: new Date(post.scheduled_time),
          status: post.status,
          platform: post.platform,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch scheduled posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [feed.id]);

  useEffect(() => {
    if (isOpen) {
      fetchScheduledPosts();
    }
  }, [isOpen, fetchScheduledPosts]);

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
      alert('Please select a time in the future');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feed_id: feed.id,
          platform: feed.platform,
          content: newPostContent,
          media_urls: [],
          media_type: 'IMAGE',
          scheduled_time: scheduledTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.post) {
        const newPost: ScheduledPost = {
          id: data.post.id,
          content: data.post.content,
          scheduledTime: new Date(data.post.scheduled_time),
          status: data.post.status,
          platform: data.post.platform,
        };

        setScheduledPosts([...scheduledPosts, newPost]);
        setNewPostContent('');
        setActiveTab('queue');
      } else {
        alert(data.error || 'Failed to schedule post');
      }
    } catch (error) {
      console.error('Failed to schedule post:', error);
      alert('Failed to schedule post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/scheduler?id=${postId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setScheduledPosts(scheduledPosts.filter(p => p.id !== postId));
      } else {
        alert(data.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const optimalTimes = ['9:00 AM', '12:00 PM', '5:00 PM', '8:00 PM'];

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
                <h4>🕐 Best Times to Post</h4>
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
                          <div className="queue-item-meta">
                            <span className={`status-badge ${post.status}`}>{post.status}</span>
                            <span className="platform-badge">Instagram</span>
                          </div>
                        </div>
                        <div className="queue-item-actions">
                          <button className="queue-action edit" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button className="queue-action delete" title="Delete" onClick={() => handleDeletePost(post.id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
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
                  <label>Quick Schedule</label>
                  <div className="quick-times">
                    {optimalTimes.map(time => (
                      <button
                        key={time}
                        className="quick-time-btn"
                        onClick={() => {
                          const [hourStr, period] = time.split(' ');
                          const [hours] = hourStr.split(':').map(Number);
                          const adjustedHours = period === 'PM' && hours !== 12 ? hours + 12 : hours;
                          setNewPostTime(`${adjustedHours.toString().padStart(2, '0')}:00`);
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Add Media</label>
                  <div className="media-upload">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Drop image or click to upload</span>
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
