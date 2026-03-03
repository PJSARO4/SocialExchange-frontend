'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  Feed,
  Platform,
  CreateFeedPayload,
  UpdateFeedPayload,
  ControlMode,
} from '../types/feed';
import {
  ContentItem,
  ContentFilters,
  CreateContentPayload,
  UpdateContentPayload,
  UploadProgress,
  CSVImportResult,
} from '../types/content';
import { logger } from '@/lib/logging/activity-logger';

// ============================================
// MOCK DATA GENERATOR
// ============================================

const generateMockFeed = (payload: CreateFeedPayload): Feed => ({
  id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  userId: 'user-1',
  platform: payload.platform,
  handle: payload.handle,
  displayName: payload.displayName,
  avatarUrl: payload.avatarUrl,
  isConnected: true,
  connectionStatus: 'active',
  lastSync: new Date().toISOString(),
  // OAuth fields
  platformUserId: payload.platformUserId,
  accessToken: payload.accessToken,
  refreshToken: payload.refreshToken,
  isOAuth: payload.isOAuth || false,
  // Automation
  automationEnabled: false,
  controlMode: 'manual',
  metrics: {
    // Start with zeros - real metrics come from platform API
    followers: payload.initialMetrics?.followers ?? 0,
    following: payload.initialMetrics?.following ?? 0,
    engagement: 0,
    postsPerWeek: 0,
    totalPosts: payload.initialMetrics?.totalPosts ?? 0,
    uptime: 0,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const generateMockContent = (payload: CreateContentPayload): ContentItem => ({
  id: `content-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  userId: 'user-1',
  feedId: payload.feedId,
  type: payload.type,
  title: payload.title,
  caption: payload.caption,
  hashtags: payload.hashtags,
  mediaUrls: payload.mediaUrls,
  thumbnailUrl: payload.thumbnailUrl || payload.mediaUrls[0],
  tags: payload.tags || [],
  status: 'draft',
  sourceType: payload.sourceType,
  metadata: payload.metadata || {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ============================================
// CONTEXT TYPES
// ============================================

interface FeedsContextType {
  // Feeds state
  feeds: Feed[];
  selectedFeedId: string | null;
  selectedFeed: Feed | null;
  feedsLoading: boolean;
  feedsError: string | null;

  // Content state
  content: ContentItem[];
  selectedContentId: string | null;
  selectedContent: ContentItem | null;
  contentLoading: boolean;
  contentError: string | null;
  contentFilters: ContentFilters;
  uploadProgress: UploadProgress[];

  // Feed actions
  selectFeed: (id: string | null) => void;
  addFeed: (payload: CreateFeedPayload) => Promise<Feed>;
  updateFeed: (id: string, payload: UpdateFeedPayload) => Promise<Feed>;
  removeFeed: (id: string) => Promise<void>;
  setControlMode: (id: string, mode: ControlMode) => Promise<void>;
  toggleAutomation: (id: string) => Promise<void>;

  // Content actions
  selectContent: (id: string | null) => void;
  addContent: (payload: CreateContentPayload) => Promise<ContentItem>;
  updateContent: (id: string, payload: UpdateContentPayload) => Promise<ContentItem>;
  removeContent: (id: string) => Promise<void>;
  setContentFilters: (filters: ContentFilters) => void;

  // Upload actions
  uploadFiles: (files: File[], feedId?: string) => Promise<ContentItem[]>;
  importCSV: (file: File, feedId?: string) => Promise<CSVImportResult>;
  cancelUpload: (uploadId: string) => void;

  // Bulk actions
  removeMultipleContent: (ids: string[]) => Promise<void>;
  assignContentToFeed: (contentIds: string[], feedId: string) => Promise<void>;
}

const FeedsContext = createContext<FeedsContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

// LocalStorage keys
const FEEDS_STORAGE_KEY = 'socialexchange_feeds';
const CONTENT_STORAGE_KEY = 'socialexchange_content';

export function FeedsProvider({ children }: { children: ReactNode }) {
  // Feeds state - initialize from localStorage
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [feedsLoading, setFeedsLoading] = useState(true); // Start true for initial load
  const [feedsError, setFeedsError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Content state
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentFilters, setContentFilters] = useState<ContentFilters>({});
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedFeeds = localStorage.getItem(FEEDS_STORAGE_KEY);
      const storedContent = localStorage.getItem(CONTENT_STORAGE_KEY);

      if (storedFeeds) {
        const parsedFeeds = JSON.parse(storedFeeds);
        console.log('📂 Loaded feeds from storage:', parsedFeeds.length);
        setFeeds(parsedFeeds);
      }

      if (storedContent) {
        const parsedContent = JSON.parse(storedContent);
        console.log('📂 Loaded content from storage:', parsedContent.length);
        setContent(parsedContent);
      }
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
    } finally {
      setIsHydrated(true);
      setFeedsLoading(false);
    }
  }, []);

  // Save feeds to localStorage whenever they change
  useEffect(() => {
    if (isHydrated && feeds.length > 0) {
      console.log('💾 Saving feeds to storage:', feeds.length);
      localStorage.setItem(FEEDS_STORAGE_KEY, JSON.stringify(feeds));
    } else if (isHydrated && feeds.length === 0) {
      // Clear storage if no feeds
      localStorage.removeItem(FEEDS_STORAGE_KEY);
    }
  }, [feeds, isHydrated]);

  // Save content to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated && content.length > 0) {
      localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    } else if (isHydrated && content.length === 0) {
      localStorage.removeItem(CONTENT_STORAGE_KEY);
    }
  }, [content, isHydrated]);

  // ============================================
  // API SYNC (runs once after localStorage hydration)
  // ============================================

  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isHydrated || hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const syncFeedsFromAPI = async () => {
      try {
        const res = await fetch('/api/feeds');

        // If unauthorized or server error, silently fall back to localStorage
        if (!res.ok) {
          console.log('API sync skipped (status %d) — using localStorage only', res.status);
          return;
        }

        const apiFeeds: any[] = await res.json();

        // Don't proceed if the response isn't an array (e.g. error object)
        if (!Array.isArray(apiFeeds) || apiFeeds.length === 0) return;

        // Map API response to the full Feed shape expected by the context
        const normalizedApiFeeds: Feed[] = apiFeeds.map((af) => ({
          id: af.id,
          userId: af.userId || 'api-user',
          platform: af.platform as Platform,
          handle: af.handle,
          displayName: af.displayName || af.handle,
          avatarUrl: af.profilePictureUrl || undefined,
          isConnected: af.isConnected ?? true,
          connectionStatus: af.isConnected ? 'active' as const : 'error' as const,
          lastSync: af.lastSync || null,
          platformUserId: af.platformAccountId || undefined,
          isOAuth: true, // API-stored feeds are always OAuth-connected
          automationEnabled: af.automationEnabled ?? false,
          controlMode: (af.controlMode || 'manual') as ControlMode,
          metrics: {
            followers: af.metrics?.followers ?? 0,
            following: af.metrics?.following ?? 0,
            engagement: af.metrics?.engagement ?? 0,
            postsPerWeek: af.metrics?.postsPerWeek ?? 0,
            totalPosts: af.metrics?.postsCount ?? 0,
            uptime: af.metrics?.uptime ?? 0,
          },
          createdAt: af.createdAt || new Date().toISOString(),
          updatedAt: af.updatedAt || new Date().toISOString(),
        }));

        setFeeds((localFeeds) => {
          // Build a lookup of API feeds by handle+platform for conflict resolution
          const apiKeyMap = new Map<string, Feed>();
          for (const af of normalizedApiFeeds) {
            apiKeyMap.set(`${af.handle}::${af.platform}`, af);
          }

          // Start with all API feeds (they take priority on conflicts)
          const merged = new Map<string, Feed>();
          for (const af of normalizedApiFeeds) {
            merged.set(`${af.handle}::${af.platform}`, af);
          }

          // Add local feeds that don't conflict with API feeds
          for (const lf of localFeeds) {
            const key = `${lf.handle}::${lf.platform}`;
            if (!merged.has(key)) {
              merged.set(key, lf);
            }
          }

          const mergedArray = Array.from(merged.values());
          console.log(
            'API sync complete: %d API feeds, %d local feeds -> %d merged',
            normalizedApiFeeds.length,
            localFeeds.length,
            mergedArray.length
          );
          return mergedArray;
        });
      } catch (err) {
        // Network error or JSON parse failure — localStorage remains the source of truth
        console.warn('API sync failed (falling back to localStorage):', err);
      }
    };

    syncFeedsFromAPI();
  }, [isHydrated]);

  // Computed
  const selectedFeed = feeds.find(f => f.id === selectedFeedId) ?? null;
  const selectedContent = content.find(c => c.id === selectedContentId) ?? null;

  // ============================================
  // FEED ACTIONS
  // ============================================

  const selectFeed = useCallback((id: string | null) => {
    setSelectedFeedId(id);
  }, []);

  const addFeed = useCallback(async (payload: CreateFeedPayload): Promise<Feed> => {
    setFeedsLoading(true);
    try {
      let newFeed: Feed;

      // If this is an OAuth-connected feed with an access token, try the real API first
      if (payload.isOAuth && payload.accessToken) {
        try {
          const res = await fetch('/api/feeds/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: payload.platform,
              handle: payload.handle,
              displayName: payload.displayName,
              accessToken: payload.accessToken,
              platformUserId: payload.platformUserId,
            }),
          });

          if (res.ok) {
            const apiData = await res.json();

            // Map the API response to the full Feed shape
            newFeed = {
              id: apiData.id,
              userId: 'api-user',
              platform: (apiData.platform || payload.platform) as Platform,
              handle: apiData.handle || payload.handle,
              displayName: apiData.displayName || payload.displayName,
              avatarUrl: payload.avatarUrl,
              isConnected: apiData.isConnected ?? true,
              connectionStatus: 'active',
              lastSync: apiData.lastSync
                ? new Date(apiData.lastSync).toISOString()
                : new Date().toISOString(),
              platformUserId: payload.platformUserId,
              accessToken: payload.accessToken,
              refreshToken: payload.refreshToken,
              isOAuth: true,
              automationEnabled: apiData.automationEnabled ?? false,
              controlMode: (apiData.controlMode || 'manual') as ControlMode,
              metrics: {
                followers: apiData.followers ?? apiData.metrics?.followers ?? payload.initialMetrics?.followers ?? 0,
                following: apiData.following ?? apiData.metrics?.following ?? payload.initialMetrics?.following ?? 0,
                engagement: apiData.engagement ?? apiData.metrics?.engagement ?? 0,
                postsPerWeek: apiData.postsPerWeek ?? apiData.metrics?.postsPerWeek ?? 0,
                totalPosts: apiData.totalPosts ?? payload.initialMetrics?.totalPosts ?? 0,
                uptime: apiData.uptime ?? apiData.metrics?.uptime ?? 0,
              },
              createdAt: apiData.createdAt
                ? new Date(apiData.createdAt).toISOString()
                : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            console.log('Feed created via API:', newFeed.id);
          } else {
            // API call failed — fall back to mock
            console.warn('API addFeed failed (status %d), falling back to local', res.status);
            newFeed = generateMockFeed(payload);
          }
        } catch (apiErr) {
          // Network error — fall back to mock
          console.warn('API addFeed error, falling back to local:', apiErr);
          newFeed = generateMockFeed(payload);
        }
      } else {
        // Non-OAuth / demo feed — use local mock
        newFeed = generateMockFeed(payload);
      }

      setFeeds(prev => [...prev, newFeed]);

      // Log the feed connection
      logger.feeds.connected('demo-user', 'Demo User', payload.platform, payload.handle);

      return newFeed;
    } catch (err) {
      setFeedsError(err instanceof Error ? err.message : 'Failed to add feed');
      throw err;
    } finally {
      setFeedsLoading(false);
    }
  }, []);

  const updateFeed = useCallback(async (id: string, payload: UpdateFeedPayload): Promise<Feed> => {
    setFeedsLoading(true);
    try {
      let updatedFeed: Feed | null = null;
      setFeeds(prev =>
        prev.map(f => {
          if (f.id === id) {
            updatedFeed = { ...f, ...payload, updatedAt: new Date().toISOString() };
            return updatedFeed;
          }
          return f;
        })
      );
      if (!updatedFeed) throw new Error('Feed not found');
      return updatedFeed;
    } catch (err) {
      setFeedsError(err instanceof Error ? err.message : 'Failed to update feed');
      throw err;
    } finally {
      setFeedsLoading(false);
    }
  }, []);

  const removeFeed = useCallback(async (id: string): Promise<void> => {
    setFeedsLoading(true);
    try {
      // Get feed info before removing for logging
      const feedToRemove = feeds.find(f => f.id === id);

      // If this is an OAuth feed, try to disconnect via API
      if (feedToRemove?.isOAuth) {
        try {
          const res = await fetch('/api/feeds', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedId: id }),
          });
          if (res.ok) {
            console.log('Feed disconnected via API:', id);
          } else {
            console.warn('API removeFeed failed (status %d), removing locally', res.status);
          }
        } catch (apiErr) {
          console.warn('API removeFeed error, removing locally:', apiErr);
        }
      }

      // Always remove from local state regardless of API result
      setFeeds(prev => prev.filter(f => f.id !== id));
      if (selectedFeedId === id) setSelectedFeedId(null);

      // Log the disconnection
      if (feedToRemove) {
        logger.feeds.disconnected('demo-user', 'Demo User', feedToRemove.platform, feedToRemove.handle);
      }
    } catch (err) {
      setFeedsError(err instanceof Error ? err.message : 'Failed to remove feed');
      throw err;
    } finally {
      setFeedsLoading(false);
    }
  }, [selectedFeedId, feeds]);

  const setControlMode = useCallback(async (id: string, mode: ControlMode): Promise<void> => {
    await updateFeed(id, { controlMode: mode });
  }, [updateFeed]);

  const toggleAutomation = useCallback(async (id: string): Promise<void> => {
    const feed = feeds.find(f => f.id === id);
    if (feed) {
      await updateFeed(id, { automationEnabled: !feed.automationEnabled });

      // Log automation toggle
      if (!feed.automationEnabled) {
        logger.automation.enabled('demo-user', 'Demo User', feed.handle);
      } else {
        logger.automation.disabled('demo-user', 'Demo User', feed.handle);
      }
    }
  }, [feeds, updateFeed]);

  // ============================================
  // CONTENT ACTIONS
  // ============================================

  const selectContent = useCallback((id: string | null) => {
    setSelectedContentId(id);
  }, []);

  const addContent = useCallback(async (payload: CreateContentPayload): Promise<ContentItem> => {
    setContentLoading(true);
    try {
      // TODO: Replace with actual API call to content endpoint
      const newContent = generateMockContent(payload);
      setContent(prev => [...prev, newContent]);
      return newContent;
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Failed to add content');
      throw err;
    } finally {
      setContentLoading(false);
    }
  }, []);

  const updateContent = useCallback(async (id: string, payload: UpdateContentPayload): Promise<ContentItem> => {
    setContentLoading(true);
    try {
      // TODO: Replace with actual API call to content endpoint
      let updatedContent: ContentItem | null = null;
      setContent(prev =>
        prev.map(c => {
          if (c.id === id) {
            updatedContent = { ...c, ...payload, updatedAt: new Date().toISOString() };
            return updatedContent;
          }
          return c;
        })
      );
      if (!updatedContent) throw new Error('Content not found');
      return updatedContent;
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Failed to update content');
      throw err;
    } finally {
      setContentLoading(false);
    }
  }, []);

  const removeContent = useCallback(async (id: string): Promise<void> => {
    setContentLoading(true);
    try {
      // TODO: Replace with actual API call to content endpoint
      setContent(prev => prev.filter(c => c.id !== id));
      if (selectedContentId === id) setSelectedContentId(null);
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Failed to remove content');
      throw err;
    } finally {
      setContentLoading(false);
    }
  }, [selectedContentId]);

  // ============================================
  // UPLOAD ACTIONS
  // ============================================

  const uploadFiles = useCallback(async (files: File[], feedId?: string): Promise<ContentItem[]> => {
    const uploadedItems: ContentItem[] = [];

    for (const file of files) {
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Add to progress
      setUploadProgress(prev => [
        ...prev,
        {
          id: uploadId,
          filename: file.name,
          progress: 0,
          status: 'pending',
        },
      ]);

      try {
        // Start uploading
        setUploadProgress(prev =>
          prev.map(p => (p.id === uploadId ? { ...p, status: 'uploading' as const, progress: 10 } : p))
        );

        // Upload to Vercel Blob via API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
        if (feedId) formData.append('feedId', feedId);

        setUploadProgress(prev =>
          prev.map(p => (p.id === uploadId ? { ...p, progress: 30 } : p))
        );

        const response = await fetch('/api/content/upload', {
          method: 'POST',
          body: formData,
        });

        setUploadProgress(prev =>
          prev.map(p => (p.id === uploadId ? { ...p, progress: 80 } : p))
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || `Upload failed (${response.status})`);
        }

        const data = await response.json();
        const uploaded = data.content;

        // Determine content type
        const isVideo = file.type.startsWith('video/');
        const type = isVideo ? 'video' : 'image';

        // Also add to local content state
        const newContent = await addContent({
          type,
          title: uploaded.title || file.name.replace(/\.[^/.]+$/, ''),
          mediaUrls: [uploaded.storageUrl],
          sourceType: 'upload',
          feedId,
          metadata: {
            originalFilename: file.name,
            fileSize: file.size,
            mimeType: file.type,
            contentId: uploaded.id,
            storageUrl: uploaded.storageUrl,
          },
        });

        uploadedItems.push(newContent);

        setUploadProgress(prev =>
          prev.map(p =>
            p.id === uploadId
              ? { ...p, status: 'complete' as const, progress: 100, contentId: newContent.id }
              : p
          )
        );
      } catch (err) {
        console.error('Upload error:', err);
        setUploadProgress(prev =>
          prev.map(p =>
            p.id === uploadId
              ? { ...p, status: 'error' as const, error: err instanceof Error ? err.message : 'Upload failed' }
              : p
          )
        );
      }
    }

    // Clear completed uploads after delay
    setTimeout(() => {
      setUploadProgress(prev => prev.filter(p => p.status !== 'complete'));
    }, 3000);

    return uploadedItems;
  }, [addContent]);

  const importCSV = useCallback(async (file: File, feedId?: string): Promise<CSVImportResult> => {
    setContentLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return {
          success: false,
          totalRows: 0,
          importedCount: 0,
          skippedCount: 0,
          errors: [{ row: 0, message: 'CSV file is empty or has no data rows' }],
          items: [],
        };
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const titleIdx = headers.indexOf('title');
      const captionIdx = headers.indexOf('caption');
      const hashtagsIdx = headers.indexOf('hashtags');
      const mediaUrlIdx = headers.indexOf('mediaurl') !== -1 ? headers.indexOf('mediaurl') : headers.indexOf('media_url');
      const tagsIdx = headers.indexOf('tags');

      const items: ContentItem[] = [];
      const errors: Array<{ row: number; message: string }> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());

        try {
          const title = titleIdx !== -1 ? values[titleIdx] : `Import ${i}`;
          const caption = captionIdx !== -1 ? values[captionIdx] : undefined;
          const hashtags = hashtagsIdx !== -1 && values[hashtagsIdx]
            ? values[hashtagsIdx].split(/[,;]/).map(h => h.trim())
            : undefined;
          const mediaUrl = mediaUrlIdx !== -1 ? values[mediaUrlIdx] : undefined;
          const tags = tagsIdx !== -1 && values[tagsIdx]
            ? values[tagsIdx].split(/[,;]/).map(t => t.trim())
            : [];

          const newContent = await addContent({
            type: mediaUrl ? 'image' : 'text',
            title,
            caption,
            hashtags,
            mediaUrls: mediaUrl ? [mediaUrl] : [],
            tags,
            sourceType: 'csv',
            feedId,
            metadata: { csvRowIndex: i },
          });

          items.push(newContent);
        } catch (err) {
          errors.push({
            row: i,
            message: err instanceof Error ? err.message : 'Failed to import row',
          });
        }
      }

      return {
        success: errors.length === 0,
        totalRows: lines.length - 1,
        importedCount: items.length,
        skippedCount: errors.length,
        errors,
        items,
      };
    } catch (err) {
      return {
        success: false,
        totalRows: 0,
        importedCount: 0,
        skippedCount: 0,
        errors: [{ row: 0, message: err instanceof Error ? err.message : 'Failed to parse CSV' }],
        items: [],
      };
    } finally {
      setContentLoading(false);
    }
  }, [addContent]);

  const cancelUpload = useCallback((uploadId: string) => {
    setUploadProgress(prev => prev.filter(p => p.id !== uploadId));
  }, []);

  // ============================================
  // BULK ACTIONS
  // ============================================

  const removeMultipleContent = useCallback(async (ids: string[]): Promise<void> => {
    setContentLoading(true);
    try {
      // TODO: Replace with actual API call to content endpoint
      setContent(prev => prev.filter(c => !ids.includes(c.id)));
      if (selectedContentId && ids.includes(selectedContentId)) {
        setSelectedContentId(null);
      }
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Failed to remove content');
      throw err;
    } finally {
      setContentLoading(false);
    }
  }, [selectedContentId]);

  const assignContentToFeed = useCallback(async (contentIds: string[], feedId: string): Promise<void> => {
    setContentLoading(true);
    try {
      // TODO: Replace with actual API call to content endpoint
      setContent(prev =>
        prev.map(c =>
          contentIds.includes(c.id)
            ? { ...c, feedId, updatedAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Failed to assign content');
      throw err;
    } finally {
      setContentLoading(false);
    }
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: FeedsContextType = {
    // Feeds state
    feeds,
    selectedFeedId,
    selectedFeed,
    feedsLoading,
    feedsError,

    // Content state
    content,
    selectedContentId,
    selectedContent,
    contentLoading,
    contentError,
    contentFilters,
    uploadProgress,

    // Feed actions
    selectFeed,
    addFeed,
    updateFeed,
    removeFeed,
    setControlMode,
    toggleAutomation,

    // Content actions
    selectContent,
    addContent,
    updateContent,
    removeContent,
    setContentFilters,

    // Upload actions
    uploadFiles,
    importCSV,
    cancelUpload,

    // Bulk actions
    removeMultipleContent,
    assignContentToFeed,
  };

  return (
    <FeedsContext.Provider value={value}>
      {children}
    </FeedsContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useFeeds() {
  const context = useContext(FeedsContext);
  if (!context) {
    throw new Error('useFeeds must be used within a FeedsProvider');
  }
  return context;
}
