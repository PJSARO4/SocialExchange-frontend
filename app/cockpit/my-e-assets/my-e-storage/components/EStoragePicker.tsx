'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEStorage } from '@/app/context/EStorageContext';
import type { EStorageItemMeta, StorageItemType } from '../types/e-storage';
import { getTypeIcon, formatBytes } from '../lib/thumbnail-utils';

// ============================================
// E-STORAGE PICKER MODAL
// Reusable modal for selecting items from E-Storage.
// Import this in LinkEx, content automation, etc.
// ============================================

interface EStoragePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: EStorageItemMeta[]) => void;
  multiple?: boolean;
  typeFilter?: StorageItemType[];
  maxItems?: number;
}

export default function EStoragePicker({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  typeFilter,
  maxItems,
}: EStoragePickerProps) {
  const { items, folders, getThumbnailUrl } = useEStorage();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set());
      setSearchTerm('');
      setActiveFolder(null);
    }
  }, [isOpen]);

  // Load thumbnails for visible items
  useEffect(() => {
    if (!isOpen) return;

    const loadThumbs = async () => {
      const urls: Record<string, string> = {};
      for (const item of items) {
        if (item.thumbnailBlobKey) {
          const url = await getThumbnailUrl(item.thumbnailBlobKey);
          if (url) urls[item.id] = url;
        }
      }
      setThumbUrls(urls);
    };

    loadThumbs();

    return () => {
      // Revoke all thumbnail URLs on close
      Object.values(thumbUrls).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, items.length]);

  // Filter items
  const filtered = items.filter((item) => {
    if (typeFilter && !typeFilter.includes(item.type)) return false;
    if (activeFolder && item.folder !== activeFolder) return false;
    if (
      searchTerm &&
      !item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.filename.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const toggleSelect = useCallback(
    (id: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (!multiple) next.clear();
          if (!maxItems || next.size < maxItems) {
            next.add(id);
          }
        }
        return next;
      });
    },
    [multiple, maxItems]
  );

  const handleConfirm = useCallback(() => {
    const selectedItems = items.filter((i) => selected.has(i.id));
    onSelect(selectedItems);
    onClose();
  }, [items, selected, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90vw',
          maxWidth: '720px',
          maxHeight: '80vh',
          background: '#111',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: 0,
            }}
          >
            SELECT FROM E-STORAGE
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            {'✕'}
          </button>
        </div>

        {/* Search + Folder Filter */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: '0.5rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.8125rem',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveFolder(null)}
              style={{
                padding: '0.375rem 0.625rem',
                background: !activeFolder
                  ? 'rgba(63, 255, 220, 0.15)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: !activeFolder
                  ? '1px solid rgba(63, 255, 220, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: !activeFolder ? '#3fffdc' : '#9ca3af',
                fontSize: '0.6875rem',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              All
            </button>
            {folders.map((f) => (
              <button
                key={f.name}
                onClick={() =>
                  setActiveFolder(activeFolder === f.name ? null : f.name)
                }
                style={{
                  padding: '0.375rem 0.625rem',
                  background:
                    activeFolder === f.name
                      ? 'rgba(63, 255, 220, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    activeFolder === f.name
                      ? '1px solid rgba(63, 255, 220, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  color: activeFolder === f.name ? '#3fffdc' : '#9ca3af',
                  fontSize: '0.6875rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {f.name} ({f.itemCount})
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '1rem 1.25rem',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#6b7280',
                fontSize: '0.875rem',
              }}
            >
              {items.length === 0
                ? 'No items in E-Storage. Add files first.'
                : 'No items match your filters.'}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: selected.has(item.id)
                      ? '2px solid #3fffdc'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {/* Thumbnail */}
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
                    {thumbUrls[item.id] ? (
                      <img
                        src={thumbUrls[item.id]}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '2rem', opacity: 0.4 }}>
                        {getTypeIcon(item.type)}
                      </span>
                    )}
                  </div>

                  {/* Check */}
                  {selected.has(item.id) && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '0.375rem',
                        right: '0.375rem',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#3fffdc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.625rem',
                        color: '#000',
                        fontWeight: '700',
                      }}
                    >
                      {'✓'}
                    </div>
                  )}

                  {/* Title */}
                  <div
                    style={{
                      padding: '0.375rem 0.5rem',
                      fontSize: '0.6875rem',
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      padding: '0 0.5rem 0.375rem',
                      fontSize: '0.5625rem',
                      color: '#6b7280',
                    }}
                  >
                    {formatBytes(item.fileSize)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {selected.size} selected
            {maxItems ? ` (max ${maxItems})` : ''}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#9ca3af',
                fontSize: '0.8125rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              style={{
                padding: '0.5rem 1.25rem',
                background:
                  selected.size > 0
                    ? 'rgba(63, 255, 220, 0.15)'
                    : 'rgba(255, 255, 255, 0.03)',
                border:
                  selected.size > 0
                    ? '1px solid rgba(63, 255, 220, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                color: selected.size > 0 ? '#3fffdc' : '#4b5563',
                fontSize: '0.8125rem',
                fontWeight: '600',
                cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
