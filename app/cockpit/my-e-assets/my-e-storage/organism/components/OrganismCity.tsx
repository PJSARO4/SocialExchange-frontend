'use client';

import { useOrganism } from '@/app/context/OrganismContext';
import OrganismAvatar from './OrganismAvatar';

// ============================================
// THE GRID — SYN's City
// Bottom-left of E-Storage, ~180x90px SVG cityscape
// ============================================

export default function OrganismCity() {
  const { mood, togglePanel, tasks } = useOrganism();

  const isWorking = mood === 'working' || tasks.some((t) => t.status === 'running');
  const windowBaseOpacity = isWorking ? 0.7 : 0.15;

  return (
    <div
      className="organism-city-container"
      onClick={togglePanel}
      title={"SYN's Grid \u2014 Click to interact"}
      style={{ position: 'relative' }}
    >
      <svg
        width="180"
        height="90"
        viewBox="0 0 180 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground line */}
        <line
          x1="5"
          y1="78"
          x2="175"
          y2="78"
          stroke="rgba(63, 255, 220, 0.2)"
          strokeWidth="1"
        />

        {/* Building 1 — short left */}
        <rect x="12" y="55" width="18" height="23" rx="1" fill="#0c1322" stroke="rgba(63, 255, 220, 0.1)" strokeWidth="0.5" />
        <rect x="16" y="59" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 3s ease-in-out infinite 0.2s' }} />
        <rect x="22" y="59" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 4s ease-in-out infinite 1.1s' }} />
        <rect x="16" y="66" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 3.5s ease-in-out infinite 0.7s' }} />
        <rect x="22" y="66" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 2.8s ease-in-out infinite 1.5s' }} />

        {/* Building 2 — medium */}
        <rect x="35" y="40" width="22" height="38" rx="1" fill="#0c1322" stroke="rgba(63, 255, 220, 0.1)" strokeWidth="0.5" />
        <rect x="39" y="44" width="3" height="3" fill="#a78bfa" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 2.5s ease-in-out infinite 0.5s' }} />
        <rect x="49" y="44" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 3.2s ease-in-out infinite 0.3s' }} />
        <rect x="39" y="52" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 4s ease-in-out infinite 1.8s' }} />
        <rect x="49" y="52" width="3" height="3" fill="#a78bfa" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 3s ease-in-out infinite 0.9s' }} />
        <rect x="39" y="60" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 3.8s ease-in-out infinite 2.1s' }} />
        <rect x="49" y="60" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 2.7s ease-in-out infinite 1.3s' }} />

        {/* Building 3 — tallest (center, antenna here) */}
        <rect x="62" y="22" width="26" height="56" rx="1" fill="#0c1322" stroke="rgba(63, 255, 220, 0.12)" strokeWidth="0.5" />
        <rect x="67" y="27" width="3" height="3" fill="#a78bfa" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 3s ease-in-out infinite 0.4s' }} />
        <rect x="79" y="27" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 2.5s ease-in-out infinite 1.7s' }} />
        <rect x="67" y="36" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 4.2s ease-in-out infinite 0.8s' }} />
        <rect x="79" y="36" width="3" height="3" fill="#a78bfa" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 3.5s ease-in-out infinite 2.3s' }} />
        <rect x="67" y="45" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 2.8s ease-in-out infinite 1.2s' }} />
        <rect x="79" y="45" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 3.7s ease-in-out infinite 0.6s' }} />
        <rect x="67" y="54" width="3" height="3" fill="#a78bfa" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 3.3s ease-in-out infinite 1.9s' }} />
        <rect x="79" y="54" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 4.5s ease-in-out infinite 0.1s' }} />

        {/* Antenna on tallest building */}
        <line x1="75" y1="22" x2="75" y2="12" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="1" />
        <circle
          cx="75"
          cy="10"
          r="3"
          fill="none"
          stroke="rgba(167, 139, 250, 0.4)"
          strokeWidth="0.7"
          style={{ animation: 'antennaSpin 8s linear infinite', transformOrigin: '75px 10px' }}
        />
        <circle cx="75" cy="10" r="1" fill="#a78bfa" opacity="0.8" />

        {/* Building 4 — medium-short */}
        <rect x="94" y="48" width="20" height="30" rx="1" fill="#0c1322" stroke="rgba(63, 255, 220, 0.1)" strokeWidth="0.5" />
        <rect x="98" y="52" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 3.1s ease-in-out infinite 1.4s' }} />
        <rect x="107" y="52" width="3" height="3" fill="#a78bfa" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 2.9s ease-in-out infinite 0.7s' }} />
        <rect x="98" y="60" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 4.1s ease-in-out infinite 2.0s' }} />
        <rect x="107" y="60" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 3.6s ease-in-out infinite 1.6s' }} />

        {/* Building 5 — tall right */}
        <rect x="120" y="35" width="20" height="43" rx="1" fill="#0c1322" stroke="rgba(63, 255, 220, 0.1)" strokeWidth="0.5" />
        <rect x="124" y="39" width="3" height="3" fill="#a78bfa" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 2.6s ease-in-out infinite 0.9s' }} />
        <rect x="133" y="39" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 3.4s ease-in-out infinite 1.1s' }} />
        <rect x="124" y="48" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 3.9s ease-in-out infinite 2.2s' }} />
        <rect x="133" y="48" width="3" height="3" fill="#a78bfa" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 2.4s ease-in-out infinite 0.3s' }} />
        <rect x="124" y="57" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 3.2s ease-in-out infinite 1.5s' }} />

        {/* Building 6 — short right */}
        <rect x="146" y="58" width="16" height="20" rx="1" fill="#0c1322" stroke="rgba(63, 255, 220, 0.1)" strokeWidth="0.5" />
        <rect x="150" y="62" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 4.3s ease-in-out infinite 0.6s' }} />
        <rect x="156" y="62" width="3" height="3" fill="#a78bfa" opacity={windowBaseOpacity} style={{ animation: 'windowFlickerAlt 3.0s ease-in-out infinite 2.5s' }} />
        <rect x="150" y="69" width="3" height="3" fill="#3fffdc" opacity={windowBaseOpacity} style={{ animation: 'windowFlicker 2.7s ease-in-out infinite 1.8s' }} />

        {/* Data streams */}
        <circle cx="30" cy="50" r="1.5" fill="#3fffdc" opacity="0.3" style={{ animation: `dataStream${isWorking ? 'Fast' : ''} ${isWorking ? '1.5' : '3'}s linear infinite 0s` }} />
        <circle cx="58" cy="38" r="1.5" fill="#a78bfa" opacity="0.3" style={{ animation: `dataStream${isWorking ? 'Fast' : ''} ${isWorking ? '1.2' : '2.5'}s linear infinite 0.8s` }} />
        <circle cx="110" cy="42" r="1.5" fill="#3fffdc" opacity="0.3" style={{ animation: `dataStream${isWorking ? 'Fast' : ''} ${isWorking ? '1.8' : '3.5'}s linear infinite 1.3s` }} />
        <circle cx="145" cy="52" r="1.5" fill="#a78bfa" opacity="0.3" style={{ animation: `dataStream${isWorking ? 'Fast' : ''} ${isWorking ? '1.4' : '2.8'}s linear infinite 0.5s` }} />
      </svg>

      {/* SYN orb sitting on top of the tallest building */}
      <div
        style={{
          position: 'absolute',
          left: '63px',
          top: '2px',
          zIndex: 10,
        }}
      >
        <OrganismAvatar mood={mood} size="sm" />
      </div>

      {/* Label */}
      <span className="organism-city-label">THE GRID</span>
    </div>
  );
}
