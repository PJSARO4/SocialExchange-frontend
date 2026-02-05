'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Feed, PLATFORMS } from '../../types/feed';

interface SettingsModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
  onDisconnect?: (feedId: string) => void;
  onToggleAutomation?: (feedId: string) => void;
}

interface RateLimitInfo {
  action: string;
  used: number;
  limit: number;
  resetAt?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  feed,
  isOpen,
  onClose,
  onDisconnect,
  onToggleAutomation,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'automation' | 'limits' | 'danger'>('account');
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([]);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const platform = PLATFORMS[feed.platform];

  // Fetch rate limits
  const fetchRateLimits = useCallback(async () => {
    setIsLoadingLimits(true);
    try {
      const response = await fetch(`/api/rate-limits?feed_id=${feed.id}`);
      const data = await response.json();
      if (data.limits) {
        setRateLimits(data.limits);
      }
    } catch (error) {
      console.error('Failed to fetch rate limits:', error);
    } finally {
      setIsLoadingLimits(false);
    }
  }, [feed.id]);

  useEffect(() => {
    if (isOpen && activeTab === 'limits') {
      fetchRateLimits();
    }
  }, [isOpen, activeTab, fetchRateLimits]);

  if (!isOpen) return null;

  const handleDisconnect = () => {
    onDisconnect?.(feed.id);
    onClose();
  };

