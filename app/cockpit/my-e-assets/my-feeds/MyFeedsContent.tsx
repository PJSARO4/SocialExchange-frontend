'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useFeeds } from './context/FeedsContext';
import { FeedsList } from './components/feeds-panel';
import { ContentLibrary } from './components/content-library';
import { Scheduler } from './components/scheduler';
import { AnalyticsModal } from './components/analytics';
import { SchedulerModal } from './components/scheduler/SchedulerModal';
import { CopilotModal } from './components/copilot/CopilotModal';
import { AutomationModal } from './components/automation/AutomationModal';
import { ContentFinderModal } from './components/content-finder/ContentFinderModal';
import { CreatePostModal } from './components/create-post';
import { SettingsModal } from './components/settings';
import { EarnExTab } from './components/earnex';
import { CompetitorsTab } from './components/competitors';
import { PageTutorial } from './components/PageTutorial';
import { Platform, PLATFORMS } from './types/feed';
import ModeSelector from './components/ModeSelector';
import MyEStorageContent from '../my-e-storage/MyEStorageContent';
import '../my-e-storage/e-storage.css';
import '../my-e-storage/organism/organism.css';

// Workspace section type - these are internal to the workspace, not top-level tabs
type WorkspaceSection = 'overview' | 'content' | 'e-storage' | 'scheduler' | 'earnex' | 'competitors';

