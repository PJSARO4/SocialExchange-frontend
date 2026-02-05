"use client";

import React, { useState, useEffect } from 'react';
import { Feed } from '../../types/feed';

interface ContentSource {
  id: string;
  type: 'rss' | 'hashtag' | 'competitor' | 'url' | 'saved';
  name: string;
  url?: string;
  hashtag?: string;
  accountHandle?: string;
  enabled: boolean;
  lastFetched?: string;
  itemCount?: number;
}

interface DiscoveredContent {
  id: string;
  source: string;
  sourceType: 'rss' | 'hashtag' | 'competitor' | 'trending';
  title: string;
  description?: string;
  imageUrl?: string;
  link: string;
  publishedAt?: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  savedAt?: string;
}

interface ContentFinderModalProps {
  feed?: Feed;
  isOpen?: boolean;
  onClose?: () => void;
  onSelect?: (content: DiscoveredContent) => void;
  onAddToQueue?: (content: DiscoveredContent) => void;
  feedId?: string;
  children?: React.ReactNode;
}

// Storage keys
const SOURCES_STORAGE_KEY = 'se-content-sources';
const SAVED_CONTENT_KEY = 'se-saved-content';
const TUTORIAL_SEEN_KEY = 'se-content-finder-tutorial';

// Default sources
const DEFAULT_SOURCES: ContentSource[] = [
  { id: '1', type: 'hashtag', name: '#socialmedia', hashtag: 'socialmedia', enabled: true, itemCount: 24 },
  { id: '2', type: 'hashtag', name: '#marketing', hashtag: 'marketing', enabled: true, itemCount: 18 },
  { id: '3', type: 'rss', name: 'TechCrunch', url: 'https://techcrunch.com/feed', enabled: true, itemCount: 12 },
];

// Mock discovered content (in production, this would come from actual API calls)
const MOCK_CONTENT: DiscoveredContent[] = [
  {
    id: 'dc1',
    source: '#socialmedia',
    sourceType: 'hashtag',
    title: '10 Social Media Trends for 2026',
    description: 'Discover the latest trends shaping social media marketing this year...',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    link: 'https://example.com/trends',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    engagement: { likes: 1240, comments: 89, shares: 234 },
  },
  {
    id: 'dc2',
    source: 'TechCrunch',
    sourceType: 'rss',
    title: 'Instagram Launches New Creator Tools',
    description: 'Meta announces powerful new features for content creators...',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    link: 'https://techcrunch.com/instagram-tools',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    engagement: { likes: 892, comments: 45 },
  },
  {
    id: 'dc3',
    source: '#marketing',
    sourceType: 'hashtag',
    title: 'Content Marketing Strategies That Work',
    description: 'Expert tips on creating engaging content...',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    link: 'https://example.com/marketing',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    engagement: { likes: 567, comments: 32, shares: 78 },
  },
  {
    id: 'dc4',
    source: '@competitor',
    sourceType: 'competitor',
    title: 'Competitor Post Analysis',
    description: 'High-performing post from a tracked competitor account...',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    link: 'https://instagram.com/p/example',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    engagement: { likes: 2340, comments: 156, shares: 89 },
  },
];

type TabType = 'discover' | 'sources' | 'trending' | 'saved';

// Load from localStorage
function loadSources(): ContentSource[] {
  if (typeof window === 'undefined') return DEFAULT_SOURCES;
  try {
    const stored = localStorage.getItem(SOURCES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SOURCES;
  } catch {
    return DEFAULT_SOURCES;
  }
}

function loadSavedContent(): DiscoveredContent[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SAVED_CONTENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSources(sources: ContentSource[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOURCES_STORAGE_KEY, JSON.stringify(sources));
}

function saveSavedContent(content: DiscoveredContent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SAVED_CONTENT_KEY, JSON.stringify(content));
}

function hasTutorialBeenSeen(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
}

function markTutorialSeen() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
}

