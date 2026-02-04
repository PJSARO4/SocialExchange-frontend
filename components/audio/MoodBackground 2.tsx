'use client';

import { useEffect, useState } from 'react';
import { useAmbientAudio } from '@/lib/audio/useAmbientAudio';
import type { AmbientMood } from '@/lib/audio/AmbientAudioEngine';

// Color schemes for each mood - subtle background gradients
const MOOD_COLORS: Record<AmbientMood, { primary: string; secondary: string; accent: string }> = {
  // Calm / Ambient - cool blues and purples
  entrance: {
    primary: 'rgba(20, 30, 48, 0.95)',
    secondary: 'rgba(36, 59, 85, 0.4)',
    accent: 'rgba(63, 255, 220, 0.05)',
  },
  peaceful: {
    primary: 'rgba(15, 25, 35, 0.95)',
    secondary: 'rgba(30, 50, 70, 0.3)',
    accent: 'rgba(100, 200, 255, 0.03)',
  },
  deepspace: {
    primary: 'rgba(5, 8, 15, 0.98)',
    secondary: 'rgba(10, 20, 40, 0.5)',
    accent: 'rgba(80, 100, 200, 0.04)',
  },
  nebula: {
    primary: 'rgba(20, 15, 35, 0.95)',
    secondary: 'rgba(60, 30, 80, 0.3)',
    accent: 'rgba(200, 100, 255, 0.05)',
  },
  cruise: {
    primary: 'rgba(10, 20, 30, 0.95)',
    secondary: 'rgba(20, 50, 80, 0.3)',
    accent: 'rgba(63, 255, 220, 0.04)',
  },

  // Medium Energy - balanced tones
  command: {
    primary: 'rgba(12, 18, 25, 0.95)',
    secondary: 'rgba(25, 40, 55, 0.35)',
    accent: 'rgba(63, 255, 220, 0.06)',
  },
  feeds: {
    primary: 'rgba(15, 22, 30, 0.95)',
    secondary: 'rgba(30, 55, 70, 0.3)',
    accent: 'rgba(63, 200, 180, 0.05)',
  },
  comms: {
    primary: 'rgba(12, 18, 28, 0.95)',
    secondary: 'rgba(25, 45, 65, 0.3)',
    accent: 'rgba(100, 180, 255, 0.04)',
  },
  exploration: {
    primary: 'rgba(15, 20, 35, 0.95)',
    secondary: 'rgba(40, 60, 100, 0.3)',
    accent: 'rgba(150, 200, 255, 0.05)',
  },
  station: {
    primary: 'rgba(18, 22, 28, 0.95)',
    secondary: 'rgba(35, 45, 55, 0.35)',
    accent: 'rgba(200, 180, 150, 0.04)',
  },
  transition: {
    primary: 'rgba(15, 20, 30, 0.95)',
    secondary: 'rgba(40, 60, 80, 0.3)',
    accent: 'rgba(63, 255, 220, 0.08)',
  },

  // High Energy - warmer, more vibrant
  market: {
    primary: 'rgba(18, 20, 25, 0.95)',
    secondary: 'rgba(50, 40, 30, 0.25)',
    accent: 'rgba(255, 200, 100, 0.06)',
  },
  alert: {
    primary: 'rgba(20, 18, 22, 0.95)',
    secondary: 'rgba(60, 40, 30, 0.3)',
    accent: 'rgba(255, 180, 80, 0.08)',
  },
  hyperspace: {
    primary: 'rgba(15, 18, 30, 0.95)',
    secondary: 'rgba(40, 50, 100, 0.35)',
    accent: 'rgba(100, 150, 255, 0.08)',
  },
  warpcore: {
    primary: 'rgba(20, 18, 25, 0.95)',
    secondary: 'rgba(50, 35, 60, 0.3)',
    accent: 'rgba(180, 100, 255, 0.06)',
  },
  pulse: {
    primary: 'rgba(22, 18, 25, 0.95)',
    secondary: 'rgba(60, 30, 50, 0.3)',
    accent: 'rgba(255, 100, 150, 0.07)',
  },
  datastream: {
    primary: 'rgba(12, 20, 28, 0.95)',
    secondary: 'rgba(20, 60, 80, 0.35)',
    accent: 'rgba(0, 255, 200, 0.08)',
  },
  cyberspace: {
    primary: 'rgba(15, 15, 25, 0.95)',
    secondary: 'rgba(40, 30, 80, 0.35)',
    accent: 'rgba(150, 50, 255, 0.08)',
  },
  battlestation: {
    primary: 'rgba(25, 18, 18, 0.95)',
    secondary: 'rgba(70, 30, 30, 0.3)',
    accent: 'rgba(255, 100, 50, 0.1)',
  },

  // Intense / Suspense - deep reds, dark tones
  incoming: {
    primary: 'rgba(25, 15, 18, 0.95)',
    secondary: 'rgba(60, 25, 30, 0.35)',
    accent: 'rgba(255, 150, 100, 0.08)',
  },
  pursuit: {
    primary: 'rgba(28, 15, 15, 0.95)',
    secondary: 'rgba(80, 25, 25, 0.35)',
    accent: 'rgba(255, 80, 50, 0.1)',
  },
  redzone: {
    primary: 'rgba(30, 12, 12, 0.95)',
    secondary: 'rgba(100, 20, 20, 0.4)',
    accent: 'rgba(255, 50, 50, 0.12)',
  },
  dread: {
    primary: 'rgba(12, 10, 15, 0.98)',
    secondary: 'rgba(30, 20, 40, 0.4)',
    accent: 'rgba(100, 50, 150, 0.06)',
  },
  darkcore: {
    primary: 'rgba(8, 8, 12, 0.98)',
    secondary: 'rgba(20, 15, 30, 0.5)',
    accent: 'rgba(80, 40, 120, 0.05)',
  },
};

export default function MoodBackground() {
  const { currentMood, isPlaying } = useAmbientAudio();
  const [colors, setColors] = useState(MOOD_COLORS.command);

  useEffect(() => {
    if (isPlaying && MOOD_COLORS[currentMood]) {
      setColors(MOOD_COLORS[currentMood]);
    } else {
      // Default when not playing
      setColors(MOOD_COLORS.command);
    }
  }, [currentMood, isPlaying]);

  return (
    <div
      className="mood-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        pointerEvents: 'none',
        transition: 'all 2s ease-in-out',
        background: `
          radial-gradient(ellipse at 20% 20%, ${colors.secondary} 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, ${colors.accent} 0%, transparent 40%),
          radial-gradient(ellipse at 50% 50%, ${colors.secondary} 0%, transparent 60%),
          ${colors.primary}
        `,
      }}
    >
      {/* Animated accent orb */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '70%',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          opacity: isPlaying ? 1 : 0.3,
          transition: 'all 3s ease-in-out',
          animation: isPlaying ? 'float 20s ease-in-out infinite' : 'none',
        }}
      />
      {/* Secondary orb */}
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: '30vw',
          height: '30vw',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
          filter: 'blur(80px)',
          opacity: isPlaying ? 0.8 : 0.2,
          transition: 'all 3s ease-in-out',
          animation: isPlaying ? 'float 25s ease-in-out infinite reverse' : 'none',
        }}
      />
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(5%, -5%) scale(1.05);
          }
          50% {
            transform: translate(-3%, 3%) scale(0.95);
          }
          75% {
            transform: translate(-5%, -3%) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}
