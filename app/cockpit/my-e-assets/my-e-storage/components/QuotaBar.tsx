'use client';

import { useEffect } from 'react';
import { useEStorage } from '@/app/context/EStorageContext';
import { formatBytes } from '../lib/thumbnail-utils';

// ============================================
// STORAGE QUOTA BAR
// ============================================

interface QuotaBarProps {
  compact?: boolean;
}

export default function QuotaBar({ compact = false }: QuotaBarProps) {
  const { stats, refreshStats, items } = useEStorage();

  useEffect(() => {
    refreshStats();
  }, [refreshStats, items.length]);

  if (!stats) {
    return null;
  }

  const usedPercent = Math.min(stats.usedPercent, 100);
  const barColor =
    usedPercent > 80 ? '#ef4444' : usedPercent > 50 ? '#f59e0b' : '#3fffdc';

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.6875rem',
          color: '#6b7280',
        }}
      >
        <div
          style={{
            flex: 1,
            height: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
            maxWidth: '80px',
          }}
        >
          <div
            style={{
              width: `${usedPercent}%`,
              height: '100%',
              background: barColor,
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span>
          {stats.totalItems} items &middot;{' '}
          {formatBytes(stats.totalSizeBytes)}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Device Storage
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            color: '#9ca3af',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {formatBytes(stats.totalSizeBytes)}
          {stats.quotaBytes > 0 && ` / ${formatBytes(stats.quotaBytes)}`}
        </span>
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '0.75rem',
        }}
      >
        <div
          style={{
            width: `${usedPercent}%`,
            height: '100%',
            background: barColor,
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
          <span
            style={{
              color: '#fff',
              fontWeight: '600',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {stats.totalItems}
          </span>{' '}
          items
        </div>
        {stats.byType.image > 0 && (
          <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
            {'🖼'} {stats.byType.image}
          </div>
        )}
        {stats.byType.video > 0 && (
          <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
            {'🎬'} {stats.byType.video}
          </div>
        )}
        {stats.byType.audio > 0 && (
          <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
            {'🎵'} {stats.byType.audio}
          </div>
        )}
        {stats.byType.document > 0 && (
          <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
            {'📄'} {stats.byType.document}
          </div>
        )}
        {usedPercent > 80 && (
          <div
            style={{
              fontSize: '0.6875rem',
              color: '#ef4444',
              fontWeight: '600',
            }}
          >
            {'⚠'} Storage nearly full
          </div>
        )}
      </div>
    </div>
  );
}
