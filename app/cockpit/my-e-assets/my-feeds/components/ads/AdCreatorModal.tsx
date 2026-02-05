"use client";

import React, { useState, useEffect } from 'react';
import {
  Ad, Campaign, AdTemplate, AdPlatform, AdObjective, AdFormat,
  AdCreative, AdTargeting, AdBudget, AdSchedule,
  AD_OBJECTIVES, AD_PLATFORMS, AD_TEMPLATE_CATEGORIES, CTA_OPTIONS
} from './types';
import './ad-creator.css';

interface AdCreatorModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  feedId?: string;
  onCreateAd?: (ad: Ad) => void;
  onCreateCampaign?: (campaign: Campaign) => void;
}

// Mock templates
const MOCK_TEMPLATES: AdTemplate[] = [
  {
    id: 't1',
    name: 'Product Spotlight',
    description: 'Clean single product showcase with bold headline',
    category: 'product',
    thumbnail: 'https://picsum.photos/200/200?random=1',
    platforms: ['instagram', 'facebook'],
    format: 'single_image',
    objective: 'sales',
    creative: {
      headline: 'New Arrival',
      primaryText: 'Discover our latest [product]. Limited time offer.',
      callToAction: 'Shop Now',
    },
  },
  {
    id: 't2',
    name: 'Carousel Collection',
    description: 'Multi-product carousel for showcasing variety',
    category: 'product',
    thumbnail: 'https://picsum.photos/200/200?random=2',
    platforms: ['instagram', 'facebook'],
    format: 'carousel',
    objective: 'traffic',
    creative: {
      headline: 'Explore Collection',
      primaryText: 'Swipe to discover our best sellers.',
      callToAction: 'Learn More',
    },
  },
  {
    id: 't3',
    name: 'Video Story',
    description: 'Engaging vertical video for stories and reels',
    category: 'service',
    thumbnail: 'https://picsum.photos/200/200?random=3',
    platforms: ['instagram', 'tiktok'],
    format: 'reel',
    objective: 'engagement',
    creative: {
      primaryText: 'Watch how we can help transform your [goal].',
      callToAction: 'Watch More',
    },
  },
  {
    id: 't4',
    name: 'Event Announcement',
    description: 'Eye-catching event promotion template',
    category: 'event',
    thumbnail: 'https://picsum.photos/200/200?random=4',
    platforms: ['instagram', 'facebook', 'linkedin'],
    format: 'single_image',
    objective: 'awareness',
    creative: {
      headline: 'You\'re Invited',
      primaryText: 'Join us for [event name]. Save your spot now!',
      callToAction: 'Book Now',
    },
  },
  {
    id: 't5',
    name: 'Lead Magnet',
    description: 'Collect leads with compelling offer',
    category: 'lead',
    thumbnail: 'https://picsum.photos/200/200?random=5',
    platforms: ['facebook', 'linkedin'],
    format: 'single_image',
    objective: 'leads',
    creative: {
      headline: 'Free Guide',
      primaryText: 'Download our free [resource] and learn how to [benefit].',
      callToAction: 'Download',
    },
  },
  {
    id: 't6',
    name: 'Customer Testimonial',
    description: 'Social proof with customer quote',
    category: 'testimonial',
    thumbnail: 'https://picsum.photos/200/200?random=6',
    platforms: ['instagram', 'facebook'],
    format: 'single_image',
    objective: 'awareness',
    creative: {
      primaryText: '"[Customer quote about your product/service]" - [Customer Name]',
      callToAction: 'Learn More',
    },
  },
  {
    id: 't7',
    name: 'Holiday Sale',
    description: 'Seasonal promotion with festive design',
    category: 'seasonal',
    thumbnail: 'https://picsum.photos/200/200?random=7',
    platforms: ['instagram', 'facebook', 'twitter'],
    format: 'single_image',
    objective: 'sales',
    creative: {
      headline: 'Holiday Special',
      primaryText: '🎁 Up to [X]% off! Limited time only.',
      callToAction: 'Shop Now',
    },
  },
  {
    id: 't8',
    name: 'App Promo',
    description: 'Drive app downloads with engaging visuals',
    category: 'product',
    thumbnail: 'https://picsum.photos/200/200?random=8',
    platforms: ['instagram', 'facebook', 'tiktok'],
    format: 'video',
    objective: 'app_installs',
    creative: {
      headline: 'Download Now',
      primaryText: 'Join [X]+ users who love our app. Available on iOS & Android.',
      callToAction: 'Download',
    },
  },
];

