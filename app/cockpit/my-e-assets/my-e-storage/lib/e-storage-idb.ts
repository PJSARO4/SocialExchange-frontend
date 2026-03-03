'use client';

import { openDB, type IDBPDatabase } from 'idb';

// ============================================
// INDEXEDDB ENGINE FOR BINARY BLOB STORAGE
// ============================================

const DB_NAME = 'sx_e_storage';
const DB_VERSION = 1;
const BLOBS_STORE = 'blobs';
const THUMBS_STORE = 'thumbnails';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available on server'));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(BLOBS_STORE)) {
          db.createObjectStore(BLOBS_STORE);
        }
        if (!db.objectStoreNames.contains(THUMBS_STORE)) {
          db.createObjectStore(THUMBS_STORE);
        }
      },
    });
  }
  return dbPromise;
}

// ============================================
// BLOB OPERATIONS
// ============================================

export async function storeBlob(key: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put(BLOBS_STORE, blob, key);
}

export async function getBlob(key: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get(BLOBS_STORE, key);
}

export async function deleteBlob(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(BLOBS_STORE, key);
}

// ============================================
// THUMBNAIL OPERATIONS
// ============================================

export async function storeThumbnail(key: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put(THUMBS_STORE, blob, key);
}

export async function getThumbnail(key: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get(THUMBS_STORE, key);
}

export async function deleteThumbnail(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(THUMBS_STORE, key);
}

// ============================================
// BULK OPERATIONS
// ============================================

export async function clearAllBlobs(): Promise<void> {
  const db = await getDB();
  await db.clear(BLOBS_STORE);
  await db.clear(THUMBS_STORE);
}

// ============================================
// STORAGE QUOTA ESTIMATE
// ============================================

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
}> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.storage &&
    navigator.storage.estimate
  ) {
    const est = await navigator.storage.estimate();
    return { usage: est.usage || 0, quota: est.quota || 0 };
  }
  return { usage: 0, quota: 0 };
}
