"use client";

import React from 'react';

interface ContentFinderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelect?: (content: any) => void;
  feedId?: string;
  children?: React.ReactNode;
}

export function ContentFinderModal({ isOpen, onClose, onSelect, feedId, children }: ContentFinderModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="content-finder-modal-overlay"
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
        className="content-finder-modal-content"
        style={{
          background: '#1a1a2e',
          border: '1px solid #00ffc8',
          borderRadius: '8px',
          padding: '2rem',
          minWidth: '500px',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#00ffc8', marginBottom: '1rem' }}>
          Content Finder
        </h2>
        <p style={{ color: '#888', marginBottom: '1rem' }}>
          Search and discover content for your feed
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search content..."
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#0a0a0f',
              border: '1px solid #333',
              color: '#fff',
              borderRadius: '4px',
            }}
          />
        </div>

        {children}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid #666',
              color: '#888',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContentFinderModal;
