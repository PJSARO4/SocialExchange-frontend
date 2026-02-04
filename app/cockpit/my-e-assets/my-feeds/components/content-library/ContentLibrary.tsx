'use client';

import { useState, useMemo } from 'react';
import { useFeeds } from '../../context/FeedsContext';
import { ContentFilters as Filters } from '../../types/content';
import ContentCard from './ContentCard';
import ContentUploader from './ContentUploader';
import ContentFilters from './ContentFilters';
import CSVImporter from './CSVImporter';

type ViewMode = 'grid' | 'list';

export default function ContentLibrary() {
  const {
    content,
    selectedFeedId,
    selectedContentId,
    selectContent,
    removeContent,
    contentLoading,
    contentFilters,
    setContentFilters,
  } = useFeeds();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showUploader, setShowUploader] = useState(false);
  const [showCSVImporter, setShowCSVImporter] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Filter content
  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      // Type filter
      if (contentFilters.type && item.type !== contentFilters.type) return false;

      // Status filter
      if (contentFilters.status && item.status !== contentFilters.status) return false;

      // Feed filter
      if (contentFilters.feedId) {
        if (contentFilters.feedId === 'unassigned') {
          if (item.feedId) return false;
        } else if (item.feedId !== contentFilters.feedId) {
          return false;
        }
      }

      // Search filter
      if (contentFilters.search) {
        const searchLower = contentFilters.search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(searchLower);
        const matchesCaption = item.caption?.toLowerCase().includes(searchLower);
        const matchesTags = item.tags.some((t) =>
          t.toLowerCase().includes(searchLower)
        );
        if (!matchesTitle && !matchesCaption && !matchesTags) return false;
      }

      // Date filter
      if (contentFilters.dateFrom) {
        const itemDate = new Date(item.createdAt);
        const fromDate = new Date(contentFilters.dateFrom);
        if (itemDate < fromDate) return false;
      }
      if (contentFilters.dateTo) {
        const itemDate = new Date(item.createdAt);
        const toDate = new Date(contentFilters.dateTo);
        if (itemDate > toDate) return false;
      }

      // Tags filter
      if (contentFilters.tags && contentFilters.tags.length > 0) {
        const hasMatchingTag = contentFilters.tags.some((filterTag) =>
          item.tags.some((itemTag) =>
            itemTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [content, contentFilters]);

  const handleRemoveContent = async (id: string) => {
    if (confirmRemoveId === id) {
      await removeContent(id);
      setConfirmRemoveId(null);
    } else {
      setConfirmRemoveId(id);
      setTimeout(() => setConfirmRemoveId(null), 3000);
    }
  };

  return (
    <div className="content-library">
      {/* Header */}
      <div className="content-library-header">
        <h2 className="content-library-title">CONTENT LIBRARY</h2>
        <div className="content-library-actions">
          <button
            className="content-library-action-btn"
            onClick={() => setShowCSVImporter(true)}
            title="Import from CSV"
          >
            📥 CSV
          </button>
          <button
            className="content-library-action-btn primary"
            onClick={() => setShowUploader(!showUploader)}
          >
            {showUploader ? '✕ CLOSE' : '+ UPLOAD'}
          </button>
          <div className="content-library-view-toggle">
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
              ≡
            </button>
          </div>
        </div>
      </div>

      {/* Uploader (collapsible) */}
      {showUploader && (
        <div className="content-library-uploader">
          <ContentUploader
            feedId={selectedFeedId || undefined}
            onUploadComplete={() => {}}
          />
        </div>
      )}

      {/* Filters */}
      <ContentFilters
        filters={contentFilters}
        onChange={setContentFilters}
      />

      {/* Content Grid/List */}
      <div className={`content-library-items ${viewMode}`}>
        {contentLoading && content.length === 0 ? (
          <div className="content-library-loading">
            <div className="content-library-loading-spinner" />
            <span>Loading content...</span>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="content-library-empty">
            <div className="content-library-empty-icon">📭</div>
            <div className="content-library-empty-title">
              {content.length === 0 ? 'NO CONTENT YET' : 'NO MATCHES'}
            </div>
            <div className="content-library-empty-text">
              {content.length === 0
                ? 'Upload images, videos, or import from CSV to get started'
                : 'Try adjusting your filters'}
            </div>
            {content.length === 0 && (
              <button
                className="content-library-empty-btn"
                onClick={() => setShowUploader(true)}
              >
                + UPLOAD CONTENT
              </button>
            )}
          </div>
        ) : (
          filteredContent.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              selected={item.id === selectedContentId}
              onSelect={() => selectContent(item.id)}
              onRemove={() => handleRemoveContent(item.id)}
            />
          ))
        )}
      </div>

      {/* Footer Stats */}
      {content.length > 0 && (
        <div className="content-library-footer">
          <span className="content-library-stat">
            {filteredContent.length} of {content.length} items
          </span>
          <span className="content-library-separator">•</span>
          <span className="content-library-stat">
            {content.filter((c) => c.status === 'scheduled').length} scheduled
          </span>
          <span className="content-library-separator">•</span>
          <span className="content-library-stat">
            {content.filter((c) => c.status === 'draft').length} drafts
          </span>
        </div>
      )}

      {/* Confirm Remove Toast */}
      {confirmRemoveId && (
        <div className="content-confirm-toast">
          <span>Click again to confirm removal</span>
          <button onClick={() => setConfirmRemoveId(null)}>Cancel</button>
        </div>
      )}

      {/* CSV Importer Modal */}
      {showCSVImporter && (
        <CSVImporter
          feedId={selectedFeedId || undefined}
          onImportComplete={() => {}}
          onClose={() => setShowCSVImporter(false)}
        />
      )}
    </div>
  );
}
