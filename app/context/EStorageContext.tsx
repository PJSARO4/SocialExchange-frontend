'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  EStorageItemMeta,
  EStorageStats,
  EStorageFilters,
  EStorageFolder,
  StorageItemType,
  StorageSource,
} from '@/app/cockpit/my-e-assets/my-e-storage/types/e-storage';
import * as store from '@/app/cockpit/my-e-assets/my-e-storage/lib/e-storage-store';
import * as idb from '@/app/cockpit/my-e-assets/my-e-storage/lib/e-storage-idb';
import {
  generateImageThumbnail,
  generateVideoThumbnail,
} from '@/app/cockpit/my-e-assets/my-e-storage/lib/thumbnail-utils';

// ============================================
// CONTEXT TYPE
// ============================================

interface EStorageContextType {
  // State
  items: EStorageItemMeta[];
  folders: EStorageFolder[];
  stats: EStorageStats | null;
  isLoading: boolean;

  // CRUD
  addFiles: (
    files: File[],
    folder?: string,
    tags?: string[],
    source?: StorageSource
  ) => Promise<EStorageItemMeta[]>;
  addFromUrl: (
    url: string,
    filename?: string,
    folder?: string,
    tags?: string[]
  ) => Promise<EStorageItemMeta | null>;
  addFromBlob: (
    blob: Blob,
    filename: string,
    meta?: Partial<EStorageItemMeta>
  ) => Promise<EStorageItemMeta>;
  removeItem: (id: string) => Promise<void>;
  removeMultiple: (ids: string[]) => Promise<void>;
  updateItem: (id: string, updates: Partial<EStorageItemMeta>) => void;
  moveToFolder: (ids: string[], folder: string) => void;

  // Retrieval
  getBlobUrl: (blobKey: string) => Promise<string | null>;
  getThumbnailUrl: (thumbKey: string) => Promise<string | null>;

  // Folders
  createFolder: (name: string, color?: string) => void;
  deleteFolder: (name: string) => void;

  // Filtering
  getFiltered: (filters: EStorageFilters) => EStorageItemMeta[];

  // Quota
  refreshStats: () => Promise<void>;

  // Bulk
  clearAll: () => Promise<void>;
  exportItem: (id: string) => Promise<File | null>;
}

// ============================================
// CONTEXT
// ============================================

const EStorageContext = createContext<EStorageContextType | null>(null);

// ============================================
// HELPERS
// ============================================

