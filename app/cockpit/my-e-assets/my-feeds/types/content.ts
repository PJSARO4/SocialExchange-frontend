'use client';

// ============================================
// CONTENT TYPES
// ============================================

export type ContentType = 'image' | 'video' | 'carousel' | 'text';
export type ContentStatus = 'draft' | 'ready' | 'scheduled' | 'posted' | 'failed';
export type SourceType = 'upload' | 'csv' | 'gdrive' | 'url';

// ============================================
// CONTENT METADATA
// ============================================

export interface ContentMetadata {
  originalFilename?: string;
  fileSize?: number;            // bytes
  mimeType?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number;            // seconds (for video)
  aspectRatio?: string;         // e.g., "16:9", "1:1"
  csvRowIndex?: number;         // if from CSV import
  aiGenerated?: boolean;
  aiPrompt?: string;
}

// ============================================
// CONTENT ITEM (MEDIA ASSET)
// ============================================

export interface ContentItem {
  id: string;
  userId: string;
  feedId?: string;              // null = available for any feed

  // Content details
  type: ContentType;
  title: string;
  caption?: string;
  hashtags?: string[];

  // Media
  mediaUrls: string[];          // stored file paths/URLs
  thumbnailUrl?: string;

  // Organization
  tags: string[];
  folder?: string;

  // Status
  status: ContentStatus;
  sourceType: SourceType;

  // Scheduling
  scheduledFor?: string;        // ISO date if scheduled
  postedAt?: string;            // ISO date if posted

  // Metadata
  metadata: ContentMetadata;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CSV IMPORT ROW
// ============================================

export interface CSVImportRow {
  title?: string;
  caption?: string;
  hashtags?: string;            // comma-separated
  mediaUrl?: string;            // URL to media
  mediaPath?: string;           // local file path
  scheduledDate?: string;
  scheduledTime?: string;
  platform?: string;
  tags?: string;                // comma-separated
}

export interface CSVImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
  items: ContentItem[];
}

// ============================================
// CREATE CONTENT PAYLOAD
// ============================================

export interface CreateContentPayload {
  type: ContentType;
  title: string;
  caption?: string;
  hashtags?: string[];
  mediaUrls: string[];
  thumbnailUrl?: string;
  tags?: string[];
  folder?: string;
  feedId?: string;
  sourceType: SourceType;
  metadata?: Partial<ContentMetadata>;
}

// ============================================
// UPDATE CONTENT PAYLOAD
// ============================================

export interface UpdateContentPayload {
  title?: string;
  caption?: string;
  hashtags?: string[];
  tags?: string[];
  folder?: string;
  status?: ContentStatus;
  scheduledFor?: string;
  feedId?: string;
}

// ============================================
// CONTENT FILTERS
// ============================================

export interface ContentFilters {
  type?: ContentType;
  status?: ContentStatus;
  feedId?: string;
  tags?: string[];
  folder?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// UPLOAD PROGRESS
// ============================================

export interface UploadProgress {
  id: string;
  filename: string;
  progress: number;             // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  contentId?: string;           // assigned after complete
}
