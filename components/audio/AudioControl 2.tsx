'use client';

import { useState, useEffect } from 'react';
import { useAmbientAudio } from '@/lib/audio/useAmbientAudio';
import type { AmbientMood } from '@/lib/audio/AmbientAudioEngine';
import './audio-control.css';

interface AudioControlProps {
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  minimal?: boolean;
  showMood?: boolean;
}

export default function AudioControl({
  position = 'bottom-left',
  minimal = false,
  showMood = true
}: AudioControlProps) {
  const {
    isPlaying,
    currentMood,
    volume,
    isEnabled,
    toggle,
    setVolume,
    setEnabled,
    changeMood
  } = useAmbientAudio();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);

  // Hide tooltip after a few seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  // All available moods with display names and descriptions
  const allMoods: { mood: AmbientMood; name: string; description: string; icon: string }[] = [
    // Calm / Ambient
    { mood: 'entrance', name: 'WELCOME', description: 'Mysterious, inviting', icon: '🌟' },
    { mood: 'peaceful', name: 'PEACEFUL', description: 'Serene, minimal', icon: '🧘' },
    { mood: 'deepspace', name: 'DEEP SPACE', description: 'Vast, cosmic', icon: '🌌' },
    { mood: 'nebula', name: 'NEBULA', description: 'Ethereal, dreamy', icon: '✨' },
    { mood: 'cruise', name: 'CRUISE', description: 'Peaceful, spacious', icon: '🚀' },
    // Medium Energy
    { mood: 'command', name: 'COMMAND', description: 'Focused, professional', icon: '🎯' },
    { mood: 'feeds', name: 'FEEDS', description: 'Calm, productive', icon: '📡' },
    { mood: 'comms', name: 'COMMS', description: 'Quiet, ambient', icon: '💬' },
    { mood: 'exploration', name: 'EXPLORE', description: 'Curious, wonder', icon: '🔭' },
    { mood: 'station', name: 'STATION', description: 'Industrial hum', icon: '🛸' },
    // High Energy
    { mood: 'market', name: 'MARKET', description: 'Dynamic tension', icon: '📈' },
    { mood: 'alert', name: 'ALERT', description: 'Attention-grabbing', icon: '⚡' },
    { mood: 'hyperspace', name: 'HYPERSPACE', description: 'Fast, exciting', icon: '💫' },
    { mood: 'warpcore', name: 'WARP CORE', description: '~100 BPM driving', icon: '⚛️' },
    { mood: 'pulse', name: 'PULSE', description: '~120 BPM rhythmic', icon: '💓' },
    { mood: 'datastream', name: 'DATASTREAM', description: '~130 BPM electric', icon: '📊' },
    { mood: 'cyberspace', name: 'CYBERSPACE', description: '~140 BPM digital', icon: '🔮' },
    { mood: 'battlestation', name: 'BATTLE', description: '~160 BPM intense', icon: '⚔️' },
    // Intense / Suspense
    { mood: 'incoming', name: 'INCOMING', description: 'Building tension', icon: '🎯' },
    { mood: 'pursuit', name: 'PURSUIT', description: '~150 BPM chase', icon: '🏃' },
    { mood: 'redzone', name: 'RED ZONE', description: '~180 BPM maximum', icon: '🔴' },
    { mood: 'dread', name: 'DREAD', description: 'Creeping terror', icon: '👁️' },
    { mood: 'darkcore', name: 'DARKCORE', description: 'Ominous, menacing', icon: '🖤' },
  ];

  // Legacy mood names map for display
  const moodNames: Record<string, string> = Object.fromEntries(
    allMoods.map(m => [m.mood, m.name])
  );

  if (minimal) {
    return (
      <button
        className={`audio-control-minimal ${isPlaying ? 'playing' : ''}`}
        onClick={toggle}
        title={isPlaying ? 'Mute ambient audio' : 'Play ambient audio'}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div className={`audio-control ${position} ${isExpanded ? 'expanded' : ''}`}>
      {/* Main toggle button */}
      <button
        className={`audio-toggle ${isPlaying ? 'playing' : ''}`}
        onClick={() => {
          if (!isEnabled) {
            setEnabled(true);
            toggle();
          } else {
            toggle();
          }
        }}
        onMouseEnter={() => !isExpanded && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="audio-icon">
          {isPlaying ? (
            <>
              <span className="wave wave-1" />
              <span className="wave wave-2" />
              <span className="wave wave-3" />
            </>
          ) : (
            <span className="muted-icon">◇</span>
          )}
        </div>
      </button>

      {/* Tooltip */}
      {showTooltip && !isExpanded && (
        <div className="audio-tooltip">
          {isPlaying ? 'Ambient On' : 'Click for Ambient'}
        </div>
      )}

      {/* Expand button */}
      <button
        className="audio-expand-btn"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '×' : '⚙'}
      </button>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="audio-panel">
          <div className="audio-panel-header">
            <span className="panel-title">AMBIENT AUDIO</span>
            {showMood && (
              <button
                className="mood-indicator clickable"
                onClick={() => setShowMoodSelector(!showMoodSelector)}
                title="Click to change mood"
              >
                {allMoods.find(m => m.mood === currentMood)?.icon} {moodNames[currentMood] || currentMood.toUpperCase()}
              </button>
            )}
          </div>

          {/* Mood Selector */}
          {showMoodSelector && (
            <div className="mood-selector">
              <div className="mood-selector-header">
                <span>Select Soundscape</span>
                <button
                  className="mood-selector-close"
                  onClick={() => setShowMoodSelector(false)}
                >
                  ×
                </button>
              </div>
              <div className="mood-grid">
                {allMoods.map(({ mood, name, description, icon }) => (
                  <button
                    key={mood}
                    className={`mood-option ${currentMood === mood ? 'active' : ''}`}
                    onClick={() => {
                      changeMood(mood);
                      // Auto-start if not playing
                      if (!isPlaying && isEnabled) {
                        toggle();
                      }
                      setShowMoodSelector(false);
                    }}
                    title={description}
                  >
                    <span className="mood-option-icon">{icon}</span>
                    <span className="mood-option-name">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enable toggle */}
          <div className="audio-setting">
            <span className="setting-label">Enable</span>
            <button
              className={`setting-toggle ${isEnabled ? 'active' : ''}`}
              onClick={() => setEnabled(!isEnabled)}
            >
              {isEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Volume slider */}
          <div className="audio-setting">
            <span className="setting-label">Volume</span>
            <div className="volume-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
                disabled={!isEnabled}
              />
              <span className="volume-value">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* Status */}
          <div className="audio-status">
            <span className={`status-dot ${isPlaying ? 'active' : ''}`} />
            <span className="status-text">
              {isPlaying ? 'Playing' : isEnabled ? 'Ready' : 'Disabled'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
