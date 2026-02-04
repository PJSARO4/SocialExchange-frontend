'use client';

import React, { useState } from 'react';
import { Feed } from '../../types/feed';

interface TrendingContent {
  id: string;
  type: 'image' | 'video' | 'carousel' | 'reel';
  thumbnail: string;
  author: string;
  authorAvatar: string;
  likes: number;
  comments: number;
  caption: string;
  hashtags: string[];
  postedAt: string;
  engagement: number;
}

interface ContentFinderModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
}

export const ContentFinderModal: React.FC<ContentFinderModalProps> = ({ feed, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'trending' | 'competitors' | 'saved' | 'hashtags'>('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [savedContent, setSavedContent] = useState<string[]>([]);

  const categories = [
    { id: 'all', label: 'All', icon: '🌟' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '✨' },
    { id: 'fitness', label: 'Fitness', icon: '💪' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'food', label: 'Food', icon: '🍕' },
    { id: 'fashion', label: 'Fashion', icon: '👗' },
    { id: 'tech', label: 'Tech', icon: '💻' }
  ];

  const trendingContent: TrendingContent[] = [
    {
      id: '1',
      type: 'reel',
      thumbnail: 'https://picsum.photos/400/500?random=1',
      author: 'lifestyle_guru',
      authorAvatar: 'https://picsum.photos/50/50?random=11',
      likes: 45200,
      comments: 892,
      caption: 'Morning routine that changed my life ☀️ Save this for later!',
      hashtags: ['#morningroutine', '#productivity', '#lifestyle'],
      postedAt: '2 hours ago',
      engagement: 8.5
    },
    {
      id: '2',
      type: 'carousel',
      thumbnail: 'https://picsum.photos/400/500?random=2',
      author: 'fitness_coach',
      authorAvatar: 'https://picsum.photos/50/50?random=12',
      likes: 32100,
      comments: 654,
      caption: '5 exercises you can do at home with zero equipment 💪',
      hashtags: ['#homeworkout', '#fitness', '#noequipment'],
      postedAt: '4 hours ago',
      engagement: 7.2
    },
    {
      id: '3',
      type: 'image',
      thumbnail: 'https://picsum.photos/400/500?random=3',
      author: 'travel_dreams',
      authorAvatar: 'https://picsum.photos/50/50?random=13',
      likes: 67800,
      comments: 1234,
      caption: 'Found paradise 🌴 This spot in Bali is unreal!',
      hashtags: ['#bali', '#travel', '#paradise'],
      postedAt: '6 hours ago',
      engagement: 9.1
    },
    {
      id: '4',
      type: 'reel',
      thumbnail: 'https://picsum.photos/400/500?random=4',
      author: 'food_artist',
      authorAvatar: 'https://picsum.photos/50/50?random=14',
      likes: 28900,
      comments: 445,
      caption: 'The easiest pasta recipe you\'ll ever make 🍝',
      hashtags: ['#pasta', '#easyrecipe', '#cooking'],
      postedAt: '8 hours ago',
      engagement: 6.8
    },
    {
      id: '5',
      type: 'carousel',
      thumbnail: 'https://picsum.photos/400/500?random=5',
      author: 'style_inspo',
      authorAvatar: 'https://picsum.photos/50/50?random=15',
      likes: 41200,
      comments: 789,
      caption: 'Outfit ideas for every day of the week 👗',
      hashtags: ['#ootd', '#fashion', '#style'],
      postedAt: '10 hours ago',
      engagement: 7.9
    },
    {
      id: '6',
      type: 'image',
      thumbnail: 'https://picsum.photos/400/500?random=6',
      author: 'tech_daily',
      authorAvatar: 'https://picsum.photos/50/50?random=16',
      likes: 19500,
      comments: 321,
      caption: 'My desk setup in 2024 - full tour in stories!',
      hashtags: ['#desksetup', '#tech', '#productivity'],
      postedAt: '12 hours ago',
      engagement: 5.4
    }
  ];

  const competitors = [
    { name: 'lifestyle_king', handle: '@lifestyle_king', followers: '125K', engagement: '4.2%', avatar: 'https://picsum.photos/50/50?random=21' },
    { name: 'daily_inspo', handle: '@daily_inspo', followers: '89K', engagement: '5.1%', avatar: 'https://picsum.photos/50/50?random=22' },
    { name: 'content_queen', handle: '@content_queen', followers: '234K', engagement: '3.8%', avatar: 'https://picsum.photos/50/50?random=23' },
    { name: 'vibe_check', handle: '@vibe_check', followers: '67K', engagement: '6.2%', avatar: 'https://picsum.photos/50/50?random=24' },
  ];

  const trendingHashtags = [
    { tag: '#authenticity', posts: '2.3M', growth: '+15%' },
    { tag: '#contentcreator', posts: '45M', growth: '+8%' },
    { tag: '#reelsinstagram', posts: '120M', growth: '+22%' },
    { tag: '#growthmindset', posts: '18M', growth: '+12%' },
    { tag: '#dayinmylife', posts: '5.6M', growth: '+35%' },
    { tag: '#behindthescenes', posts: '12M', growth: '+18%' },
    { tag: '#miniviog', posts: '890K', growth: '+45%' },
    { tag: '#getreadywithme', posts: '8.9M', growth: '+28%' },
  ];

  if (!isOpen) return null;

  const toggleSave = (contentId: string) => {
    setSavedContent(prev =>
      prev.includes(contentId)
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reel':
        return <span className="content-type-badge reel">🎬 Reel</span>;
      case 'carousel':
        return <span className="content-type-badge carousel">📑 Carousel</span>;
      case 'image':
        return <span className="content-type-badge image">📷 Photo</span>;
      case 'video':
        return <span className="content-type-badge video">🎥 Video</span>;
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="content-finder-modal" onClick={e => e.stopPropagation()}>
        <div className="finder-header">
          <div className="finder-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h2>Content Finder</h2>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="finder-search">
          <div className="search-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search for content, hashtags, or creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="finder-tabs">
          <button
            className={`finder-tab ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            🔥 Trending
          </button>
          <button
            className={`finder-tab ${activeTab === 'competitors' ? 'active' : ''}`}
            onClick={() => setActiveTab('competitors')}
          >
            👀 Competitors
          </button>
          <button
            className={`finder-tab ${activeTab === 'hashtags' ? 'active' : ''}`}
            onClick={() => setActiveTab('hashtags')}
          >
            # Hashtags
          </button>
          <button
            className={`finder-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            💾 Saved ({savedContent.length})
          </button>
        </div>

        <div className="finder-content">
          {activeTab === 'trending' && (
            <div className="trending-view">
              <div className="category-filters">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <div className="trending-grid">
                {trendingContent.map(content => (
                  <div key={content.id} className="trending-card">
                    <div className="card-media">
                      <img src={content.thumbnail} alt={content.caption} />
                      {getTypeIcon(content.type)}
                      <div className="card-overlay">
                        <div className="overlay-stats">
                          <span>❤️ {formatNumber(content.likes)}</span>
                          <span>💬 {formatNumber(content.comments)}</span>
                        </div>
                      </div>
                      <button
                        className={`save-btn ${savedContent.includes(content.id) ? 'saved' : ''}`}
                        onClick={() => toggleSave(content.id)}
                      >
                        {savedContent.includes(content.id) ? '✓ Saved' : '+ Save'}
                      </button>
                    </div>
                    <div className="card-info">
                      <div className="card-author">
                        <img src={content.authorAvatar} alt={content.author} />
                        <span>@{content.author}</span>
                        <span className="post-time">{content.postedAt}</span>
                      </div>
                      <p className="card-caption">{content.caption}</p>
                      <div className="card-hashtags">
                        {content.hashtags.map(tag => (
                          <span key={tag} className="hashtag">{tag}</span>
                        ))}
                      </div>
                      <div className="engagement-score">
                        <span className="score-label">Engagement</span>
                        <span className="score-value">{content.engagement}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'competitors' && (
            <div className="competitors-view">
              <div className="competitors-intro">
                <h3>Track Your Competition</h3>
                <p>See what's working for similar accounts in your niche</p>
                <button className="add-competitor-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Competitor
                </button>
              </div>

              <div className="competitors-list">
                {competitors.map(comp => (
                  <div key={comp.name} className="competitor-card">
                    <div className="competitor-profile">
                      <img src={comp.avatar} alt={comp.name} />
                      <div className="competitor-info">
                        <h4>{comp.name}</h4>
                        <span className="competitor-handle">{comp.handle}</span>
                      </div>
                    </div>
                    <div className="competitor-stats">
                      <div className="comp-stat">
                        <span className="stat-value">{comp.followers}</span>
                        <span className="stat-label">Followers</span>
                      </div>
                      <div className="comp-stat">
                        <span className="stat-value">{comp.engagement}</span>
                        <span className="stat-label">Engagement</span>
                      </div>
                    </div>
                    <div className="competitor-actions">
                      <button className="view-content-btn">View Content</button>
                      <button className="analyze-btn">Analyze</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="competitor-insights">
                <h4>💡 Insights</h4>
                <div className="insights-grid">
                  <div className="insight-card">
                    <span className="insight-icon">📸</span>
                    <span className="insight-text">Carousels get 3x more engagement in your niche</span>
                  </div>
                  <div className="insight-card">
                    <span className="insight-icon">⏰</span>
                    <span className="insight-text">Top competitors post at 9 AM and 7 PM</span>
                  </div>
                  <div className="insight-card">
                    <span className="insight-icon">🎯</span>
                    <span className="insight-text">Educational content performs 40% better</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hashtags' && (
            <div className="hashtags-view">
              <div className="hashtag-search">
                <h3>Discover Trending Hashtags</h3>
                <p>Find the best hashtags for your content</p>
              </div>

              <div className="trending-hashtags-list">
                <h4>🔥 Trending This Week</h4>
                <div className="hashtags-grid">
                  {trendingHashtags.map(item => (
                    <div key={item.tag} className="hashtag-card">
                      <div className="hashtag-main">
                        <span className="hashtag-name">{item.tag}</span>
                        <span className={`hashtag-growth ${item.growth.startsWith('+') ? 'positive' : 'negative'}`}>
                          {item.growth}
                        </span>
                      </div>
                      <span className="hashtag-posts">{item.posts} posts</span>
                      <button className="copy-hashtag">Copy</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hashtag-generator">
                <h4>🎯 Hashtag Generator</h4>
                <div className="generator-input">
                  <input type="text" placeholder="Enter your topic (e.g., fitness, travel)" />
                  <button className="generate-btn">Generate</button>
                </div>
                <div className="suggested-sets">
                  <h5>Suggested Sets</h5>
                  <div className="hashtag-sets">
                    <button className="set-btn">
                      <span className="set-name">High Volume</span>
                      <span className="set-count">30 tags</span>
                    </button>
                    <button className="set-btn">
                      <span className="set-name">Niche Specific</span>
                      <span className="set-count">25 tags</span>
                    </button>
                    <button className="set-btn">
                      <span className="set-name">Mix (Recommended)</span>
                      <span className="set-count">30 tags</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="saved-view">
              {savedContent.length === 0 ? (
                <div className="empty-saved">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  <h3>No saved content yet</h3>
                  <p>Browse trending content and save ideas for inspiration</p>
                  <button className="browse-btn" onClick={() => setActiveTab('trending')}>
                    Browse Trending
                  </button>
                </div>
              ) : (
                <div className="saved-grid">
                  {trendingContent
                    .filter(c => savedContent.includes(c.id))
                    .map(content => (
                      <div key={content.id} className="saved-card">
                        <img src={content.thumbnail} alt={content.caption} />
                        <div className="saved-info">
                          <span className="saved-author">@{content.author}</span>
                          <button
                            className="remove-saved"
                            onClick={() => toggleSave(content.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentFinderModal;
