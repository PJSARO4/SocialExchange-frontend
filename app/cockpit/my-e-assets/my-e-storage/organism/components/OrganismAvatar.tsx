'use client';

import type { OrganismMood } from '../types/organism';

// ============================================
// ORGANISM AVATAR — SVG Orb
// ============================================

interface OrganismAvatarProps {
  mood?: OrganismMood;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 32, md: 48, lg: 72 };

export default function OrganismAvatar({
  mood = 'idle',
  size = 'md',
}: OrganismAvatarProps) {
  const px = SIZES[size];
  const half = px / 2;
  const orbR = half * 0.6;
  const eyeR = orbR * 0.2;

  const glowColor =
    mood === 'alert'
      ? 'rgba(239, 68, 68, 0.6)'
      : mood === 'happy'
        ? 'rgba(63, 255, 220, 0.8)'
        : 'rgba(167, 139, 250, 0.5)';

  const orbFill =
    mood === 'alert'
      ? '#ef4444'
      : mood === 'happy'
        ? '#3fffdc'
        : '#a78bfa';

  const animationStyle: React.CSSProperties =
    mood === 'idle'
      ? { animation: 'orgoFloat 3s ease-in-out infinite' }
      : mood === 'thinking'
        ? { animation: 'orgoFloat 1.5s ease-in-out infinite' }
        : mood === 'working'
          ? { animation: 'orgoWork 1.2s ease-in-out infinite' }
          : mood === 'happy'
            ? { animation: 'orgoFloat 1s ease-in-out infinite' }
            : { animation: 'orbAlert 0.8s ease-in-out infinite' };

  return (
    <div style={{ width: px, height: px, ...animationStyle }}>
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
      >
        {/* Glow */}
        <defs>
          <radialGradient id={`orb-glow-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id={`orb-fill-${size}`} cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="100%" stopColor={orbFill} />
          </radialGradient>
        </defs>

        {/* Outer glow */}
        <circle cx={half} cy={half} r={half * 0.9} fill={`url(#orb-glow-${size})`} />

        {/* Ring (thinking) */}
        {mood === 'thinking' && (
          <circle
            cx={half}
            cy={half}
            r={orbR + 4}
            fill="none"
            stroke="rgba(167, 139, 250, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            style={{ animation: 'orgoThink 3s linear infinite', transformOrigin: 'center' }}
          />
        )}

        {/* Main orb */}
        <circle
          cx={half}
          cy={half}
          r={orbR}
          fill={`url(#orb-fill-${size})`}
          style={{
            filter: `drop-shadow(0 0 ${size === 'lg' ? 8 : 4}px ${glowColor})`,
          }}
        />

        {/* Eye */}
        <ellipse
          cx={half}
          cy={half - orbR * 0.1}
          rx={eyeR}
          ry={eyeR * 1.2}
          fill="#fff"
          opacity={0.9}
          style={{ animation: 'orgoBlink 4s ease-in-out infinite' }}
        />

        {/* Inner highlight */}
        <circle
          cx={half - orbR * 0.25}
          cy={half - orbR * 0.25}
          r={orbR * 0.15}
          fill="rgba(255, 255, 255, 0.4)"
        />
      </svg>
    </div>
  );
}
