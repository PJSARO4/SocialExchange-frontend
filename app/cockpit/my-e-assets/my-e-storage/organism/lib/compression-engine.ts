'use client';

import type { PlatformName, PlatformSpec, CompressionResult } from '../types/organism';

// ============================================
// PLATFORM SPECS
// Social media image requirements
// ============================================

export const PLATFORM_SPECS: Record<PlatformName, PlatformSpec> = {
  'instagram-square': {
    name: 'instagram-square',
    label: 'Instagram Square',
    width: 1080,
    height: 1080,
    maxFileSize: 8 * 1024 * 1024, // 8MB
    quality: 0.85,
    format: 'image/jpeg',
  },
  'instagram-portrait': {
    name: 'instagram-portrait',
    label: 'Instagram Portrait',
    width: 1080,
    height: 1350,
    maxFileSize: 8 * 1024 * 1024,
    quality: 0.85,
    format: 'image/jpeg',
  },
  'instagram-landscape': {
    name: 'instagram-landscape',
    label: 'Instagram Landscape',
    width: 1080,
    height: 608,
    maxFileSize: 8 * 1024 * 1024,
    quality: 0.85,
    format: 'image/jpeg',
  },
  twitter: {
    name: 'twitter',
    label: 'Twitter / X',
    width: 1200,
    height: 675,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    quality: 0.85,
    format: 'image/jpeg',
  },
  facebook: {
    name: 'facebook',
    label: 'Facebook',
    width: 1200,
    height: 630,
    maxFileSize: 8 * 1024 * 1024,
    quality: 0.85,
    format: 'image/jpeg',
  },
  tiktok: {
    name: 'tiktok',
    label: 'TikTok',
    width: 1080,
    height: 1920,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    quality: 0.85,
    format: 'image/jpeg',
  },
};

// ============================================
// COMPRESSION ENGINE
// Client-side Canvas API
// ============================================

export async function compressForPlatform(
  blob: Blob,
  platform: PlatformName,
  customQuality?: number
): Promise<{ blob: Blob; savings: number }> {
  const spec = PLATFORM_SPECS[platform];
  const quality = customQuality ?? spec.quality;

  // Create image bitmap from blob
  const img = await createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Fill background (for transparent images)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, spec.width, spec.height);

  // Calculate cover fit (crop to fill)
  const scale = Math.max(spec.width / img.width, spec.height / img.height);
  const scaledW = img.width * scale;
  const scaledH = img.height * scale;
  const x = (spec.width - scaledW) / 2;
  const y = (spec.height - scaledH) / 2;

  ctx.drawImage(img, x, y, scaledW, scaledH);

  // Convert to blob
  const compressed = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas toBlob failed'));
      },
      spec.format,
      quality
    );
  });

  // If still too large, reduce quality iteratively
  let finalBlob = compressed;
  let q = quality;
  while (finalBlob.size > spec.maxFileSize && q > 0.3) {
    q -= 0.1;
    finalBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas toBlob failed'));
        },
        spec.format,
        q
      );
    });
  }

  const savings = Math.round((1 - finalBlob.size / blob.size) * 100);

  return {
    blob: finalBlob,
    savings: Math.max(savings, 0),
  };
}

// ============================================
// BATCH COMPRESSION
// ============================================

export async function batchCompress(
  items: { id: string; blob: Blob }[],
  platform: PlatformName,
  customQuality?: number
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (const item of items) {
    try {
      const { blob, savings } = await compressForPlatform(
        item.blob,
        platform,
        customQuality
      );
      results.push({
        itemId: item.id,
        originalSize: item.blob.size,
        compressedSize: blob.size,
        savings,
        platform,
        blob,
      });
    } catch (err) {
      console.error(`Compression failed for ${item.id}:`, err);
    }
  }

  return results;
}

// ============================================
// FORMAT CHECKER
// ============================================

export function checkImageCompliance(
  width: number,
  height: number,
  fileSize: number
): { compliant: PlatformName[]; suggestions: string[] } {
  const compliant: PlatformName[] = [];
  const suggestions: string[] = [];

  for (const [name, spec] of Object.entries(PLATFORM_SPECS)) {
    const platformName = name as PlatformName;
    const matchesSize = width >= spec.width && height >= spec.height;
    const matchesFileSize = fileSize <= spec.maxFileSize;

    if (matchesSize && matchesFileSize) {
      compliant.push(platformName);
    } else if (!matchesSize) {
      suggestions.push(
        `${spec.label}: Image too small (needs ${spec.width}x${spec.height})`
      );
    } else {
      suggestions.push(
        `${spec.label}: File too large (max ${Math.round(spec.maxFileSize / 1024 / 1024)}MB)`
      );
    }
  }

  return { compliant, suggestions };
}

// ============================================
// AUTO-TAG BY FILENAME
// ============================================

export function generateTagsFromFilename(filename: string): string[] {
  const tags: string[] = [];
  const name = filename.replace(/\.[^.]+$/, '').toLowerCase();

  // Split on common separators
  const words = name.split(/[-_\s.]+/).filter((w) => w.length > 2);

  // Common content type keywords
  const contentKeywords: Record<string, string> = {
    food: 'food',
    recipe: 'food',
    meal: 'food',
    travel: 'travel',
    landscape: 'landscape',
    portrait: 'portrait',
    selfie: 'portrait',
    product: 'product',
    fashion: 'fashion',
    style: 'fashion',
    fitness: 'fitness',
    workout: 'fitness',
    tech: 'tech',
    review: 'review',
    unbox: 'unboxing',
    thumbnail: 'thumbnail',
    cover: 'cover',
    banner: 'banner',
    logo: 'branding',
    brand: 'branding',
    story: 'story',
    reel: 'reel',
    post: 'post',
    carousel: 'carousel',
    meme: 'meme',
    quote: 'quote',
    infographic: 'infographic',
    screenshot: 'screenshot',
  };

  words.forEach((word) => {
    if (contentKeywords[word]) {
      tags.push(contentKeywords[word]);
    }
  });

  // Deduplicate
  return Array.from(new Set(tags)).slice(0, 5);
}
