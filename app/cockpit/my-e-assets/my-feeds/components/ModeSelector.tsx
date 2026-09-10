'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ReactNode } from 'react';
import {
  CpuChipIcon,
  HandRaisedIcon,
  EyeIcon,
  ShieldCheckIcon,
} from '@heroicons/react/20/solid';
import { ControlMode } from '../types/feed';

interface ModeSelectorProps {
  currentMode: ControlMode;
  onModeChange: (mode: ControlMode) => void;
  disabled?: boolean;
  compact?: boolean;
  /**
   * Which modes to offer. Defaults to COMPACT_MODE_ORDER for the compact
   * dropdown and to every defined mode for the full card variant.
   *
   * This is the expansion seam for SYN: adding RECOMMEND / ASSISTED later is a
   * change to MODES + this list, not a change to the component.
   */
  modes?: ControlMode[];
}

// Mode configuration with full details
const MODES: Array<{
  id: ControlMode;
  icon: ReactNode;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  description: string;
  features: string[];
}> = [
  {
    id: 'autopilot',
    icon: <CpuChipIcon style={{ width: 18, height: 18 }} />,
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
    icon: <HandRaisedIcon style={{ width: 18, height: 18 }} />,
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
    id: 'escrow',
    icon: <ShieldCheckIcon style={{ width: 18, height: 18 }} />,
    label: 'Escrow',
    shortLabel: 'ESCROW',
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.1)',
    description: 'Actions are prepared and queued for your review. Nothing is posted until you approve it.',
    features: [
      'Queued for review',
      'Approval required',
      'Nothing auto-posts',
      'Full audit trail'
    ]
  },
  {
    id: 'observation',
    icon: <EyeIcon style={{ width: 18, height: 18 }} />,
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

/**
 * Display order for the compact dropdown. MANUAL -> ESCROW -> AUTOPILOT is the
 * order of increasing autonomy, which is the order the operator reasons in.
 *
 * 'observation' is intentionally absent here: it is still a valid ControlMode
 * (and still resolvable for display if a feed is already in it), but it is not
 * a step on the autonomy ladder.
 */
export const COMPACT_MODE_ORDER: ControlMode[] = ['manual', 'escrow', 'autopilot'];

/**
 * SYN autonomy ladder — NOT YET IMPLEMENTED, documented here so the expansion
 * path is explicit and so nobody has to re-derive it later.
 *
 *   MANUAL     SYN observes only.                        (exists)
 *   RECOMMEND  SYN analyses and recommends. No side effects.
 *   ASSISTED   SYN may create/store content after approval.
 *   ESCROW     SYN may prepare schedules/actions after approval. (exists)
 *   AUTOPILOT  SYN may execute explicitly permitted actions.     (exists)
 *
 * Adding RECOMMEND/ASSISTED requires: a Prisma enum migration, an entry in
 * MODES, and inserting the id into COMPACT_MODE_ORDER. Nothing else in this
 * component is order- or count-dependent.
 */
export const PLANNED_MODES = ['recommend', 'assisted'] as const;

export default function ModeSelector({
  currentMode,
  onModeChange,
  disabled = false,
  compact = false,
  modes
}: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<ControlMode | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const byId = (id: ControlMode) => MODES.find(m => m.id === id);
  const currentModeConfig = byId(currentMode) || MODES.find(m => m.id === 'manual') || MODES[0];

  const compactIds = modes ?? COMPACT_MODE_ORDER;
  const compactModes = compactIds
    .map(byId)
    .filter((m): m is (typeof MODES)[number] => Boolean(m));

  const fullModes = modes
    ? modes.map(byId).filter((m): m is (typeof MODES)[number] => Boolean(m))
    : MODES;

  const displayMode = hoveredMode ? byId(hoveredMode) : currentModeConfig;

  /**
   * The dropdown is portalled to <body> and positioned with position:fixed from
   * the trigger's viewport rect. See the comment on .mode-selector-dropdown in
   * my-feeds.css for why anchoring it to the trigger was not survivable.
   */
  const MENU_WIDTH = 300;
  const GUTTER = 12;

  const placeMenu = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();

    // Prefer right-aligning the menu to the trigger (the trigger sits at the
    // right edge of the account bar), then clamp into the viewport.
    let left = r.right - MENU_WIDTH;
    const maxLeft = window.innerWidth - MENU_WIDTH - GUTTER;
    if (left > maxLeft) left = maxLeft;
    if (left < GUTTER) left = GUTTER;

    setMenuPos({ top: Math.round(r.bottom + 6), left: Math.round(left) });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    placeMenu();
    const onScroll = () => placeMenu();
    const onResize = () => placeMenu();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    // capture:true so we also react to scrolling of inner scroll containers
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, placeMenu]);

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
          ref={btnRef}
          type="button"
          className={`mode-selector-compact-btn ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(v => !v)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
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

        {isOpen && mounted && menuPos && createPortal(
          <>
            <div
              className="mode-selector-backdrop"
              onClick={() => setIsOpen(false)}
            />
            <div
              className="mode-selector-dropdown"
              role="listbox"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {compactModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="option"
                  aria-selected={mode.id === currentMode}
                  className={`mode-dropdown-item ${mode.id === currentMode ? 'active' : ''}`}
                  onClick={() => handleModeSelect(mode.id)}
                  style={{
                    '--mode-color': mode.color,
                    '--mode-bg': mode.bgColor
                  } as React.CSSProperties}
                >
                  <span className="mode-icon" style={{ color: mode.color }}>{mode.icon}</span>
                  <span className="mode-info">
                    <span className="mode-name">{mode.shortLabel}</span>
                    <span className="mode-desc">{mode.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="mode-selector">
      {/* Mode Cards */}
      <div className="mode-selector-cards">
        {fullModes.map((mode) => (
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

/**
 * DEAD STRING — kept only so any stray import keeps resolving.
 *
 * These rules are NOT injected anywhere. The live styles are in my-feeds.css
 * (search: .mode-selector-compact). Editing this string has no visual effect;
 * edit my-feeds.css instead.
 */
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
