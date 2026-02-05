"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAmbientAudio } from '@/lib/audio/AmbientAudioEngine';

interface AudioControlProps {
  className?: string;
}

export default function AudioControl({ className = '' }: AudioControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [audioLevels, setAudioLevels] = useState([0.3, 0.5, 0.4, 0.6, 0.3]);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const audio = getAmbientAudio();
    setIsPlaying(audio.getIsPlaying());
    setVolume(audio.getVolume() || 0.3);
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
      setIsPlaying(false);
    } else {
      await audio.start('cockpit');
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const audio = getAmbientAudio();
    audio.setVolume(newVolume);
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`audio-control-widget ${isExpanded ? 'expanded' : ''} ${isPlaying ? 'playing' : ''} ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Main Control */}
      <button
        onClick={toggleAudio}
        className="audio-control-button"
        aria-label={isPlaying ? 'Mute ambient audio' : 'Play ambient audio'}
      >
        {/* Sound Bars Visualization */}
        <div className="audio-bars">
          {audioLevels.map((level, i) => (
            <div
              key={i}
              className="audio-bar"
              style={{ height: `${level * 100}%` }}
            />
          ))}
        </div>

        {/* Pulse Ring */}
        {isPlaying && <div className="pulse-ring" />}
      </button>

      {/* Expanded Panel */}
      <div className="audio-panel">
        <div className="audio-panel-content">
          {/* Status */}
          <div className="audio-status">
            <span className="status-indicator" />
            <span className="status-text">
              {isPlaying ? 'AMBIENT ACTIVE' : 'AUDIO OFF'}
            </span>
          </div>

          {/* Volume Slider */}
          <div className="volume-control">
            <span className="volume-icon">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <span className="volume-icon">🔊</span>
          </div>

          {/* Quick Actions */}
          <div className="audio-actions">
            <button
              onClick={toggleAudio}
              className={`audio-action-btn ${isPlaying ? 'active' : ''}`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .audio-control-widget {
          position: fixed;
          bottom: 70px;
          left: 20px;
          z-index: 1100;
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .audio-control-button {
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
          box-shadow:
            0 0 20px rgba(0, 0, 0, 0.5),
            inset 0 0 20px rgba(0, 255, 200, 0.05);
        }

        .audio-control-widget.playing .audio-control-button {
          border-color: rgba(0, 255, 200, 0.6);
          box-shadow:
            0 0 20px rgba(0, 255, 200, 0.2),
            0 0 40px rgba(0, 255, 200, 0.1),
            inset 0 0 20px rgba(0, 255, 200, 0.1);
        }

        .audio-control-button:hover {
          transform: scale(1.05);
          border-color: rgba(0, 255, 200, 0.8);
        }

        /* Sound Bars */
        .audio-bars {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 3px;
          height: 20px;
          width: 24px;
        }

        .audio-bar {
          width: 3px;
          background: linear-gradient(to top, #00ffc8, #00a8ff);
          border-radius: 2px;
          transition: height 0.15s ease;
          min-height: 3px;
        }

        .audio-control-widget:not(.playing) .audio-bar {
          background: #4a5568;
        }

        /* Pulse Ring */
        .pulse-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid rgba(0, 255, 200, 0.4);
          animation: pulse 2s ease-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        /* Expanded Panel */
        .audio-panel {
          position: absolute;
          left: 56px;
          bottom: 0;
          width: 0;
          opacity: 0;
          overflow: hidden;
          transition: all 0.3s ease;
          pointer-events: none;
        }

        .audio-control-widget.expanded .audio-panel {
          width: 200px;
          opacity: 1;
          pointer-events: auto;
        }

        .audio-panel-content {
          background: linear-gradient(135deg, #0a1a2e 0%, #0d2840 100%);
          border: 1px solid rgba(0, 255, 200, 0.3);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }

        /* Status */
        .audio-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.65rem;
          letter-spacing: 1px;
          color: #9ca3af;
          text-transform: uppercase;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4a5568;
        }

        .audio-control-widget.playing .status-indicator {
          background: #00ffc8;
          box-shadow: 0 0 8px rgba(0, 255, 200, 0.6);
          animation: glow 1.5s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from { box-shadow: 0 0 4px rgba(0, 255, 200, 0.4); }
          to { box-shadow: 0 0 12px rgba(0, 255, 200, 0.8); }
        }

        /* Volume Control */
        .volume-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .volume-icon {
          font-size: 0.75rem;
          opacity: 0.6;
        }

        .volume-slider {
          flex: 1;
          height: 4px;
          appearance: none;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          cursor: pointer;
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: #00ffc8;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0, 255, 200, 0.5);
        }

        .volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: #00ffc8;
          border-radius: 50%;
          border: none;
          cursor: pointer;
        }

        /* Actions */
        .audio-actions {
          display: flex;
          justify-content: center;
        }

        .audio-action-btn {
          padding: 0.4rem 1rem;
          border-radius: 6px;
          border: 1px solid rgba(0, 255, 200, 0.3);
          background: transparent;
          color: #9ca3af;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .audio-action-btn:hover {
          background: rgba(0, 255, 200, 0.1);
          border-color: rgba(0, 255, 200, 0.5);
          color: #00ffc8;
        }

        .audio-action-btn.active {
          background: rgba(0, 255, 200, 0.15);
          border-color: #00ffc8;
          color: #00ffc8;
        }
      `}</style>
    </div>
  );
}
