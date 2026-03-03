'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEStorage } from '@/app/context/EStorageContext';
import type { EStorageItemMeta } from '../types/e-storage';
import { getTypeIcon, formatBytes } from '../lib/thumbnail-utils';

// ============================================
// STORAGE ITEM CARD
// ============================================

interface StorageItemCardProps {
  item: EStorageItemMeta;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (item: EStorageItemMeta) => void;
  viewMode?: 'grid' | 'list';
}

export default function StorageItemCard({
  item,
  selected = false,
  onSelect,
  onOpen,
  viewMode = 'grid',
}: StorageItemCardProps) {
  const { getThumbnailUrl, getBlobUrl, removeItem, exportItem } =
    useEStorage();
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  // Load thumbnail on mount, revoke on unmount
  useEffect(() => {
    let url: string | null = null;

    if (item.thumbnailBlobKey) {
      getThumbnailUrl(item.thumbnailBlobKey).then((u) => {
        url = u;
        setThumbUrl(u);
      });
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [item.thumbnailBlobKey, getThumbnailUrl]);

  const handleDownload = useCallback(async () => {
    const file = await exportItem(item.id);
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [item, exportItem]);

  const handleDelete = useCallback(async () => {
    await removeItem(item.id);
  }, [item.id, removeItem]);

  const handleOpen = useCallback(async () => {
    if (onOpen) {
      onOpen(item);
      return;
    }
    // Fallback: open blob in new tab
    const url = await getBlobUrl(item.blobKey);
    if (url) window.open(url, '_blank');
  }, [item, onOpen, getBlobUrl]);

  const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // ============================================
  // LIST VIEW
  // ============================================

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onSelect?.(item.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.625rem 1rem',
          background: selected
            ? 'rgba(63, 255, 220, 0.08)'
            : 'rgba(255, 255, 255, 0.02)',
          border: selected
            ? '1px solid rgba(63, 255, 220, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!selected)
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          if (!selected)
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
        }}
      >
        {/* Thumbnail / Icon */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={item.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '1.25rem' }}>{getTypeIcon(item.type)}</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: '500',
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </div>
          <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
            {item.type.toUpperCase()} &middot; {formatBytes(item.fileSize)} &middot;{' '}
            {formattedDate}
          </div>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.625rem',
                  padding: '0.125rem 0.375rem',
                  background: 'rgba(63, 255, 220, 0.1)',
                  borderRadius: '3px',
                  color: '#3fffdc',
                  textTransform: 'uppercase',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
            style={{
              padding: '0.25rem 0.5rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#9ca3af',
              fontSize: '0.6875rem',
              cursor: 'pointer',
            }}
            title="Open"
          >
            {'👁'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            style={{
              padding: '0.25rem 0.5rem',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#9ca3af',
              fontSize: '0.6875rem',
              cursor: 'pointer',
            }}
            title="Download"
          >
            {'⬇'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            style={{
              padding: '0.25rem 0.5rem',
              background: 'transparent',
              border: '1px solid rgba(255, 100, 100, 0.2)',
              borderRadius: '4px',
              color: '#f87171',
              fontSize: '0.6875rem',
              cursor: 'pointer',
            }}
            title="Delete"
          >
            {'✖'}
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // GRID VIEW (default)
  // ============================================

  return (
    <div
      onClick={() => onSelect?.(item.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        position: 'relative',
        borderRadius: '10px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.03)',
        border: selected
          ? '2px solid rgba(63, 255, 220, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Thumbnail Area */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '2.5rem', opacity: 0.5 }}>
            {getTypeIcon(item.type)}
          </span>
        )}
      </div>

      {/* Type Badge */}
      <div
        style={{
          position: 'absolute',
          top: '0.5rem',
          left: '0.5rem',
          padding: '0.125rem 0.375rem',
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '4px',
          fontSize: '0.625rem',
          color: '#3fffdc',
          textTransform: 'uppercase',
          fontWeight: '600',
          letterSpacing: '0.5px',
        }}
      >
        {item.type}
      </div>

      {/* Selection Indicator */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#3fffdc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            color: '#000',
            fontWeight: '700',
          }}
        >
          {'✓'}
        </div>
      )}

      {/* Action Buttons (hover) */}
      {showActions && (
        <div
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            display: 'flex',
            gap: '0.25rem',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: 'none',
              color: '#fff',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Open"
          >
            {'👁'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: 'none',
              color: '#fff',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Download"
          >
            {'⬇'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(200, 50, 50, 0.7)',
              border: 'none',
              color: '#fff',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Delete"
          >
            {'✖'}
          </button>
        </div>
      )}

      {/* Info Footer */}
      <div style={{ padding: '0.625rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: '500',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '0.25rem',
          }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: '0.625rem', color: '#6b7280' }}>
          {formatBytes(item.fileSize)} &middot; {formattedDate}
        </div>
        {item.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '0.25rem',
              marginTop: '0.375rem',
              flexWrap: 'wrap',
            }}
          >
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.5625rem',
                  padding: '0.0625rem 0.25rem',
                  background: 'rgba(63, 255, 220, 0.1)',
                  borderRadius: '3px',
                  color: '#3fffdc',
                  textTransform: 'uppercase',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
