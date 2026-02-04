'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Feed } from '../FeedsContext';

interface AutopilotPanelProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
  onOpenCopilot: () => void;
  onOpenScheduler: () => void;
  onOpenContentLibrary: () => void;
}

type AutopilotStep = 'overview' | 'content' | 'captions' | 'schedule' | 'review' | 'active';

interface AutopilotConfig {
  // Content Source
  contentSource: 'library' | 'folder' | 'ai_generated';
  contentFolderId?: string;
  shuffleContent: boolean;
  repeatContent: boolean;

  // Posting Schedule
  postsPerDay: number;
  postingTimes: string[]; // ['09:00', '14:00', '19:00']
  activeDays: string[]; // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  timezone: string;

  // Caption Settings
  captionMode: 'ai_generate' | 'templates' | 'manual_queue';
  captionTone: 'professional' | 'casual' | 'playful' | 'inspirational' | 'educational';
  includeHashtags: boolean;
  hashtagCount: number;
  includeEmojis: boolean;
  includeCTA: boolean;
  ctaType: 'link_bio' | 'comment' | 'share' | 'follow' | 'custom';
  customCTA?: string;
  captionTemplates: string[];

  // Advanced
  avoidDuplicates: boolean;
  minTimeBetweenPosts: number; // hours
  pauseOnLowEngagement: boolean;
  engagementThreshold: number;
}

const DEFAULT_CONFIG: AutopilotConfig = {
  contentSource: 'library',
  shuffleContent: true,
  repeatContent: false,
  postsPerDay: 2,
  postingTimes: ['09:00', '14:00'],
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  captionMode: 'ai_generate',
  captionTone: 'casual',
  includeHashtags: true,
  hashtagCount: 15,
  includeEmojis: true,
  includeCTA: true,
  ctaType: 'link_bio',
  captionTemplates: [],
  avoidDuplicates: true,
  minTimeBetweenPosts: 4,
  pauseOnLowEngagement: false,
  engagementThreshold: 2,
};

