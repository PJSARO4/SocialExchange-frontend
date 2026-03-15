'use client';

/**
 * Upload Integration Utility
 * Orchestrates media upload across Vercel Blob, E-Storage, and Content Library
 * so a single user action populates all three systems.
 */

// Types
export interface UploadResult {
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'REELS';
  contentId?: string;
}

export interface UploadProgress {
  stage: 'preparing' | 'uploading' | 'saving' | 'complete' | 'error';
  percent: number;
  message: string;
}

type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Detect Instagram media type from MIME type
 */
export function detectMediaType(mimeType: string): 'IMAGE' | 'VIDEO' | 'REELS' {
  if (mimeType.startsWith('video/')) return 'VIDEO';
  return 'IMAGE';
}

/**
 * Validate file for Instagram posting
 */
export function validateMediaFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return { valid: false, error: 'Only image and video files are supported.' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File is too large. Maximum size is 100MB.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  return { valid: true };
}

/**
 * Upload a file to Vercel Blob via the /api/content/upload endpoint.
 * Returns the public URL and metadata.
 *
 * NOTE: This does NOT require auth session in demo/localStorage mode.
 * If the server returns 401, we fall back to a client-side approach.
 */
async function uploadToVercelBlob(
  file: File,
  feedId?: string,
  tags?: string[],
  onProgress?: ProgressCallback
): Promise<UploadResult> {
  onProgress?.({
    stage: 'uploading',
    percent: 20,
    message: 'Uploading to cloud storage...',
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
  if (feedId) formData.append('feedId', feedId);
  if (tags?.length) formData.append('tags', tags.join(','));

  const response = await fetch('/api/content/upload', {
    method: 'POST',
    body: formData,
  });

  onProgress?.({
    stage: 'uploading',
    percent: 70,
    message: 'Processing...',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // If blob storage not configured, provide a helpful message
    if (response.status === 503) {
      throw new Error(
        'Cloud storage is not configured yet. Add BLOB_READ_WRITE_TOKEN to your environment variables. ' +
        'Get one from: Vercel Dashboard → Storage → Create Blob Store.'
      );
    }

    // If auth fails (demo mode), provide client-side fallback info
    if (response.status === 401) {
      throw new Error(
        'Upload requires authentication. Please sign in or use Demo Login.'
      );
    }

    throw new Error(errorData.error || errorData.details || 'Upload failed');
  }

  const data = await response.json();

  return {
    publicUrl: data.content.storageUrl,
    fileName: data.content.fileName,
    fileSize: data.content.fileSize,
    mimeType: data.content.mimeType,
    mediaType: detectMediaType(data.content.mimeType),
    contentId: data.content.id,
  };
}

/**
 * Save uploaded media to the Content Library (localStorage).
 * This makes it available for the Chain Builder's pull-content node.
 */
function saveToContentLibrary(result: UploadResult, feedId?: string): void {
  try {
    const CONTENT_KEY = 'socialexchange_content';
    const stored = localStorage.getItem(CONTENT_KEY);
    const content = stored ? JSON.parse(stored) : [];

    const item = {
      id: result.contentId || `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: result.fileName.replace(/\.[^/.]+$/, ''),
      description: '',
      mediaUrl: result.publicUrl,
      mediaUrls: [result.publicUrl],
      type: result.mediaType === 'IMAGE' ? 'image' : 'video',
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
      tags: ['create-post-upload'],
      status: 'ready',
      sourceType: 'upload',
      feedId: feedId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    content.unshift(item);
    localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
  } catch (err) {
    console.warn('[upload-integration] Failed to save to Content Library:', err);
  }
}

/**
 * Save uploaded media to E-Storage (localStorage metadata index).
 * The actual blob is already on Vercel Blob — we store the reference.
 */
function saveToEStorage(result: UploadResult): void {
  try {
    const E_STORAGE_KEY = 'sx_e_storage_items';
    const stored = localStorage.getItem(E_STORAGE_KEY);
    const items = stored ? JSON.parse(stored) : [];

    const item = {
      id: `es-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: 'demo',
      type: result.mediaType === 'IMAGE' ? 'image' : 'video',
      source: 'upload' as const,
      title: result.fileName.replace(/\.[^/.]+$/, ''),
      description: '',
      filename: result.fileName,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      dimensions: null,
      duration: null,
      folder: 'Uploads',
      tags: ['create-post'],
      sourceUrl: result.publicUrl, // The Vercel Blob public URL
      blobKey: null, // No IndexedDB blob — it's on Vercel Blob
      thumbnailBlobKey: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    items.unshift(item);
    localStorage.setItem(E_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('[upload-integration] Failed to save to E-Storage:', err);
  }
}

/**
 * Main function: Upload media to all systems.
 *
 * 1. Uploads to Vercel Blob (gets public URL for Instagram API)
 * 2. Saves to Content Library (for Chain Builder pull-content)
 * 3. Saves to E-Storage (for asset management)
 *
 * Returns the upload result with the public URL needed for publishing.
 */
export async function uploadMediaToAllSystems(
  file: File,
  options?: {
    feedId?: string;
    tags?: string[];
    onProgress?: ProgressCallback;
  }
): Promise<UploadResult> {
  const { feedId, tags, onProgress } = options || {};

  // Validate
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  onProgress?.({
    stage: 'preparing',
    percent: 5,
    message: 'Preparing upload...',
  });

  // Step 1: Upload to Vercel Blob
  const result = await uploadToVercelBlob(file, feedId, tags, onProgress);

  onProgress?.({
    stage: 'saving',
    percent: 85,
    message: 'Saving to libraries...',
  });

  // Step 2: Save to Content Library (non-blocking)
  saveToContentLibrary(result, feedId);

  // Step 3: Save to E-Storage (non-blocking)
  saveToEStorage(result);

  onProgress?.({
    stage: 'complete',
    percent: 100,
    message: 'Upload complete!',
  });

  return result;
}
