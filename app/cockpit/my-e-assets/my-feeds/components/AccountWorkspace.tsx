'use client';

import './account-workspace.css';

import { useState } from 'react';
import {
  mockFeedAssets,
  mockScheduledPosts,
  mockDraftPosts,
} from '../../../lib/mockData';
import type { FeedAsset } from '../../../lib/mockData';

import WeekHeader from './WeekHeader';
import TimeSlotGrid from './TimeSlotGrid';

type ActiveView = 'command' | 'scheduler' | 'automation';

export default function AccountWorkspace() {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    mockFeedAssets[0]?.id || null
  );
  const [activeView, setActiveView] = useState<ActiveView>('command');

  const selectedFeed = mockFeedAssets.find(
    (feed) => feed.id === selectedAccountId
  );

  const accountPosts = selectedAccountId
    ? mockScheduledPosts.filter(
        (post) => post.accountId === selectedAccountId
      )
    : [];

  const accountDrafts = selectedAccountId
    ? mockDraftPosts.filter(
        (draft) => draft.accountId === selectedAccountId
      )
    : [];

  const automationActive = selectedFeed?.status.automated || false;
  const automationState = automationActive ? 'ARMED' : 'STANDBY';

  const getPlatformLabel = (platform: FeedAsset['platform']) =>
    platform.toUpperCase();

  return (
    <div className="account-workspace">
      <div className="workspace-layout">
        {/* LEFT PANEL */}
        <aside className="workspace-left-panel">
          <div className="workspace-panel-header">
            <h3 className="workspace-panel-title">ACCOUNTS</h3>
          </div>
          <div className="workspace-panel-body">
            {mockFeedAssets.map((feed) => (
              <button
                key={feed.id}
                className={`account-selector-item ${
                  selectedAccountId === feed.id ? 'active' : ''
                }`}
                onClick={() => {
                  setSelectedAccountId(feed.id);
                  setActiveView('command');
                }}
              >
                <div className="account-selector-platform">
                  {getPlatformLabel(feed.platform)}
                </div>
                <div className="account-selector-handle">{feed.handle}</div>
                <div className="account-selector-status">
                  {feed.status.active ? 'ACTIVE' : 'INACTIVE'}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER PANEL */}
        <main className="workspace-center-panel">
          {!selectedFeed ? (
            <div className="workspace-standby">
              <div className="workspace-standby-text">
                SELECT ACCOUNT TO BEGIN
              </div>
            </div>
          ) : activeView === 'scheduler' ? (
            <div className="scheduler-view">
              <div className="scheduler-view-header">
                <button
                  className="scheduler-back-button"
                  onClick={() => setActiveView('command')}
                >
                  ← COMMAND CENTER
                </button>
                <div className="scheduler-view-title">SCHEDULER</div>
              </div>
              <div className="scheduler-view-body">
                <WeekHeader dates={[]} />
                <TimeSlotGrid
                  dates={[]}
                  posts={accountPosts}
                  onSlotClick={() => {}}
                  onPostClick={() => {}}
                />
              </div>
            </div>
          ) : activeView === 'automation' ? (
            <div className="automation-view">
              <div className="automation-view-header">
                <button
                  className="automation-back-button"
                  onClick={() => setActiveView('command')}
                >
                  ← COMMAND CENTER
                </button>
                <div className="automation-view-title">AUTOMATION</div>
              </div>
              <div className="automation-view-body">
                <div className="automation-placeholder">
                  Automation panel placeholder
                </div>
              </div>
            </div>
          ) : (
            <div className="command-center">
              <div className="command-center-header">
                <div className="command-center-identity">
                  <div className="command-center-handle">
                    {selectedFeed.handle}
                  </div>
                  <div className="command-center-name">
                    {selectedFeed.displayName}
                  </div>
                </div>
                <div className="command-center-platform">
                  {getPlatformLabel(selectedFeed.platform)}
                </div>
              </div>

              <div className="command-center-body">
                <div className="command-center-primary">
                  <section className="command-section command-section-performance">
                    <header className="command-section-header">
                      <h3 className="command-section-title">PERFORMANCE</h3>
                    </header>
                    <div className="command-section-body">
                      <div className="metrics-grid">
                        <div className="metric-item">
                          <div className="metric-label">FOLLOWERS</div>
                          <div className="metric-value">
                            {selectedFeed.metrics.followers.toLocaleString()}
                          </div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label">ENGAGEMENT</div>
                          <div className="metric-value">
                            {selectedFeed.metrics.engagement}%
                          </div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label">UPTIME</div>
                          <div className="metric-value">
                            {selectedFeed.metrics.automationUptime}%
                          </div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label">POSTS/WEEK</div>
                          <div className="metric-value">
                            {selectedFeed.metrics.postsPerWeek}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="command-center-state-row">
                    <section className="command-section command-section-content">
                      <header className="command-section-header">
                        <h3 className="command-section-title">CONTENT STATE</h3>
                      </header>
                      <div className="command-section-body">
                        <div className="content-state-grid">
                          <div className="content-state-item">
                            <div className="content-state-value">
                              {accountDrafts.length}
                            </div>
                            <div className="content-state-label">DRAFTS</div>
                          </div>
                          <div className="content-state-item">
                            <div className="content-state-value">
                              {accountPosts.length}
                            </div>
                            <div className="content-state-label">SCHEDULED</div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="command-section command-section-automation">
                      <header className="command-section-header">
                        <h3 className="command-section-title">AUTOMATION</h3>
                      </header>
                      <div className="command-section-body">
                        <div
                          className={`automation-indicator status-${
                            automationActive ? 'armed' : 'standby'
                          }`}
                        >
                          <div className="automation-indicator-label">
                            {automationState}
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  <section className="command-section command-section-activity">
                    <header className="command-section-header">
                      <h3 className="command-section-title">RECENT ACTIVITY</h3>
                    </header>
                    <div className="command-section-body">
                      {accountPosts.length === 0 &&
                      accountDrafts.length === 0 ? (
                        <div className="command-section-empty">
                          NO ACTIVITY
                        </div>
                      ) : (
                        <div className="activity-list">
                          {accountPosts.slice(0, 3).map((post) => (
                            <div key={post.id} className="activity-item">
                              <div className="activity-item-type">
                                SCHEDULED
                              </div>
                              <div className="activity-item-content">
                                {post.caption.substring(0, 50)}
                              </div>
                              <div className="activity-item-time">
                                DAY {post.dayOfWeek} {post.hour}:
                                {post.minute.toString().padStart(2, '0')}
                              </div>
                            </div>
                          ))}
                          {accountDrafts.slice(0, 2).map((draft) => (
                            <div key={draft.id} className="activity-item">
                              <div className="activity-item-type">DRAFT</div>
                              <div className="activity-item-content">
                                {draft.caption.substring(0, 50)}
                              </div>
                              <div className="activity-item-time">
                                {draft.lastEdited}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="command-center-secondary">
                  <section className="command-section command-section-operations">
                    <header className="command-section-header">
                      <h3 className="command-section-title">OPERATIONS</h3>
                    </header>
                    <div className="command-section-body">
                      <div className="operations-grid">
                        <button
                          className="operation-button"
                          onClick={() => setActiveView('scheduler')}
                        >
                          SCHEDULER
                        </button>
                        <button
                          className="operation-button"
                          onClick={() => setActiveView('automation')}
                        >
                          AUTOMATION
                        </button>
                        <button className="operation-button">CONTENT</button>
                        <button className="operation-button">ANALYTICS</button>
                        <button className="operation-button">CAPITAL</button>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT PANEL */}
        <aside className="workspace-right-panel">
          <div className="workspace-panel-header">
            <h3 className="workspace-panel-title">STATUS</h3>
          </div>
          <div className="workspace-panel-body">
            {selectedFeed && (
              <div className="status-indicators">
                <div className="status-indicator-item">
                  <div className="status-indicator-label">ACTIVE</div>
                  <div
                    className={`status-indicator-value ${
                      selectedFeed.status.active ? 'on' : 'off'
                    }`}
                  >
                    {selectedFeed.status.active ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="status-indicator-item">
                  <div className="status-indicator-label">AUTOMATED</div>
                  <div
                    className={`status-indicator-value ${
                      selectedFeed.status.automated ? 'on' : 'off'
                    }`}
                  >
                    {selectedFeed.status.automated ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="status-indicator-item">
                  <div className="status-indicator-label">ESCROW</div>
                  <div
                    className={`status-indicator-value ${
                      selectedFeed.status.inEscrow ? 'on' : 'off'
                    }`}
                  >
                    {selectedFeed.status.inEscrow ? 'YES' : 'NO'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
