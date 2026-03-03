'use client';

// ============================================
// E-STORAGE TYPES
// ============================================

export type StorageItemType = 'image' | 'video' | 'audio' | 'text' | 'link' | 'document';

export type StorageSource =
  | 'upload'
  | 'drag-drop'
  | 'api'
  | 'scrape'
  | 'linkex'
  | 'automation'
  | 'clipboard'
  | 'organism';

// ============================================
// E-STORAGE ITEM METADATA
// ============================================

export interface EStorageItemMeta {
  id: string;
  userId: string;
  type: StorageItemType;
  title: string;
  description?: string;

  // Organization
  folder: string; // default: 'Unsorted'
  tags: string[];

  // Source tracking
  source: StorageSource;
  sourceUrl?: string; // original URL if scraped

  // File metadata
  filename: string;
  mimeType: string;
  fileSize: number; // bytes
  dimensions?: { width: number; height: number };
  duration?: number; // seconds, for video/audio

  // Binary references (keys into IndexedDB)
  blobKey: string;
  thumbnailBlobKey?: string;

  // Timestamps
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

// ============================================
// FOLDERS
// ============================================

export interface EStorageFolder {
  name: string;
  color?: string; // hex color for folder icon
  itemCount: number;
}

// ============================================
// STORAGE STATS
// ============================================

export interface EStorageStats {
  totalItems: number;
  totalSizeBytes: number;
  quotaBytes: number; // estimated available
  usedPercent: number;
  byType: Record<StorageItemType, number>;
}

// ============================================
// FILTERS
// ============================================

export interface EStorageFilters {
  type?: StorageItemType;
  folder?: string;
  tags?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'name' | 'size' | 'type';
  sortDir?: 'asc' | 'desc';
}