function generateId(): string {
  return `es-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function detectType(mimeType: string): StorageItemType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('text/')) return 'text';
  return 'document';
}

// ============================================
// PROVIDER
// ============================================

export function EStorageProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<EStorageItemMeta[]>([]);
  const [folders, setFolders] = useState<EStorageFolder[]>([]);
  const [stats, setStats] = useState<EStorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(store.getStorageItems());
    setFolders(store.getFolders());
    setIsHydrated(true);
    setIsLoading(false);
  }, []);

  // Persist items whenever they change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      store.saveStorageItems(items);
      store.recalculateFolderCounts();
      setFolders(store.getFolders());
    }
  }, [items, isHydrated]);

  // ============================================
  // ADD FILES (drag-drop / file picker)
  // ============================================

  const addFiles = useCallback(
    async (
      files: File[],
      folder = 'Unsorted',
      tags: string[] = [],
      source: StorageSource = 'upload'
    ): Promise<EStorageItemMeta[]> => {
      const newItems: EStorageItemMeta[] = [];

      for (const file of files) {
        const id = generateId();
        const blobKey = `blob-${id}`;
        const thumbKey = `thumb-${id}`;

        // Store binary in IndexedDB
        await idb.storeBlob(blobKey, file);

        // Generate thumbnail for images/videos
        let thumbnailBlobKey: string | undefined;
        try {
          let thumbBlob: Blob | undefined;
          if (file.type.startsWith('image/')) {
            thumbBlob = await generateImageThumbnail(file);
          } else if (file.type.startsWith('video/')) {
            thumbBlob = await generateVideoThumbnail(file);
          }
          if (thumbBlob) {
            await idb.storeThumbnail(thumbKey, thumbBlob);
            thumbnailBlobKey = thumbKey;
          }
        } catch {
          // Thumbnail generation is non-critical
        }

        const type = detectType(file.type);
        const now = new Date().toISOString();

        const meta: EStorageItemMeta = {
          id,
          userId: 'current-user',
          type,
          title: file.name.replace(/\.[^.]+$/, ''),
          folder,
          tags,
          source,
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
          blobKey,
          thumbnailBlobKey,
          createdAt: now,
          updatedAt: now,
        };

        newItems.push(meta);
      }

      setItems((prev) => [...prev, ...newItems]);
      return newItems;
    },
    []
  );

  // ============================================
  // ADD FROM URL (scraped content)
  // ============================================

  const addFromUrl = useCallback(
    async (
      url: string,
      filename?: string,
      folder = 'Unsorted',
      tags: string[] = []
    ): Promise<EStorageItemMeta | null> => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;

        const blob = await res.blob();
        const inferredName =
          filename || url.split('/').pop()?.split('?')[0] || 'download';

        const id = generateId();
        const blobKey = `blob-${id}`;
        const thumbKey = `thumb-${id}`;

        await idb.storeBlob(blobKey, blob);

        // Generate thumbnail
        let thumbnailBlobKey: string | undefined;
        try {
          if (blob.type.startsWith('image/')) {
            const file = new File([blob], inferredName, { type: blob.type });
            const thumbBlob = await generateImageThumbnail(file);
            await idb.storeThumbnail(thumbKey, thumbBlob);
            thumbnailBlobKey = thumbKey;
          }
        } catch {
          // Non-critical
        }

        const type = detectType(blob.type);
        const now = new Date().toISOString();

        const meta: EStorageItemMeta = {
          id,
          userId: 'current-user',
          type,
          title: inferredName.replace(/\.[^.]+$/, ''),
          folder,
          tags,
          source: 'scrape',
          sourceUrl: url,
          filename: inferredName,
          mimeType: blob.type,
          fileSize: blob.size,
          blobKey,
          thumbnailBlobKey,
          createdAt: now,
          updatedAt: now,
        };

        setItems((prev) => [...prev, meta]);
        return meta;
      } catch (err) {
        console.error('[e-storage] Failed to add from URL:', err);
        return null;
      }
    },
    []
  );

  // ============================================
  // ADD FROM BLOB (programmatic)
  // ============================================

  const addFromBlob = useCallback(
    async (
      blob: Blob,
      filename: string,
      overrides?: Partial<EStorageItemMeta>
    ): Promise<EStorageItemMeta> => {
      const id = generateId();
      const blobKey = `blob-${id}`;
      const thumbKey = `thumb-${id}`;

      await idb.storeBlob(blobKey, blob);

      let thumbnailBlobKey: string | undefined;
      try {
        if (blob.type.startsWith('image/')) {
          const file = new File([blob], filename, { type: blob.type });
          const thumbBlob = await generateImageThumbnail(file);
          await idb.storeThumbnail(thumbKey, thumbBlob);
          thumbnailBlobKey = thumbKey;
        }
      } catch {
        // Non-critical
      }

      const type = detectType(blob.type);
      const now = new Date().toISOString();

      const meta: EStorageItemMeta = {
        id,
        userId: 'current-user',
        type,
        title: filename.replace(/\.[^.]+$/, ''),
        folder: 'Unsorted',
        tags: [],
        source: 'api',
        filename,
        mimeType: blob.type,
        fileSize: blob.size,
        blobKey,
        thumbnailBlobKey,
        createdAt: now,
        updatedAt: now,
        ...overrides,
      };

      setItems((prev) => [...prev, meta]);
      return meta;
    },
    []
  );

  // ============================================
  // REMOVE
  // ============================================

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        // Clean up IndexedDB blobs
        idb.deleteBlob(item.blobKey).catch(() => {});
        if (item.thumbnailBlobKey) {
          idb.deleteThumbnail(item.thumbnailBlobKey).catch(() => {});
        }
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const removeMultiple = useCallback(async (ids: string[]) => {
    const idSet = new Set(ids);
    setItems((prev) => {
      prev.forEach((item) => {
        if (idSet.has(item.id)) {
          idb.deleteBlob(item.blobKey).catch(() => {});
          if (item.thumbnailBlobKey) {
            idb.deleteThumbnail(item.thumbnailBlobKey).catch(() => {});
          }
        }
      });
      return prev.filter((i) => !idSet.has(i.id));
    });
  }, []);

  // ============================================
  // UPDATE
  // ============================================

  const updateItem = useCallback(
    (id: string, updates: Partial<EStorageItemMeta>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        )
      );
    },
    []
  );

  const moveToFolder = useCallback((ids: string[], folder: string) => {
    const idSet = new Set(ids);
    setItems((prev) =>
      prev.map((item) =>
        idSet.has(item.id)
          ? { ...item, folder, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  // ============================================
  // RETRIEVAL (Object URLs from IndexedDB)
  // ============================================

  const getBlobUrl = useCallback(
    async (blobKey: string): Promise<string | null> => {
      try {
        const blob = await idb.getBlob(blobKey);
        return blob ? URL.createObjectURL(blob) : null;
      } catch {
        return null;
      }
    },
    []
  );

  const getThumbnailUrl = useCallback(
    async (thumbKey: string): Promise<string | null> => {
      try {
        const blob = await idb.getThumbnail(thumbKey);
        return blob ? URL.createObjectURL(blob) : null;
      } catch {
        return null;
      }
    },
    []
  );

  // ============================================
  // FOLDERS
  // ============================================

  const createFolder = useCallback(
    (name: string, color?: string) => {
      store.addFolder(name, color);
      setFolders(store.getFolders());
    },
    []
  );

  const deleteFolder = useCallback(
    (name: string) => {
      store.removeFolder(name);
      setFolders(store.getFolders());
      // Update items state to reflect folder changes
      setItems(store.getStorageItems());
    },
    []
  );

  // ============================================
  // FILTERING
  // ============================================

  const getFiltered = useCallback(
    (filters: EStorageFilters): EStorageItemMeta[] => {
      let result = [...items];

      if (filters.type) {
        result = result.filter((i) => i.type === filters.type);
      }
      if (filters.folder) {
        result = result.filter((i) => i.folder === filters.folder);
      }
      if (filters.tags && filters.tags.length > 0) {
        result = result.filter((i) =>
          filters.tags!.some((t) => i.tags.includes(t))
        );
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (i) =>
            i.title.toLowerCase().includes(q) ||
            i.filename.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q) ||
            i.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (filters.dateFrom) {
        result = result.filter((i) => i.createdAt >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        result = result.filter((i) => i.createdAt <= filters.dateTo!);
      }

      // Sort
      const sortBy = filters.sortBy || 'date';
      const sortDir = filters.sortDir || 'desc';
      result.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case 'name':
            cmp = a.title.localeCompare(b.title);
            break;
          case 'size':
            cmp = a.fileSize - b.fileSize;
            break;
          case 'type':
            cmp = a.type.localeCompare(b.type);
            break;
          case 'date':
          default:
            cmp = a.createdAt.localeCompare(b.createdAt);
            break;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });

      return result;
    },
    [items]
  );

  // ============================================
  // QUOTA / STATS
  // ============================================

  const refreshStats = useCallback(async () => {
    const estimate = await idb.getStorageEstimate();
    const totalSizeBytes = items.reduce((sum, i) => sum + i.fileSize, 0);
    const byType: Record<StorageItemType, number> = {
      image: 0,
      video: 0,
      audio: 0,
      text: 0,
      link: 0,
      document: 0,
    };
    items.forEach((i) => {
      byType[i.type] = (byType[i.type] || 0) + 1;
    });

    setStats({
      totalItems: items.length,
      totalSizeBytes,
      quotaBytes: estimate.quota,
      usedPercent: estimate.quota > 0 ? (estimate.usage / estimate.quota) * 100 : 0,
      byType,
    });
  }, [items]);

  // ============================================
  // BULK
  // ============================================

  const clearAll = useCallback(async () => {
    await idb.clearAllBlobs();
    setItems([]);
    store.saveStorageItems([]);
  }, []);

  const exportItem = useCallback(
    async (id: string): Promise<File | null> => {
      const item = items.find((i) => i.id === id);
      if (!item) return null;

      const blob = await idb.getBlob(item.blobKey);
      if (!blob) return null;

      return new File([blob], item.filename, { type: item.mimeType });
    },
    [items]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <EStorageContext.Provider
      value={{
        items,
        folders,
        stats,
        isLoading,
        addFiles,
        addFromUrl,
        addFromBlob,
        removeItem,
        removeMultiple,
        updateItem,
        moveToFolder,
        getBlobUrl,
        getThumbnailUrl,
        createFolder,
        deleteFolder,
        getFiltered,
        refreshStats,
        clearAll,
        exportItem,
      }}
    >
      {children}
    </EStorageContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useEStorage(): EStorageContextType {
  const ctx = useContext(EStorageContext);
  if (!ctx) {
    throw new Error('useEStorage must be used within EStorageProvider');
  }
  return ctx;
}