export default function MyFeedsContent() {
  const { feeds, selectedFeed, selectedFeedId, feedsLoading, addFeed, updateFeed, toggleAutomation, setControlMode } = useFeeds();
  const [workspaceSection, setWorkspaceSection] = useState<WorkspaceSection>('overview');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [copilotModalOpen, setCopilotModalOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [contentFinderOpen, setContentFinderOpen] = useState(false);
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [oauthProcessed, setOauthProcessed] = useState(false);

  // Handle OAuth callback - save the connected account or upgrade existing manual feed
  useEffect(() => {
    const connectedPlatform = searchParams.get('connected') as Platform | null;

    if (connectedPlatform && session?.user && !oauthProcessed) {
      const user = session.user as any;

      if (!user.id) return;

      // Check if this account already exists (manual or OAuth)
      const existingFeed = feeds.find(
        f => f.platform === connectedPlatform && f.platformUserId === user.id
      );
      const alreadyOAuth = existingFeed?.isOAuth && existingFeed?.accessToken;

      if (alreadyOAuth) {
        // Already fully OAuth-connected, nothing to do
        console.log('✅ Account already OAuth-connected:', existingFeed.handle);
        setOauthProcessed(true);
        window.history.replaceState({}, '', '/cockpit/my-e-assets/my-feeds');
        return;
      }

      console.log('🎉 Processing OAuth connection:', {
        platform: connectedPlatform,
        user: user.name,
        userId: user.id,
        provider: user.provider,
        upgrading: !!existingFeed,
      });

      // Fetch real profile data from Instagram API
      const fetchAndConnect = async () => {
        let profileData: any = null;

        if (connectedPlatform === 'instagram' && user.accessToken) {
          try {
            const response = await fetch(
              `/api/instagram/profile?access_token=${encodeURIComponent(user.accessToken)}`
            );
            if (response.ok) {
              profileData = await response.json();
              console.log('📊 Fetched real Instagram data:', profileData);
            }
          } catch (error) {
            console.error('Failed to fetch Instagram profile:', error);
          }
        }

        if (existingFeed) {
          // UPGRADE existing manual feed to OAuth
          console.log('🔄 Upgrading manual feed to OAuth:', existingFeed.handle);
          await updateFeed(existingFeed.id, {
            accessToken: user.accessToken,
            isOAuth: true,
            connectionStatus: 'active',
            ...(profileData && {
              displayName: profileData.name || profileData.username || existingFeed.displayName,
              avatarUrl: profileData.profilePictureUrl || existingFeed.avatarUrl,
              metrics: {
                followers: profileData.followersCount ?? existingFeed.metrics?.followers ?? 0,
                following: profileData.followsCount ?? existingFeed.metrics?.following ?? 0,
                totalPosts: profileData.mediaCount ?? existingFeed.metrics?.totalPosts ?? 0,
                engagement: existingFeed.metrics?.engagement ?? 0,
                postsPerWeek: existingFeed.metrics?.postsPerWeek ?? 0,
                uptime: existingFeed.metrics?.uptime ?? 0,
              },
            }),
          });
          console.log('✅ Feed upgraded to OAuth successfully');
        } else {
          // Add brand new OAuth-connected account
          addFeed({
            platform: connectedPlatform,
            handle: `@${profileData?.username || user.name || user.id}`,
            displayName: profileData?.name || profileData?.username || user.name || `${connectedPlatform} Account`,
            avatarUrl: profileData?.profilePictureUrl,
            platformUserId: user.id,
            accessToken: user.accessToken,
            isOAuth: true,
            ...(profileData && {
              initialMetrics: {
                followers: profileData.followersCount,
                following: profileData.followsCount,
                totalPosts: profileData.mediaCount,
              }
            }),
          });
          console.log('✅ New OAuth feed added successfully');
        }

        setOauthProcessed(true);

        // Clean up the URL
        window.history.replaceState({}, '', '/cockpit/my-e-assets/my-feeds');
      };

      fetchAndConnect();
    }
  }, [searchParams, session, feeds, addFeed, updateFeed, oauthProcessed]);

  if (feedsLoading && feeds.length === 0) {
    return (
      <div className="feeds-deck">
        <div className="feeds-loading">
          <div className="feeds-loading-spinner" />
          <div className="feeds-loading-text">INITIALIZING SYSTEMS</div>
        </div>
      </div>
    );
  }

  const platform = selectedFeed ? PLATFORMS[selectedFeed.platform] : null;

  return (
    <div className="feeds-deck">
      {/* Minimal Header */}
      <header className="feeds-deck-header compact">
        <div className="feeds-deck-title-group">
          <h1 className="feeds-deck-title">MY FEEDS</h1>
          <div className="feeds-deck-status-bar">
            <span className="feeds-status-item">{feeds.length} CONNECTED</span>
            <span className="feeds-status-separator">•</span>
            <span className="feeds-status-item">
              {feeds.filter((f) => f.automationEnabled).length} AUTOMATED
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="feeds-deck-body">
        {/* Left Sidebar - Accounts */}
        <aside className="feeds-deck-left">
          <FeedsList />
        </aside>

        {/* Main Content Area - Account Workspace */}
        <main className="feeds-deck-main">
          {selectedFeed ? (
            <div className="account-workspace">
              {/* Account Header Bar */}
              <div className="workspace-account-bar">
                <div className="workspace-account-identity">
                  {selectedFeed.avatarUrl ? (
                    <div className="workspace-avatar-container">
                      <img
                        src={selectedFeed.avatarUrl}
                        alt={selectedFeed.displayName || selectedFeed.handle}
                        className="workspace-avatar"
                      />
                      <div
                        className="workspace-platform-badge"
                        style={{ backgroundColor: platform?.color }}
                      >
                        {platform?.icon}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="workspace-platform-icon"
                      style={{ backgroundColor: platform?.color }}
                    >
                      {platform?.icon}
                    </div>
                  )}
                  <div className="workspace-account-info">
                    <h2 className="workspace-handle">{selectedFeed.handle}</h2>
                    <span className="workspace-display-name">{selectedFeed.displayName}</span>
                  </div>
                </div>

                {/* Quick Metrics */}
                <div className="workspace-quick-metrics">
                  <div className="quick-metric">
                    <span className="quick-metric-value">
                      {(selectedFeed.metrics?.followers || 0).toLocaleString()}
                    </span>
                    <span className="quick-metric-label">Followers</span>
                  </div>
                  <div className="quick-metric">
                    <span className="quick-metric-value">
                      {(selectedFeed.metrics?.engagement || 0).toFixed(1)}%
                    </span>
                    <span className="quick-metric-label">Engagement</span>
                  </div>
                  <div className="quick-metric">
                    <span className={`quick-metric-value status ${selectedFeed.connectionStatus}`}>
                      {selectedFeed.connectionStatus.toUpperCase()}
                    </span>
                    <span className="quick-metric-label">Status</span>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="workspace-mode-control">
                  <ModeSelector
                    currentMode={selectedFeed.controlMode}
                    onModeChange={(mode) => setControlMode(selectedFeed.id, mode)}
                    compact
                  />
                </div>
              </div>

              {/* Workspace Navigation */}
              <nav className="workspace-nav">
                <button
                  className={`workspace-nav-item ${workspaceSection === 'overview' ? 'active' : ''}`}
                  onClick={() => setWorkspaceSection('overview')}
                >
                  <span className="nav-icon">🏠</span>
                  <span className="nav-label">Overview</span>
                </button>
                <button
                  className={`workspace-nav-item ${workspaceSection === 'content' ? 'active' : ''}`}
                  onClick={() => setWorkspaceSection('content')}
                >
                  <span className="nav-icon">📚</span>
                  <span className="nav-label">Content</span>
                </button>
                <button
                  className={`workspace-nav-item ${workspaceSection === 'e-storage' ? 'active' : ''}`}
                  onClick={() => setWorkspaceSection('e-storage')}
                >
                  <span className="nav-icon">💾</span>
                  <span className="nav-label">E-Storage</span>
                </button>
                <button
                  className={`workspace-nav-item ${workspaceSection === 'scheduler' ? 'active' : ''}`}
                  onClick={() => setWorkspaceSection('scheduler')}
                >
                  <span className="nav-icon">📅</span>
                  <span className="nav-label">Scheduler</span>
                </button>
                <button
                  className={`workspace-nav-item ${workspaceSection === 'earnex' ? 'active' : ''}`}
                  onClick={() => setWorkspaceSection('earnex')}
                >
                  <span className="nav-icon">💰</span>
                  <span className="nav-label">EarnEx</span>
                </button>
                <button
                  className={`workspace-nav-item ${workspaceSection === 'competitors' ? 'active' : ''}`}
                  onClick={() => setWorkspaceSection('competitors')}
                >
                  <span className="nav-icon">👁️</span>
                  <span className="nav-label">Competitors</span>
                </button>
              </nav>

              {/* Workspace Content */}
              <div className="workspace-content">
                <div key={workspaceSection} style={{ animation: 'tabContentFade 0.35s ease-out forwards' }}>
                {workspaceSection === 'overview' && (
                  <div className="workspace-overview">
                    {/* Quick Actions Grid */}
                    <section className="workspace-section animate-in">
                      <h3 className="section-title">Quick Actions</h3>
                      <div className="quick-actions-grid">
                        <button className="quick-action-card" onClick={() => setCreatePostOpen(true)}>
                          <span className="action-icon">📝</span>
                          <span className="action-label">Create Post</span>
                        </button>
                        <button className="quick-action-card" onClick={() => setSchedulerOpen(true)}>
                          <span className="action-icon">📆</span>
                          <span className="action-label">Schedule</span>
                        </button>
                        <button className="quick-action-card" onClick={() => setAnalyticsOpen(true)}>
                          <span className="action-icon">📊</span>
                          <span className="action-label">Analytics</span>
                        </button>
                        <button className="quick-action-card" onClick={() => setCopilotModalOpen(true)}>
                          <span className="action-icon">🤖</span>
                          <span className="action-label">AI Copilot</span>
                        </button>
                        <button className="quick-action-card" onClick={() => setAutomationOpen(true)}>
                          <span className="action-icon">⚡</span>
                          <span className="action-label">Automation</span>
                        </button>
                        <button className="quick-action-card" onClick={() => setContentFinderOpen(true)}>
                          <span className="action-icon">🔍</span>
                          <span className="action-label">Find Content</span>
                        </button>
                        <button className="quick-action-card linkex" onClick={() => setAutomationOpen(true)}>
                          <span className="action-icon">⛓️</span>
                          <span className="action-label">LinkEx</span>
                          <span className="action-subtitle">Chain Builder</span>
                        </button>
                        <button className="quick-action-card" onClick={() => setSettingsOpen(true)}>
                          <span className="action-icon">⚙️</span>
                          <span className="action-label">Settings</span>
                        </button>
                      </div>
                    </section>

                    {/* Telemetry */}
                    <section className="workspace-section animate-in">
                      <div className="section-header-with-tooltip">
                        <h3 className="section-title">Telemetry</h3>
                        <div className="tooltip-trigger">
                          <span className="info-icon">ℹ️</span>
                          <div className="tooltip-content">
                            <strong>Real-time account health metrics</strong>
                            <p>Monitor your account's performance at a glance. These metrics update automatically when synced with your connected platform.</p>
                          </div>
                        </div>
                      </div>
                      <div className="telemetry-grid">
                        <div className="telemetry-card pulse-subtle">
                          <span className="telemetry-value">{(selectedFeed.metrics?.followers || 0).toLocaleString()}</span>
                          <span className="telemetry-label">Followers</span>
                          <div className="telemetry-tooltip">Total audience reach</div>
                        </div>
                        <div className="telemetry-card pulse-subtle" style={{ animationDelay: '0.1s' }}>
                          <span className="telemetry-value">{(selectedFeed.metrics?.engagement || 0).toFixed(1)}%</span>
                          <span className="telemetry-label">Engagement</span>
                          <div className="telemetry-tooltip">Likes + comments ÷ followers</div>
                        </div>
                        <div className="telemetry-card pulse-subtle" style={{ animationDelay: '0.2s' }}>
                          <span className="telemetry-value">{selectedFeed.metrics?.postsPerWeek || 0}</span>
                          <span className="telemetry-label">Posts/Week</span>
                          <div className="telemetry-tooltip">Average posting frequency</div>
                        </div>
                        <div className="telemetry-card pulse-subtle" style={{ animationDelay: '0.3s' }}>
                          <span className="telemetry-value">{(selectedFeed.metrics?.uptime || 0).toFixed(0)}%</span>
                          <span className="telemetry-label">Uptime</span>
                          <div className="telemetry-tooltip">Connection stability score</div>
                        </div>
                      </div>
                    </section>

                    {/* Automation Status */}
                    <section className={`workspace-section animate-in ${selectedFeed.automationEnabled ? 'automation-section-armed' : ''}`} style={{ animationDelay: '0.15s' }}>
                      <div className="section-header-with-tooltip">
                        <h3 className="section-title">Automation</h3>
                        <div className="tooltip-trigger">
                          <span className="info-icon">ℹ️</span>
                          <div className="tooltip-content">
                            <strong>Workflow automation control</strong>
                            <p><b>ARMED:</b> Your automation chains are active and will execute based on triggers (schedules, events, etc.)</p>
                            <p><b>IDLE:</b> Chains are paused. No automated actions will run until you re-enable.</p>
                            <p>Use LinkEx (Chain Builder) to create and configure automation workflows.</p>
                          </div>
                        </div>
                      </div>

                      {/* Instagram API Limitations Banner */}
                      {selectedFeed.platform === 'instagram' && (
                        <div className="api-limitations-banner">
                          <div className="api-limitations-header">
                            <span className="api-limitations-icon">⚠️</span>
                            <strong>Instagram API Limitations</strong>
                          </div>
                          <div className="api-limitations-content">
                            <div className="api-limitations-columns">
                              <div className="api-limitations-column">
                                <span className="column-title">✅ Available</span>
                                <ul>
                                  <li>Publish posts (Business account)</li>
                                  <li>Schedule posts</li>
                                  <li>Auto-comment (30/day)</li>
                                  <li>Fetch analytics</li>
                                </ul>
                              </div>
                              <div className="api-limitations-column">
                                <span className="column-title">❌ Not Available</span>
                                <ul>
                                  <li>Auto-like (API blocked)</li>
                                  <li>Auto-follow (API blocked)</li>
                                  <li>Stories (API blocked)</li>
                                  <li>DMs (requires approval)</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="automation-panel">
                        <div className="automation-status">
                          <button
                            className={`automation-toggle ${selectedFeed.automationEnabled ? 'armed' : 'idle'}`}
                            onClick={() => toggleAutomation(selectedFeed.id)}
                          >
                            <span className={`toggle-indicator ${selectedFeed.automationEnabled ? 'pulse-glow' : ''}`}>⦿</span>
                            <span className="toggle-label">
                              {selectedFeed.automationEnabled ? 'ARMED' : 'IDLE'}
                            </span>
                          </button>
                          <span className="automation-hint">
                            {selectedFeed.automationEnabled ? 'Automation chains are running' : 'Click to activate automation chains'}
                          </span>
                        </div>
                        <button
                          className="automation-configure-btn"
                          onClick={() => setAutomationOpen(true)}
                        >
                          ⛓️ Configure Chains
                        </button>
                      </div>
                    </section>

                    {/* Recent Activity / Upcoming */}
                    <section className="workspace-section animate-in" style={{ animationDelay: '0.25s' }}>
                      <h3 className="section-title">Upcoming</h3>
                      <div className="upcoming-panel">
                        <div className="upcoming-empty">
                          <span className="upcoming-empty-icon">📭</span>
                          <span className="upcoming-empty-text">No scheduled posts</span>
                          <button className="upcoming-action" onClick={() => setSchedulerOpen(true)}>
                            + Schedule Post
                          </button>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {workspaceSection === 'content' && (
                  <ContentLibrary />
                )}

                {workspaceSection === 'e-storage' && (
                  <MyEStorageContent embedded />
                )}

                {workspaceSection === 'scheduler' && (
                  <Scheduler />
                )}

                {workspaceSection === 'earnex' && (
                  <EarnExTab feed={selectedFeed} feeds={feeds} />
                )}

                {workspaceSection === 'competitors' && (
                  <CompetitorsTab feed={selectedFeed} feeds={feeds} />
                )}
                </div>
              </div>
            </div>
          ) : (
            /* No Account Selected State */
            <div className="no-account-selected">
              <div className="no-account-content">
                <div className="no-account-icon">📡</div>
                <h2 className="no-account-title">Select an Account</h2>
                <p className="no-account-text">
                  Choose an account from the left panel to start managing your content
                </p>
                {feeds.length === 0 && (
                  <>
                    <p className="no-account-hint">
                      No accounts connected yet. Connect your Instagram to get started.
                    </p>
                    <a
                      href="/api/auth/signin/instagram"
                      className="connect-instagram-btn"
                    >
                      <span className="connect-instagram-icon">📸</span>
                      <span>Connect Instagram</span>
                    </a>
                    <p className="connect-requirement">
                      Requires an Instagram Business or Creator account
                    </p>
                  </>
                )}
              </div>

              {/* Quick Stats for all accounts */}
              {feeds.length > 0 && (
                <div className="all-accounts-summary">
                  <h3>All Accounts Overview</h3>
                  <div className="summary-stats">
                    <div className="summary-stat">
                      <span className="summary-value">{feeds.length}</span>
                      <span className="summary-label">Connected</span>
                    </div>
                    <div className="summary-stat">
                      <span className="summary-value">
                        {feeds.reduce((sum, f) => sum + (f.metrics?.followers || 0), 0).toLocaleString()}
                      </span>
                      <span className="summary-label">Total Followers</span>
                    </div>
                    <div className="summary-stat">
                      <span className="summary-value">
                        {feeds.filter(f => f.automationEnabled).length}
                      </span>
                      <span className="summary-label">Automated</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {analyticsOpen && selectedFeed && (
        <AnalyticsModal
          feed={selectedFeed}
          onClose={() => setAnalyticsOpen(false)}
        />
      )}

      {schedulerOpen && selectedFeed && (
        <SchedulerModal
          feed={selectedFeed}
          isOpen={schedulerOpen}
          onClose={() => setSchedulerOpen(false)}
        />
      )}

      {copilotModalOpen && selectedFeed && (
        <CopilotModal
          feed={selectedFeed}
          isOpen={copilotModalOpen}
          onClose={() => setCopilotModalOpen(false)}
        />
      )}

      {automationOpen && selectedFeed && (
        <AutomationModal
          feedId={selectedFeed.id}
          isOpen={automationOpen}
          onClose={() => setAutomationOpen(false)}
        />
      )}

      {contentFinderOpen && selectedFeed && (
        <ContentFinderModal
          feed={selectedFeed}
          isOpen={contentFinderOpen}
          onClose={() => setContentFinderOpen(false)}
        />
      )}

      {createPostOpen && selectedFeed && (
        <CreatePostModal
          feed={selectedFeed}
          isOpen={createPostOpen}
          onClose={() => setCreatePostOpen(false)}
        />
      )}

      {settingsOpen && selectedFeed && (
        <SettingsModal
          feed={selectedFeed}
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onToggleAutomation={toggleAutomation}
        />
      )}

      <PageTutorial />
    </div>
  );
}