export default function AutopilotPanel({
  feed,
  isOpen,
  onClose,
  onOpenCopilot,
  onOpenScheduler,
  onOpenContentLibrary,
}: AutopilotPanelProps) {
  const [step, setStep] = useState<AutopilotStep>('overview');
  const [config, setConfig] = useState<AutopilotConfig>(DEFAULT_CONFIG);
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [contentCount, setContentCount] = useState(0);
  const [queuedPosts, setQueuedPosts] = useState(0);
  const [previewCaption, setPreviewCaption] = useState('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Load saved config
  useEffect(() => {
    const savedConfig = localStorage.getItem(`autopilot_config_${feed.id}`);
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    const isActive = localStorage.getItem(`autopilot_active_${feed.id}`);
    setIsAutopilotActive(isActive === 'true');
  }, [feed.id]);

  // Save config
  const saveConfig = useCallback((newConfig: AutopilotConfig) => {
    setConfig(newConfig);
    localStorage.setItem(`autopilot_config_${feed.id}`, JSON.stringify(newConfig));
  }, [feed.id]);

  // Generate preview caption
  const generatePreviewCaption = async () => {
    setIsGeneratingPreview(true);
    try {
      const response = await fetch('/api/copilot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'caption',
          tone: config.captionTone,
          includeHashtags: config.includeHashtags,
          hashtagCount: config.hashtagCount,
          includeEmojis: config.includeEmojis,
          includeCTA: config.includeCTA,
          ctaType: config.ctaType,
          context: {
            handle: feed.handle,
            niche: 'general', // Could be made configurable
          },
        }),
      });
      const data = await response.json();
      setPreviewCaption(data.content || 'Preview caption will appear here...');
    } catch (error) {
      setPreviewCaption('Unable to generate preview. Check your connection.');
    }
    setIsGeneratingPreview(false);
  };

  // Activate autopilot
  const activateAutopilot = async () => {
    try {
      // Save the configuration
      localStorage.setItem(`autopilot_config_${feed.id}`, JSON.stringify(config));
      localStorage.setItem(`autopilot_active_${feed.id}`, 'true');

      // Queue initial posts based on schedule
      const response = await fetch('/api/autopilot/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedId: feed.id,
          config,
        }),
      });

      if (response.ok) {
        setIsAutopilotActive(true);
        setStep('active');
      }
    } catch (error) {
      console.error('Failed to activate autopilot:', error);
    }
  };

  // Deactivate autopilot
  const deactivateAutopilot = () => {
    localStorage.setItem(`autopilot_active_${feed.id}`, 'false');
    setIsAutopilotActive(false);
    setStep('overview');
  };

  if (!isOpen) return null;

  return (
    <div className="autopilot-panel-overlay">
      <div className="autopilot-panel">
        {/* Header */}
        <div className="autopilot-header">
          <div className="autopilot-title">
            <div className={`autopilot-status-indicator ${isAutopilotActive ? 'active' : 'inactive'}`} />
            <h2>Autopilot Command Center</h2>
            <span className="autopilot-feed-badge">@{feed.handle}</span>
          </div>
          <button className="autopilot-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Progress Steps */}
        {!isAutopilotActive && step !== 'active' && (
          <div className="autopilot-progress">
            {['overview', 'content', 'captions', 'schedule', 'review'].map((s, i) => (
              <div
                key={s}
                className={`progress-step ${step === s ? 'active' : ''} ${
                  ['overview', 'content', 'captions', 'schedule', 'review'].indexOf(step) > i ? 'completed' : ''
                }`}
                onClick={() => setStep(s as AutopilotStep)}
              >
                <div className="step-number">{i + 1}</div>
                <span className="step-label">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="autopilot-content">
          {/* Overview Step */}
          {step === 'overview' && (
            <div className="autopilot-step overview-step">
              <div className="step-header">
                <h3>🚀 Welcome to Autopilot</h3>
                <p>Set up automated posting and let your content work for you 24/7</p>
              </div>

              <div className="overview-cards">
                <div className="overview-card" onClick={() => setStep('content')}>
                  <div className="card-icon">📁</div>
                  <h4>Content Source</h4>
                  <p>Choose where your posts come from</p>
                  <span className="card-status">
                    {config.contentSource === 'library' ? 'Content Library' :
                     config.contentSource === 'folder' ? 'Synced Folder' : 'AI Generated'}
                  </span>
                </div>

                <div className="overview-card" onClick={() => setStep('captions')}>
                  <div className="card-icon">✍️</div>
                  <h4>Caption AI</h4>
                  <p>Configure your caption style</p>
                  <span className="card-status">{config.captionTone} tone</span>
                </div>

                <div className="overview-card" onClick={() => setStep('schedule')}>
                  <div className="card-icon">📅</div>
                  <h4>Schedule</h4>
                  <p>Set posting frequency & times</p>
                  <span className="card-status">{config.postsPerDay} posts/day</span>
                </div>
              </div>

              <div className="overview-stats">
                <div className="stat-item">
                  <span className="stat-value">{contentCount}</span>
                  <span className="stat-label">Content Ready</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{queuedPosts}</span>
                  <span className="stat-label">Posts Queued</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{config.postsPerDay * 7}</span>
                  <span className="stat-label">Weekly Posts</span>
                </div>
              </div>

              <div className="overview-actions">
                <button className="btn-secondary" onClick={onOpenContentLibrary}>
                  📁 Open Content Library
                </button>
                <button className="btn-primary" onClick={() => setStep('content')}>
                  Configure Autopilot →
                </button>
              </div>
            </div>
          )}

          {/* Content Source Step */}
          {step === 'content' && (
            <div className="autopilot-step content-step">
              <div className="step-header">
                <h3>📁 Content Source</h3>
                <p>Where should we pull your content from?</p>
              </div>

              <div className="content-source-options">
                <label className={`source-option ${config.contentSource === 'library' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="contentSource"
                    value="library"
                    checked={config.contentSource === 'library'}
                    onChange={() => saveConfig({ ...config, contentSource: 'library' })}
                  />
                  <div className="option-content">
                    <div className="option-icon">📚</div>
                    <div className="option-details">
                      <h4>Content Library</h4>
                      <p>Use media you've uploaded to Social Exchange</p>
                    </div>
                  </div>
                </label>

                <label className={`source-option ${config.contentSource === 'folder' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="contentSource"
                    value="folder"
                    checked={config.contentSource === 'folder'}
                    onChange={() => saveConfig({ ...config, contentSource: 'folder' })}
                  />
                  <div className="option-content">
                    <div className="option-icon">🔗</div>
                    <div className="option-details">
                      <h4>Synced Folder</h4>
                      <p>Connect Google Drive, Dropbox, or local folder</p>
                    </div>
                  </div>
                </label>

                <label className={`source-option ${config.contentSource === 'ai_generated' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="contentSource"
                    value="ai_generated"
                    checked={config.contentSource === 'ai_generated'}
                    onChange={() => saveConfig({ ...config, contentSource: 'ai_generated' })}
                  />
                  <div className="option-content">
                    <div className="option-icon">🤖</div>
                    <div className="option-details">
                      <h4>AI Generated</h4>
                      <p>Let AI create images based on your brand</p>
                      <span className="coming-soon">Coming Soon</span>
                    </div>
                  </div>
                </label>
              </div>

              <div className="content-options">
                <h4>Content Behavior</h4>

                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={config.shuffleContent}
                    onChange={(e) => saveConfig({ ...config, shuffleContent: e.target.checked })}
                  />
                  <span className="toggle-label">
                    <strong>Shuffle Content</strong>
                    <small>Randomize order instead of sequential</small>
                  </span>
                </label>

                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={config.repeatContent}
                    onChange={(e) => saveConfig({ ...config, repeatContent: e.target.checked })}
                  />
                  <span className="toggle-label">
                    <strong>Repeat Content</strong>
                    <small>Reuse content after all items are posted</small>
                  </span>
                </label>

                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={config.avoidDuplicates}
                    onChange={(e) => saveConfig({ ...config, avoidDuplicates: e.target.checked })}
                  />
                  <span className="toggle-label">
                    <strong>Avoid Duplicates</strong>
                    <small>Never post the same image twice in 30 days</small>
                  </span>
                </label>
              </div>

              <div className="step-actions">
                <button className="btn-secondary" onClick={() => setStep('overview')}>
                  ← Back
                </button>
                <button className="btn-outline" onClick={onOpenContentLibrary}>
                  📁 Manage Content
                </button>
                <button className="btn-primary" onClick={() => setStep('captions')}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Captions Step */}
          {step === 'captions' && (
            <div className="autopilot-step captions-step">
              <div className="step-header">
                <h3>✍️ Caption AI Settings</h3>
                <p>Configure how your captions are generated</p>
              </div>

              <div className="caption-mode-selector">
                <h4>Caption Mode</h4>
                <div className="mode-options">
                  <button
                    className={`mode-btn ${config.captionMode === 'ai_generate' ? 'active' : ''}`}
                    onClick={() => saveConfig({ ...config, captionMode: 'ai_generate' })}
                  >
                    🤖 AI Generate
                  </button>
                  <button
                    className={`mode-btn ${config.captionMode === 'templates' ? 'active' : ''}`}
                    onClick={() => saveConfig({ ...config, captionMode: 'templates' })}
                  >
                    📝 Templates
                  </button>
                  <button
                    className={`mode-btn ${config.captionMode === 'manual_queue' ? 'active' : ''}`}
                    onClick={() => saveConfig({ ...config, captionMode: 'manual_queue' })}
                  >
                    ✏️ Manual Queue
                  </button>
                </div>
              </div>

              {config.captionMode === 'ai_generate' && (
                <>
                  <div className="tone-selector">
                    <h4>Caption Tone</h4>
                    <div className="tone-options">
                      {['professional', 'casual', 'playful', 'inspirational', 'educational'].map((tone) => (
                        <button
                          key={tone}
                          className={`tone-btn ${config.captionTone === tone ? 'active' : ''}`}
                          onClick={() => saveConfig({ ...config, captionTone: tone as any })}
                        >
                          {tone === 'professional' && '👔'}
                          {tone === 'casual' && '😊'}
                          {tone === 'playful' && '🎉'}
                          {tone === 'inspirational' && '✨'}
                          {tone === 'educational' && '📚'}
                          <span>{tone.charAt(0).toUpperCase() + tone.slice(1)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="caption-extras">
                    <h4>Caption Elements</h4>

                    <label className="toggle-option">
                      <input
                        type="checkbox"
                        checked={config.includeHashtags}
                        onChange={(e) => saveConfig({ ...config, includeHashtags: e.target.checked })}
                      />
                      <span className="toggle-label">
                        <strong>Include Hashtags</strong>
                        {config.includeHashtags && (
                          <input
                            type="range"
                            min="5"
                            max="30"
                            value={config.hashtagCount}
                            onChange={(e) => saveConfig({ ...config, hashtagCount: parseInt(e.target.value) })}
                            className="hashtag-slider"
                          />
                        )}
                        <small>{config.hashtagCount} hashtags</small>
                      </span>
                    </label>

                    <label className="toggle-option">
                      <input
                        type="checkbox"
                        checked={config.includeEmojis}
                        onChange={(e) => saveConfig({ ...config, includeEmojis: e.target.checked })}
                      />
                      <span className="toggle-label">
                        <strong>Include Emojis</strong>
                        <small>Add relevant emojis to captions</small>
                      </span>
                    </label>

                    <label className="toggle-option">
                      <input
                        type="checkbox"
                        checked={config.includeCTA}
                        onChange={(e) => saveConfig({ ...config, includeCTA: e.target.checked })}
                      />
                      <span className="toggle-label">
                        <strong>Include Call-to-Action</strong>
                      </span>
                    </label>

                    {config.includeCTA && (
                      <div className="cta-options">
                        <select
                          value={config.ctaType}
                          onChange={(e) => saveConfig({ ...config, ctaType: e.target.value as any })}
                        >
                          <option value="link_bio">Link in Bio</option>
                          <option value="comment">Drop a Comment</option>
                          <option value="share">Share with Friends</option>
                          <option value="follow">Follow for More</option>
                          <option value="custom">Custom CTA</option>
                        </select>
                        {config.ctaType === 'custom' && (
                          <input
                            type="text"
                            placeholder="Enter your custom CTA..."
                            value={config.customCTA || ''}
                            onChange={(e) => saveConfig({ ...config, customCTA: e.target.value })}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Caption Preview */}
                  <div className="caption-preview">
                    <div className="preview-header">
                      <h4>Caption Preview</h4>
                      <button
                        className="btn-small"
                        onClick={generatePreviewCaption}
                        disabled={isGeneratingPreview}
                      >
                        {isGeneratingPreview ? '⏳ Generating...' : '🔄 Generate Preview'}
                      </button>
                    </div>
                    <div className="preview-content">
                      {previewCaption || 'Click "Generate Preview" to see a sample caption'}
                    </div>
                  </div>
                </>
              )}

              <div className="step-actions">
                <button className="btn-secondary" onClick={() => setStep('content')}>
                  ← Back
                </button>
                <button className="btn-outline" onClick={onOpenCopilot}>
                  🤖 Open Copilot
                </button>
                <button className="btn-primary" onClick={() => setStep('schedule')}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Schedule Step */}
          {step === 'schedule' && (
            <div className="autopilot-step schedule-step">
              <div className="step-header">
                <h3>📅 Posting Schedule</h3>
                <p>Set when and how often to post</p>
              </div>

              <div className="frequency-selector">
                <h4>Posts Per Day</h4>
                <div className="frequency-options">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      className={`freq-btn ${config.postsPerDay === num ? 'active' : ''}`}
                      onClick={() => {
                        const times = generateDefaultTimes(num);
                        saveConfig({ ...config, postsPerDay: num, postingTimes: times });
                      }}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    className={`freq-btn ${config.postsPerDay > 5 ? 'active' : ''}`}
                    onClick={() => {
                      const times = generateDefaultTimes(6);
                      saveConfig({ ...config, postsPerDay: 6, postingTimes: times });
                    }}
                  >
                    6+
                  </button>
                </div>
              </div>

              <div className="posting-times">
                <h4>Posting Times</h4>
                <div className="times-grid">
                  {config.postingTimes.map((time, index) => (
                    <div key={index} className="time-input-group">
                      <label>Post {index + 1}</label>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...config.postingTimes];
                          newTimes[index] = e.target.value;
                          saveConfig({ ...config, postingTimes: newTimes });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <p className="optimal-times-hint">
                  💡 Based on your audience, optimal times are: 9am, 12pm, 6pm
                </p>
              </div>

              <div className="active-days">
                <h4>Active Days</h4>
                <div className="days-grid">
                  {[
                    { key: 'mon', label: 'Mon' },
                    { key: 'tue', label: 'Tue' },
                    { key: 'wed', label: 'Wed' },
                    { key: 'thu', label: 'Thu' },
                    { key: 'fri', label: 'Fri' },
                    { key: 'sat', label: 'Sat' },
                    { key: 'sun', label: 'Sun' },
                  ].map((day) => (
                    <button
                      key={day.key}
                      className={`day-btn ${config.activeDays.includes(day.key) ? 'active' : ''}`}
                      onClick={() => {
                        const newDays = config.activeDays.includes(day.key)
                          ? config.activeDays.filter((d) => d !== day.key)
                          : [...config.activeDays, day.key];
                        saveConfig({ ...config, activeDays: newDays });
                      }}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="schedule-summary">
                <div className="summary-card">
                  <span className="summary-value">
                    {config.postsPerDay * config.activeDays.length}
                  </span>
                  <span className="summary-label">Posts/Week</span>
                </div>
                <div className="summary-card">
                  <span className="summary-value">
                    {Math.round((config.postsPerDay * config.activeDays.length * 52) / 12)}
                  </span>
                  <span className="summary-label">Posts/Month</span>
                </div>
                <div className="summary-card">
                  <span className="summary-value">
                    {Math.ceil(contentCount / (config.postsPerDay * config.activeDays.length))}
                  </span>
                  <span className="summary-label">Weeks of Content</span>
                </div>
              </div>

              <div className="step-actions">
                <button className="btn-secondary" onClick={() => setStep('captions')}>
                  ← Back
                </button>
                <button className="btn-outline" onClick={onOpenScheduler}>
                  📅 Open Scheduler
                </button>
                <button className="btn-primary" onClick={() => setStep('review')}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === 'review' && (
            <div className="autopilot-step review-step">
              <div className="step-header">
                <h3>✅ Review & Activate</h3>
                <p>Review your autopilot configuration before going live</p>
              </div>

              <div className="review-summary">
                <div className="review-section">
                  <h4>📁 Content</h4>
                  <ul>
                    <li>Source: <strong>{config.contentSource === 'library' ? 'Content Library' : config.contentSource}</strong></li>
                    <li>Shuffle: <strong>{config.shuffleContent ? 'Yes' : 'No'}</strong></li>
                    <li>Repeat: <strong>{config.repeatContent ? 'Yes' : 'No'}</strong></li>
                  </ul>
                </div>

                <div className="review-section">
                  <h4>✍️ Captions</h4>
                  <ul>
                    <li>Mode: <strong>{config.captionMode}</strong></li>
                    <li>Tone: <strong>{config.captionTone}</strong></li>
                    <li>Hashtags: <strong>{config.includeHashtags ? `${config.hashtagCount} tags` : 'No'}</strong></li>
                    <li>CTA: <strong>{config.includeCTA ? config.ctaType : 'None'}</strong></li>
                  </ul>
                </div>

                <div className="review-section">
                  <h4>📅 Schedule</h4>
                  <ul>
                    <li>Frequency: <strong>{config.postsPerDay} posts/day</strong></li>
                    <li>Times: <strong>{config.postingTimes.join(', ')}</strong></li>
                    <li>Active Days: <strong>{config.activeDays.length} days/week</strong></li>
                    <li>Weekly Total: <strong>{config.postsPerDay * config.activeDays.length} posts</strong></li>
                  </ul>
                </div>
              </div>

              <div className="activation-warning">
                <span className="warning-icon">⚠️</span>
                <p>
                  Once activated, Autopilot will automatically post content based on your schedule.
                  You can pause or modify settings at any time.
                </p>
              </div>

              <div className="step-actions">
                <button className="btn-secondary" onClick={() => setStep('schedule')}>
                  ← Back
                </button>
                <button className="btn-activate" onClick={activateAutopilot}>
                  🚀 Activate Autopilot
                </button>
              </div>
            </div>
          )}

          {/* Active State */}
          {(step === 'active' || isAutopilotActive) && (
            <div className="autopilot-step active-step">
              <div className="active-header">
                <div className="active-indicator">
                  <div className="pulse-ring" />
                  <div className="pulse-core" />
                </div>
                <h3>Autopilot Active</h3>
                <p>Your account is posting automatically</p>
              </div>

              <div className="active-stats">
                <div className="stat-card">
                  <span className="stat-icon">📤</span>
                  <span className="stat-value">12</span>
                  <span className="stat-label">Posts This Week</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">⏰</span>
                  <span className="stat-value">3h 24m</span>
                  <span className="stat-label">Until Next Post</span>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">📊</span>
                  <span className="stat-value">4.2%</span>
                  <span className="stat-label">Avg Engagement</span>
                </div>
              </div>

              <div className="upcoming-posts">
                <h4>Upcoming Posts</h4>
                <div className="posts-list">
                  <div className="upcoming-post">
                    <div className="post-thumb" />
                    <div className="post-info">
                      <span className="post-time">Today at 2:00 PM</span>
                      <span className="post-status pending">Queued</span>
                    </div>
                  </div>
                  <div className="upcoming-post">
                    <div className="post-thumb" />
                    <div className="post-info">
                      <span className="post-time">Today at 7:00 PM</span>
                      <span className="post-status pending">Queued</span>
                    </div>
                  </div>
                  <div className="upcoming-post">
                    <div className="post-thumb" />
                    <div className="post-info">
                      <span className="post-time">Tomorrow at 9:00 AM</span>
                      <span className="post-status pending">Queued</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="active-actions">
                <button className="btn-secondary" onClick={() => setStep('overview')}>
                  ⚙️ Edit Settings
                </button>
                <button className="btn-danger" onClick={deactivateAutopilot}>
                  ⏸️ Pause Autopilot
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Copilot Presence Indicator */}
        <div className="copilot-presence" onClick={onOpenCopilot}>
          <div className="presence-avatar">
            <div className="avatar-pulse" />
            🤖
          </div>
          <div className="presence-text">
            <span className="presence-status">Copilot is here to help</span>
            <span className="presence-hint">Click to chat about your autopilot settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate default posting times
function generateDefaultTimes(count: number): string[] {
  const optimalTimes = ['09:00', '12:00', '14:00', '17:00', '19:00', '21:00'];
  return optimalTimes.slice(0, count);
}
