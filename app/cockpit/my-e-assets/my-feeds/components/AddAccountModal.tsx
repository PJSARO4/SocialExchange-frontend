'use client';

import { useState } from 'react';

type Platform = 'instagram' | 'tiktok' | 'facebook' | 'twitter';

interface Props {
  onAdd: (
    platform: Platform,
    handle: string,
    displayName: string
  ) => void;
  onClose: () => void;
}

export default function AddAccountModal({
  onAdd,
  onClose,
}: Props) {
  const [platform, setPlatform] =
    useState<Platform>('instagram');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');

  const platforms: { id: Platform; label: string }[] = [
    { id: 'instagram', label: 'INSTAGRAM' },
    { id: 'tiktok', label: 'TIKTOK' },
    { id: 'facebook', label: 'FACEBOOK' },
    { id: 'twitter', label: 'X (TWITTER)' },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle || !displayName) return;
    onAdd(platform, handle, displayName);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 className="modal-title">ADD ACCOUNT</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form className="modal-body" onSubmit={submit}>
          <div className="modal-section">
            <label className="modal-label">
              PLATFORM
            </label>
            <div className="platform-selector">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`platform-option ${
                    platform === p.id ? 'selected' : ''
                  }`}
                  onClick={() => setPlatform(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-section">
            <label
              htmlFor="handle"
              className="modal-label"
            >
              HANDLE
            </label>
            <input
              id="handle"
              className="modal-input"
              placeholder="@username"
              value={handle}
              onChange={(e) =>
                setHandle(e.target.value)
              }
              required
            />
          </div>

          <div className="modal-section">
            <label
              htmlFor="displayName"
              className="modal-label"
            >
              DISPLAY NAME
            </label>
            <input
              id="displayName"
              className="modal-input"
              placeholder="Account Name"
              value={displayName}
              onChange={(e) =>
                setDisplayName(e.target.value)
              }
              required
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-button secondary"
              onClick={onClose}
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="modal-button primary"
            >
              CONNECT ACCOUNT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
