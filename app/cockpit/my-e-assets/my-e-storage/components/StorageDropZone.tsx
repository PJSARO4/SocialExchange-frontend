'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { useEStorage } from '@/app/context/EStorageContext';
import type { StorageSource } from '../types/e-storage';

// ============================================
// STORAGE DROP ZONE
// ============================================

interface StorageDropZoneProps {
  folder?: string;
  tags?: string[];
  source?: StorageSource;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}

const ACCEPTED_TYPES = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'text/*',
].join(',');

export default function StorageDropZone({
  folder = 'Unsorted',
  tags = [],
  source = 'drag-drop',
  children,
  className,
  compact = false,
}: StorageDropZoneProps) {
  const { addFiles } = useEStorage();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      setIsProcessing(true);
      try {
        await addFiles(files, folder, tags, source);
      } catch (err) {
        console.error('[e-storage] Drop error:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [addFiles, folder, tags, source]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setIsProcessing(true);
      try {
        await addFiles(files, folder, tags, 'upload');
      } catch (err) {
        console.error('[e-storage] Upload error:', err);
      } finally {
        setIsProcessing(false);
      }
      // Reset input
      e.target.value = '';
    },
    [addFiles, folder, tags]
  );

  if (compact) {
    return (
      <div
        className={className}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          border: isDragging
            ? '2px dashed #3fffdc'
            : '2px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          background: isDragging
            ? 'rgba(63, 255, 220, 0.05)'
            : 'transparent',
          cursor: 'pointer',
        }}
      >
        <label style={{ cursor: 'pointer', display: 'block' }}>
          <input
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
            {isProcessing
              ? 'Processing...'
              : isDragging
              ? 'Drop files here'
              : '+ Drop files or click to upload'}
          </span>
        </label>
      </div>
    );
  }

  return (
    <div
      className={className}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        border: isDragging
          ? '2px dashed #3fffdc'
          : '2px dashed rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        transition: 'all 0.25s ease',
        background: isDragging
          ? 'rgba(63, 255, 220, 0.08)'
          : 'rgba(255, 255, 255, 0.02)',
      }}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            background: 'rgba(63, 255, 220, 0.1)',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#3fffdc',
            }}
          >
            DROP FILES HERE
          </span>
        </div>
      )}

      {!isDragging && (
        <>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
            {isProcessing ? '\u{23F3}' : '\u{1F4E5}'}
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.5rem',
            }}
          >
            {isProcessing ? 'PROCESSING FILES...' : 'DRAG & DROP FILES'}
          </div>
          <div
            style={{
              fontSize: '0.8125rem',
              color: '#6b7280',
              marginBottom: '1rem',
            }}
          >
            Images, videos, audio, PDFs, and text files
          </div>
          <label
            style={{
              display: 'inline-block',
              padding: '0.5rem 1.5rem',
              background: 'rgba(63, 255, 220, 0.15)',
              border: '1px solid rgba(63, 255, 220, 0.3)',
              borderRadius: '6px',
              color: '#3fffdc',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            BROWSE FILES
          </label>
        </>
      )}

      {children}
    </div>
  );
}
