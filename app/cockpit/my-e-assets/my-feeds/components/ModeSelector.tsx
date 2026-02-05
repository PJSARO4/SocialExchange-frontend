'use client';

import { useState } from 'react';
import { ControlMode } from '../types/feed';

interface ModeSelectorProps {
  currentMode: ControlMode;
  onModeChange: (mode: ControlMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

// Mode configuration with full details
const MODES: Array<{
  id: ControlMode;
  icon: string;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
}> = [
  {
    id: 'autopilot',
    icon: '🤖',
    label: 'Automated',
    shortLabel: 'AUTO',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
    description: 'AI auto-curates content from sources, generates captions, and schedules posts based on optimal times.',
    features: [
      'AI content curation',
      'Auto-generated captions',
      'Smart scheduling',
      'Engagement optimization'
    ]
  },
  {
    id: 'manual',
    icon: '✋',
    label: 'Independent',
    shortLabel: 'MANUAL',
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.1)',
    description: 'Full control over your content. Create and schedule posts manually with Copilot assistance on request.',
    features: [
      'Manual content creation',
      'Custom scheduling',
      'Copilot on demand',
      'Full creative control'
    ]
  },
  {
    id: 'observation',
    icon: '👁️',
    label: 'Observe',
    shortLabel: 'OBSERVE',
    color: '#ff9500',
    bgColor: 'rgba(255, 149, 0, 0.1)',
    description: 'Track any public account\'s metrics, posting frequency, and engagement patterns. No posting capability.',
    features: [
      'Public metrics tracking',
      'Competitor analysis',
      'Trend monitoring',
      'Performance insights'
    ]
  }
];

export default function ModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
  compact = false
}: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<ControlMode | null>(null);

  const currentModeConfig = MODES.find(m => m.id === currentMode) || MODES[1];
  const displayMode = hoveredMode ? MODES.find(m => m.id === hoveredMode) : currentModeConfig;

  const handleModeSelect = (mode: ControlMode) => {
    if (!disabled && mode !== currentMode) {
      onModeChange(mode);
    }
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="mode-selector-compact">
        <button
          className="mode-selector-compact-btn"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          style={{
            borderColor: currentModeConfig.color,
            backgroundColor: currentModeConfig.bgColor
          }}
        >
          <span className="mode-icon">{currentModeConfig.icon}</span>
          <span className="mode-label" style={{ color: currentModeConfig.color }}>
            {currentModeConfig.shortLabel}
          </span>
          <span className="mode-chevron">▼</span>
        </button>

        {isOpen && (
          <>
            <div className="mode-selector-backdrop" onClick={() => setIsOpen(false)} />
            <div className="mode-selector-dropdown">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  className={`mode-dropdown-item ${mode.id === currentMode ? 'active' : ''}`}
                  onClick={() => handleModeSelect(mode.id)}
                  style={{
                    '--mode-color': mode.color,
                    '--mode-bg': mode.bgColor
                  } as React.CSSProperties}
                >
                  <span className="mode-icon">{mode.icon}</span>
                  <span className="mode-info">
                    <span className="mode-name">{mode.label}</span>
                    <span className="mode-desc">{mode.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mode-selector">
      {/* Mode Cards */}
      <div className="mode-selector-cards">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            className={`mode-card ${mode.id === currentMode ? 'selected' : ''}`}
            onClick={() => handleModeSelect(mode.id)}
            onMouseEnter={() => setHoveredMode(mode.id)}
            onMouseLeave={() => setHoveredMode(null)}
            disabled={disabled}
            style={{
              '--mode-color': mode.color,
              '--mode-bg': mode.bgColor
            } as React.CSSProperties}
          >
            <div className="mode-card-header">
              <span className="mode-card-icon">{mode.icon}</span>
              <span className="mode-card-label">{mode.label}</span>
            </div>
            {mode.id === currentMode && (
              <div className="mode-card-active-indicator">
                <span>●</span> ACTIVE
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Mode Description */}
      <div
        className="mode-selector-details"
        style={{
          borderColor: displayMode?.color,
          backgroundColor: displayMode?.bgColor
        }}
      >
        <div className="mode-details-header">
          <span className="mode-details-icon">{displayMode?.icon}</span>
          <span className="mode-details-title" style={{ color: displayMode?.color }}>
            {displayMode?.label} Mode
          </span>
        </div>
        <p className="mode-details-description">{displayMode?.description}</p>
        <ul className="mode-details-features">
          {displayMode?.features.map((feature, i) => (
            <li key={i} style={{ color: displayMode?.color }}>
              <span className="feature-bullet">◆</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// CSS styles for the mode selector
export const modeSelectorStyles = `
.mode-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-selector-cards {
  display: flex;
  gap: 12px;
}

.mode-card {
  flex: 1;
  padding: 16px;
  background: rgba(0, 20, 30, 0.6);
  border: 1px solid rgba(0, 200, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.mode-card:hover {
  border-color: var(--mode-color);
  background: var(--mode-bg);
  transform: translateY(-2px);
}

.mode-card.selected {
  border-color: var(--mode-color);
  background: var(--mode-bg);
  box-shadow: 0 0 20px var(--mode-bg);
}

.mode-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mode-card-icon {
  font-size: 1.5rem;
}

.mode-card-label {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}

.mode-card-active-indicator {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--mode-color);
  display: flex;
  align-items: center;
  gap: 4px;
}

.mode-selector-details {
  padding: 16px;
  border: 1px solid;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.mode-details-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mode-details-icon {
  font-size: 1.2rem;
}

.mode-details-title {
  font-family: var(--font-mono);
  font-weight: 600;
}

.mode-details-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 12px;
}

.mode-details-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.mode-details-features li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
}

.feature-bullet {
  font-size: 0.6rem;
}

/* Compact variant */
.mode-selector-compact {
  position: relative;
}

.mode-selector-compact-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 20, 30, 0.8);
  border: 1px solid;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-mono);
}

.mode-selector-compact-btn:hover {
  background: rgba(0, 40, 60, 0.8);
}

.mode-chevron {
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.5);
}

.mode-selector-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.mode-selector-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  min-width: 280px;
  margin-top: 4px;
  background: rgba(0, 20, 30, 0.95);
  border: 1px solid rgba(0, 200, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.mode-dropdown-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.mode-dropdown-item:hover {
  background: var(--mode-bg);
}

.mode-dropdown-item.active {
  background: var(--mode-bg);
  border-left: 3px solid var(--mode-color);
}

.mode-dropdown-item .mode-icon {
  font-size: 1.2rem;
  margin-top: 2px;
}

.mode-dropdown-item .mode-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-dropdown-item .mode-name {
  font-family: var(--font-mono);
  font-weight: 600;
  color: #fff;
}

.mode-dropdown-item .mode-desc {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

/* Feed card mode badge */
.feed-card-mode-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
}

.feed-card-mode {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 600;
}
`;
