"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Feed } from '../../types/feed';
import './advertise.css';

interface AdvertiseTabProps {
  feed?: Feed | null;
}

// Types for overlays
interface OverlayItem {
  id: string;
  type: 'logo' | 'qr' | 'link' | 'watermark' | 'text';
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string;
  style?: {
    opacity?: number;
    rotation?: number;
    color?: string;
    animation?: string;
  };
}

interface BrandKit {
  id: string;
  name: string;
  logo?: string;
  colors: string[];
  fonts: string[];
  watermarkText?: string;
  defaultOverlays: OverlayItem[];
}

interface ContentItem {
  id: string;
  type: 'image' | 'video' | 'reel';
  thumbnail: string;
  url: string;
  caption?: string;
  status: 'draft' | 'branded' | 'scheduled' | 'published';
}

interface PartnerCampaign {
  id: string;
  brand: string;
  brandLogo: string;
  title: string;
  description: string;
  compensation: string;
  requirements: string[];
  deadline: string;
  status: 'open' | 'applied' | 'accepted' | 'completed';
}

type ViewMode = 'dashboard' | 'editor' | 'brandkit' | 'campaigns';
type EditorTool = 'select' | 'logo' | 'qr' | 'link' | 'watermark' | 'text';

const STORAGE_KEY = 'se-brand-kits';
const CAMPAIGNS_KEY = 'se-partner-campaigns';

// Mock partner campaigns
const MOCK_PARTNER_CAMPAIGNS: PartnerCampaign[] = [
  {
    id: 'pc1',
    brand: 'TechFlow',
    brandLogo: 'https://picsum.photos/100/100?random=10',
    title: 'Tech Product Launch',
    description: 'Create engaging content showcasing our new smart device launch.',
    compensation: '$500-2000',
    requirements: ['10K+ followers', 'Tech niche', '2 posts + 3 stories'],
    deadline: '2024-02-15',
    status: 'open',
  },
  {
    id: 'pc2',
    brand: 'FitLife Pro',
    brandLogo: 'https://picsum.photos/100/100?random=11',
    title: 'Fitness Challenge Campaign',
    description: 'Join our 30-day fitness challenge and document your journey.',
    compensation: '$300-800',
    requirements: ['5K+ followers', 'Fitness content', '1 reel per week'],
    deadline: '2024-02-28',
    status: 'open',
  },
  {
    id: 'pc3',
    brand: 'EcoStyle',
    brandLogo: 'https://picsum.photos/100/100?random=12',
    title: 'Sustainable Fashion Spotlight',
    description: 'Showcase our eco-friendly fashion line with your unique style.',
    compensation: '$200 + Products',
    requirements: ['2K+ followers', 'Fashion focus', '3 carousel posts'],
    deadline: '2024-03-10',
    status: 'applied',
  },
];

// Mock content library
const MOCK_CONTENT: ContentItem[] = [
  { id: 'c1', type: 'image', thumbnail: 'https://picsum.photos/400/400?random=20', url: '', status: 'draft' },
  { id: 'c2', type: 'video', thumbnail: 'https://picsum.photos/400/400?random=21', url: '', status: 'draft' },
  { id: 'c3', type: 'reel', thumbnail: 'https://picsum.photos/400/400?random=22', url: '', status: 'branded' },
  { id: 'c4', type: 'image', thumbnail: 'https://picsum.photos/400/400?random=23', url: '', status: 'draft' },
];

function loadBrandKits(): BrandKit[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveBrandKits(kits: BrandKit[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kits));
}

