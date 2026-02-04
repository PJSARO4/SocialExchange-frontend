'use client';

import React, { useState, useEffect } from 'react';
import { Feed } from '../FeedsContext';

interface HistoricalPost {
  id: string;
  instagramId?: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS';
  caption: string;
  hashtags: string[];
  postedAt: Date;
  scheduledAt?: Date;
  source: 'autopilot' | 'scheduled' | 'manual' | 'instagram';
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
    engagementRate: number;
  };
  topComments?: { username: string; text: string }[];
}

interface PostHistoryModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
  onRepost?: (post: HistoricalPost) => void;
  onAnalyzeCaption?: (post: HistoricalPost) => void;
}

type ViewMode = 'grid' | 'list' | 'calendar';
type SortBy = 'newest' | 'oldest' | 'engagement' | 'likes' | 'comments';
type FilterSource = 'all' | 'autopilot' | 'scheduled' | 'manual';

export default function PostHistoryModal({
  feed,
  isOpen,
  onClose,
  onRepost,
  onAnalyzeCaption,
}: PostHistoryModalProps) {
  const [posts, setPosts] = useState<HistoricalPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedPost, setSelectedPost] = useState<HistoricalPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      if (!isOpen) return;
      setIsLoading(true);

      try {
        // Fetch from Instagram API
        const savedToken = localStorage.getItem(`instagram_token_${feed.id}`);
        const savedUserId = localStorage.getItem(`instagram_user_id_${feed.id}`);

        if (savedToken && savedUserId) {
          const response = await fetch(
            `https://graph.facebook.com/v21.0/${savedUserId}/media?fields=id,media_type,media_url,thumbnail_url,caption,timestamp,like_count,comments_count&limit=50&access_token=${savedToken}`
          );

          if (response.ok) {
            const data = await response.json();
            const formattedPosts: HistoricalPost[] = (data.data || []).map((post: any) => ({
              id: post.id,
              instagramId: post.id,
              mediaUrl: post.media_url || post.thumbnail_url,
              mediaType: post.media_type,
              caption: post.caption || '',
              hashtags: extractHashtags(post.caption || ''),
              postedAt: new Date(post.timestamp),
              source: 'instagram' as const,
              metrics: {
                likes: post.like_count || 0,
                comments: post.comments_count || 0,
                shares: 0,
                saves: 0,
                reach: 0,
                impressions: 0,
                engagementRate: calculateEngagement(
                  post.like_count || 0,
                  post.comments_count || 0,
                  feed.followers
                ),
              },
            }));
            setPosts(formattedPosts);
          }
        }

        // Also fetch local scheduled posts that were published
        const localPosts = JSON.parse(
          localStorage.getItem(`post_history_${feed.id}`) || '[]'
        );
        setPosts((prev) => [...prev, ...localPosts]);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      }

      setIsLoading(false);
    };

    fetchPosts();
  }, [feed.id, feed.followers, isOpen]);

  // Filter and sort posts
  const filteredPosts = posts
    .filter((post) => {
      // Source filter
      if (filterSource !== 'all' && post.source !== filterSource) {
        return false;
      }

      // Date range filter
      const now = new Date();
      const postDate = new Date(post.postedAt);
      const daysDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dateRange === '7d' && daysDiff > 7) return false;
      if (dateRange === '30d' && daysDiff > 30) return false;
      if (dateRange === '90d' && daysDiff > 90) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          post.caption.toLowerCase().includes(query) ||
          post.hashtags.some((h) => h.toLowerCase().includes(query))
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
        case 'oldest':
          return new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
        case 'engagement':
          return b.metrics.engagementRate - a.metrics.engagementRate;
        case 'likes':
          return b.metrics.likes - a.metrics.likes;
        case 'comments':
          return b.metrics.comments - a.metrics.comments;
        default:
          return 0;
      }
    });

  // Calculate stats
  const stats = {
    totalPosts: filteredPosts.length,
    avgLikes: Math.round(
      filteredPosts.reduce((sum, p) => sum + p.metrics.likes, 0) / filteredPosts.length || 0
    ),
    avgComments: Math.round(
      filteredPosts.reduce((sum, p) => sum + p.metrics.comments, 0) / filteredPosts.length || 0
    ),
    avgEngagement: (
      filteredPosts.reduce((sum, p) => sum + p.metrics.engagementRate, 0) /
        filteredPosts.length || 0
    ).toFixed(2),
    topPost: filteredPosts.reduce(
      (top, p) => (p.metrics.engagementRate > (top?.metrics.engagementRate || 0) ? p : top),
      null as HistoricalPost | null
    ),
  };

  if (!isOpen) return null;

  return (
    <div className="post-history-overlay">
      <div className="post-history-modal">
        {/* Header */}
        <div className="history-header">
          <div className="header-title">
            <h2>📊 Post History</h2>
            <span className="post-count">{stats.totalPosts} posts</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Stats Bar */}
        <div className="history-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.totalPosts}</span>
            <span className="stat-label">Total Posts</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.avgLikes}</span>
            <span className="stat-label">Avg Likes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.avgComments}</span>
            <span className="stat-label">Avg Comments</span>
          </div>
          <div className="stat-card highlight">
            <span className="stat-value">{stats.avgEngagement}%</span>
            <span className="stat-label">Avg Engagement</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="history-toolbar">
          <div className="toolbar-left">
            <div className="date-filter">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  className={dateRange === range ? 'active' : ''}
                  onClick={() => setDateRange(range)}
                >
                  {range === 'all' ? 'All Time' : range}
                </button>
              ))}
            </div>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as FilterSource)}
            >
              <option value="all">All Sources</option>
              <option value="autopilot">Autopilot</option>
              <option value="scheduled">Scheduled</option>
              <option value="manual">Manual</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="engagement">Best Engagement</option>
              <option value="likes">Most Likes</option>
              <option value="comments">Most Comments</option>
            </select>
          </div>

          <div className="toolbar-center">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search captions or hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="toolbar-right">
            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ⊞
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                ☰
              </button>
              <button
                className={viewMode === 'calendar' ? 'active' : ''}
                onClick={() => setViewMode('calendar')}
                title="Calendar View"
              >
                📅
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="history-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading post history...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No posts found</h3>
              <p>Try adjusting your filters or date range</p>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="posts-grid">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="post-card"
                      onClick={() => setSelectedPost(post)}
                    >
                      <div className="post-media">
                        {post.mediaType === 'VIDEO' || post.mediaType === 'REELS' ? (
                          <video src={post.mediaUrl} muted />
                        ) : (
                          <img src={post.mediaUrl} alt="" />
                        )}
                        <div className="post-overlay">
                          <span className="overlay-stat">
                            ❤️ {formatNumber(post.metrics.likes)}
                          </span>
                          <span className="overlay-stat">
                            💬 {formatNumber(post.metrics.comments)}
                          </span>
                        </div>
                        {post.mediaType === 'VIDEO' && (
                          <span className="media-badge">▶️</span>
                        )}
                        {post.mediaType === 'CAROUSEL' && (
                          <span className="media-badge">◫</span>
                        )}
                        {post.mediaType === 'REELS' && (
                          <span className="media-badge">🎬</span>
                        )}
                        <span className={`source-badge ${post.source}`}>
                          {post.source === 'autopilot' && '🤖'}
                          {post.source === 'scheduled' && '📅'}
                          {post.source === 'manual' && '✏️'}
                          {post.source === 'instagram' && '📷'}
                        </span>
                      </div>
                      <div className="post-info">
                        <span className="post-date">
                          {new Date(post.postedAt).toLocaleDateString()}
                        </span>
                        <span className="post-engagement">
                          {post.metrics.engagementRate.toFixed(1)}% eng
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="posts-list">
                  <div className="list-header">
                    <span className="col-media">Post</span>
                    <span className="col-caption">Caption</span>
                    <span className="col-likes">Likes</span>
                    <span className="col-comments">Comments</span>
                    <span className="col-engagement">Engagement</span>
                    <span className="col-date">Posted</span>
                    <span className="col-actions">Actions</span>
                  </div>
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="list-row">
                      <span className="col-media">
                        <img src={post.mediaUrl} alt="" />
                      </span>
                      <span className="col-caption">
                        {post.caption.substring(0, 100)}
                        {post.caption.length > 100 && '...'}
                      </span>
                      <span className="col-likes">
                        {formatNumber(post.metrics.likes)}
                      </span>
                      <span className="col-comments">
                        {formatNumber(post.metrics.comments)}
                      </span>
                      <span className="col-engagement">
                        {post.metrics.engagementRate.toFixed(2)}%
                      </span>
                      <span className="col-date">
                        {new Date(post.postedAt).toLocaleDateString()}
                      </span>
                      <span className="col-actions">
                        <button
                          className="action-btn"
                          onClick={() => setSelectedPost(post)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => onAnalyzeCaption?.(post)}
                          title="Analyze Caption"
                        >
                          📊
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => onRepost?.(post)}
                          title="Repost"
                        >
                          🔄
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Post Detail Modal */}
        {selectedPost && (
          <div className="post-detail-overlay" onClick={() => setSelectedPost(null)}>
            <div className="post-detail-modal" onClick={(e) => e.stopPropagation()}>
              <button className="detail-close" onClick={() => setSelectedPost(null)}>
                ×
              </button>

              <div className="detail-content">
                <div className="detail-media">
                  {selectedPost.mediaType === 'VIDEO' ||
                  selectedPost.mediaType === 'REELS' ? (
                    <video src={selectedPost.mediaUrl} controls />
                  ) : (
                    <img src={selectedPost.mediaUrl} alt="" />
                  )}
                </div>

                <div className="detail-info">
                  <div className="detail-header">
                    <span className="detail-date">
                      Posted {new Date(selectedPost.postedAt).toLocaleString()}
                    </span>
                    <span className={`detail-source ${selectedPost.source}`}>
                      {selectedPost.source === 'autopilot' && '🤖 Autopilot'}
                      {selectedPost.source === 'scheduled' && '📅 Scheduled'}
                      {selectedPost.source === 'manual' && '✏️ Manual'}
                      {selectedPost.source === 'instagram' && '📷 Instagram'}
                    </span>
                  </div>

                  <div className="detail-metrics">
                    <div className="metric">
                      <span className="metric-value">
                        {formatNumber(selectedPost.metrics.likes)}
                      </span>
                      <span className="metric-label">Likes</span>
                    </div>
                    <div className="metric">
                      <span className="metric-value">
                        {formatNumber(selectedPost.metrics.comments)}
                      </span>
                      <span className="metric-label">Comments</span>
                    </div>
                    <div className="metric highlight">
                      <span className="metric-value">
                        {selectedPost.metrics.engagementRate.toFixed(2)}%
                      </span>
                      <span className="metric-label">Engagement</span>
                    </div>
                  </div>

                  <div className="detail-caption">
                    <h4>Caption</h4>
                    <p>{selectedPost.caption}</p>
                  </div>

                  {selectedPost.hashtags.length > 0 && (
                    <div className="detail-hashtags">
                      <h4>Hashtags ({selectedPost.hashtags.length})</h4>
                      <div className="hashtag-list">
                        {selectedPost.hashtags.map((tag, i) => (
                          <span key={i} className="hashtag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="detail-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => onAnalyzeCaption?.(selectedPost)}
                    >
                      📊 Analyze Performance
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => onRepost?.(selectedPost)}
                    >
                      🔄 Repost This
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[\w]+/g);
  return matches ? matches.map((h) => h.slice(1)) : [];
}

function calculateEngagement(likes: number, comments: number, followers: number): number {
  if (followers === 0) return 0;
  return ((likes + comments) / followers) * 100;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