type ViewMode = 'dashboard' | 'templates' | 'creator' | 'campaigns';
type CreatorStep = 'objective' | 'platform' | 'creative' | 'targeting' | 'budget' | 'review';

const STORAGE_KEY = 'se-ad-campaigns';

// Load campaigns from localStorage
function loadCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save campaigns to localStorage
function saveCampaigns(campaigns: Campaign[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

export function AdCreatorModal({ isOpen, onClose, feedId, onCreateAd, onCreateCampaign }: AdCreatorModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AdTemplate | null>(null);
  const [templateCategory, setTemplateCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Creator wizard state
  const [creatorStep, setCreatorStep] = useState<CreatorStep>('objective');
  const [selectedObjective, setSelectedObjective] = useState<AdObjective | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<AdPlatform[]>([]);
  const [adCreative, setAdCreative] = useState<Partial<AdCreative>>({
    type: 'single_image',
    primaryText: '',
    headline: '',
    callToAction: 'Learn More',
    mediaUrls: [],
  });
  const [adTargeting, setAdTargeting] = useState<Partial<AdTargeting>>({
    locations: [],
    ageMin: 18,
    ageMax: 65,
    genders: ['all'],
    interests: [],
  });
  const [adBudget, setAdBudget] = useState<Partial<AdBudget>>({
    type: 'daily',
    amount: 20,
    currency: 'USD',
    bidStrategy: 'lowest_cost',
  });
  const [adSchedule, setAdSchedule] = useState<Partial<AdSchedule>>({
    startDate: new Date().toISOString().split('T')[0],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Load campaigns on mount
  useEffect(() => {
    setCampaigns(loadCampaigns());
  }, []);

  // Save campaigns when they change
  useEffect(() => {
    if (campaigns.length > 0) {
      saveCampaigns(campaigns);
    }
  }, [campaigns]);

  if (!isOpen) return null;

  // Filter templates
  const filteredTemplates = MOCK_TEMPLATES.filter(template => {
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = templateCategory === 'all' || template.category === templateCategory;
    return matchesSearch && matchesCategory;
  });

  // Stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSpend = campaigns.reduce((sum, c) => sum + (c.totalSpend || 0), 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + (c.totalImpressions || 0), 0);

  // Start from template
  const handleUseTemplate = (template: AdTemplate) => {
    setSelectedTemplate(template);
    setSelectedObjective(template.objective);
    setSelectedPlatforms(template.platforms);
    setAdCreative({
      type: template.format,
      ...template.creative,
      mediaUrls: [],
    });
    setCreatorStep('creative');
    setViewMode('creator');
  };

  // Start blank
  const handleStartBlank = () => {
    setSelectedTemplate(null);
    setSelectedObjective(null);
    setSelectedPlatforms([]);
    setAdCreative({
      type: 'single_image',
      primaryText: '',
      headline: '',
      callToAction: 'Learn More',
      mediaUrls: [],
    });
    setCreatorStep('objective');
    setViewMode('creator');
  };

  // Navigate creator steps
  const handleNextStep = () => {
    const steps: CreatorStep[] = ['objective', 'platform', 'creative', 'targeting', 'budget', 'review'];
    const currentIndex = steps.indexOf(creatorStep);
    if (currentIndex < steps.length - 1) {
      setCreatorStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    const steps: CreatorStep[] = ['objective', 'platform', 'creative', 'targeting', 'budget', 'review'];
    const currentIndex = steps.indexOf(creatorStep);
    if (currentIndex > 0) {
      setCreatorStep(steps[currentIndex - 1]);
    }
  };

  // Create ad
  const handleCreateAd = () => {
    const newCampaign: Campaign = {
      id: `campaign-${Date.now()}`,
      feedId: feedId || '',
      name: `Campaign ${new Date().toLocaleDateString()}`,
      objective: selectedObjective!,
      status: 'draft',
      budget: adBudget as AdBudget,
      schedule: adSchedule as AdSchedule,
      ads: [{
        id: `ad-${Date.now()}`,
        campaignId: `campaign-${Date.now()}`,
        name: adCreative.headline || 'Untitled Ad',
        platform: selectedPlatforms[0],
        objective: selectedObjective!,
        creative: adCreative as AdCreative,
        targeting: adTargeting as AdTargeting,
        budget: adBudget as AdBudget,
        schedule: adSchedule as AdSchedule,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }],
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCampaigns(prev => [...prev, newCampaign]);
    onCreateCampaign?.(newCampaign);
    setViewMode('dashboard');
    resetCreator();
  };

  // Reset creator
  const resetCreator = () => {
    setCreatorStep('objective');
    setSelectedObjective(null);
    setSelectedPlatforms([]);
    setSelectedTemplate(null);
    setAdCreative({
      type: 'single_image',
      primaryText: '',
      headline: '',
      callToAction: 'Learn More',
      mediaUrls: [],
    });
  };

  // Toggle platform selection
  const togglePlatform = (platform: AdPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps: { id: CreatorStep; label: string }[] = [
      { id: 'objective', label: 'Objective' },
      { id: 'platform', label: 'Platforms' },
      { id: 'creative', label: 'Creative' },
      { id: 'targeting', label: 'Audience' },
      { id: 'budget', label: 'Budget' },
      { id: 'review', label: 'Review' },
    ];

    return (
      <div className="creator-steps">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={`creator-step ${creatorStep === step.id ? 'active' : ''} ${
                steps.indexOf(steps.find(s => s.id === creatorStep)!) > index ? 'completed' : ''
              }`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && <div className="step-connector" />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="ad-creator-overlay" onClick={onClose}>
      <div className="ad-creator-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="ad-creator-header">
          <div className="header-left">
            {viewMode !== 'dashboard' && (
              <button className="back-btn" onClick={() => setViewMode('dashboard')}>
                ← Back
              </button>
            )}
            <h2>
              {viewMode === 'dashboard' && '📢 Ad Creator'}
              {viewMode === 'templates' && '📋 Ad Templates'}
              {viewMode === 'creator' && '✨ Create New Ad'}
              {viewMode === 'campaigns' && '📊 Campaigns'}
            </h2>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </header>

        {/* Dashboard View */}
        {viewMode === 'dashboard' && (
          <div className="ad-dashboard">
            {/* Stats */}
            <div className="ad-stats">
              <div className="stat-card">
                <span className="stat-icon">📊</span>
                <div className="stat-content">
                  <span className="stat-value">{totalCampaigns}</span>
                  <span className="stat-label">Campaigns</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">🟢</span>
                <div className="stat-content">
                  <span className="stat-value">{activeCampaigns}</span>
                  <span className="stat-label">Active</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">💰</span>
                <div className="stat-content">
                  <span className="stat-value">${totalSpend.toFixed(2)}</span>
                  <span className="stat-label">Total Spend</span>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-icon">👁️</span>
                <div className="stat-content">
                  <span className="stat-value">{totalImpressions.toLocaleString()}</span>
                  <span className="stat-label">Impressions</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-card primary" onClick={handleStartBlank}>
                <span className="action-icon">➕</span>
                <span className="action-title">Create New Ad</span>
                <span className="action-desc">Start from scratch</span>
              </button>
              <button className="action-card" onClick={() => setViewMode('templates')}>
                <span className="action-icon">📋</span>
                <span className="action-title">Browse Templates</span>
                <span className="action-desc">Use a pre-made design</span>
              </button>
              <button className="action-card" onClick={() => setViewMode('campaigns')}>
                <span className="action-icon">📊</span>
                <span className="action-title">View Campaigns</span>
                <span className="action-desc">Manage existing ads</span>
              </button>
            </div>

            {/* Recent Campaigns */}
            <div className="recent-campaigns">
              <h3>Recent Campaigns</h3>
              {campaigns.length === 0 ? (
                <div className="empty-campaigns">
                  <span className="empty-icon">📢</span>
                  <p>No campaigns yet. Create your first ad to get started!</p>
                </div>
              ) : (
                <div className="campaign-list">
                  {campaigns.slice(0, 3).map(campaign => (
                    <div key={campaign.id} className="campaign-item">
                      <div className={`campaign-status ${campaign.status}`}>
                        {campaign.status}
                      </div>
                      <div className="campaign-info">
                        <h4>{campaign.name}</h4>
                        <span>{campaign.ads.length} ad(s) • {AD_OBJECTIVES.find(o => o.id === campaign.objective)?.name}</span>
                      </div>
                      <div className="campaign-metrics">
                        <span>${campaign.totalSpend.toFixed(2)} spent</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Templates View */}
        {viewMode === 'templates' && (
          <div className="ad-templates">
            <div className="templates-toolbar">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="template-search"
              />
            </div>

            <div className="template-categories">
              {AD_TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`category-btn ${templateCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setTemplateCategory(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="template-grid">
              {filteredTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-preview">
                    <img src={template.thumbnail} alt={template.name} />
                    <div className="template-platforms">
                      {template.platforms.map(p => (
                        <span key={p} className="platform-badge">
                          {AD_PLATFORMS.find(pl => pl.id === p)?.icon}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="template-info">
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                    <div className="template-meta">
                      <span className="format-badge">{template.format.replace('_', ' ')}</span>
                      <span className="objective-badge">
                        {AD_OBJECTIVES.find(o => o.id === template.objective)?.icon}
                        {AD_OBJECTIVES.find(o => o.id === template.objective)?.name}
                      </span>
                    </div>
                  </div>
                  <button className="use-btn" onClick={() => handleUseTemplate(template)}>
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creator View */}
        {viewMode === 'creator' && (
          <div className="ad-creator-wizard">
            {renderStepIndicator()}

            <div className="creator-content">
              {/* Objective Step */}
              {creatorStep === 'objective' && (
                <div className="creator-step-content">
                  <h3>What's your campaign objective?</h3>
                  <p>Choose the goal that best fits what you want to achieve</p>
                  <div className="objective-grid">
                    {AD_OBJECTIVES.map(obj => (
                      <button
                        key={obj.id}
                        className={`objective-card ${selectedObjective === obj.id ? 'selected' : ''}`}
                        onClick={() => setSelectedObjective(obj.id)}
                      >
                        <span className="objective-icon">{obj.icon}</span>
                        <span className="objective-name">{obj.name}</span>
                        <span className="objective-desc">{obj.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform Step */}
              {creatorStep === 'platform' && (
                <div className="creator-step-content">
                  <h3>Where do you want to run your ad?</h3>
                  <p>Select one or more platforms for your campaign</p>
                  <div className="platform-grid">
                    {AD_PLATFORMS.map(platform => (
                      <button
                        key={platform.id}
                        className={`platform-card ${selectedPlatforms.includes(platform.id) ? 'selected' : ''}`}
                        onClick={() => togglePlatform(platform.id)}
                      >
                        <span className="platform-icon">{platform.icon}</span>
                        <span className="platform-name">{platform.name}</span>
                        <span className="platform-formats">
                          {platform.formats.slice(0, 3).join(', ')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Creative Step */}
              {creatorStep === 'creative' && (
                <div className="creator-step-content">
                  <h3>Design your ad creative</h3>
                  <div className="creative-editor">
                    <div className="creative-form">
                      <div className="form-group">
                        <label>Format</label>
                        <select
                          value={adCreative.type}
                          onChange={e => setAdCreative({ ...adCreative, type: e.target.value as AdFormat })}
                        >
                          <option value="single_image">Single Image</option>
                          <option value="carousel">Carousel</option>
                          <option value="video">Video</option>
                          <option value="story">Story</option>
                          <option value="reel">Reel</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Headline</label>
                        <input
                          type="text"
                          value={adCreative.headline || ''}
                          onChange={e => setAdCreative({ ...adCreative, headline: e.target.value })}
                          placeholder="Catchy headline..."
                          maxLength={40}
                        />
                        <span className="char-count">{(adCreative.headline || '').length}/40</span>
                      </div>
                      <div className="form-group">
                        <label>Primary Text</label>
                        <textarea
                          value={adCreative.primaryText || ''}
                          onChange={e => setAdCreative({ ...adCreative, primaryText: e.target.value })}
                          placeholder="Your ad message..."
                          maxLength={125}
                          rows={3}
                        />
                        <span className="char-count">{(adCreative.primaryText || '').length}/125</span>
                      </div>
                      <div className="form-group">
                        <label>Call to Action</label>
                        <select
                          value={adCreative.callToAction}
                          onChange={e => setAdCreative({ ...adCreative, callToAction: e.target.value })}
                        >
                          {CTA_OPTIONS.map(cta => (
                            <option key={cta} value={cta}>{cta}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Destination URL</label>
                        <input
                          type="url"
                          value={adCreative.destinationUrl || ''}
                          onChange={e => setAdCreative({ ...adCreative, destinationUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Media</label>
                        <div className="media-upload">
                          <button className="upload-btn">
                            📷 Upload Image/Video
                          </button>
                          <span className="upload-hint">Recommended: 1080x1080 for feed, 1080x1920 for stories</span>
                        </div>
                      </div>
                    </div>
                    <div className="creative-preview">
                      <h4>Preview</h4>
                      <div className="ad-preview-card">
                        <div className="preview-media">
                          <span className="preview-placeholder">📷</span>
                        </div>
                        <div className="preview-content">
                          <p className="preview-text">{adCreative.primaryText || 'Your ad text will appear here...'}</p>
                          <p className="preview-headline">{adCreative.headline || 'Headline'}</p>
                          <button className="preview-cta">{adCreative.callToAction}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Targeting Step */}
              {creatorStep === 'targeting' && (
                <div className="creator-step-content">
                  <h3>Define your audience</h3>
                  <div className="targeting-form">
                    <div className="form-group">
                      <label>Locations</label>
                      <input
                        type="text"
                        placeholder="Enter locations (e.g., United States, New York)"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            setAdTargeting({
                              ...adTargeting,
                              locations: [...(adTargeting.locations || []), e.currentTarget.value]
                            });
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="tag-list">
                        {adTargeting.locations?.map((loc, i) => (
                          <span key={i} className="tag">
                            {loc}
                            <button onClick={() => setAdTargeting({
                              ...adTargeting,
                              locations: adTargeting.locations?.filter((_, j) => j !== i)
                            })}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group half">
                        <label>Age Range</label>
                        <div className="age-range">
                          <input
                            type="number"
                            min={13}
                            max={65}
                            value={adTargeting.ageMin || 18}
                            onChange={e => setAdTargeting({ ...adTargeting, ageMin: parseInt(e.target.value) })}
                          />
                          <span>to</span>
                          <input
                            type="number"
                            min={13}
                            max={65}
                            value={adTargeting.ageMax || 65}
                            onChange={e => setAdTargeting({ ...adTargeting, ageMax: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="form-group half">
                        <label>Gender</label>
                        <select
                          value={adTargeting.genders?.[0] || 'all'}
                          onChange={e => setAdTargeting({ ...adTargeting, genders: [e.target.value as any] })}
                        >
                          <option value="all">All Genders</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Interests</label>
                      <input
                        type="text"
                        placeholder="Add interests (e.g., technology, fitness, travel)"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            setAdTargeting({
                              ...adTargeting,
                              interests: [...(adTargeting.interests || []), e.currentTarget.value]
                            });
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <div className="tag-list">
                        {adTargeting.interests?.map((interest, i) => (
                          <span key={i} className="tag">
                            {interest}
                            <button onClick={() => setAdTargeting({
                              ...adTargeting,
                              interests: adTargeting.interests?.filter((_, j) => j !== i)
                            })}>×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="audience-estimate">
                      <span className="estimate-icon">👥</span>
                      <div className="estimate-info">
                        <span className="estimate-label">Estimated Audience Size</span>
                        <span className="estimate-value">2.5M - 5M people</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Budget Step */}
              {creatorStep === 'budget' && (
                <div className="creator-step-content">
                  <h3>Set your budget & schedule</h3>
                  <div className="budget-form">
                    <div className="form-group">
                      <label>Budget Type</label>
                      <div className="budget-type-options">
                        <button
                          className={`budget-type-btn ${adBudget.type === 'daily' ? 'selected' : ''}`}
                          onClick={() => setAdBudget({ ...adBudget, type: 'daily' })}
                        >
                          <span className="type-name">Daily Budget</span>
                          <span className="type-desc">Spend up to this amount each day</span>
                        </button>
                        <button
                          className={`budget-type-btn ${adBudget.type === 'lifetime' ? 'selected' : ''}`}
                          onClick={() => setAdBudget({ ...adBudget, type: 'lifetime' })}
                        >
                          <span className="type-name">Lifetime Budget</span>
                          <span className="type-desc">Spend this amount over entire campaign</span>
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Budget Amount</label>
                      <div className="budget-input">
                        <span className="currency">$</span>
                        <input
                          type="number"
                          min={1}
                          value={adBudget.amount || 20}
                          onChange={e => setAdBudget({ ...adBudget, amount: parseFloat(e.target.value) })}
                        />
                        <span className="period">{adBudget.type === 'daily' ? '/day' : 'total'}</span>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group half">
                        <label>Start Date</label>
                        <input
                          type="date"
                          value={adSchedule.startDate || ''}
                          onChange={e => setAdSchedule({ ...adSchedule, startDate: e.target.value })}
                        />
                      </div>
                      <div className="form-group half">
                        <label>End Date (Optional)</label>
                        <input
                          type="date"
                          value={adSchedule.endDate || ''}
                          onChange={e => setAdSchedule({ ...adSchedule, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="budget-estimate">
                      <div className="estimate-row">
                        <span>Estimated Daily Reach</span>
                        <span>5K - 15K people</span>
                      </div>
                      <div className="estimate-row">
                        <span>Estimated Results</span>
                        <span>200 - 600 clicks</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Step */}
              {creatorStep === 'review' && (
                <div className="creator-step-content">
                  <h3>Review your ad</h3>
                  <div className="review-summary">
                    <div className="review-section">
                      <h4>Campaign Details</h4>
                      <div className="review-row">
                        <span>Objective</span>
                        <span>{AD_OBJECTIVES.find(o => o.id === selectedObjective)?.name}</span>
                      </div>
                      <div className="review-row">
                        <span>Platforms</span>
                        <span>{selectedPlatforms.map(p => AD_PLATFORMS.find(pl => pl.id === p)?.name).join(', ')}</span>
                      </div>
                    </div>
                    <div className="review-section">
                      <h4>Creative</h4>
                      <div className="review-row">
                        <span>Format</span>
                        <span>{adCreative.type?.replace('_', ' ')}</span>
                      </div>
                      <div className="review-row">
                        <span>Headline</span>
                        <span>{adCreative.headline || '-'}</span>
                      </div>
                      <div className="review-row">
                        <span>CTA</span>
                        <span>{adCreative.callToAction}</span>
                      </div>
                    </div>
                    <div className="review-section">
                      <h4>Audience</h4>
                      <div className="review-row">
                        <span>Locations</span>
                        <span>{adTargeting.locations?.join(', ') || 'All locations'}</span>
                      </div>
                      <div className="review-row">
                        <span>Age</span>
                        <span>{adTargeting.ageMin} - {adTargeting.ageMax}</span>
                      </div>
                    </div>
                    <div className="review-section">
                      <h4>Budget & Schedule</h4>
                      <div className="review-row">
                        <span>Budget</span>
                        <span>${adBudget.amount} {adBudget.type}</span>
                      </div>
                      <div className="review-row">
                        <span>Duration</span>
                        <span>{adSchedule.startDate} - {adSchedule.endDate || 'Ongoing'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="creator-nav">
              {creatorStep !== 'objective' && (
                <button className="nav-btn secondary" onClick={handlePrevStep}>
                  ← Previous
                </button>
              )}
              <div className="nav-spacer" />
              {creatorStep !== 'review' ? (
                <button
                  className="nav-btn primary"
                  onClick={handleNextStep}
                  disabled={
                    (creatorStep === 'objective' && !selectedObjective) ||
                    (creatorStep === 'platform' && selectedPlatforms.length === 0)
                  }
                >
                  Next →
                </button>
              ) : (
                <button className="nav-btn primary create" onClick={handleCreateAd}>
                  🚀 Create Campaign
                </button>
              )}
            </div>
          </div>
        )}

        {/* Campaigns View */}
        {viewMode === 'campaigns' && (
          <div className="ad-campaigns">
            <div className="campaigns-header">
              <h3>All Campaigns</h3>
              <button className="action-btn" onClick={handleStartBlank}>
                + New Campaign
              </button>
            </div>
            {campaigns.length === 0 ? (
              <div className="empty-campaigns large">
                <span className="empty-icon">📊</span>
                <h3>No Campaigns Yet</h3>
                <p>Create your first ad campaign to start reaching your audience</p>
                <button className="action-btn primary" onClick={handleStartBlank}>
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="campaigns-list">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="campaign-card">
                    <div className="campaign-header">
                      <div className={`status-badge ${campaign.status}`}>{campaign.status}</div>
                      <div className="campaign-actions">
                        <button className="icon-btn" title="Edit">✏️</button>
                        <button className="icon-btn" title="Duplicate">📋</button>
                        <button className="icon-btn" title="Delete">🗑️</button>
                      </div>
                    </div>
                    <div className="campaign-body">
                      <h4>{campaign.name}</h4>
                      <p>{AD_OBJECTIVES.find(o => o.id === campaign.objective)?.name} • {campaign.ads.length} ad(s)</p>
                    </div>
                    <div className="campaign-metrics-grid">
                      <div className="metric">
                        <span className="metric-value">${campaign.totalSpend.toFixed(2)}</span>
                        <span className="metric-label">Spend</span>
                      </div>
                      <div className="metric">
                        <span className="metric-value">{campaign.totalImpressions.toLocaleString()}</span>
                        <span className="metric-label">Impressions</span>
                      </div>
                      <div className="metric">
                        <span className="metric-value">{campaign.totalClicks.toLocaleString()}</span>
                        <span className="metric-label">Clicks</span>
                      </div>
                    </div>
                    <div className="campaign-footer">
                      <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                      <button className={`toggle-btn ${campaign.status === 'active' ? 'active' : ''}`}>
                        {campaign.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="ad-creator-footer">
          <span className="footer-info">
            {viewMode === 'dashboard' && `${activeCampaigns} active campaign(s)`}
            {viewMode === 'templates' && `${filteredTemplates.length} templates`}
            {viewMode === 'creator' && 'Complete all steps to launch your campaign'}
            {viewMode === 'campaigns' && `${campaigns.length} total campaign(s)`}
          </span>
        </footer>
      </div>
    </div>
  );
}

export default AdCreatorModal;
