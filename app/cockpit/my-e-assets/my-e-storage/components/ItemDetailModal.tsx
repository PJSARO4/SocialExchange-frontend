'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEStorage } from '@/app/context/EStorageContext';
import type { EStorageItemMeta } from '../types/e-storage';
import { getTypeIcon, formatBytes } from '../lib/thumbnail-utils';

interface ItemDetailModalProps {
  item: EStorageItemMeta;
  onClose: () => void;
  onOpenLightbox?: (item: EStorageItemMeta) => void;
}

export default function ItemDetailModal({
  item,
  onClose,
  onOpenLightbox,
}: ItemDetailModalProps) {
  const { getBlobUrl, updateItem } = useEStorage();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description || '');
  const [editTags, setEditTags] = useState<string[]>([...item.tags]);
  const [newTag, setNewTag] = useState('');
  const [saved, setSaved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load full-size preview
  useEffect(() => {
    let url: string | null = null;
    if (item.blobKey) {
      getBlobUrl(item.blobKey).then((u) => {
        url = u;
        setPreviewUrl(u);
      });
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [item.blobKey, getBlobUrl]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  const handleSave = useCallback(() => {
    updateItem(item.id, {
      title: editTitle.trim() || item.title,
      description: editDescription.trim(),
      tags: editTags,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsEditing(false);
    }, 1200);
  }, [item.id, item.title, editTitle, editDescription, editTags, updateItem]);

  const handleAddTag = useCallback(() => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !editTags.includes(tag)) {
      setEditTags((prev) => [...prev, tag]);
      setNewTag('');
    }
  }, [newTag, editTags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setEditTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag]
  );

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="e-detail-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="e-detail-modal">
        {/* Header */}
        <div className="e-detail-header">
          <div className="e-detail-header-left">
            <span className="e-detail-type-icon">{getTypeIcon(item.type)}</span>
            <span className="e-detail-type-label">{item.type.toUpperCase()}</span>
          </div>
          <div className="e-detail-header-right">
            {!isEditing && (
              <button
                className="e-detail-edit-btn"
                onClick={() => setIsEditing(true)}
              >
                {'✏️'} Edit
              </button>
            )}
            <button className="e-detail-close-btn" onClick={onClose}>
              {'✕'}
            </button>
          </div>
        </div>

        {/* Preview */}
        {item.type === 'image' && previewUrl && (
          <div
            className="e-detail-preview"
            onClick={() => onOpenLightbox?.(item)}
            title="Click to open full-size"
          >
            <img src={previewUrl} alt={item.title} />
            <div className="e-detail-preview-zoom">{'🔍'} Click to expand</div>
          </div>
        )}

        {item.type === 'video' && previewUrl && (
          <div className="e-detail-preview">
            <video src={previewUrl} controls style={{ maxWidth: '100%', maxHeight: '300px' }} />
          </div>
        )}

        {item.type === 'audio' && previewUrl && (
          <div className="e-detail-preview" style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{'🎵'}</div>
            <audio src={previewUrl} controls style={{ width: '100%' }} />
          </div>
        )}

        {/* Body */}
        <div className="e-detail-body">
          {/* Title */}
          <div className="e-detail-field">
            <label className="e-detail-label">Title</label>
            {isEditing ? (
              <input
                className="e-detail-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <div className="e-detail-value">{item.title}</div>
            )}
          </div>

          {/* Description */}
          <div className="e-detail-field">
            <label className="e-detail-label">Description</label>
            {isEditing ? (
              <textarea
                className="e-detail-textarea"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
              />
            ) : (
              <div className="e-detail-value e-detail-description">
                {item.description || 'No description'}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="e-detail-field">
            <label className="e-detail-label">Tags</label>
            <div className="e-detail-tags">
              {(isEditing ? editTags : item.tags).map((tag) => (
                <span key={tag} className="e-detail-tag">
                  {tag}
                  {isEditing && (
                    <button
                      className="e-detail-tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {'×'}
                    </button>
                  )}
                </span>
              ))}
              {isEditing && (
                <div className="e-detail-tag-input-wrap">
                  <input
                    className="e-detail-tag-input"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="+ add tag"
                  />
                </div>
              )}
              {!isEditing && item.tags.length === 0 && (
                <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>No tags</span>
              )}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="e-detail-meta-grid">
            <div className="e-detail-meta-item">
              <span className="e-detail-meta-label">Filename</span>
              <span className="e-detail-meta-value">{item.filename}</span>
            </div>
            <div className="e-detail-meta-item">
              <span className="e-detail-meta-label">Size</span>
              <span className="e-detail-meta-value">{formatBytes(item.fileSize)}</span>
            </div>
            <div className="e-detail-meta-item">
              <span className="e-detail-meta-label">Folder</span>
              <span className="e-detail-meta-value">{item.folder}</span>
            </div>
            <div className="e-detail-meta-item">
              <span className="e-detail-meta-label">Uploaded</span>
              <span className="e-detail-meta-value">{formatDate(item.createdAt)}</span>
            </div>
            {item.dimensions && (
              <div className="e-detail-meta-item">
                <span className="e-detail-meta-label">Dimensions</span>
                <span className="e-detail-meta-value">
                  {item.dimensions.width} × {item.dimensions.height}px
                </span>
              </div>
            )}
            <div className="e-detail-meta-item">
              <span className="e-detail-meta-label">Source</span>
              <span className="e-detail-meta-value">{item.source || 'upload'}</span>
            </div>
          </div>
        </div>

        {/* Edit Actions */}
        {isEditing && (
          <div className="e-detail-actions">
            <button
              className="e-detail-cancel-btn"
              onClick={() => {
                setIsEditing(false);
                setEditTitle(item.title);
                setEditDescription(item.description || '');
                setEditTags([...item.tags]);
              }}
            >
              Cancel
            </button>
            <button
              className="e-detail-save-btn"
              onClick={handleSave}
            >
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
