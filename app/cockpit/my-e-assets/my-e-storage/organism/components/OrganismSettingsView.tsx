'use client';

import { useState } from 'react';
import { useOrganism } from '@/app/context/OrganismContext';
import { PLATFORM_SPECS } from '../lib/compression-engine';
import type { PlatformName } from '../types/organism';

// ============================================
// SETTINGS VIEW — Behavior toggles + training
// ============================================

export default function OrganismSettingsView() {
  const { config, toggleBehavior, saveTraining, updateConfig } = useOrganism();
  const [trainingText, setTrainingText] = useState(config.userTraining);
  const [saved, setSaved] = useState(false);

  const handleSaveTraining = () => {
    saveTraining(trainingText);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="orgo-settings">
      {/* Behaviors Section */}
      <div>
        <div
          style={{
            fontSize: '0.6875rem',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.5rem',
            fontWeight: '600',
          }}
        >
          Behaviors
        </div>

        {config.behaviors.map((behavior) => (
          <div key={behavior.id} className="orgo-behavior-item">
            <button
              className={`orgo-behavior-toggle ${behavior.enabled ? 'on' : ''}`}
              onClick={() => toggleBehavior(behavior.id)}
              aria-label={`Toggle ${behavior.name}`}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginBottom: '0.125rem',
                }}
              >
                <span style={{ fontSize: '0.875rem' }}>{behavior.icon}</span>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: '500',
                    color: behavior.enabled ? '#e5e7eb' : '#6b7280',
                  }}
                >
                  {behavior.name}
                </span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
                {behavior.description}
              </div>
              <div
                style={{
                  fontSize: '0.625rem',
                  color: '#4b5563',
                  marginTop: '0.125rem',
                }}
              >
                Trigger: {behavior.triggerCondition}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compression Defaults */}
      <div>
        <div
          style={{
            fontSize: '0.6875rem',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.5rem',
            fontWeight: '600',
          }}
        >
          Compression Defaults
        </div>

        <div
          style={{
            padding: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              marginBottom: '0.5rem',
            }}
          >
            Default Platform
          </div>
          <select
            value={config.compressionDefaults.platform}
            onChange={(e) =>
              updateConfig({
                compressionDefaults: {
                  ...config.compressionDefaults,
                  platform: e.target.value as PlatformName,
                },
              })
            }
            style={{
              width: '100%',
              padding: '0.375rem 0.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#e5e7eb',
              fontSize: '0.75rem',
              outline: 'none',
            }}
          >
            {Object.values(PLATFORM_SPECS).map((spec) => (
              <option key={spec.name} value={spec.name}>
                {spec.label} ({spec.width}x{spec.height})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Training Section */}
      <div>
        <div
          style={{
            fontSize: '0.6875rem',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.5rem',
            fontWeight: '600',
          }}
        >
          Training Notes
        </div>

        <div className="orgo-training-area">
          <div
            style={{
              fontSize: '0.6875rem',
              color: '#9ca3af',
              marginBottom: '0.5rem',
            }}
          >
            Describe your preferences to personalize SYN. This is prepended to
            its system prompt.
          </div>
          <textarea
            className="orgo-training-textarea"
            placeholder="e.g. I primarily post food content on Instagram. I prefer square format. Auto-compress everything for Twitter..."
            value={trainingText}
            onChange={(e) => setTrainingText(e.target.value)}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '0.5rem',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            {saved && (
              <span style={{ fontSize: '0.6875rem', color: '#3fffdc' }}>
                Saved!
              </span>
            )}
            <button
              onClick={handleSaveTraining}
              style={{
                padding: '0.375rem 0.75rem',
                background: 'rgba(63, 255, 220, 0.12)',
                border: '1px solid rgba(63, 255, 220, 0.25)',
                borderRadius: '6px',
                color: '#3fffdc',
                fontSize: '0.6875rem',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Toggle */}
      <div className="orgo-behavior-item">
        <button
          className={`orgo-behavior-toggle ${config.notifications ? 'on' : ''}`}
          onClick={() => updateConfig({ notifications: !config.notifications })}
          aria-label="Toggle notifications"
        />
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: '500', color: '#e5e7eb' }}>
            Activity Notifications
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
            Show floating bubbles when SYN completes tasks
          </div>
        </div>
      </div>
    </div>
  );
}
