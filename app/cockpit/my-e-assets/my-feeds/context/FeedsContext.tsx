'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
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
  automationEnabled: false,
  controlMode: 'manual',
  metrics: {
    followers: Math.floor(Math.random() * 10000),
    following: Math.floor(Math.random() * 1000),
    engagement: Math.round(Math.random() * 10 * 100) / 100,
    postsPerWeek: Math.floor(Math.random() * 10),
    totalPosts: Math.floor(Math.random() * 500),
    uptime: 99.5,
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

export function FeedsProvider({ children }: { children: ReactNode }) {
  // Feeds state
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [feedsLoading, setFeedsLoading] = useState(false);
  const [feedsError, setFeedsError] = useState<string | null>(null);

  // Content state
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentFilters, setContentFilters] = useState<ContentFilters>({});
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const newFeed = generateMockFeed(payload);
      setFeeds(prev => [...prev, newFeed]);
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setFeeds(prev => prev.filter(f => f.id !== id));
      if (selectedFeedId === id) setSelectedFeedId(null);
    } catch (err) {
      setFeedsError(err instanceof Error ? err.message : 'Failed to remove feed');
      throw err;
    } finally {
      setFeedsLoading(false);
    }
  }, [selectedFeedId]);

  const setControlMode = useCallback(async (id: string, mode: ControlMode): Promise<void> => {
    await updateFeed(id, { controlMode: mode });
  }, [updateFeed]);

  const toggleAutomation = useCallback(async (id: string): Promise<void> => {
    const feed = feeds.find(f => f.id === id);
    if (feed) {
      await updateFeed(id, { automationEnabled: !feed.automationEnabled });
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
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
        // Simulate upload progress
        setUploadProgress(prev =>
          prev.map(p => (p.id === uploadId ? { ...p, status: 'uploading' as const } : p))
        );

        // Simulate chunked upload
        for (let i = 0; i <= 100; i += 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev =>
            prev.map(p => (p.id === uploadId ? { ...p, progress: i } : p))
          );
        }

        // Determine content type
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');
        const type = isVideo ? 'video' : isImage ? 'image' : 'text';

        // Create content item
        // TODO: Replace with actual upload to storage
        const fakeUrl = URL.createObjectURL(file);
        const newContent = await addContent({
          type,
          title: file.name.replace(/\.[^/.]+$/, ''),
          mediaUrls: [fakeUrl],
          sourceType: 'upload',
          feedId,
          metadata: {
            originalFilename: file.name,
            fileSize: file.size,
            mimeType: file.type,
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
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
