"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getAmbientAudio } from '@/lib/audio/AmbientAudioEngine';

interface AudioControlProps {
  className?: string;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  showMood?: boolean;
  compact?: boolean;
}

export default function AudioControl({
  className = '',
  position = 'bottom-right',
  showMood = false,
  compact = false
}: AudioControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if audio is already playing
    const audio = getAmbientAudio();
    setIsPlaying(audio.getIsPlaying());
  }, []);

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

  const positionClasses: Record<string, string> = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 ${className}`}
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
    >
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-3 py-2 transition-all duration-300 hover:border-cyan-400/50">
        {/* Volume Slider - shows on hover */}
        {showVolumeSlider && !compact && (
          <div className="flex items-center gap-2 pr-2 border-r border-cyan-500/20">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 appearance-none bg-cyan-900/50 rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,255,255,0.5)]
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
            />
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={toggleAudio}
          className="flex items-center gap-2 text-sm font-mono transition-colors duration-200"
          aria-label={isPlaying ? 'Mute ambient audio' : 'Play ambient audio'}
        >
          {isPlaying ? (
            <>
              <span className="text-cyan-400 animate-pulse">🔊</span>
              {!compact && <span className="text-cyan-300/80 text-xs">AMBIENT</span>}
            </>
          ) : (
            <>
              <span className="text-gray-500">🔇</span>
              {!compact && <span className="text-gray-500 text-xs">MUTED</span>}
            </>
          )}
        </button>
      </div>

      {/* Audio visualization bars when playing */}
      {isPlaying && !compact && (
        <div className="absolute -top-1 right-1 flex gap-0.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-0.5 bg-cyan-400/60 rounded-full animate-pulse"
              style={{
                height: `${4 + Math.random() * 8}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.5 + Math.random() * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
