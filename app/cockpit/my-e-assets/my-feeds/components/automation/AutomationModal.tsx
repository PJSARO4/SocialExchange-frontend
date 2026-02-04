"use client";

import React from 'react';

interface AutomationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  feedId?: string;
  children?: React.ReactNode;
}

export function AutomationModal({ isOpen, onClose, feedId, children }: AutomationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="automation-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="automation-modal-content"
        style={{
          background: '#1a1a2e',
          border: '1px solid #00ffc8',
          borderRadius: '8px',
          padding: '2rem',
          minWidth: '400px',
          maxWidth: '600px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#00ffc8', marginBottom: '1rem' }}>
          Feed Automation
        </h2>
        <p style={{ color: '#888', marginBottom: '1rem' }}>
          Automation settings for feed: {feedId || 'N/A'}
        </p>
        {children}
        <button
          onClick={onClose}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid #00ffc8',
            color: '#00ffc8',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default AutomationModal;
