'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Play, Volume2, VolumeX, Radio } from 'lucide-react';
import { useAmbientAudio } from '@/lib/audio/useAmbientAudio';

const WELCOME_VIDEO_SEEN_KEY = 'se-welcome-video-seen';
const VIDEO_SRC = '/videos/welcome.mp4';

function hasSeenWelcomeVideo(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(WELCOME_VIDEO_SEEN_KEY) === 'true';
}

function markWelcomeVideoSeen() {
  localStorage.setItem(WELCOME_VIDEO_SEEN_KEY, 'true');
}

type Phase = 'prompt' | 'video';

export default function WelcomeVideoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('prompt');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientAudio = useAmbientAudio();
  const wasPlayingRef = useRef(false);

  // Check if video file exists and if user hasn't seen it
  useEffect(() => {
    if (hasSeenWelcomeVideo()) return;

    fetch(VIDEO_SRC, { method: 'HEAD' })
      .then(res => {
        if (res.ok) {
          setHasVideo(true);
          setTimeout(() => {
            // Remember if ambient audio was playing, then pause it
            wasPlayingRef.current = ambientAudio.isPlaying;
            if (ambientAudio.isPlaying) {
              ambientAudio.pause();
            }
            setIsOpen(true);
            requestAnimationFrame(() => setFadeIn(true));
          }, 1500);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    setFadeIn(false);
    setTimeout(() => {
      setIsOpen(false);
      markWelcomeVideoSeen();
      if (videoRef.current) videoRef.current.pause();
      // Resume ambient audio if it was playing before the transmission
      if (wasPlayingRef.current) {
        ambientAudio.play();
        wasPlayingRef.current = false;
      }
    }, 300);
  }, [ambientAudio]);

  const handleAccept = useCallback(() => {
    setPhase('video');
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 400);
  }, []);

  const handleDeny = useCallback(() => {
    handleClose();
  }, [handleClose]);

  const handlePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(pct);
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    setProgress(100);
    setTimeout(() => handleClose(), 2000);
  }, [handleClose]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  if (!isOpen || !hasVideo) return null;

  return (
    <div
      className={`wv-overlay ${fadeIn ? 'wv-visible' : ''}`}
      onClick={handleClose}
    >
      <div className={`wv-modal ${phase === 'video' ? 'wv-expanded' : 'wv-compact'}`} onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button className="wv-close" onClick={handleClose} aria-label="Close">
          <X size={18} strokeWidth={1.5} />
        </button>

        {phase === 'prompt' ? (
          /* ═══ PHASE 1: Transmission Prompt ═══ */
          <div className="wv-prompt">
            <div className="wv-signal-ring">
              <div className="wv-signal-core">
                <Radio size={28} strokeWidth={1.5} />
              </div>
            </div>

            <div className="wv-prompt-badge">INCOMING</div>
            <h2 className="wv-prompt-title">NEW TRANSMISSION AVAILABLE</h2>
            <p className="wv-prompt-sub">A message from Social Exchange Command</p>

            <div className="wv-prompt-actions">
              <button className="wv-btn-accept" onClick={handleAccept}>
                ACCEPT
              </button>
              <button className="wv-btn-deny" onClick={handleDeny}>
                DENY
              </button>
            </div>
          </div>
        ) : (
          /* ═══ PHASE 2: Video Playback ═══ */
          <>
            <div className="wv-header">
              <span className="wv-badge">TRANSMISSION PLAYBACK</span>
            </div>

            <div className="wv-video-wrap">
              <video
                ref={videoRef}
                src={VIDEO_SRC}
                className="wv-video"
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
                onClick={handlePlay}
              />

              {!isPlaying && (
                <button className="wv-play-overlay" onClick={handlePlay}>
                  <div className="wv-play-btn">
                    <Play size={32} strokeWidth={1.5} fill="currentColor" />
                  </div>
                </button>
              )}
            </div>

            <div className="wv-controls">
              <button className="wv-ctrl-btn" onClick={handlePlay}>
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="2" width="4" height="12" rx="1" />
                    <rect x="9" y="2" width="4" height="12" rx="1" />
                  </svg>
                ) : (
                  <Play size={16} strokeWidth={1.5} fill="currentColor" />
                )}
              </button>

              <div className="wv-progress" onClick={handleProgressClick}>
                <div className="wv-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <button className="wv-ctrl-btn" onClick={handleMute}>
                {isMuted ? <VolumeX size={16} strokeWidth={1.5} /> : <Volume2 size={16} strokeWidth={1.5} />}
              </button>
            </div>

            <button className="wv-skip" onClick={handleClose}>
              Close & explore the platform
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        .wv-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0);
          backdrop-filter: blur(0px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 20px;
        }

        .wv-overlay.wv-visible {
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
        }

        .wv-modal {
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          transform: scale(0.9) translateY(20px);
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .wv-visible .wv-modal {
          transform: scale(1) translateY(0);
          opacity: 1;
        }

        .wv-compact {
          max-width: 420px;
        }

        .wv-expanded {
          max-width: 640px;
        }

        /* Dark mode (default) */
        .wv-modal {
          background: linear-gradient(180deg, #0a1628 0%, #0d1f35 100%);
          border: 1px solid rgba(0, 255, 200, 0.12);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 255, 200, 0.05);
        }

        :global([data-theme="light"]) .wv-modal {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.15);
        }

        .wv-close {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.4);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wv-close:hover {
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        :global([data-theme="light"]) .wv-close {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.5);
        }

        :global([data-theme="light"]) .wv-close:hover {
          background: rgba(0, 0, 0, 0.1);
          color: #000;
        }

        /* ═══ PROMPT PHASE ═══ */
        .wv-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 32px 32px;
          text-align: center;
        }

        .wv-signal-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 24px;
          animation: wv-pulse-ring 2s ease-in-out infinite;
        }

        .wv-signal-ring::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px solid rgba(0, 255, 200, 0.2);
          animation: wv-ring-expand 2s ease-out infinite;
        }

        .wv-signal-ring::after {
          content: '';
          position: absolute;
          inset: -16px;
          border-radius: 50%;
          border: 1px solid rgba(0, 255, 200, 0.1);
          animation: wv-ring-expand 2s ease-out 0.5s infinite;
        }

        .wv-signal-core {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(0, 255, 200, 0.1);
          border: 1px solid rgba(0, 255, 200, 0.3);
          color: #00ffc8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        :global([data-theme="light"]) .wv-signal-core {
          background: rgba(5, 150, 105, 0.08);
          border-color: rgba(5, 150, 105, 0.3);
          color: #059669;
        }

        :global([data-theme="light"]) .wv-signal-ring::before {
          border-color: rgba(5, 150, 105, 0.2);
        }

        :global([data-theme="light"]) .wv-signal-ring::after {
          border-color: rgba(5, 150, 105, 0.1);
        }

        @keyframes wv-pulse-ring {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes wv-ring-expand {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .wv-prompt-badge {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #00ffc8;
          padding: 4px 14px;
          border-radius: 20px;
          border: 1px solid rgba(0, 255, 200, 0.2);
          background: rgba(0, 255, 200, 0.06);
          margin-bottom: 16px;
        }

        :global([data-theme="light"]) .wv-prompt-badge {
          color: #059669;
          border-color: rgba(5, 150, 105, 0.25);
          background: rgba(5, 150, 105, 0.06);
        }

        .wv-prompt-title {
          font-family: var(--font-display, var(--font-mono, monospace));
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #fff;
          margin: 0 0 8px;
        }

        :global([data-theme="light"]) .wv-prompt-title {
          color: #111827;
        }

        .wv-prompt-sub {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
          letter-spacing: 0.04em;
          margin: 0 0 28px;
        }

        :global([data-theme="light"]) .wv-prompt-sub {
          color: #6b7280;
        }

        .wv-prompt-actions {
          display: flex;
          gap: 12px;
          width: 100%;
          max-width: 300px;
        }

        .wv-btn-accept {
          flex: 1;
          padding: 12px 20px;
          border-radius: 8px;
          border: 1px solid rgba(0, 255, 200, 0.4);
          background: rgba(0, 255, 200, 0.12);
          color: #00ffc8;
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wv-btn-accept:hover {
          background: rgba(0, 255, 200, 0.2);
          border-color: rgba(0, 255, 200, 0.6);
          box-shadow: 0 0 20px rgba(0, 255, 200, 0.15);
        }

        :global([data-theme="light"]) .wv-btn-accept {
          border-color: rgba(5, 150, 105, 0.4);
          background: rgba(5, 150, 105, 0.1);
          color: #059669;
        }

        :global([data-theme="light"]) .wv-btn-accept:hover {
          background: rgba(5, 150, 105, 0.18);
          border-color: rgba(5, 150, 105, 0.6);
          box-shadow: 0 0 20px rgba(5, 150, 105, 0.12);
        }

        .wv-btn-deny {
          flex: 1;
          padding: 12px 20px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.4);
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wv-btn-deny:hover {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
        }

        :global([data-theme="light"]) .wv-btn-deny {
          border-color: rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.03);
          color: rgba(0, 0, 0, 0.4);
        }

        :global([data-theme="light"]) .wv-btn-deny:hover {
          background: rgba(0, 0, 0, 0.06);
          color: rgba(0, 0, 0, 0.6);
        }

        /* ═══ VIDEO PHASE ═══ */
        .wv-header {
          padding: 16px 20px 12px;
          text-align: center;
        }

        .wv-badge {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          letter-spacing: 0.15em;
          color: #00ffc8;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid rgba(0, 255, 200, 0.2);
          background: rgba(0, 255, 200, 0.06);
        }

        :global([data-theme="light"]) .wv-badge {
          color: #059669;
          border-color: rgba(5, 150, 105, 0.25);
          background: rgba(5, 150, 105, 0.08);
        }

        .wv-video-wrap {
          position: relative;
          aspect-ratio: 16 / 9;
          margin: 0 16px;
          border-radius: 10px;
          overflow: hidden;
          background: #000;
          cursor: pointer;
        }

        .wv-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .wv-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.35);
          border: none;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .wv-play-overlay:hover {
          background: rgba(0, 0, 0, 0.25);
        }

        .wv-play-btn {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(0, 255, 200, 0.15);
          border: 2px solid rgba(0, 255, 200, 0.4);
          color: #00ffc8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-left: 4px;
          transition: all 0.3s ease;
        }

        .wv-play-overlay:hover .wv-play-btn {
          background: rgba(0, 255, 200, 0.25);
          border-color: rgba(0, 255, 200, 0.6);
          transform: scale(1.08);
        }

        .wv-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
        }

        .wv-ctrl-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .wv-ctrl-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #00ffc8;
        }

        :global([data-theme="light"]) .wv-ctrl-btn {
          border-color: rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.04);
          color: rgba(0, 0, 0, 0.5);
        }

        :global([data-theme="light"]) .wv-ctrl-btn:hover {
          background: rgba(0, 0, 0, 0.08);
          color: #059669;
        }

        .wv-progress {
          flex: 1;
          height: 4px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.08);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        :global([data-theme="light"]) .wv-progress {
          background: rgba(0, 0, 0, 0.08);
        }

        .wv-progress-fill {
          height: 100%;
          border-radius: 2px;
          background: #00ffc8;
          transition: width 0.1s linear;
        }

        :global([data-theme="light"]) .wv-progress-fill {
          background: #059669;
        }

        .wv-skip {
          display: block;
          width: 100%;
          padding: 14px;
          border: none;
          background: none;
          color: rgba(255, 255, 255, 0.35);
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: color 0.2s ease;
          text-align: center;
        }

        .wv-skip:hover {
          color: rgba(255, 255, 255, 0.6);
        }

        :global([data-theme="light"]) .wv-skip {
          color: rgba(0, 0, 0, 0.3);
        }

        :global([data-theme="light"]) .wv-skip:hover {
          color: rgba(0, 0, 0, 0.5);
        }

        @media (max-width: 640px) {
          .wv-modal {
            max-width: 100%;
            border-radius: 12px;
          }
          .wv-prompt {
            padding: 32px 24px 28px;
          }
          .wv-prompt-title {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  );
}
