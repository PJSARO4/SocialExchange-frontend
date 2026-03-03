'use client';

import { useState, useMemo, useCallback } from 'react';
import { useEStorage } from '@/app/context/EStorageContext';
import StorageDropZone from './components/StorageDropZone';
import StorageItemCard from './components/StorageItemCard';
import QuotaBar from './components/QuotaBar';
import type { EStorageFilters, StorageItemType, EStorageItemMeta } from './types/e-storage';
import { formatBytes, getTypeIcon } from './lib/thumbnail-utils';
import OrganismEStorageIntegration from './organism/components/OrganismEStorageIntegration';

// ============================================
// MY E-STORAGE CONTENT
// Can be rendered as standalone page or within My Feeds tab
// ============================================

interface MyEStorageContentProps {
  embedded?: boolean; // true when rendered as My Feeds tab
}

export default function MyEStorageContent({ embedded = false }: MyEStorageContentProps) {
  const {
    items,
    folders,
    getFiltered,
    createFolder,
    deleteFolder,
    moveToFolder,
    removeMultiple,
    updateItem,
  } = useEStorage();

  const [filters, setFilters] = useState<EStorageFilters>({
    sortBy: 'date',
    sortDir: 'desc',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState<EStorageItemMeta | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  const filteredItems = useMemo(
    () => getFiltered(filters),
    [getFiltered, filters]
  );

  const typeFilters: { label: string; value: StorageItemType | undefined }[] = [
    { label: 'All', value: undefined },
    { label: 'Images', value: 'image' },
    { label: 'Videos', value: 'video' },
    { label: 'Audio', value: 'audio' },
    { label: 'Docs', value: 'document' },
    { label: 'Text', value: 'text' },
  ];

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  }, [selectedIds.size, filteredItems]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await removeMultiple(Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds, removeMultiple]);

  const handleMoveSelected = useCallback(
    (folder: string) => {
      if (selectedIds.size === 0) return;
      moveToFolder(Array.from(selectedIds), folder);
      setSelectedIds(new Set());
      setShowMoveMenu(false);
    },
    [selectedIds, moveToFolder]
  );

  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  }, [newFolderName, createFolder]);

  return (
    <div className={`e-storage ${embedded ? 'e-storage-embedded' : ''}`}>
      {/* Header */}
      <div className="e-storage-header">
        <div className="e-storage-title-row">
          <div>
            <h2 className="e-storage-title">
              {embedded ? 'E-STORAGE' : 'MY E-STORAGE'}
            </h2>
            <p className="e-storage-subtitle">
              Device-stored content &middot; Drag & drop, scrape, or import via
              API
            </p>
          </div>
          <QuotaBar compact />
        </div>
      </div>

      {/* Toolbar */}
      <div className="e-storage-toolbar">
        {/* Search */}
        <input
          type="text"
          className="e-storage-search"
          placeholder="Search files..."
          value={filters.search || ''}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value || undefined }))
          }
        />

        {/* Type Filters */}
        <div className="e-storage-type-filters">
          {typeFilters.map((tf) => (
            <button
              key={tf.label}
              className={`e-storage-type-btn ${
                filters.type === tf.value ? 'active' : ''
              }`}
              onClick={() => setFilters((f) => ({ ...f, type: tf.value }))}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          className="e-storage-sort"
          value={`${filters.sortBy || 'date'}-${filters.sortDir || 'desc'}`}
          onChange={(e) => {
            const [sortBy, sortDir] = e.target.value.split('-') as [
              EStorageFilters['sortBy'],
              EStorageFilters['sortDir']
            ];
            setFilters((f) => ({ ...f, sortBy, sortDir }));
          }}
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="size-desc">Largest First</option>
          <option value="size-asc">Smallest First</option>
        </select>

        {/* View Toggle */}
        <div className="e-storage-view-toggle">
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            ▦
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Bulk Actions (when items selected) */}
      {selectedIds.size > 0 && (
        <div className="e-storage-bulk-bar">
          <span className="e-storage-bulk-count">
            {selectedIds.size} selected
          </span>
          <button className="e-storage-bulk-btn" onClick={handleSelectAll}>
            {selectedIds.size === filteredItems.length
              ? 'Deselect All'
              : 'Select All'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              className="e-storage-bulk-btn"
              onClick={() => setShowMoveMenu(!showMoveMenu)}
            >
              Move to...
            </button>
            {showMoveMenu && (
              <div className="e-storage-move-menu">
                {folders.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => handleMoveSelected(f.name)}
                    className="e-storage-move-item"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="e-storage-bulk-btn danger"
            onClick={handleDeleteSelected}
          >
            Delete
          </button>
        </div>
      )}

      {/* Main Body */}
      <div className="e-storage-body">
        {/* Folder Sidebar */}
        <aside className="e-storage-sidebar">
          <div className="e-storage-sidebar-title">FOLDERS</div>

          <button
            className={`e-storage-folder-item ${
              !filters.folder ? 'active' : ''
            }`}
            onClick={() => setFilters((f) => ({ ...f, folder: undefined }))}
          >
            <span className="folder-icon" style={{ color: '#3fffdc' }}>
              {'📁'}
            </span>
            <span className="folder-name">All Files</span>
            <span className="folder-count">{items.length}</span>
          </button>

          {folders.map((f) => (
            <div key={f.name} className="e-storage-folder-row">
              <button
                className={`e-storage-folder-item ${
                  filters.folder === f.name ? 'active' : ''
                }`}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    folder: prev.folder === f.name ? undefined : f.name,
                  }))
                }
              >
                <span
                  className="folder-icon"
                  style={{ color: f.color || '#6b7280' }}
                >
                  {'📂'}
                </span>
                <span className="folder-name">{f.name}</span>
                <span className="folder-count">{f.itemCount}</span>
              </button>
              {f.name !== 'Unsorted' && (
                <button
                  className="e-storage-folder-delete"
                  onClick={() => deleteFolder(f.name)}
                  title="Delete folder"
                >
                  {'✕'}
                </button>
              )}
            </div>
          ))}

          {/* New Folder */}
          {showNewFolder ? (
            <div className="e-storage-new-folder">
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="e-storage-new-folder-input"
                autoFocus
              />
              <button
                onClick={handleCreateFolder}
                className="e-storage-new-folder-confirm"
              >
                {'✓'}
              </button>
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName('');
                }}
                className="e-storage-new-folder-cancel"
              >
                {'✕'}
              </button>
            </div>
          ) : (
            <button
              className="e-storage-add-folder"
              onClick={() => setShowNewFolder(true)}
            >
              + New Folder
            </button>
          )}

          {/* Tags Section */}
          {items.length > 0 && (
            <div className="e-storage-tags-section">
              <div className="e-storage-sidebar-title">TAGS</div>
              <div className="e-storage-tags-cloud">
                {Array.from(
                  new Set(items.flatMap((i) => i.tags))
                )
                  .slice(0, 15)
                  .map((tag) => (
                    <button
                      key={tag}
                      className={`e-storage-tag ${
                        filters.tags?.includes(tag) ? 'active' : ''
                      }`}
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          tags: f.tags?.includes(tag)
                            ? f.tags.filter((t) => t !== tag)
                            : [...(f.tags || []), tag],
                        }))
                      }
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="e-storage-main">
          {/* Drop Zone */}
          <StorageDropZone
            folder={filters.folder || 'Unsorted'}
            compact={items.length > 0}
          />

          {/* Items */}
          {filteredItems.length === 0 && items.length > 0 ? (
            <div className="e-storage-empty">
              <span className="e-storage-empty-icon">{'🔍'}</span>
              <span className="e-storage-empty-text">
                No items match your filters
              </span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="e-storage-empty">
              <span className="e-storage-empty-icon">{'💾'}</span>
              <span className="e-storage-empty-title">E-STORAGE IS EMPTY</span>
              <span className="e-storage-empty-text">
                Drag & drop files above, or use the API to store content.
                <br />
                All files are stored on your device.
              </span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="e-storage-grid">
              {filteredItems.map((item) => (
                <StorageItemCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onSelect={handleSelect}
                  viewMode="grid"
                />
              ))}
            </div>
          ) : (
            <div className="e-storage-list">
              {filteredItems.map((item) => (
                <StorageItemCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onSelect={handleSelect}
                  viewMode="list"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SYN Organism — The Grid + Panel */}
      <OrganismEStorageIntegration />
    </div>
  );
}
