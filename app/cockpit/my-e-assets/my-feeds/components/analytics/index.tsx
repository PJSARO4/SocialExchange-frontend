"use client";

import React from 'react';
import { Feed } from '../../types/feed';

interface AnalyticsModalProps {
  feed: Feed;
  isOpen?: boolean;
  onClose: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ feed, isOpen = true, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="analytics-modal-overlay"
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
        className="analytics-modal-content"
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
          Feed Analytics
        </h2>
        <p style={{ color: '#888', marginBottom: '1rem' }}>
          @{feed.handle} · {feed.platform}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ background: '#0a0a0f', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#00ffc8', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {feed.metrics?.followers?.toLocaleString() || '0'}
            </div>
            <div style={{ color: '#666', fontSize: '0.875rem' }}>Followers</div>
          </div>
          <div style={{ background: '#0a0a0f', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#00ffc8', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {feed.metrics?.engagement || '0'}%
            </div>
            <div style={{ color: '#666', fontSize: '0.875rem' }}>Engagement</div>
          </div>
          <div style={{ background: '#0a0a0f', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#00ffc8', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {feed.metrics?.totalPosts || '0'}
            </div>
            <div style={{ color: '#666', fontSize: '0.875rem' }}>Posts</div>
          </div>
        </div>

        <div style={{ color: '#666', padding: '2rem', textAlign: 'center', border: '1px dashed #333', borderRadius: '8px' }}>
          Detailed analytics charts will appear here
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: '1.5rem',
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid #00ffc8',
            color: '#00ffc8',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AnalyticsModal;
