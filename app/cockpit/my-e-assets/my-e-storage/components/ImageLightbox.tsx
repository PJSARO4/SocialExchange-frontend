'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEStorage } from '@/app/context/EStorageContext';
import type { EStorageItemMeta } from '../types/e-storage';

interface ImageLightboxProps {
  item: EStorageItemMeta;
  items: EStorageItemMeta[]; // all items for navigation
  onClose: () => void;
  onNavigate?: (item: EStorageItemMeta) => void;
}

export default function ImageLightbox({
  item,
  items,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const { getBlobUrl } = useEStorage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(() =>
    items.findIndex((i) => i.id === item.id)
  );

  // Only show image items
  const imageItems = items.filter((i) => i.type === 'image');

  useEffect(() => {
    setCurrentIndex(imageItems.findIndex((i) => i.id === item.id));
  }, [item.id, imageItems]);

  // Load image URL
  useEffect(() => {
    let url: string | null = null;
    const current = imageItems[currentIndex];
    if (current?.blobKey) {
      getBlobUrl(current.blobKey).then((u) => {
        url = u;
        setImageUrl(u);
      });
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [currentIndex, imageItems, getBlobUrl]);

  const goNext = useCallback(() => {
    if (currentIndex < imageItems.length - 1) {
      const nextItem = imageItems[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      onNavigate?.(nextItem);
    }
  }, [currentIndex, imageItems, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevItem = imageItems[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      onNavigate?.(prevItem);
    }
  }, [currentIndex, imageItems, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  const currentItem = imageItems[currentIndex];

  return (
    <div className="e-lightbox-overlay" onClick={onClose}>
      <div
        className="e-lightbox-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button className="e-lightbox-close" onClick={onClose}>
          {'✕'}
        </button>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button className="e-lightbox-nav e-lightbox-prev" onClick={goPrev}>
            {'‹'}
          </button>
        )}
        {currentIndex < imageItems.length - 1 && (
          <button className="e-lightbox-nav e-lightbox-next" onClick={goNext}>
            {'›'}
          </button>
        )}

        {/* Image */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={currentItem?.title || 'Preview'}
            className="e-lightbox-image"
          />
        ) : (
          <div className="e-lightbox-loading">Loading...</div>
        )}

        {/* Info bar */}
        {currentItem && (
          <div className="e-lightbox-info">
            <span className="e-lightbox-title">{currentItem.title}</span>
            <span className="e-lightbox-counter">
              {currentIndex + 1} / {imageItems.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
