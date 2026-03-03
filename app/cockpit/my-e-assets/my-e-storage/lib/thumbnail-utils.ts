'use client';

// ============================================
// THUMBNAIL GENERATION UTILITIES
// ============================================

const THUMB_MAX_SIZE = 200; // px

/**
 * Generate a thumbnail for an image file.
 * Uses canvas to resize to max 200px, output as JPEG 70%.
 */
export async function generateImageThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(
        THUMB_MAX_SIZE / img.width,
        THUMB_MAX_SIZE / img.height,
        1
      );
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob
            ? resolve(blob)
            : reject(new Error('Failed to generate thumbnail'));
        },
        'image/jpeg',
        0.7
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Generate a thumbnail for a video file.
 * Captures a frame at 25% of the video duration.
 */
export async function generateVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.muted = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 4);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(
        THUMB_MAX_SIZE / video.videoWidth,
        THUMB_MAX_SIZE / video.videoHeight,
        1
      );
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob
            ? resolve(blob)
            : reject(new Error('Failed to generate video thumbnail'));
        },
        'image/jpeg',
        0.7
      );
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };

    video.src = url;
  });
}

/**
 * Get a type-specific placeholder icon for items without thumbnails.
 */
export function getTypeIcon(type: string): string {
  switch (type) {
    case 'image':
      return '\u{1F5BC}'; // framed picture
    case 'video':
      return '\u{1F3AC}'; // clapper board
    case 'audio':
      return '\u{1F3B5}'; // musical note
    case 'document':
      return '\u{1F4C4}'; // page facing up
    case 'text':
      return '\u{1F4DD}'; // memo
    case 'link':
      return '\u{1F517}'; // link
    default:
      return '\u{1F4BE}'; // floppy disk
  }
}

/**
 * Format bytes to human readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
