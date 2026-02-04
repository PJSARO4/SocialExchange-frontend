'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Feed } from '../FeedsContext';

interface ContentItem {
  id: string;
  type: 'image' | 'video' | 'carousel';
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  uploadedAt: Date;
  tags: string[];
  usedCount: number;
  lastUsedAt?: Date;
  aiCaption?: string;
  status: 'ready' | 'processing' | 'error';
}

interface ContentLibraryModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
  onSelectContent?: (items: ContentItem[]) => void;
  selectionMode?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'name' | 'size' | 'unused';
type FilterType = 'all' | 'image' | 'video' | 'carousel' | 'unused';

export default function ContentLibraryModal({
  feed,
  isOpen,
  onClose,
  onSelectContent,
  selectionMode = false,
}: ContentLibraryModalProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load content from API/localStorage
  useEffect(() => {
    const loadContent = async () => {
      try {
        // Try API first
        const response = await fetch(`/api/content?feed_id=${feed.id}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.items || []);
        } else {
          // Fallback to localStorage for demo
          const saved = localStorage.getItem(`content_library_${feed.id}`);
          if (saved) {
            setContent(JSON.parse(saved));
          }
        }
      } catch {
        // Use localStorage fallback
        const saved = localStorage.getItem(`content_library_${feed.id}`);
        if (saved) {
          setContent(JSON.parse(saved));
        }
      }
    };

    if (isOpen) {
      loadContent();
    }
  }, [feed.id, isOpen]);

  // Save content to localStorage (demo)
  const saveContent = useCallback((items: ContentItem[]) => {
    setContent(items);
    localStorage.setItem(`content_library_${feed.id}`, JSON.stringify(items));
  }, [feed.id]);

  // Handle file upload
  const handleUpload = async (files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    const newItems: ContentItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));

      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        continue;
      }

      // Create object URL for preview
      const url = URL.createObjectURL(file);

      // Get dimensions for images
      let width, height, duration;
      if (file.type.startsWith('image/')) {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = url;
        });
        width = img.width;
        height = img.height;
      }

      const item: ContentItem = {
        id: `content_${Date.now()}_${i}`,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url,
        thumbnailUrl: url,
        filename: file.name,
        size: file.size,
        width,
        height,
        duration,
        uploadedAt: new Date(),
        tags: [],
        usedCount: 0,
        status: 'ready',
      };

      newItems.push(item);
    }

    saveContent([...newItems, ...content]);
    setIsUploading(false);
    setUploadProgress(0);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  // Toggle item selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Select all
  const selectAll = () => {
    setSelectedItems(new Set(filteredContent.map((item) => item.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Delete selected items
  const deleteSelected = () => {
    const newContent = content.filter((item) => !selectedItems.has(item.id));
    saveContent(newContent);
    setSelectedItems(new Set());
  };

  // Generate AI captions for selected
  const generateCaptions = async () => {
    setIsGeneratingCaptions(true);

    for (const id of selectedItems) {
      const item = content.find((c) => c.id === id);
      if (!item || item.aiCaption) continue;

      try {
        const response = await fetch('/api/copilot/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'caption',
            imageUrl: item.url,
            context: { handle: feed.handle },
          }),
        });
        const data = await response.json();

        const newContent = content.map((c) =>
          c.id === id ? { ...c, aiCaption: data.content } : c
        );
        saveContent(newContent);
      } catch (error) {
        console.error('Failed to generate caption:', error);
      }
    }

    setIsGeneratingCaptions(false);
  };

  // Filter and sort content
  const filteredContent = content
    .filter((item) => {
      if (filterType !== 'all' && filterType !== 'unused' && item.type !== filterType) {
        return false;
      }
      if (filterType === 'unused' && item.usedCount > 0) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.filename.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case 'oldest':
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'size':
          return b.size - a.size;
        case 'unused':
          return a.usedCount - b.usedCount;
        default:
          return 0;
      }
    });

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="content-library-overlay">
      <div className="content-library-modal">
        {/* Header */}
        <div className="library-header">
          <div className="header-title">
            <h2>📁 Content Library</h2>
            <span className="content-count">{content.length} items</span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Toolbar */}
        <div className="library-toolbar">
          <div className="toolbar-left">
            <button
              className="btn-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              ⬆️ Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
              style={{ display: 'none' }}
            />

            <div className="filter-group">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="unused">Unused</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">By Name</option>
                <option value="size">By Size</option>
                <option value="unused">Least Used</option>
              </select>
            </div>
          </div>

          <div className="toolbar-center">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="toolbar-right">
            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
              >
                ⊞
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Selection toolbar */}
        {selectedItems.size > 0 && (
          <div className="selection-toolbar">
            <span className="selection-count">{selectedItems.size} selected</span>
            <button className="btn-small" onClick={selectAll}>Select All</button>
            <button className="btn-small" onClick={clearSelection}>Clear</button>
            <button
              className="btn-small"
              onClick={generateCaptions}
              disabled={isGeneratingCaptions}
            >
              {isGeneratingCaptions ? '⏳ Generating...' : '✨ Generate Captions'}
            </button>
            <button className="btn-small btn-danger" onClick={deleteSelected}>
              🗑️ Delete
            </button>
            {selectionMode && (
              <button
                className="btn-primary"
                onClick={() => {
                  const items = content.filter((c) => selectedItems.has(c.id));
                  onSelectContent?.(items);
                  onClose();
                }}
              >
                Use Selected ({selectedItems.size})
              </button>
            )}
          </div>
        )}

        {/* Content area */}
        <div
          className={`library-content ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Upload progress */}
          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span>Uploading... {uploadProgress}%</span>
            </div>
          )}

          {/* Drag overlay */}
          {dragActive && (
            <div className="drag-overlay">
              <div className="drag-message">
                <span className="drag-icon">📁</span>
                <p>Drop files here to upload</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {filteredContent.length === 0 && !isUploading && (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No content yet</h3>
              <p>Upload images or videos to get started</p>
              <button
                className="btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                ⬆️ Upload Content
              </button>
            </div>
          )}

          {/* Grid view */}
          {viewMode === 'grid' && filteredContent.length > 0 && (
            <div className="content-grid">
              {filteredContent.map((item) => (
                <div
                  key={item.id}
                  className={`content-card ${selectedItems.has(item.id) ? 'selected' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                  onDoubleClick={() => setPreviewItem(item)}
                >
                  <div className="card-media">
                    {item.type === 'video' ? (
                      <video src={item.url} muted />
                    ) : (
                      <img src={item.thumbnailUrl || item.url} alt={item.filename} />
                    )}
                    {item.type === 'video' && (
                      <span className="media-badge video">▶️</span>
                    )}
                    {item.usedCount > 0 && (
                      <span className="used-badge">Used {item.usedCount}x</span>
                    )}
                  </div>
                  <div className="card-info">
                    <span className="card-filename">{item.filename}</span>
                    <span className="card-size">{formatSize(item.size)}</span>
                  </div>
                  <div className="card-select">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === 'list' && filteredContent.length > 0 && (
            <div className="content-list">
              <div className="list-header">
                <span className="col-select">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === filteredContent.length}
                    onChange={() =>
                      selectedItems.size === filteredContent.length
                        ? clearSelection()
                        : selectAll()
                    }
                  />
                </span>
                <span className="col-thumb">Preview</span>
                <span className="col-name">Name</span>
                <span className="col-type">Type</span>
                <span className="col-size">Size</span>
                <span className="col-used">Used</span>
                <span className="col-date">Uploaded</span>
              </div>
              {filteredContent.map((item) => (
                <div
                  key={item.id}
                  className={`list-row ${selectedItems.has(item.id) ? 'selected' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <span className="col-select">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </span>
                  <span className="col-thumb">
                    <img src={item.thumbnailUrl || item.url} alt="" />
                  </span>
                  <span className="col-name">{item.filename}</span>
                  <span className="col-type">{item.type}</span>
                  <span className="col-size">{formatSize(item.size)}</span>
                  <span className="col-used">{item.usedCount}</span>
                  <span className="col-date">
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview modal */}
        {previewItem && (
          <div className="preview-overlay" onClick={() => setPreviewItem(null)}>
            <div className="preview-content" onClick={(e) => e.stopPropagation()}>
              <button className="preview-close" onClick={() => setPreviewItem(null)}>
                ×
              </button>
              {previewItem.type === 'video' ? (
                <video src={previewItem.url} controls autoPlay />
              ) : (
                <img src={previewItem.url} alt={previewItem.filename} />
              )}
              <div className="preview-info">
                <h4>{previewItem.filename}</h4>
                <p>{formatSize(previewItem.size)} • {previewItem.width}x{previewItem.height}</p>
                {previewItem.aiCaption && (
                  <div className="preview-caption">
                    <h5>AI Generated Caption:</h5>
                    <p>{previewItem.aiCaption}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
