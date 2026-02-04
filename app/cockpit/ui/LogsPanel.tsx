'use client';

import { useEffect, useState, useRef } from 'react';
import {
  ActivityLog,
  LogCategory,
  LogLevel,
  LOG_COLORS,
  LEVEL_COLORS,
  subscribeToLogs,
  getLogs,
  seedDemoLogs,
} from '@/lib/logging/activity-logger';
import './logs-panel.css';

// ============================================
// FILTER OPTIONS
// ============================================

const CATEGORY_OPTIONS: { value: LogCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'auth', label: '🔐 Auth' },
  { value: 'user', label: '👤 User' },
  { value: 'market', label: '📈 Market' },
  { value: 'content', label: '📝 Content' },
  { value: 'automation', label: '🤖 Automation' },
  { value: 'feeds', label: '📱 Feeds' },
  { value: 'system', label: '⚙️ System' },
  { value: 'security', label: '🛡️ Security' },
  { value: 'payment', label: '💰 Payment' },
  { value: 'admin', label: '👑 Admin' },
];

const LEVEL_OPTIONS: { value: LogLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'critical', label: 'Critical' },
];

// ============================================
// COMPONENT
// ============================================

export default function LogsPanel() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'all'>('all');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to logs
  useEffect(() => {
    // Seed demo logs on first load
    const existingLogs = getLogs({ limit: 1 });
    if (existingLogs.length === 0) {
      seedDemoLogs();
    }

    const unsubscribe = subscribeToLogs((newLogs) => {
      if (!isPaused) {
        setLogs(newLogs);
      }
    });

    return () => unsubscribe();
  }, [isPaused]);

  // Filter logs
  useEffect(() => {
    let filtered = [...logs];

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(log => log.category === categoryFilter);
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.userName?.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, categoryFilter, levelFilter, searchTerm]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="logs-panel">
      {/* Header */}
      <header className="logs-panel-header">
        <div className="logs-panel-title">
          <span className="logs-panel-icon">📋</span>
          <h2>Activity Logs</h2>
          <span className="logs-count">{filteredLogs.length} entries</span>
        </div>

        <div className="logs-panel-controls">
          <button
            className={`logs-control-btn ${isPaused ? 'paused' : ''}`}
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            className={`logs-control-btn ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title="Auto-scroll"
          >
            ↓
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="logs-filters">
        <div className="logs-filter-group">
          <select
            className="logs-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as LogCategory | 'all')}
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            className="logs-filter-select"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
          >
            {LEVEL_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <input
          type="text"
          className="logs-search"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Logs List */}
      <div
        className="logs-list"
        ref={logsContainerRef}
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
          <div className="logs-empty">
            <span className="logs-empty-icon">📭</span>
            <p>No logs match your filters</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const colors = LOG_COLORS[log.category];
            const levelColors = LEVEL_COLORS[log.level];
            const isExpanded = expandedId === log.id;

            return (
              <div
                key={log.id}
                className={`log-entry ${isExpanded ? 'expanded' : ''} ${log.level}`}
                style={{
                  '--log-bg': colors.bg,
                  '--log-text': colors.text,
                  '--log-border': colors.border,
                  '--level-color': levelColors.indicator,
                } as React.CSSProperties}
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
              >
                {/* Level Indicator */}
                <div className={`log-level-indicator ${levelColors.pulse ? 'pulse' : ''}`} />

                {/* Main Content */}
                <div className="log-content">
                  <div className="log-header">
                    <span className="log-category-badge">
                      {colors.icon} {log.category.toUpperCase()}
                    </span>
                    <span className="log-action">{log.action}</span>
                    <span className="log-time">
                      {formatDate(log.timestamp)} {formatTime(log.timestamp)}
                    </span>
                  </div>

                  <div className="log-message">{log.message}</div>

                  {log.userName && (
                    <div className="log-user">
                      <span className="log-user-icon">👤</span>
                      {log.userName}
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="log-details">
                      <div className="log-details-grid">
                        <div className="log-detail">
                          <span className="log-detail-label">Log ID</span>
                          <span className="log-detail-value">{log.id}</span>
                        </div>
                        <div className="log-detail">
                          <span className="log-detail-label">Level</span>
                          <span className={`log-detail-value level-${log.level}`}>{log.level.toUpperCase()}</span>
                        </div>
                        {log.userId && (
                          <div className="log-detail">
                            <span className="log-detail-label">User ID</span>
                            <span className="log-detail-value">{log.userId}</span>
                          </div>
                        )}
                        {log.targetId && (
                          <div className="log-detail">
                            <span className="log-detail-label">Target</span>
                            <span className="log-detail-value">{log.targetType}: {log.targetId}</span>
                          </div>
                        )}
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="log-metadata">
                          <span className="log-metadata-label">Metadata</span>
                          <pre className="log-metadata-content">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expand Indicator */}
                <div className="log-expand-icon">
                  {isExpanded ? '▼' : '▶'}
                </div>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Live Indicator */}
      {!isPaused && (
        <div className="logs-live-indicator">
          <span className="logs-live-dot" />
          LIVE
        </div>
      )}
    </div>
  );
}
