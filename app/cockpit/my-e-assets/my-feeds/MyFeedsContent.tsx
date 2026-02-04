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
import { Platform } from './types/feed';

type ActiveTab = 'workspace' | 'content' | 'scheduler';

export default function MyFeedsContent() {
  const { feeds, selectedFeed, selectedFeedId, feedsLoading, addFeed } = useFeeds();
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
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
            className={`feeds-deck-tab ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            WORKSPACE
          </button>
          <button
            className={`feeds-deck-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            CONTENT LIBRARY
          </button>
          <button
            className={`feeds-deck-tab ${activeTab === 'scheduler' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduler')}
          >
            SCHEDULER
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
          {activeTab === 'workspace' ? (
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
          ) : activeTab === 'content' ? (
            <ContentLibrary />
          ) : (
            <Scheduler feedId={selectedFeedId || undefined} />
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
    </div>
  );
}
