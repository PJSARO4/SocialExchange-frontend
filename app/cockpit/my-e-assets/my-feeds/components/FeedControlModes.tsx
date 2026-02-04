'use client';

import { useState } from 'react';
import type { Feed } from '../types';

type Mode = 'autopilot' | 'escrow' | 'manual' | 'observation';

export default function FeedControlModes({ feed }: { feed: Feed }) {
  const [mode, setMode] = useState<Mode>('manual');

  return (
    <div className="feed-control-modes">
      <h3>CONTROL MODE</h3>

      {(['autopilot', 'escrow', 'manual', 'observation'] as Mode[]).map(m => (
        <button
          key={m}
          className={mode === m ? 'active' : ''}
          onClick={() => setMode(m)}
        >
          {m.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