export function ContentFinderModal({
  feed,
  isOpen,
  onClose,
  onSelect,
  onAddToQueue,
  feedId,
  children
}: ContentFinderModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [savedContent, setSavedContent] = useState<DiscoveredContent[]>([]);
  const [discoveredContent, setDiscoveredContent] = useState<DiscoveredContent[]>(MOCK_CONTENT);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [newSourceType, setNewSourceType] = useState<'rss' | 'hashtag' | 'competitor' | 'url'>('hashtag');
  const [newSourceValue, setNewSourceValue] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    setSources(loadSources());
    setSavedContent(loadSavedContent());
    setShowTutorial(!hasTutorialBeenSeen());
  }, []);

  // Save sources when they change
  useEffect(() => {
    if (sources.length > 0) {
      saveSources(sources);
    }
  }, [sources]);

  // Save content when it changes
  useEffect(() => {
    saveSavedContent(savedContent);
  }, [savedContent]);

  if (!isOpen) return null;

  // Filter content based on search and selected source
  const filteredContent = discoveredContent.filter(item => {
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = !selectedSource || item.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  const handleAddSource = () => {
    if (!newSourceValue.trim()) return;

    const newSource: ContentSource = {
      id: `source-${Date.now()}`,
      type: newSourceType,
      name: newSourceType === 'hashtag' ? `#${newSourceValue.replace('#', '')}` :
            newSourceType === 'competitor' ? `@${newSourceValue.replace('@', '')}` :
            newSourceValue,
      [newSourceType === 'hashtag' ? 'hashtag' : newSourceType === 'competitor' ? 'accountHandle' : 'url']: newSourceValue,
      enabled: true,
      itemCount: 0,
    };

    setSources(prev => [...prev, newSource]);
    setNewSourceValue('');
    setIsAddingSource(false);
  };

  const handleToggleSource = (sourceId: string) => {
    setSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleRemoveSource = (sourceId: string) => {
    setSources(prev => prev.filter(s => s.id !== sourceId));
  };

  const handleSaveContent = (item: DiscoveredContent) => {
    // Check if already saved
    if (savedContent.some(s => s.id === item.id)) {
      // Remove from saved
      setSavedContent(prev => prev.filter(s => s.id !== item.id));
    } else {
      // Add to saved (store reference only, not the actual image)
      setSavedContent(prev => [...prev, { ...item, savedAt: new Date().toISOString() }]);
    }
  };

  const isContentSaved = (itemId: string) => savedContent.some(s => s.id === itemId);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    markTutorialSeen();
  };

  const formatRelativeTime = (isoDate?: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatNumber = (n?: number) => {
    if (!n) return '0';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="finder-modal-overlay" onClick={onClose}>
      <div className="finder-modal" onClick={e => e.stopPropagation()}>
        {/* Tutorial Overlay */}
        {showTutorial && (
          <div className="finder-tutorial-overlay">
            <div className="finder-tutorial">
              <h3>👋 Welcome to Content Finder</h3>
              <div className="tutorial-steps">
                <div className="tutorial-step">
                  <span className="step-icon">🔎</span>
                  <div className="step-content">
                    <strong>Discover</strong>
                    <p>Find trending content from hashtags, RSS feeds, and competitor accounts</p>
                  </div>
                </div>
                <div className="tutorial-step">
                  <span className="step-icon">📡</span>
                  <div className="step-content">
                    <strong>Sources</strong>
                    <p>Add and manage your content sources - track hashtags, RSS feeds, and competitors</p>
                  </div>
                </div>
                <div className="tutorial-step">
                  <span className="step-icon">💾</span>
                  <div className="step-content">
                    <strong>Save & Queue</strong>
                    <p>Save content references for later or add directly to your posting queue</p>
                  </div>
                </div>
                <div className="tutorial-note">
                  <span className="note-icon">💡</span>
                  <p><strong>Storage Note:</strong> We save links and references only - not actual images. This keeps your data light and fast!</p>
                </div>
              </div>
              <button className="tutorial-close-btn" onClick={handleCloseTutorial}>
                Got it, let's go!
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="finder-modal-header">
          <div className="finder-header-title">
            <span className="finder-icon">🔍</span>
            <h2>Content Finder</h2>
            <button
              className="finder-help-btn"
              onClick={() => setShowTutorial(true)}
              title="Show tutorial"
            >
              ?
            </button>
          </div>
          <button className="finder-close-btn" onClick={onClose}>×</button>
        </header>

        {/* Tabs */}
        <nav className="finder-tabs">
          {(['discover', 'sources', 'trending', 'saved'] as TabType[]).map(tab => (
            <button
              key={tab}
              className={`finder-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'discover' && '🔎'}
              {tab === 'sources' && '📡'}
              {tab === 'trending' && '📈'}
              {tab === 'saved' && '💾'}
              {tab.toUpperCase()}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="finder-body">
          {activeTab === 'discover' && (
            <>
              {/* Search & Filters */}
              <div className="finder-search-bar">
                <input
                  type="text"
                  placeholder="Search discovered content..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="finder-search-input"
                />
                <div className="finder-source-filter">
                  <select
                    value={selectedSource || ''}
                    onChange={e => setSelectedSource(e.target.value || null)}
                    className="finder-select"
                  >
                    <option value="">All Sources</option>
                    {sources.filter(s => s.enabled).map(source => (
                      <option key={source.id} value={source.name}>{source.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content Grid */}
              <div className="finder-content-grid">
                {filteredContent.map(item => (
                  <div key={item.id} className="finder-content-card">
                    {item.imageUrl && (
                      <div className="finder-card-image">
                        <img src={item.imageUrl} alt={item.title} />
                        <span className="finder-card-source">{item.source}</span>
                      </div>
                    )}
                    <div className="finder-card-body">
                      <h3 className="finder-card-title">{item.title}</h3>
                      {item.description && (
                        <p className="finder-card-desc">{item.description}</p>
                      )}
                      <div className="finder-card-meta">
                        <span className="finder-card-time">{formatRelativeTime(item.publishedAt)}</span>
                        {item.engagement && (
                          <div className="finder-card-engagement">
                            <span>❤️ {formatNumber(item.engagement.likes)}</span>
                            <span>💬 {formatNumber(item.engagement.comments)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="finder-card-actions">
                      <button
                        className={`finder-save-btn ${isContentSaved(item.id) ? 'saved' : ''}`}
                        onClick={() => handleSaveContent(item)}
                        title={isContentSaved(item.id) ? 'Remove from saved' : 'Save for later'}
                      >
                        {isContentSaved(item.id) ? '💾' : '🔖'}
                      </button>
                      <button
                        className="finder-action-btn primary"
                        onClick={() => onAddToQueue?.(item)}
                      >
                        + Queue
                      </button>
                      <button
                        className="finder-action-btn"
                        onClick={() => onSelect?.(item)}
                      >
                        Remix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'sources' && (
            <div className="finder-sources">
              <div className="finder-sources-header">
                <h3>Content Sources</h3>
                <button
                  className="finder-add-source-btn"
                  onClick={() => setIsAddingSource(true)}
                >
                  + Add Source
                </button>
              </div>

              {isAddingSource && (
                <div className="finder-add-source-form">
                  <select
                    value={newSourceType}
                    onChange={e => setNewSourceType(e.target.value as any)}
                    className="finder-select"
                  >
                    <option value="hashtag">Hashtag</option>
                    <option value="rss">RSS Feed</option>
                    <option value="competitor">Competitor Account</option>
                    <option value="url">Website URL</option>
                  </select>
                  <input
                    type="text"
                    placeholder={
                      newSourceType === 'hashtag' ? 'Enter hashtag...' :
                      newSourceType === 'rss' ? 'Enter RSS feed URL...' :
                      newSourceType === 'competitor' ? 'Enter account handle...' :
                      'Enter website URL...'
                    }
                    value={newSourceValue}
                    onChange={e => setNewSourceValue(e.target.value)}
                    className="finder-input"
                  />
                  <button className="finder-btn primary" onClick={handleAddSource}>Add</button>
                  <button className="finder-btn" onClick={() => setIsAddingSource(false)}>Cancel</button>
                </div>
              )}

              <div className="finder-sources-list">
                {sources.map(source => (
                  <div key={source.id} className={`finder-source-item ${source.enabled ? 'enabled' : 'disabled'}`}>
                    <div className="finder-source-icon">
                      {source.type === 'hashtag' && '#️⃣'}
                      {source.type === 'rss' && '📰'}
                      {source.type === 'competitor' && '👤'}
                      {source.type === 'url' && '🌐'}
                    </div>
                    <div className="finder-source-info">
                      <span className="finder-source-name">{source.name}</span>
                      <span className="finder-source-meta">
                        {source.itemCount} items • {source.type}
                      </span>
                    </div>
                    <div className="finder-source-actions">
                      <button
                        className={`finder-toggle-btn ${source.enabled ? 'on' : 'off'}`}
                        onClick={() => handleToggleSource(source.id)}
                      >
                        {source.enabled ? 'ON' : 'OFF'}
                      </button>
                      <button
                        className="finder-remove-btn"
                        onClick={() => handleRemoveSource(source.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'trending' && (
            <div className="finder-trending">
              <div className="finder-trending-header">
                <h3>🔥 Trending Now</h3>
                <span className="finder-trending-update">Updated 5 minutes ago</span>
              </div>
              <div className="finder-trending-list">
                {['#AIArt', '#ContentCreator', '#DigitalMarketing', '#SocialMediaTips', '#Reels2026'].map((tag, i) => (
                  <div key={tag} className="finder-trending-item">
                    <span className="finder-trending-rank">#{i + 1}</span>
                    <span className="finder-trending-tag">{tag}</span>
                    <span className="finder-trending-posts">{Math.floor(Math.random() * 50 + 10)}K posts</span>
                    <button className="finder-btn small">Track</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="finder-saved">
              {savedContent.length === 0 ? (
                <div className="finder-saved-empty">
                  <span className="finder-saved-icon">💾</span>
                  <h3>No Saved Content</h3>
                  <p>Save content from the Discover tab to access it later</p>
                  <button className="finder-btn primary" onClick={() => setActiveTab('discover')}>
                    Go to Discover
                  </button>
                </div>
              ) : (
                <>
                  <div className="finder-saved-header">
                    <h3>Saved Content ({savedContent.length})</h3>
                    <span className="finder-storage-note">
                      💡 Saving references only - no heavy downloads!
                    </span>
                  </div>
                  <div className="finder-content-grid">
                    {savedContent.map(item => (
                      <div key={item.id} className="finder-content-card saved">
                        {item.imageUrl && (
                          <div className="finder-card-image">
                            <img src={item.imageUrl} alt={item.title} />
                            <span className="finder-card-source">{item.source}</span>
                          </div>
                        )}
                        <div className="finder-card-body">
                          <h3 className="finder-card-title">{item.title}</h3>
                          {item.description && (
                            <p className="finder-card-desc">{item.description}</p>
                          )}
                          <div className="finder-card-meta">
                            <span className="finder-card-time">Saved {formatRelativeTime(item.savedAt)}</span>
                          </div>
                        </div>
                        <div className="finder-card-actions">
                          <button
                            className="finder-action-btn danger"
                            onClick={() => handleSaveContent(item)}
                          >
                            Remove
                          </button>
                          <button
                            className="finder-action-btn primary"
                            onClick={() => onAddToQueue?.(item)}
                          >
                            + Queue
                          </button>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="finder-action-btn"
                          >
                            View ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="finder-modal-footer">
          <div className="finder-footer-stats">
            <span>{sources.filter(s => s.enabled).length} sources active</span>
            <span>•</span>
            <span>{filteredContent.length} items found</span>
          </div>
          <button className="finder-btn" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  );
}

export default ContentFinderModal;
