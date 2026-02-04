"use client";

import React from 'react';

interface IdleCruiseProps {
  onExit: () => void;
}

export default function IdleCruise({ onExit }: IdleCruiseProps) {
  return (
    <div
      className="idle-cruise-overlay"
      onClick={onExit}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 9999,
      }}
    >
      <div style={{ textAlign: 'center', color: '#00ffc8' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          IDLE MODE
        </div>
        <div style={{ opacity: 0.6 }}>
          Click anywhere to resume
        </div>
      </div>
    </div>
  );
}
