// ============================================
// CONTENT SOURCE ADAPTERS (Server-side only)
// Used by /api/organism/scrape
// ============================================

import type { ContentSuggestion } from '../types/organism';

// ============================================
// UNSPLASH ADAPTER
// Free: 50 requests/hour
// ============================================

export async function searchUnsplash(
  query: string,
  perPage: number = 10
): Promise<ContentSuggestion[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=squarish`;
    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.results || []).map((photo: Record<string, unknown>) => ({
      id: `unsplash-${photo.id}`,
      title: (photo.alt_description as string) || (photo.description as string) || 'Untitled',
      description: photo.description as string,
      imageUrl: (photo.urls as Record<string, string>)?.regular,
      sourceUrl: (photo.links as Record<string, string>)?.html,
      sourceName: 'unsplash',
      type: 'image' as const,
      author: (photo.user as Record<string, string>)?.name,
      tags: ((photo.tags as Array<Record<string, string>>) || [])
        .slice(0, 5)
        .map((t) => t.title)
        .filter(Boolean),
    }));
  } catch (err) {
    console.error('Unsplash search failed:', err);
    return [];
  }
}

// ============================================
// PEXELS ADAPTER
// Free: 200 requests/hour
// ============================================

export async function searchPexels(
  query: string,
  perPage: number = 10
): Promise<ContentSuggestion[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
    const response = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.photos || []).map((photo: Record<string, unknown>) => ({
      id: `pexels-${photo.id}`,
      title: (photo.alt as string) || 'Untitled',
      description: (photo.alt as string) || undefined,
      imageUrl: (photo.src as Record<string, string>)?.large,
      sourceUrl: photo.url as string,
      sourceName: 'pexels',
      type: 'image' as const,
      author: (photo.photographer as string) || undefined,
      tags: [],
    }));
  } catch (err) {
    console.error('Pexels search failed:', err);
    return [];
  }
}

// ============================================
// PEXELS VIDEO ADAPTER
// ============================================

export async function searchPexelsVideos(
  query: string,
  perPage: number = 5
): Promise<ContentSuggestion[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;
    const response = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.videos || []).map((video: Record<string, unknown>) => {
      const files = (video.video_files as Array<Record<string, unknown>>) || [];
      const bestFile = files.find((f) => f.quality === 'hd') || files[0];
      return {
        id: `pexels-video-${video.id}`,
        title: `Video: ${query}`,
        description: undefined,
        imageUrl: video.image as string,
        sourceUrl: bestFile?.link as string || video.url as string,
        sourceName: 'pexels',
        type: 'video' as const,
        author: (video.user as Record<string, string>)?.name || undefined,
        tags: [],
      };
    });
  } catch (err) {
    console.error('Pexels video search failed:', err);
    return [];
  }
}

// ============================================
// COMBINED SEARCH
// ============================================

export async function searchAllSources(
  query: string,
  type: 'image' | 'video' | 'all' = 'all',
  perPage: number = 8
): Promise<ContentSuggestion[]> {
  const promises: Promise<ContentSuggestion[]>[] = [];

  if (type === 'image' || type === 'all') {
    promises.push(searchUnsplash(query, perPage));
    promises.push(searchPexels(query, perPage));
  }

  if (type === 'video' || type === 'all') {
    promises.push(searchPexelsVideos(query, Math.min(perPage, 5)));
  }

  const results = await Promise.allSettled(promises);
  const allItems: ContentSuggestion[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  });

  return allItems;
}
