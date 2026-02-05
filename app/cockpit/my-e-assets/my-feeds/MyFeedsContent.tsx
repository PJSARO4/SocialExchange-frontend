'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useFeeds } from './context/FeedsContext';
import { FeedsList } from './components/feeds-panel';
import { ContentLibrary } from './components/content-library';
import { Scheduler } from './components/scheduler';
import FeedWorkspace from './components/workspace/FeedWorkspace';
import { AnalyticsModal } from './components/analytics';
import { SchedulerModal } from './components/scheduler/SchedulerModal';
import { CopilotModal } from './components/copilot/CopilotModal';
import { AutomationModal } from './components/automation/AutomationModal';
import { ContentFinderModal } from './components/content-finder/ContentFinderModal';
import { LinkExModal } from './components/linkex';
import { EarnExTab } from './components/earnex';
import { CompetitorsTab } from './components/competitors';
import { PageTutorial } from './components/PageTutorial';
import { Platform } from './types/feed';

type ActiveTab = 'dashboard' | 'workspace' | 'content' | 'scheduler' | 'earnex' | 'competitors';

export default function MyFeedsContent() {
  const { feeds, selectedFeed, selectedFeedId, feedsLoading, addFeed } = useFeeds();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [copilotModalOpen, setCopilotModalOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);
  const [contentFinderOpen, setContentFinderOpen] = useState(false);
  const [linkExOpen, setLinkExOpen] = useState(false);
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [oauthProcessed, setOauthProcessed] = useState(false);

  // Handle OAuth callback - save the connected account
  useEffect(() => {
    const connectedPlatform = searchParams.get('connected') as Platform | null;

    if (connectedPlatform && session?.user && !oauthProcessed) {
      const user = session.user as any;

      // Check if this account is already connected
      const alreadyConnected = feeds.some(
        f => f.platform === connectedPlatform && f.platformUserId === user.id
      );

      if (!alreadyConnected && user.id) {
        console.log('🎉 Processing OAuth connection:', {
          platform: connectedPlatform,
          user: user.name,
          userId: user.id,
          provider: user.provider,
        });

        // Fetch real profile data from Instagram API
        const fetchAndAddAccount = async () => {
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

          // Add the connected account with real data if available
          addFeed({
            platform: connectedPlatform,
            handle: `@${profileData?.username || user.name || user.id}`,
            displayName: profileData?.name || profileData?.username || user.name || `${connectedPlatform} Account`,
            avatarUrl: profileData?.profilePictureUrl,
            platformUserId: user.id,
            accessToken: user.accessToken,
            isOAuth: true,
            // Pass metrics if we have them
            ...(profileData && {
              initialMetrics: {
                followers: profileData.followersCount,
                following: profileData.followsCount,
                totalPosts: profileData.mediaCount,
              }
            }),
          });

          setOauthProcessed(true);

          // Clean up the URL
          window.history.replaceState({}, '', '/cockpit/my-e-assets/my-feeds');
        };

        fetchAndAddAccount();
      }
    }
  }, [searchParams, session, feeds, addFeed, oauthProcessed]);

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

  return (
    <div className="feeds-deck">
      {/* Header */}
      <header className="feeds-deck-header">
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

        {/* Tab Navigation */}
        <nav className="feeds-deck-tabs">
          <button
            className={`feeds-deck-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            DASHBOARD
          </button>
          <button
            className={`feeds-deck-tab ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            MY WORKSPACE
          </button>
          <button
            className={`feeds-deck-tab ${activeTab === 'earnex' ? 'active' : ''}`}
            onClick={() => setActiveTab('earnex')}
          >
            EARNEX
          </button>
          <button
            className={`feeds-deck-tab ${activeTab === 'competitors' ? 'active' : ''}`}
            onClick={() => setActiveTab('competitors')}
          >
            COMPETITORS
          </button>
        </nav>
      </header>

      {/* Body */}
      <div className="feeds-deck-body">
        {/* Left Sidebar - Accounts */}
        <aside className="feeds-deck-left">
          <FeedsList />
        </aside>

        {/* Main Content Area */}
        <main className="feeds-deck-main">
          {activeTab === 'dashboard' ? (
            /* Account Dashboard - Bird's Eye View */
            <div className="account-dashboard">
              <div className="dashboard-header">
                <h2 className="dashboard-title">Account Dashboard</h2>
                <p className="dashboard-subtitle">Your bird's eye view of everything</p>
              </div>

              <div className="dashboard-grid">
                {/* My Workspace Tile */}
                <div
                  className="dashboard-tile workspace-tile"
                  onClick={() => setActiveTab('workspace')}
                >
                  <div className="tile-icon">🎯</div>
                  <h3 className="tile-title">My Workspace</h3>
                  <p className="tile-description">
                    Content management, scheduling, automation, and all your creative tools
                  </p>
                  <div className="tile-stats">
                    <span className="stat-item">
                      <span className="stat-value">{feeds.length}</span>
                      <span className="stat-label">Accounts</span>
                    </span>
                    <span className="stat-item">
                      <span className="stat-value">{feeds.filter(f => f.automationEnabled).length}</span>
                      <span className="stat-label">Automated</span>
                    </span>
                  </div>
                  <div className="tile-arrow">→</div>
                </div>

                {/* EarnEx Tile */}
                <div
                  className="dashboard-tile earnex-tile"
                  onClick={() => setActiveTab('earnex')}
                >
                  <div className="tile-icon">💰</div>
                  <h3 className="tile-title">EarnEx</h3>
                  <p className="tile-description">
                    Manage campaigns, find opportunities, and track your earnings
                  </p>
                  <div className="tile-stats">
                    <span className="stat-item">
                      <span className="stat-value">0</span>
                      <span className="stat-label">Owned</span>
                    </span>
                    <span className="stat-item">
                      <span className="stat-value">0</span>
                      <span className="stat-label">Participating</span>
                    </span>
                  </div>
                  <div className="tile-arrow">→</div>
                </div>

                {/* Competitors Tile */}
                <div
                  className="dashboard-tile competitors-tile"
                  onClick={() => setActiveTab('competitors')}
                >
                  <div className="tile-icon">👁️</div>
                  <h3 className="tile-title">Competitors</h3>
                  <p className="tile-description">
                    Track competitors, analyze strategies, and stay ahead
                  </p>
                  <div className="tile-stats">
                    <span className="stat-item">
                      <span className="stat-value">0</span>
                      <span className="stat-label">Tracking</span>
                    </span>
                    <span className="stat-item">
                      <span className="stat-value">--</span>
                      <span className="stat-label">Insights</span>
                    </span>
                  </div>
                  <div className="tile-arrow">→</div>
                </div>
              </div>

              {/* Quick Stats Overview */}
              <div className="dashboard-overview">
                <h3 className="overview-title">Quick Overview</h3>
                <div className="overview-cards">
                  <div className="overview-card">
                    <span className="overview-icon">📊</span>
                    <div className="overview-info">
                      <span className="overview-value">
                        {feeds.reduce((sum, f) => sum + (f.metrics?.followers || 0), 0).toLocaleString()}
                      </span>
                      <span className="overview-label">Total Followers</span>
                    </div>
                  </div>
                  <div className="overview-card">
                    <span className="overview-icon">💬</span>
                    <div className="overview-info">
                      <span className="overview-value">
                        {feeds.length > 0
                          ? (feeds.reduce((sum, f) => sum + (f.metrics?.engagement || 0), 0) / feeds.length).toFixed(1)
                          : '0'}%
                      </span>
                      <span className="overview-label">Avg Engagement</span>
                    </div>
                  </div>
                  <div className="overview-card">
                    <span className="overview-icon">📅</span>
                    <div className="overview-info">
                      <span className="overview-value">0</span>
                      <span className="overview-label">Scheduled Posts</span>
                    </div>
                  </div>
                  <div className="overview-card">
                    <span className="overview-icon">💵</span>
                    <div className="overview-info">
                      <span className="overview-value">$0</span>
                      <span className="overview-label">Pending Earnings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'workspace' ? (
            selectedFeed ? (
              <FeedWorkspace
                feed={selectedFeed}
                onNavigate={setActiveTab}
                onCreatePost={() => setCreatePostOpen(true)}
                onOpenAnalytics={() => setAnalyticsOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenScheduler={() => setSchedulerOpen(true)}
                onOpenCopilot={() => setCopilotModalOpen(true)}
                onOpenAutomation={() => setAutomationOpen(true)}
                onOpenContentFinder={() => setContentFinderOpen(true)}
                onOpenLinkEx={() => setLinkExOpen(true)}
              />
            ) : (
              <div className="feeds-empty-state">
                <div className="feeds-empty-icon">📡</div>
                <div className="feeds-empty-title">SELECT AN ACCOUNT</div>
                <div className="feeds-empty-text">
                  Choose an account from the left panel to view its workspace
                </div>
              </div>
            )
          ) : activeTab === 'earnex' ? (
            <EarnExTab feed={selectedFeed} feeds={feeds} />
          ) : activeTab === 'competitors' ? (
            <CompetitorsTab feed={selectedFeed} feeds={feeds} />
          ) : (
            <ContentLibrary />
          )}
        </main>
      </div>

      {/* Analytics Modal */}
      {analyticsOpen && selectedFeed && (
        <AnalyticsModal
          feed={selectedFeed}
          onClose={() => setAnalyticsOpen(false)}
        />
      )}

      {/* Scheduler Modal */}
      {schedulerOpen && selectedFeed && (
        <SchedulerModal
          feed={selectedFeed}
          isOpen={schedulerOpen}
          onClose={() => setSchedulerOpen(false)}
        />
      )}

      {/* AI Copilot Modal */}
      {copilotModalOpen && selectedFeed && (
        <CopilotModal
          feed={selectedFeed}
          isOpen={copilotModalOpen}
          onClose={() => setCopilotModalOpen(false)}
        />
      )}

      {/* Automation Modal */}
      {automationOpen && selectedFeed && (
        <AutomationModal
          feed={selectedFeed}
          isOpen={automationOpen}
          onClose={() => setAutomationOpen(false)}
        />
      )}

      {/* Content Finder Modal */}
      {contentFinderOpen && selectedFeed && (
        <ContentFinderModal
          feed={selectedFeed}
          isOpen={contentFinderOpen}
          onClose={() => setContentFinderOpen(false)}
        />
      )}

      {/* LinkEx Modal */}
      {linkExOpen && selectedFeed && (
        <LinkExModal
          feed={selectedFeed}
          isOpen={linkExOpen}
          onClose={() => setLinkExOpen(false)}
        />
      )}

      {/* Page Tutorial */}
      <PageTutorial />
    </div>
  );
}
