'use client';

/**
 * Content Bridge
 * Provides a unified interface for querying media from both
 * Content Library and E-Storage. Used by the Chain Builder's
 * pull-content node to find media across all sources.
 */

// ── Types ───────────────────────────────────────────────

export interface UnifiedMediaItem {
  id: string;
  publicUrl: string;
  type: 'IMAGE' | 'VIDEO' | 'REELS';
  title: string;
  caption?: string;
  source: 'content-library' | 'e-storage';
  tags: string[];
  createdAt: string;
}

export type ContentSourceFilter = 'all' | 'content-library' | 'e-storage';
export type ContentTypeFilter = 'any' | 'image' | 'video' | 'carousel';
export type SelectionMethod = 'random' | 'newest' | 'oldest' | 'highest-engagement';

export interface UnifiedMediaQuery {
  source?: ContentSourceFilter;
  contentType?: ContentTypeFilter;
  selectionMethod?: SelectionMethod;
  limit?: number;
  tags?: string[];
}

// ── Storage Keys ────────────────────────────────────────

const CONTENT_LIBRARY_KEY = 'socialexchange_content';
const E_STORAGE_KEY = 'sx_e_storage_items';

// ── Loaders ─────────────────────────────────────────────

function loadContentLibraryItems(): UnifiedMediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CONTENT_LIBRARY_KEY);
    const items = stored ? JSON.parse(stored) : [];

    return items
      .filter((item: any) => item.mediaUrl || item.mediaUrls?.[0])
      .map((item: any) => ({
        id: item.id,
        publicUrl: item.mediaUrl || item.mediaUrls?.[0] || '',
        type: mapContentType(item.type),
        title: item.title || item.description || 'Untitled',
        caption: item.caption || item.description || '',
        source: 'content-library' as const,
        tags: item.tags || [],
        createdAt: item.createdAt || new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

function loadEStorageItems(): UnifiedMediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(E_STORAGE_KEY);
    const items = stored ? JSON.parse(stored) : [];

    return items
      .filter((item: any) => {
        // Only include image/video types that have a public URL
        const isMedia = item.type === 'image' || item.type === 'video';
        const hasUrl = !!item.sourceUrl;
        return isMedia && hasUrl;
      })
      .map((item: any) => ({
        id: item.id,
        publicUrl: item.sourceUrl,
        type: item.type === 'video' ? ('VIDEO' as const) : ('IMAGE' as const),
        title: item.title || item.filename || 'Untitled',
        caption: item.description || '',
        source: 'e-storage' as const,
        tags: item.tags || [],
        createdAt: item.createdAt || new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

// ── Helpers ─────────────────────────────────────────────

function mapContentType(type: string): 'IMAGE' | 'VIDEO' | 'REELS' {
  switch (type?.toLowerCase()) {
    case 'video':
      return 'VIDEO';
    case 'reel':
    case 'reels':
      return 'REELS';
    default:
      return 'IMAGE';
  }
}

function deduplicateByUrl(items: UnifiedMediaItem[]): UnifiedMediaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.publicUrl)) return false;
    seen.add(item.publicUrl);
    return true;
  });
}

// ── Main Query Function ─────────────────────────────────

/**
 * Get unified media items from Content Library and/or E-Storage.
 *
 * Used by:
 * - Chain Builder's pull-content node (via automation-executor.ts)
 * - Any future feature that needs to query all media sources
 */
export function getUnifiedMedia(query?: UnifiedMediaQuery): UnifiedMediaItem[] {
  const {
    source = 'all',
    contentType = 'any',
    selectionMethod = 'newest',
    limit,
    tags,
  } = query || {};

  // Load from selected sources
  let items: UnifiedMediaItem[] = [];

  if (source === 'all' || source === 'content-library') {
    items.push(...loadContentLibraryItems());
  }

  if (source === 'all' || source === 'e-storage') {
    items.push(...loadEStorageItems());
  }

  // Deduplicate items that might exist in both systems (same URL)
  items = deduplicateByUrl(items);

  // Filter by content type
  if (contentType !== 'any') {
    items = items.filter((item) => {
      switch (contentType) {
        case 'image':
          return item.type === 'IMAGE';
        case 'video':
          return item.type === 'VIDEO' || item.type === 'REELS';
        case 'carousel':
          return false; // carousels not yet supported in unified view
        default:
          return true;
      }
    });
  }

  // Filter by tags
  if (tags?.length) {
    items = items.filter((item) =>
      tags.some((tag) => item.tags.includes(tag))
    );
  }

  // Sort by selection method
  switch (selectionMethod) {
    case 'newest':
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'oldest':
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'random':
      items.sort(() => Math.random() - 0.5);
      break;
    case 'highest-engagement':
      // No engagement data available in unified view — fall back to newest
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  // Apply limit
  if (limit && limit > 0) {
    items = items.slice(0, limit);
  }

  return items;
}

/**
 * Get count of available media items per source.
 * Useful for showing counts in the UI (e.g., NodeConfigPanel).
 */
export function getMediaCounts(): {
  contentLibrary: number;
  eStorage: number;
  total: number;
} {
  const cl = loadContentLibraryItems().length;
  const es = loadEStorageItems().length;
  return {
    contentLibrary: cl,
    eStorage: es,
    total: deduplicateByUrl([...loadContentLibraryItems(), ...loadEStorageItems()]).length,
  };
}
