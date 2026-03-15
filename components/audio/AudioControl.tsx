"use client";

import React, { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import {
  getAmbientAudio,
  AMBIENT_TRACKS,
  type AmbientTrack,
} from '@/lib/audio/AmbientAudioEngine';
import {
  Sparkles, Cpu, Rocket, Radio, Wind, Atom,
  Waves, Gem, Sun, Zap, Moon, Building2,
  Snowflake, Circle, Signal, Globe,
} from 'lucide-react';

const TRACK_ICON_MAP: Record<string, ReactNode> = {
  galaxy: <Sparkles size={14} />,
  cpu: <Cpu size={14} />,
  rocket: <Rocket size={14} />,
  radio: <Radio size={14} />,
  wind: <Wind size={14} />,
  atom: <Atom size={14} />,
  waves: <Waves size={14} />,
  gem: <Gem size={14} />,
  sun: <Sun size={14} />,
  zap: <Zap size={14} />,
  moon: <Moon size={14} />,
  building: <Building2 size={14} />,
  snowflake: <Snowflake size={14} />,
  circle: <Circle size={14} />,
  signal: <Signal size={14} />,
  globe: <Globe size={14} />,
};

interface AudioControlProps {
  className?: string;
}

export default function AudioControl({ className = '' }: AudioControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [audioLevels, setAudioLevels] = useState([0.3, 0.5, 0.4, 0.6, 0.3]);
  const [currentTrack, setCurrentTrack] = useState<AmbientTrack>(AMBIENT_TRACKS[0]);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [showTrackList, setShowTrackList] = useState(false);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    const audio = getAmbientAudio();
    setIsPlaying(audio.getIsPlaying());
    setVolume(audio.getVolume() || 0.3);
    setCurrentTrack(audio.getCurrentTrack());
    setShuffleEnabled(audio.getShuffleEnabled());

    // Listen for track changes
    const handleTrackChange = (track: AmbientTrack) => {
      setCurrentTrack(track);
    };
    const handlePlayState = (playing: boolean) => {
      setIsPlaying(playing);
    };
    const handleShuffle = (enabled: boolean) => {
      setShuffleEnabled(enabled);
    };

    audio.on('trackChange', handleTrackChange);
    audio.on('playStateChange', handlePlayState);
    audio.on('shuffleChange', handleShuffle);

    return () => {
      audio.off('trackChange', handleTrackChange);
      audio.off('playStateChange', handlePlayState);
      audio.off('shuffleChange', handleShuffle);
    };
  }, []);

  // Animate audio levels when playing
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        setAudioLevels(prev => prev.map(() => 0.2 + Math.random() * 0.6));
      }, 150);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      setAudioLevels([0.15, 0.15, 0.15, 0.15, 0.15]);
    }
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isPlaying]);

  const toggleAudio = useCallback(async () => {
    const audio = getAmbientAudio();
    if (isPlaying) {
      audio.pause();
    } else {
      await audio.start('cockpit');
    }
  }, [isPlaying]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    getAmbientAudio().setVolume(newVolume);
  }, []);

  const handleNext = useCallback(async () => {
    await getAmbientAudio().nextTrack();
  }, []);

  const handlePrev = useCallback(async () => {
    await getAmbientAudio().prevTrack();
  }, []);

  const handleShuffle = useCallback(() => {
    getAmbientAudio().toggleShuffle();
  }, []);

  const handleTrackSelect = useCallback(async (trackId: string) => {
    await getAmbientAudio().playTrack(trackId);
    setShowTrackList(false);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`ac-widget ${isExpanded ? 'ac-expanded' : ''} ${isPlaying ? 'ac-playing' : ''} ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => { setIsExpanded(false); setShowTrackList(false); }}
    >
      {/* Main Button */}
      <button
        onClick={toggleAudio}
        className="ac-btn"
        aria-label={isPlaying ? 'Pause ambient audio' : 'Play ambient audio'}
      >
        <div className="ac-bars">
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className="ac-bar"
              style={{ height: `${level * 100}%` }}
            />
          ))}
        </div>
        {isPlaying && <div className="ac-pulse" />}
      </button>

      {/* Expanded Panel */}
      <div className="ac-panel">
        <div className="ac-panel-inner">
          {/* Status */}
          <div className="ac-status">
            <span className="ac-status-dot" />
            <span className="ac-status-text">
              {isPlaying ? 'PLAYING' : 'PAUSED'}
            </span>
          </div>

          {/* Current Track Display */}
          <button
            className="ac-track-display"
            onClick={() => setShowTrackList(!showTrackList)}
          >
            <span className="ac-track-icon">{TRACK_ICON_MAP[currentTrack.icon] || currentTrack.icon}</span>
            <div className="ac-track-info">
              <span className="ac-track-name">{currentTrack.name}</span>
              <span className="ac-track-desc">{currentTrack.description}</span>
            </div>
            <span className="ac-track-arrow">{showTrackList ? '▲' : '▼'}</span>
          </button>

          {/* Track List */}
          {showTrackList && (
            <div className="ac-tracklist">
              {AMBIENT_TRACKS.map((track) => (
                <button
                  key={track.id}
                  className={`ac-tracklist-item ${currentTrack.id === track.id ? 'active' : ''}`}
                  onClick={() => handleTrackSelect(track.id)}
                >
                  <span className="ac-tl-icon">{TRACK_ICON_MAP[track.icon] || track.icon}</span>
                  <div className="ac-tl-info">
                    <span className="ac-tl-name">{track.name}</span>
                    <span className="ac-tl-desc">{track.description}</span>
                  </div>
                  {currentTrack.id === track.id && isPlaying && (
                    <span className="ac-tl-playing">♪</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Transport Controls */}
          <div className="ac-transport">
            <button
              className={`ac-transport-btn ac-shuffle ${shuffleEnabled ? 'active' : ''}`}
              onClick={handleShuffle}
              title={shuffleEnabled ? 'Shuffle on' : 'Shuffle off'}
            >
              ⇄
            </button>
            <button className="ac-transport-btn" onClick={handlePrev} title="Previous track">
              ⏮
            </button>
            <button
              className={`ac-transport-btn ac-play ${isPlaying ? 'active' : ''}`}
              onClick={toggleAudio}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className="ac-transport-btn" onClick={handleNext} title="Next track">
              ⏭
            </button>
          </div>

          {/* Volume */}
          <div className="ac-volume">
            <span className="ac-vol-icon">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="ac-vol-slider"
            />
            <span className="ac-vol-icon">🔊</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ac-widget {
          position: fixed;
          bottom: 70px;
          left: 20px;
          z-index: 1100;
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .ac-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0a1a2e 0%, #0d2840 100%);
          border: 2px solid rgba(0, 255, 200, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 255, 200, 0.05);
        }

        .ac-playing .ac-btn {
          border-color: rgba(0, 255, 200, 0.6);
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.2), 0 0 40px rgba(0, 255, 200, 0.1), inset 0 0 20px rgba(0, 255, 200, 0.1);
        }

        .ac-btn:hover {
          transform: scale(1.05);
          border-color: rgba(0, 255, 200, 0.8);
        }

        /* Sound Bars */
        .ac-bars {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 3px;
          height: 20px;
          width: 24px;
        }

        .ac-bar {
          width: 3px;
          background: linear-gradient(to top, #00ffc8, #00a8ff);
          border-radius: 2px;
          transition: height 0.15s ease;
          min-height: 3px;
        }

        .ac-widget:not(.ac-playing) .ac-bar {
          background: #4a5568;
        }

        /* Pulse Ring */
        .ac-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(0, 255, 200, 0.4);
          animation: ac-pulse-anim 2s ease-out infinite;
        }

        @keyframes ac-pulse-anim {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        /* Panel */
        .ac-panel {
          position: absolute;
          left: 48px;
          bottom: 0;
          width: 0;
          opacity: 0;
          overflow: hidden;
          transition: all 0.3s ease;
          pointer-events: none;
          padding-left: 8px;
        }

        .ac-expanded .ac-panel {
          width: 268px;
          opacity: 1;
          pointer-events: auto;
        }

        .ac-panel-inner {
          background: linear-gradient(135deg, #0a1a2e 0%, #0d2840 100%);
          border: 1px solid rgba(0, 255, 200, 0.3);
          border-radius: 12px;
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          max-height: 450px;
          overflow-y: auto;
        }

        /* Status */
        .ac-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.6rem;
          letter-spacing: 1.5px;
          color: #9ca3af;
          text-transform: uppercase;
        }

        .ac-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4a5568;
        }

        .ac-playing .ac-status-dot {
          background: #00ffc8;
          box-shadow: 0 0 8px rgba(0, 255, 200, 0.6);
          animation: ac-glow 1.5s ease-in-out infinite alternate;
        }

        @keyframes ac-glow {
          from { box-shadow: 0 0 4px rgba(0, 255, 200, 0.4); }
          to { box-shadow: 0 0 12px rgba(0, 255, 200, 0.8); }
        }

        /* Track Display */
        .ac-track-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 255, 200, 0.2);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
        }

        .ac-track-display:hover {
          background: rgba(0, 255, 200, 0.1);
          border-color: rgba(0, 255, 200, 0.4);
        }

        .ac-track-icon {
          font-size: 1.15rem;
        }

        .ac-track-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .ac-track-name {
          font-size: 0.72rem;
          color: #e8eaed;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ac-track-desc {
          font-size: 0.58rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ac-track-arrow {
          font-size: 0.55rem;
          color: #6b7280;
        }

        /* Track List */
        .ac-tracklist {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 0.35rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .ac-tracklist-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .ac-tracklist-item:hover {
          background: rgba(0, 255, 200, 0.1);
          border-color: rgba(0, 255, 200, 0.3);
        }

        .ac-tracklist-item.active {
          background: rgba(0, 255, 200, 0.15);
          border-color: rgba(0, 255, 200, 0.5);
        }

        .ac-tl-icon { font-size: 0.9rem; }

        .ac-tl-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .ac-tl-name {
          font-size: 0.65rem;
          color: #e8eaed;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ac-tracklist-item.active .ac-tl-name {
          color: #00ffc8;
        }

        .ac-tl-desc {
          font-size: 0.52rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ac-tl-playing {
          color: #00ffc8;
          font-size: 0.7rem;
          animation: ac-note-bounce 0.6s ease-in-out infinite alternate;
        }

        @keyframes ac-note-bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-2px); }
        }

        /* Transport Controls */
        .ac-transport {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
        }

        .ac-transport-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(0, 255, 200, 0.2);
          background: transparent;
          color: #9ca3af;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ac-transport-btn:hover {
          background: rgba(0, 255, 200, 0.1);
          border-color: rgba(0, 255, 200, 0.5);
          color: #00ffc8;
        }

        .ac-transport-btn.ac-play {
          width: 36px;
          height: 36px;
          font-size: 0.85rem;
        }

        .ac-transport-btn.active {
          background: rgba(0, 255, 200, 0.15);
          border-color: #00ffc8;
          color: #00ffc8;
        }

        .ac-shuffle.active {
          color: #00ffc8;
          border-color: rgba(0, 255, 200, 0.5);
          background: rgba(0, 255, 200, 0.1);
        }

        /* Volume */
        .ac-volume {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .ac-vol-icon {
          font-size: 0.7rem;
          opacity: 0.6;
        }

        .ac-vol-slider {
          flex: 1;
          height: 4px;
          appearance: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          cursor: pointer;
        }

        .ac-vol-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #00ffc8;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0, 255, 200, 0.5);
        }

        .ac-vol-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #00ffc8;
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }

        /* Light mode support */
        :global([data-theme="light"]) .ac-btn {
          background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
          border-color: rgba(5, 150, 105, 0.3);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        :global([data-theme="light"]) .ac-playing .ac-btn {
          border-color: rgba(5, 150, 105, 0.6);
          box-shadow: 0 2px 15px rgba(5, 150, 105, 0.15);
        }

        :global([data-theme="light"]) .ac-bar {
          background: linear-gradient(to top, #059669, #0284c7);
        }

        :global([data-theme="light"]) .ac-panel-inner {
          background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
          border-color: rgba(5, 150, 105, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        :global([data-theme="light"]) .ac-status-text,
        :global([data-theme="light"]) .ac-track-desc,
        :global([data-theme="light"]) .ac-tl-desc {
          color: #6b7280;
        }

        :global([data-theme="light"]) .ac-track-name,
        :global([data-theme="light"]) .ac-tl-name {
          color: #1f2937;
        }

        :global([data-theme="light"]) .ac-track-display {
          background: rgba(0, 0, 0, 0.03);
          border-color: rgba(0, 0, 0, 0.1);
        }

        :global([data-theme="light"]) .ac-transport-btn {
          border-color: rgba(0, 0, 0, 0.1);
          color: #6b7280;
        }

        :global([data-theme="light"]) .ac-transport-btn:hover {
          background: rgba(5, 150, 105, 0.1);
          border-color: rgba(5, 150, 105, 0.4);
          color: #059669;
        }

        :global([data-theme="light"]) .ac-transport-btn.active,
        :global([data-theme="light"]) .ac-shuffle.active {
          background: rgba(5, 150, 105, 0.1);
          border-color: #059669;
          color: #059669;
        }

        :global([data-theme="light"]) .ac-pulse {
          border-color: rgba(5, 150, 105, 0.4);
        }

        :global([data-theme="light"]) .ac-playing .ac-status-dot {
          background: #059669;
          box-shadow: 0 0 8px rgba(5, 150, 105, 0.6);
        }

        :global([data-theme="light"]) .ac-tracklist-item.active {
          background: rgba(5, 150, 105, 0.1);
          border-color: rgba(5, 150, 105, 0.3);
        }

        :global([data-theme="light"]) .ac-tracklist-item.active .ac-tl-name {
          color: #059669;
        }

        :global([data-theme="light"]) .ac-tl-playing {
          color: #059669;
        }
      `}</style>
    </div>
  );
}