  // Default rate limits if none fetched
  const displayLimits: RateLimitInfo[] = rateLimits.length > 0 ? rateLimits : [
    { action: 'LIKE', used: 45, limit: 150 },
    { action: 'COMMENT', used: 12, limit: 30 },
    { action: 'FOLLOW', used: 8, limit: 50 },
    { action: 'DM', used: 3, limit: 20 },
    { action: 'PUBLISH', used: 2, limit: 25 },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="settings-title">
            <span
              className="settings-platform-badge"
              style={{ backgroundColor: platform.color }}
            >
              {platform.icon}
            </span>
            <div>
              <h2 className="modal-title">SETTINGS</h2>
              <span className="settings-handle">{feed.handle}</span>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            👤 Account
          </button>
          <button
            className={`settings-tab ${activeTab === 'automation' ? 'active' : ''}`}
            onClick={() => setActiveTab('automation')}
          >
            🤖 Automation
          </button>
          <button
            className={`settings-tab ${activeTab === 'limits' ? 'active' : ''}`}
            onClick={() => setActiveTab('limits')}
          >
            📊 Rate Limits
          </button>
          <button
            className={`settings-tab ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            ⚠️ Danger Zone
          </button>
        </div>

        <div className="modal-body settings-body">
          {activeTab === 'account' && (
            <>
              <section className="settings-section">
                <h3 className="settings-section-title">ACCOUNT INFORMATION</h3>
                <div className="settings-info-grid">
                  <div className="settings-info-item">
                    <span className="info-label">Platform</span>
                    <span className="info-value">{platform.label}</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="info-label">Handle</span>
                    <span className="info-value">{feed.handle}</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="info-label">Display Name</span>
                    <span className="info-value">{feed.displayName || '-'}</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="info-label">Connection Status</span>
                    <span className={`info-value status-${feed.connectionStatus}`}>
                      {feed.connectionStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="settings-info-item">
                    <span className="info-label">Connected Via</span>
                    <span className="info-value">{feed.isOAuth ? 'OAuth' : 'Manual'}</span>
                  </div>
                  <div className="settings-info-item">
                    <span className="info-label">Last Synced</span>
                    <span className="info-value">
                      {feed.lastSync ? new Date(feed.lastSync).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="settings-section">
                <h3 className="settings-section-title">TOKEN STATUS</h3>
                <div className="token-status">
                  {feed.accessToken ? (
                    <div className="token-valid">
                      <span className="token-icon">✅</span>
                      <div className="token-info">
                        <span className="token-title">Access Token Active</span>
                        <span className="token-detail">
                          {feed.tokenExpiresAt
                            ? `Expires: ${new Date(feed.tokenExpiresAt).toLocaleDateString()}`
                            : 'Long-lived token'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="token-invalid">
                      <span className="token-icon">⚠️</span>
                      <div className="token-info">
                        <span className="token-title">No Access Token</span>
                        <span className="token-detail">Reconnect to restore API access</span>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === 'automation' && (
            <>
              <section className="settings-section">
                <h3 className="settings-section-title">AUTOMATION STATUS</h3>
                <div className="automation-setting">
                  <div className="automation-setting-info">
                    <span className="automation-setting-title">Master Automation Switch</span>
                    <span className="automation-setting-desc">
                      Enable or disable all automation for this account
                    </span>
                  </div>
                  <button
                    className={`automation-master-toggle ${feed.automationEnabled ? 'enabled' : ''}`}
                    onClick={() => onToggleAutomation?.(feed.id)}
                  >
                    {feed.automationEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </section>

              <section className="settings-section">
                <h3 className="settings-section-title">CONTROL MODE</h3>
                <div className="control-mode-info">
                  <div className={`control-mode-badge ${feed.controlMode}`}>
                    {feed.controlMode.toUpperCase()}
                  </div>
                  <p className="control-mode-desc">
                    {feed.controlMode === 'autopilot' && 'Full automation enabled. System manages posting and engagement.'}
                    {feed.controlMode === 'escrow' && 'Content requires approval before posting.'}
                    {feed.controlMode === 'manual' && 'You have full control. No automated actions.'}
                    {feed.controlMode === 'observation' && 'Read-only mode. Metrics tracked but no actions taken.'}
                  </p>
                </div>
              </section>

              <section className="settings-section">
                <h3 className="settings-section-title">AUTOMATION LIMITS</h3>
                <p className="settings-note">
                  Instagram enforces strict rate limits to prevent spam. Our system automatically
                  respects these limits to keep your account safe.
                </p>
                <div className="limits-info-grid">
                  <div className="limit-info-card">
                    <span className="limit-icon">❤️</span>
                    <span className="limit-name">Likes</span>
                    <span className="limit-value">150/day</span>
                  </div>
                  <div className="limit-info-card">
                    <span className="limit-icon">💬</span>
                    <span className="limit-name">Comments</span>
                    <span className="limit-value">30/day</span>
                  </div>
                  <div className="limit-info-card">
                    <span className="limit-icon">➕</span>
                    <span className="limit-name">Follows</span>
                    <span className="limit-value">50/day</span>
                  </div>
                  <div className="limit-info-card">
                    <span className="limit-icon">📨</span>
                    <span className="limit-name">DMs</span>
                    <span className="limit-value">20/day</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'limits' && (
            <>
              <section className="settings-section">
                <div className="settings-section-header">
                  <h3 className="settings-section-title">TODAY'S USAGE</h3>
                  <button
                    className="refresh-limits-btn"
                    onClick={fetchRateLimits}
                    disabled={isLoadingLimits}
                  >
                    {isLoadingLimits ? '↻' : '↻ Refresh'}
                  </button>
                </div>
                <div className="rate-limits-grid">
                  {displayLimits.map((limit) => (
                    <div key={limit.action} className="rate-limit-card">
                      <div className="rate-limit-header">
                        <span className="rate-limit-action">{limit.action}</span>
                        <span className="rate-limit-count">
                          {limit.used} / {limit.limit}
                        </span>
                      </div>
                      <div className="rate-limit-bar">
                        <div
                          className={`rate-limit-fill ${limit.used / limit.limit > 0.8 ? 'warning' : ''} ${limit.used >= limit.limit ? 'full' : ''}`}
                          style={{ width: `${Math.min((limit.used / limit.limit) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="rate-limit-remaining">
                        {limit.limit - limit.used} remaining
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="settings-section">
                <h3 className="settings-section-title">API CALL BUDGET</h3>
                <div className="api-budget">
                  <div className="api-budget-ring">
                    <svg viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#1a2a3a"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3fffdc"
                        strokeWidth="3"
                        strokeDasharray="35, 100"
                      />
                    </svg>
                    <div className="api-budget-value">35%</div>
                  </div>
                  <div className="api-budget-info">
                    <span className="api-budget-title">70 / 200 calls this hour</span>
                    <span className="api-budget-note">Resets at the top of each hour</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'danger' && (
            <>
              <section className="settings-section danger">
                <h3 className="settings-section-title">⚠️ DANGER ZONE</h3>
                <p className="danger-warning">
                  These actions are irreversible. Please proceed with caution.
                </p>

                <div className="danger-action">
                  <div className="danger-action-info">
                    <span className="danger-action-title">Disconnect Account</span>
                    <span className="danger-action-desc">
                      Remove this account from Social Exchange. Your scheduled posts will be cancelled.
                    </span>
                  </div>
                  {!showDisconnectConfirm ? (
                    <button
                      className="danger-btn"
                      onClick={() => setShowDisconnectConfirm(true)}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <div className="disconnect-confirm">
                      <span>Are you sure?</span>
                      <button className="confirm-yes" onClick={handleDisconnect}>
                        Yes, Disconnect
                      </button>
                      <button
                        className="confirm-no"
                        onClick={() => setShowDisconnectConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-button secondary" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