export function AdvertiseTab({ feed }: AdvertiseTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [partnerCampaigns, setPartnerCampaigns] = useState<PartnerCampaign[]>(MOCK_PARTNER_CAMPAIGNS);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [editorTool, setEditorTool] = useState<EditorTool>('select');
  const [activeBrandKit, setActiveBrandKit] = useState<BrandKit | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('Visit Site');
  const [watermarkText, setWatermarkText] = useState('');
  const [customText, setCustomText] = useState('');

  // Load brand kits on mount
  useEffect(() => {
    setBrandKits(loadBrandKits());
  }, []);

  // Save brand kits when they change
  useEffect(() => {
    if (brandKits.length > 0) {
      saveBrandKits(brandKits);
    }
  }, [brandKits]);

  // Create default brand kit
  const handleCreateBrandKit = () => {
    const newKit: BrandKit = {
      id: `bk-${Date.now()}`,
      name: feed?.displayName ? `${feed.displayName}'s Brand Kit` : 'My Brand Kit',
      colors: ['#00ffc8', '#1a1a2e', '#ffffff'],
      fonts: ['Inter', 'Poppins'],
      watermarkText: feed?.handle || '@username',
      defaultOverlays: [],
    };
    setBrandKits(prev => [...prev, newKit]);
    setActiveBrandKit(newKit);
  };

  // Add overlay to canvas
  const handleAddOverlay = useCallback((type: OverlayItem['type']) => {
    const newOverlay: OverlayItem = {
      id: `overlay-${Date.now()}`,
      type,
      position: { x: 50, y: 50 },
      size: { width: type === 'watermark' ? 200 : 100, height: type === 'watermark' ? 30 : 100 },
      content: type === 'qr' ? qrUrl : type === 'link' ? linkUrl : type === 'watermark' ? watermarkText : type === 'text' ? customText : '',
      style: {
        opacity: type === 'watermark' ? 0.5 : 1,
        rotation: 0,
        animation: type === 'link' ? 'pulse' : undefined,
      },
    };
    setOverlays(prev => [...prev, newOverlay]);
  }, [qrUrl, linkUrl, watermarkText, customText]);

  // Remove overlay
  const handleRemoveOverlay = (id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
  };

  // Apply to campaign
  const handleApplyToCampaign = (campaignId: string) => {
    setPartnerCampaigns(prev =>
      prev.map(c => c.id === campaignId ? { ...c, status: 'applied' as const } : c)
    );
  };

  // Stats
  const brandedCount = MOCK_CONTENT.filter(c => c.status === 'branded').length;
  const openCampaigns = partnerCampaigns.filter(c => c.status === 'open').length;
  const appliedCampaigns = partnerCampaigns.filter(c => c.status === 'applied').length;

  return (
    <div className="advertise-tab">
      {/* Header with View Tabs */}
      <header className="advertise-header">
        <div className="advertise-title-group">
          <h2>📢 Advertise & Promote</h2>
          <span className="advertise-subtitle">Create branded content & join campaigns</span>
        </div>
        <nav className="advertise-nav">
          <button
            className={`advertise-nav-btn ${viewMode === 'dashboard' ? 'active' : ''}`}
            onClick={() => setViewMode('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`advertise-nav-btn ${viewMode === 'editor' ? 'active' : ''}`}
            onClick={() => setViewMode('editor')}
          >
            Content Editor
          </button>
          <button
            className={`advertise-nav-btn ${viewMode === 'brandkit' ? 'active' : ''}`}
            onClick={() => setViewMode('brandkit')}
          >
            Brand Kit
          </button>
          <button
            className={`advertise-nav-btn ${viewMode === 'campaigns' ? 'active' : ''}`}
            onClick={() => setViewMode('campaigns')}
          >
            Partner Campaigns
          </button>
        </nav>
      </header>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="advertise-dashboard">
          {/* Stats */}
          <div className="advertise-stats">
            <div className="stat-card">
              <span className="stat-icon">🎨</span>
              <div className="stat-info">
                <span className="stat-value">{brandKits.length}</span>
                <span className="stat-label">Brand Kits</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✨</span>
              <div className="stat-info">
                <span className="stat-value">{brandedCount}</span>
                <span className="stat-label">Branded Content</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🤝</span>
              <div className="stat-info">
                <span className="stat-value">{openCampaigns}</span>
                <span className="stat-label">Open Campaigns</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📬</span>
              <div className="stat-info">
                <span className="stat-value">{appliedCampaigns}</span>
                <span className="stat-label">Applied</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-grid">
            <button className="quick-action primary" onClick={() => setViewMode('editor')}>
              <span className="action-icon">🖼️</span>
              <span className="action-text">Brand Content</span>
              <span className="action-desc">Add logos, QR codes & overlays</span>
            </button>
            <button className="quick-action" onClick={() => setViewMode('brandkit')}>
              <span className="action-icon">🎨</span>
              <span className="action-text">Manage Brand Kit</span>
              <span className="action-desc">Colors, logos, watermarks</span>
            </button>
            <button className="quick-action" onClick={() => setViewMode('campaigns')}>
              <span className="action-icon">💼</span>
              <span className="action-text">Find Campaigns</span>
              <span className="action-desc">Partner with brands</span>
            </button>
          </div>

          {/* Recent Branded Content */}
          <section className="dashboard-section">
            <h3>Recent Content</h3>
            <div className="content-grid">
              {MOCK_CONTENT.slice(0, 4).map(item => (
                <div
                  key={item.id}
                  className={`content-card ${item.status}`}
                  onClick={() => {
                    setSelectedContent(item);
                    setViewMode('editor');
                  }}
                >
                  <img src={item.thumbnail} alt="Content" />
                  <div className="content-overlay">
                    <span className={`content-badge ${item.status}`}>{item.status}</span>
                    <span className="content-type">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Featured Campaigns */}
          <section className="dashboard-section">
            <h3>Featured Campaigns</h3>
            <div className="campaigns-preview">
              {partnerCampaigns.filter(c => c.status === 'open').slice(0, 2).map(campaign => (
                <div key={campaign.id} className="campaign-preview-card">
                  <img src={campaign.brandLogo} alt={campaign.brand} className="campaign-logo" />
                  <div className="campaign-preview-info">
                    <h4>{campaign.title}</h4>
                    <span className="campaign-brand">{campaign.brand}</span>
                    <span className="campaign-comp">{campaign.compensation}</span>
                  </div>
                  <button
                    className="campaign-action-btn"
                    onClick={() => setViewMode('campaigns')}
                  >
                    View →
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Content Editor View */}
      {viewMode === 'editor' && (
        <div className="advertise-editor">
          <div className="editor-sidebar">
            {/* Tool Selection */}
            <div className="tool-section">
              <h4>Overlay Tools</h4>
              <div className="tool-grid">
                <button
                  className={`tool-btn ${editorTool === 'logo' ? 'active' : ''}`}
                  onClick={() => setEditorTool('logo')}
                >
                  <span>🏷️</span>
                  <span>Logo</span>
                </button>
                <button
                  className={`tool-btn ${editorTool === 'qr' ? 'active' : ''}`}
                  onClick={() => setEditorTool('qr')}
                >
                  <span>📱</span>
                  <span>QR Code</span>
                </button>
                <button
                  className={`tool-btn ${editorTool === 'link' ? 'active' : ''}`}
                  onClick={() => setEditorTool('link')}
                >
                  <span>🔗</span>
                  <span>Link</span>
                </button>
                <button
                  className={`tool-btn ${editorTool === 'watermark' ? 'active' : ''}`}
                  onClick={() => setEditorTool('watermark')}
                >
                  <span>💧</span>
                  <span>Watermark</span>
                </button>
                <button
                  className={`tool-btn ${editorTool === 'text' ? 'active' : ''}`}
                  onClick={() => setEditorTool('text')}
                >
                  <span>📝</span>
                  <span>Text</span>
                </button>
              </div>
            </div>

            {/* Tool Options */}
            <div className="tool-options">
              {editorTool === 'logo' && (
                <div className="option-group">
                  <label>Upload Logo</label>
                  <div className="upload-area">
                    <span>📷</span>
                    <span>Click or drag to upload</span>
                  </div>
                  <button className="add-overlay-btn" onClick={() => handleAddOverlay('logo')}>
                    + Add Logo Overlay
                  </button>
                </div>
              )}

              {editorTool === 'qr' && (
                <div className="option-group">
                  <label>QR Code URL</label>
                  <input
                    type="url"
                    placeholder="https://your-link.com"
                    value={qrUrl}
                    onChange={e => setQrUrl(e.target.value)}
                  />
                  <div className="qr-preview">
                    <div className="qr-placeholder">
                      <span>📱</span>
                      <span>QR Preview</span>
                    </div>
                  </div>
                  <button
                    className="add-overlay-btn"
                    onClick={() => handleAddOverlay('qr')}
                    disabled={!qrUrl}
                  >
                    + Add QR Code
                  </button>
                </div>
              )}

              {editorTool === 'link' && (
                <div className="option-group">
                  <label>Link URL</label>
                  <input
                    type="url"
                    placeholder="https://your-link.com"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                  />
                  <label>Button Text</label>
                  <input
                    type="text"
                    placeholder="Visit Site"
                    value={linkText}
                    onChange={e => setLinkText(e.target.value)}
                  />
                  <div className="animation-options">
                    <label>Animation Style</label>
                    <select defaultValue="pulse">
                      <option value="none">None</option>
                      <option value="pulse">Pulse</option>
                      <option value="bounce">Bounce</option>
                      <option value="glow">Glow</option>
                      <option value="shake">Shake</option>
                    </select>
                  </div>
                  <button
                    className="add-overlay-btn"
                    onClick={() => handleAddOverlay('link')}
                    disabled={!linkUrl}
                  >
                    + Add Animated Link
                  </button>
                </div>
              )}

              {editorTool === 'watermark' && (
                <div className="option-group">
                  <label>Watermark Text</label>
                  <input
                    type="text"
                    placeholder={feed?.handle || '@username'}
                    value={watermarkText}
                    onChange={e => setWatermarkText(e.target.value)}
                  />
                  <div className="watermark-options">
                    <label>Position</label>
                    <select defaultValue="bottom-right">
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="center">Center</option>
                      <option value="tiled">Tiled</option>
                    </select>
                    <label>Opacity</label>
                    <input type="range" min="10" max="100" defaultValue="50" />
                  </div>
                  <button
                    className="add-overlay-btn"
                    onClick={() => handleAddOverlay('watermark')}
                    disabled={!watermarkText}
                  >
                    + Add Watermark
                  </button>
                </div>
              )}

              {editorTool === 'text' && (
                <div className="option-group">
                  <label>Custom Text</label>
                  <textarea
                    placeholder="Enter your text..."
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    rows={3}
                  />
                  <div className="text-options">
                    <label>Font</label>
                    <select defaultValue="Inter">
                      <option value="Inter">Inter</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Playfair">Playfair Display</option>
                    </select>
                    <label>Color</label>
                    <input type="color" defaultValue="#ffffff" />
                  </div>
                  <button
                    className="add-overlay-btn"
                    onClick={() => handleAddOverlay('text')}
                    disabled={!customText}
                  >
                    + Add Text
                  </button>
                </div>
              )}
            </div>

            {/* Active Overlays */}
            {overlays.length > 0 && (
              <div className="overlays-list">
                <h4>Active Overlays</h4>
                {overlays.map(overlay => (
                  <div key={overlay.id} className="overlay-item">
                    <span className="overlay-type">
                      {overlay.type === 'logo' && '🏷️'}
                      {overlay.type === 'qr' && '📱'}
                      {overlay.type === 'link' && '🔗'}
                      {overlay.type === 'watermark' && '💧'}
                      {overlay.type === 'text' && '📝'}
                    </span>
                    <span className="overlay-label">
                      {overlay.type.charAt(0).toUpperCase() + overlay.type.slice(1)}
                    </span>
                    <button
                      className="overlay-remove"
                      onClick={() => handleRemoveOverlay(overlay.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div className="editor-canvas">
            {selectedContent ? (
              <div className="canvas-container">
                <img src={selectedContent.thumbnail} alt="Content" className="canvas-image" />
                {/* Render overlays */}
                {overlays.map(overlay => (
                  <div
                    key={overlay.id}
                    className={`canvas-overlay ${overlay.type} ${overlay.style?.animation || ''}`}
                    style={{
                      left: `${overlay.position.x}%`,
                      top: `${overlay.position.y}%`,
                      width: overlay.size.width,
                      height: overlay.size.height,
                      opacity: overlay.style?.opacity,
                      transform: `rotate(${overlay.style?.rotation || 0}deg)`,
                    }}
                  >
                    {overlay.type === 'qr' && (
                      <div className="qr-overlay-preview">📱</div>
                    )}
                    {overlay.type === 'link' && (
                      <button className="link-overlay-btn">{linkText}</button>
                    )}
                    {overlay.type === 'watermark' && (
                      <span className="watermark-overlay-text">{overlay.content}</span>
                    )}
                    {overlay.type === 'text' && (
                      <span className="text-overlay-content">{overlay.content}</span>
                    )}
                    {overlay.type === 'logo' && (
                      <div className="logo-overlay-placeholder">🏷️</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="canvas-empty">
                <span className="empty-icon">🖼️</span>
                <h3>Select Content to Edit</h3>
                <p>Choose from your content library below</p>
              </div>
            )}

            {/* Content Selection */}
            <div className="content-selector">
              <h4>Select Content</h4>
              <div className="content-selector-grid">
                {MOCK_CONTENT.map(item => (
                  <div
                    key={item.id}
                    className={`selector-item ${selectedContent?.id === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedContent(item)}
                  >
                    <img src={item.thumbnail} alt="Content" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="editor-actions">
            <button className="action-btn secondary" onClick={() => setOverlays([])}>
              Clear All
            </button>
            <button className="action-btn secondary">
              Preview
            </button>
            <button className="action-btn primary" disabled={!selectedContent || overlays.length === 0}>
              💾 Save Branded Content
            </button>
            <button className="action-btn primary" disabled={!selectedContent || overlays.length === 0}>
              📅 Schedule Post
            </button>
          </div>
        </div>
      )}

      {/* Brand Kit View */}
      {viewMode === 'brandkit' && (
        <div className="advertise-brandkit">
          {brandKits.length === 0 ? (
            <div className="brandkit-empty">
              <span className="empty-icon">🎨</span>
              <h3>Create Your Brand Kit</h3>
              <p>Set up your brand identity with logos, colors, and watermarks</p>
              <button className="create-kit-btn" onClick={handleCreateBrandKit}>
                + Create Brand Kit
              </button>
            </div>
          ) : (
            <>
              <div className="brandkit-list">
                {brandKits.map(kit => (
                  <div
                    key={kit.id}
                    className={`brandkit-card ${activeBrandKit?.id === kit.id ? 'active' : ''}`}
                    onClick={() => setActiveBrandKit(kit)}
                  >
                    <div className="kit-preview">
                      <div className="kit-colors">
                        {kit.colors.map((color, i) => (
                          <div
                            key={i}
                            className="color-swatch"
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="kit-info">
                      <h4>{kit.name}</h4>
                      <span>{kit.colors.length} colors • {kit.fonts.length} fonts</span>
                    </div>
                  </div>
                ))}
                <button className="add-kit-btn" onClick={handleCreateBrandKit}>
                  + Add Kit
                </button>
              </div>

              {activeBrandKit && (
                <div className="brandkit-editor">
                  <h3>{activeBrandKit.name}</h3>

                  <section className="kit-section">
                    <h4>Logo</h4>
                    <div className="logo-upload">
                      <div className="upload-area large">
                        <span>📷</span>
                        <span>Upload your logo</span>
                        <span className="upload-hint">PNG or SVG, transparent background recommended</span>
                      </div>
                    </div>
                  </section>

                  <section className="kit-section">
                    <h4>Brand Colors</h4>
                    <div className="colors-editor">
                      {activeBrandKit.colors.map((color, i) => (
                        <div key={i} className="color-editor">
                          <input type="color" value={color} />
                          <span>{color}</span>
                        </div>
                      ))}
                      <button className="add-color-btn">+ Add Color</button>
                    </div>
                  </section>

                  <section className="kit-section">
                    <h4>Fonts</h4>
                    <div className="fonts-editor">
                      {activeBrandKit.fonts.map((font, i) => (
                        <div key={i} className="font-item">
                          <span style={{ fontFamily: font }}>{font}</span>
                        </div>
                      ))}
                      <button className="add-font-btn">+ Add Font</button>
                    </div>
                  </section>

                  <section className="kit-section">
                    <h4>Default Watermark</h4>
                    <input
                      type="text"
                      value={activeBrandKit.watermarkText || ''}
                      placeholder="@yourusername"
                      className="watermark-input"
                    />
                    <div className="watermark-preview">
                      <span style={{ opacity: 0.5 }}>{activeBrandKit.watermarkText || '@username'}</span>
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Partner Campaigns View */}
      {viewMode === 'campaigns' && (
        <div className="advertise-campaigns">
          <div className="campaigns-filters">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Open</button>
            <button className="filter-btn">Applied</button>
            <button className="filter-btn">My Campaigns</button>
          </div>

          <div className="campaigns-grid">
            {partnerCampaigns.map(campaign => (
              <div key={campaign.id} className={`campaign-card ${campaign.status}`}>
                <div className="campaign-header">
                  <img src={campaign.brandLogo} alt={campaign.brand} className="brand-logo" />
                  <div className="campaign-brand-info">
                    <span className="brand-name">{campaign.brand}</span>
                    <span className={`campaign-status ${campaign.status}`}>{campaign.status}</span>
                  </div>
                </div>

                <div className="campaign-body">
                  <h4>{campaign.title}</h4>
                  <p>{campaign.description}</p>

                  <div className="campaign-details">
                    <div className="detail-row">
                      <span className="detail-icon">💰</span>
                      <span>{campaign.compensation}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span>Deadline: {campaign.deadline}</span>
                    </div>
                  </div>

                  <div className="campaign-requirements">
                    <span className="requirements-title">Requirements:</span>
                    <ul>
                      {campaign.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="campaign-footer">
                  {campaign.status === 'open' && (
                    <button
                      className="apply-btn"
                      onClick={() => handleApplyToCampaign(campaign.id)}
                    >
                      Apply Now
                    </button>
                  )}
                  {campaign.status === 'applied' && (
                    <span className="applied-badge">✓ Application Sent</span>
                  )}
                  {campaign.status === 'accepted' && (
                    <button className="start-btn">Start Creating</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Create Own Campaign */}
          <div className="create-campaign-section">
            <h3>Create Your Own Campaign</h3>
            <p>Looking for collaborators? Create a campaign and find content creators.</p>
            <button className="create-campaign-btn">
              + Create Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvertiseTab;
