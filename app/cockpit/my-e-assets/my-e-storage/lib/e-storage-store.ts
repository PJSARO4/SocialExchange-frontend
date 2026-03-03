'use client';

import { EStorageItemMeta, EStorageFolder } from '../types/e-storage';

// ============================================
// LOCALSTORAGE KEYS
// ============================================

const KEYS = {
  ITEMS: 'sx_e_storage_items',
  FOLDERS: 'sx_e_storage_folders',
} as const;

// ============================================
// GENERIC HELPERS (matching codebase pattern)
// ============================================

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================
// ITEMS (metadata index)
// ============================================

export function getStorageItems(): EStorageItemMeta[] {
  return getStorage<EStorageItemMeta[]>(KEYS.ITEMS, []);
}

export function saveStorageItems(items: EStorageItemMeta[]): void {
  setStorage(KEYS.ITEMS, items);
}

export function getItemById(id: string): EStorageItemMeta | undefined {
  return getStorageItems().find((i) => i.id === id);
}

export function addStorageItem(item: EStorageItemMeta): void {
  const items = getStorageItems();
  items.push(item);
  saveStorageItems(items);
}

export function updateStorageItem(
  id: string,
  updates: Partial<EStorageItemMeta>
): void {
  const items = getStorageItems();
  const index = items.findIndex((i) => i.id === id);
  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStorageItems(items);
  }
}

export function removeStorageItem(id: string): void {
  const items = getStorageItems().filter((i) => i.id !== id);
  saveStorageItems(items);
}

// ============================================
// FOLDERS
// ============================================

const DEFAULT_FOLDERS: EStorageFolder[] = [
  { name: 'Unsorted', color: '#6b7280', itemCount: 0 },
];

export function getFolders(): EStorageFolder[] {
  return getStorage<EStorageFolder[]>(KEYS.FOLDERS, DEFAULT_FOLDERS);
}

export function saveFolders(folders: EStorageFolder[]): void {
  setStorage(KEYS.FOLDERS, folders);
}

export function addFolder(name: string, color?: string): void {
  const folders = getFolders();
  if (!folders.find((f) => f.name === name)) {
    folders.push({ name, color: color || '#3fffdc', itemCount: 0 });
    saveFolders(folders);
  }
}

export function removeFolder(name: string): void {
  if (name === 'Unsorted') return; // Cannot delete default
  const folders = getFolders().filter((f) => f.name !== name);
  saveFolders(folders);
  // Move items from deleted folder to Unsorted
  const items = getStorageItems();
  let changed = false;
  items.forEach((i) => {
    if (i.folder === name) {
      i.folder = 'Unsorted';
      changed = true;
    }
  });
  if (changed) saveStorageItems(items);
}

// ============================================
// HELPERS
// ============================================

export function getItemsByFolder(folder: string): EStorageItemMeta[] {
  return getStorageItems().filter((i) => i.folder === folder);
}

export function getItemsByTag(tag: string): EStorageItemMeta[] {
  return getStorageItems().filter((i) => i.tags.includes(tag));
}

export function getAllTags(): string[] {
  const items = getStorageItems();
  const tagSet = new Set<string>();
  items.forEach((i) => i.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export function recalculateFolderCounts(): void {
  const items = getStorageItems();
  const folders = getFolders();
  folders.forEach((f) => {
    f.itemCount = items.filter((i) => i.folder === f.name).length;
  });
  saveFolders(folders);
}
