'use client';

import { useState } from 'react';
import { ContentFilters as Filters, ContentType, ContentStatus } from '../../types/content';
import { useFeeds } from '../../context/FeedsContext';

interface ContentFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export default function ContentFilters({
  filters,
  onChange,
}: ContentFiltersProps) {
  const { feeds } = useFeeds();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const types: Array<{ value: ContentType | undefined; label: string }> = [
    { value: undefined, label: 'ALL TYPES' },
    { value: 'image', label: 'IMAGES' },
    { value: 'video', label: 'VIDEOS' },
    { value: 'carousel', label: 'CAROUSELS' },
    { value: 'text', label: 'TEXT' },
  ];

  const statuses: Array<{ value: ContentStatus | undefined; label: string }> = [
    { value: undefined, label: 'ALL STATUS' },
    { value: 'draft', label: 'DRAFT' },
    { value: 'ready', label: 'READY' },
    { value: 'scheduled', label: 'SCHEDULED' },
    { value: 'posted', label: 'POSTED' },
    { value: 'failed', label: 'FAILED' },
  ];

  return (
    <div className="content-filters">
      {/* Search */}
      <div className="content-filters-search">
        <span className="content-filters-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search content..."
          value={filters.search || ''}
          onChange={(e) =>
            onChange({ ...filters, search: e.target.value || undefined })
          }
          className="content-filters-search-input"
        />
        {filters.search && (
          <button
            className="content-filters-search-clear"
            onClick={() => onChange({ ...filters, search: undefined })}
          >
            ×
          </button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="content-filters-row">
        {/* Type */}
        <select
          className="content-filters-select"
          value={filters.type || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              type: (e.target.value as ContentType) || undefined,
            })
          }
        >
          {types.map((t) => (
            <option key={t.label} value={t.value || ''}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          className="content-filters-select"
          value={filters.status || ''}
          onChange={(e) =>
            onChange({
              ...filters,
              status: (e.target.value as ContentStatus) || undefined,
            })
          }
        >
          {statuses.map((s) => (
            <option key={s.label} value={s.value || ''}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Feed */}
        {feeds.length > 0 && (
          <select
            className="content-filters-select"
            value={filters.feedId || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                feedId: e.target.value || undefined,
              })
            }
          >
            <option value="">ALL ACCOUNTS</option>
            <option value="unassigned">UNASSIGNED</option>
            {feeds.map((f) => (
              <option key={f.id} value={f.id}>
                {f.handle}
              </option>
            ))}
          </select>
        )}

        {/* Toggle Advanced */}
        <button
          className={`content-filters-toggle ${showAdvanced ? 'active' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          ⚙
        </button>

        {/* Clear All */}
        {hasActiveFilters(filters) && (
          <button
            className="content-filters-clear"
            onClick={() => onChange({})}
          >
            CLEAR
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="content-filters-advanced">
          {/* Date Range */}
          <div className="content-filters-group">
            <label className="content-filters-label">DATE RANGE</label>
            <div className="content-filters-date-range">
              <input
                type="date"
                className="content-filters-date"
                value={filters.dateFrom || ''}
                onChange={(e) =>
                  onChange({ ...filters, dateFrom: e.target.value || undefined })
                }
              />
              <span className="content-filters-date-separator">to</span>
              <input
                type="date"
                className="content-filters-date"
                value={filters.dateTo || ''}
                onChange={(e) =>
                  onChange({ ...filters, dateTo: e.target.value || undefined })
                }
              />
            </div>
          </div>

          {/* Tags */}
          <div className="content-filters-group">
            <label className="content-filters-label">TAGS</label>
            <input
              type="text"
              className="content-filters-input"
              placeholder="Enter tags (comma separated)"
              value={filters.tags?.join(', ') || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  tags: e.target.value
                    ? e.target.value.split(',').map((t) => t.trim())
                    : undefined,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function hasActiveFilters(filters: Filters): boolean {
  return !!(
    filters.type ||
    filters.status ||
    filters.feedId ||
    filters.search ||
    filters.dateFrom ||
    filters.dateTo ||
    (filters.tags && filters.tags.length > 0)
  );
}
