/**
 * Media URL Validation for Instagram Publishing
 *
 * Instagram requirements:
 * - Images: JPEG, PNG (max 8MB)
 * - Videos: MP4, MOV (max 100MB, max 60s for feed, max 90s for Reels)
 * - URLs must be publicly accessible (not localhost, not private IPs)
 * - URLs must use HTTPS
 */

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  contentType?: string;
  contentLength?: number;
  mediaType?: 'IMAGE' | 'VIDEO';
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/mpeg'];
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Validates a media URL for Instagram publishing
 */
export async function validateMediaUrl(url: string): Promise<MediaValidationResult> {
  // Basic URL validation
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Media URL is required' };
  }

  // Must be HTTPS
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Media URL must use HTTPS' };
    }

    // Block localhost and private IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')
    ) {
      return { valid: false, error: 'Media URL must be publicly accessible (no localhost or private IPs)' };
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // HEAD request to check accessibility and content type
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        valid: false,
        error: `Media URL returned HTTP ${response.status}. URL must be publicly accessible.`,
      };
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    // Determine media type
    const isImage = ALLOWED_IMAGE_TYPES.some(t => contentType.includes(t));
    const isVideo = ALLOWED_VIDEO_TYPES.some(t => contentType.includes(t));

    if (!isImage && !isVideo) {
      return {
        valid: false,
        error: `Unsupported media type: ${contentType}. Supported: JPEG, PNG, MP4, MOV`,
        contentType,
      };
    }

    // Check file size
    if (contentLength > 0) {
      if (isImage && contentLength > MAX_IMAGE_SIZE) {
        return {
          valid: false,
          error: `Image too large: ${(contentLength / 1024 / 1024).toFixed(1)}MB. Maximum is 8MB.`,
          contentType,
          contentLength,
        };
      }

      if (isVideo && contentLength > MAX_VIDEO_SIZE) {
        return {
          valid: false,
          error: `Video too large: ${(contentLength / 1024 / 1024).toFixed(1)}MB. Maximum is 100MB.`,
          contentType,
          contentLength,
        };
      }
    }

    return {
      valid: true,
      contentType,
      contentLength: contentLength || undefined,
      mediaType: isImage ? 'IMAGE' : 'VIDEO',
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { valid: false, error: 'Media URL request timed out (10s). URL must respond quickly.' };
    }

    return {
      valid: false,
      error: `Cannot reach media URL: ${error.message}`,
    };
  }
}

/**
 * Validates multiple media URLs (for carousel posts)
 */
export async function validateMediaUrls(urls: string[]): Promise<{
  valid: boolean;
  results: MediaValidationResult[];
  errors: string[];
}> {
  if (!urls || urls.length === 0) {
    return { valid: false, results: [], errors: ['At least one media URL is required'] };
  }

  if (urls.length > 10) {
    return { valid: false, results: [], errors: ['Maximum 10 items in a carousel post'] };
  }

  const results = await Promise.all(urls.map(url => validateMediaUrl(url)));
  const errors = results
    .map((r, i) => r.error ? `Item ${i + 1}: ${r.error}` : null)
    .filter(Boolean) as string[];

  return {
    valid: errors.length === 0,
    results,
    errors,
  };
}
