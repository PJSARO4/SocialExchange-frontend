'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Platform, PLATFORMS, CreateFeedPayload } from '../../types/feed';

interface AddFeedModalProps {
  onAdd: (payload: CreateFeedPayload) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

type ConnectionMode = 'oauth' | 'manual';

export default function AddFeedModal({
  onAdd,
  onClose,
  isLoading = false,
}: AddFeedModalProps) {
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('oauth');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const platformList = Object.values(PLATFORMS);
  const selectedPlatform = PLATFORMS[platform];

  // Platforms that support OAuth
  const oauthPlatforms: Platform[] = ['instagram', 'facebook'];
  const supportsOAuth = oauthPlatforms.includes(platform);

  const handleOAuthConnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      // Map platform to NextAuth provider ID
      let provider: string;
      if (platform === 'instagram') {
        // Use Instagram Direct Login (goes through instagram.com, not facebook.com)
        // No Facebook Page required!
        provider = 'instagram-direct';
      } else if (platform === 'facebook') {
        provider = 'facebook';
      } else {
        provider = platform;
      }

      await signIn(provider, {
        callbackUrl: `/cockpit/my-e-assets/my-feeds?connected=${platform}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth connection failed');
      setIsConnecting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!handle.trim()) {
      setError('Handle is required');
      return;
    }

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    try {
      await onAdd({
        platform,
        handle: handle.startsWith('@') ? handle : `@${handle}`,
        displayName: displayName.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add account');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content add-feed-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 className="modal-title">CONNECT ACCOUNT</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={isLoading || isConnecting}
          >
            ×
          </button>
        </header>

        <div className="modal-body">
          {/* Platform Selection */}
          <div className="modal-section">
            <label className="modal-label">SELECT PLATFORM</label>
            <div className="platform-grid">
              {platformList.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`platform-tile ${platform === p.id ? 'selected' : ''}`}
                  onClick={() => {
                    setPlatform(p.id);
                    // Reset to OAuth if the new platform supports it
                    if (oauthPlatforms.includes(p.id)) {
                      setConnectionMode('oauth');
                    } else {
                      setConnectionMode('manual');
                    }
                  }}
                  disabled={isLoading || isConnecting}
                >
                  <span
                    className="platform-tile-indicator"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="platform-tile-icon">{p.icon}</span>
                  <span className="platform-tile-label">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Mode Toggle (only for platforms that support OAuth) */}
          {supportsOAuth && (
            <div className="modal-section">
              <label className="modal-label">CONNECTION METHOD</label>
              <div className="connection-mode-toggle">
                <button
                  type="button"
                  className={`mode-button ${connectionMode === 'oauth' ? 'active' : ''}`}
                  onClick={() => setConnectionMode('oauth')}
                  disabled={isLoading || isConnecting}
                >
                  <span className="mode-icon">🔐</span>
                  <span className="mode-label">OAuth</span>
                  <span className="mode-desc">Real data &amp; posting</span>
                </button>
                <button
                  type="button"
                  className={`mode-button ${connectionMode === 'manual' ? 'active' : ''}`}
                  onClick={() => setConnectionMode('manual')}
                  disabled={isLoading || isConnecting}
                >
                  <span className="mode-icon">✏️</span>
                  <span className="mode-label">Manual</span>
                  <span className="mode-desc">Observation only</span>
                </button>
              </div>
            </div>
          )}

          {/* OAuth Connection */}
          {connectionMode === 'oauth' && supportsOAuth && (
            <div className="modal-section oauth-section">
              <div className="oauth-info">
                <div className="oauth-icon" style={{ color: selectedPlatform.color }}>
                  {selectedPlatform.icon}
                </div>
                <div className="oauth-text">
                  <h3>Connect your {selectedPlatform.label} account</h3>
                  <p>
                    Sign in directly with {selectedPlatform.label} to:
                  </p>
                  <ul className="oauth-features">
                    <li>✓ View real follower counts &amp; engagement</li>
                    <li>✓ Schedule and auto-post content</li>
                    <li>✓ Access detailed analytics</li>
                    <li>✓ Manage comments &amp; messages</li>
                  </ul>
                </div>
              </div>

              {platform === 'instagram' && (
                <div className="oauth-requirements">
                  <span className="requirements-icon">ℹ</span>
                  <div className="requirements-text">
                    <strong>Requirements:</strong>
                    <ul>
                      <li>Instagram Business or Creator account</li>
                    </ul>
                    <p className="requirements-note">
                      ✨ No Facebook Page required! Sign in directly with Instagram.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="oauth-connect-button"
                style={{ backgroundColor: selectedPlatform.color }}
                onClick={handleOAuthConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <span className="spinner" />
                    CONNECTING...
                  </>
                ) : (
                  <>
                    {selectedPlatform.icon}
                    CONNECT WITH {selectedPlatform.label.toUpperCase()}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manual Entry Form */}
          {(connectionMode === 'manual' || !supportsOAuth) && (
            <form onSubmit={handleManualSubmit}>
              {/* Handle Input */}
              <div className="modal-section">
                <label htmlFor="feed-handle" className="modal-label">
                  HANDLE
                </label>
                <input
                  id="feed-handle"
                  type="text"
                  className="modal-input"
                  placeholder="@username"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              {/* Display Name Input */}
              <div className="modal-section">
                <label htmlFor="feed-display-name" className="modal-label">
                  DISPLAY NAME
                </label>
                <input
                  id="feed-display-name"
                  type="text"
                  className="modal-input"
                  placeholder="Account name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              {/* Manual Mode Notice */}
              <div className="modal-notice warning">
                <span className="modal-notice-icon">⚠</span>
                <span className="modal-notice-text">
                  Manual accounts are <strong>observation only</strong>.
                  You won't be able to post or view real analytics.
                  Connect via OAuth for full features.
                </span>
              </div>

              {/* Submit Button */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-button secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="modal-button primary"
                  disabled={isLoading || !handle.trim() || !displayName.trim()}
                >
                  {isLoading ? 'ADDING...' : 'ADD ACCOUNT'}
                </button>
              </div>
            </form>
          )}

          {/* Error Message */}
          {error && (
            <div className="modal-error">
              <span className="modal-error-icon">⚠</span>
              {error}
            </div>
          )}

          {/* OAuth Footer */}
          {connectionMode === 'oauth' && supportsOAuth && (
            <div className="modal-footer">
              <button
                type="button"
                className="modal-button secondary"
                onClick={onClose}
                disabled={isConnecting}
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
