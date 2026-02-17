"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAmbientAudio, CHANNEL_INFO, type AmbientChannel } from '@/lib/audio/AmbientAudioEngine';

interface AudioControlProps {
  className?: string;
}

export default function AudioControl({ className = '' }: AudioControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [audioLevels, setAudioLevels] = useState([0.3, 0.5, 0.4, 0.6, 0.3]);
  const [currentChannel, setCurrentChannel] = useState<AmbientChannel>('deep-space');
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    const audio = getAmbientAudio();
    setIsPlaying(audio.getIsPlaying());
    setVolume(audio.getVolume() || 0.3);
    setCurrentChannel(audio.getChannel());
  }, []);

  // Animate audio levels when playing
  useEffect(() => {
    if (isPlaying && currentChannel !== 'silence') {
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
  }, [isPlaying, currentChannel]);

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

  const handleChannelChange = useCallback(async (channel: AmbientChannel) => {
    const audio = getAmbientAudio();
    await audio.setChannel(channel);
    setCurrentChannel(channel);
    setShowChannelPicker(false);
  }, []);

  if (!mounted) return null;

  const channelInfo = CHANNEL_INFO[currentChannel];

  return (
    <div
      className={`audio-control-widget ${isExpanded ? 'expanded' : ''} ${isPlaying ? 'playing' : ''} ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => { setIsExpanded(false); setShowChannelPicker(false); }}
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
        {isPlaying && currentChannel !== 'silence' && <div className="pulse-ring" />}
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

          {/* Current Channel Display */}
          <button
            className="channel-selector"
            onClick={() => setShowChannelPicker(!showChannelPicker)}
          >
            <span className="channel-icon">{channelInfo.icon}</span>
            <div className="channel-info">
              <span className="channel-name">{channelInfo.name}</span>
              <span className="channel-desc">{channelInfo.description}</span>
            </div>
            <span className="channel-arrow">{showChannelPicker ? '▲' : '▼'}</span>
          </button>

          {/* Channel Picker */}
          {showChannelPicker && (
            <div className="channel-picker">
              {Object.entries(CHANNEL_INFO).map(([key, info]) => (
                <button
                  key={key}
                  className={`channel-option ${currentChannel === key ? 'active' : ''}`}
                  onClick={() => handleChannelChange(key as AmbientChannel)}
                >
                  <span className="option-icon">{info.icon}</span>
                  <div className="option-info">
                    <span className="option-name">{info.name}</span>
                    <span className="option-desc">{info.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

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
          width: 240px;
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
          max-height: 400px;
          overflow-y: auto;
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

        /* Channel Selector */
        .channel-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 255, 200, 0.2);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          text-align: left;
        }

        .channel-selector:hover {
          background: rgba(0, 255, 200, 0.1);
          border-color: rgba(0, 255, 200, 0.4);
        }

        .channel-icon {
          font-size: 1.25rem;
        }

        .channel-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .channel-name {
          font-size: 0.75rem;
          color: #e8eaed;
          font-weight: 500;
        }

        .channel-desc {
          font-size: 0.6rem;
          color: #6b7280;
        }

        .channel-arrow {
          font-size: 0.6rem;
          color: #6b7280;
        }

        /* Channel Picker */
        .channel-picker {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .channel-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .channel-option:hover {
          background: rgba(0, 255, 200, 0.1);
          border-color: rgba(0, 255, 200, 0.3);
        }

        .channel-option.active {
          background: rgba(0, 255, 200, 0.15);
          border-color: rgba(0, 255, 200, 0.5);
        }

        .option-icon {
          font-size: 1rem;
        }

        .option-info {
          display: flex;
          flex-direction: column;
        }

        .option-name {
          font-size: 0.7rem;
          color: #e8eaed;
        }

        .option-desc {
          font-size: 0.55rem;
          color: #6b7280;
        }

        .channel-option.active .option-name {
          color: #00ffc8;
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
