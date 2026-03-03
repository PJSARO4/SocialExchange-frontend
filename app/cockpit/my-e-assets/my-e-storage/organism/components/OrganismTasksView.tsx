'use client';

import { useOrganism } from '@/app/context/OrganismContext';

// ============================================
// TASKS VIEW — Task queue + completed log
// ============================================

const TASK_ICONS: Record<string, string> = {
  compress: '🗜',
  tag: '🏷',
  organize: '📂',
  scrape: '🔍',
  analyze: '📊',
  cleanup: '🧹',
  'format-check': '✅',
};

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function OrganismTasksView() {
  const { tasks, runTask } = useOrganism();

  const running = tasks.filter((t) => t.status === 'running');
  const pending = tasks.filter((t) => t.status === 'pending');
  const completed = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'failed'
  );

  return (
    <div className="orgo-tasks-list">
      {/* Running */}
      {running.map((task) => (
        <div key={task.id} className="orgo-task-item running">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.25rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>
              {TASK_ICONS[task.type] || '⚡'}
            </span>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: '#3fffdc',
              }}
            >
              Running
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#e5e7eb' }}>
            {task.description}
          </div>
          <div className="orgo-task-progress">
            <div
              className="orgo-task-progress-bar"
              style={{ width: `${task.progress || 50}%` }}
            />
          </div>
        </div>
      ))}

      {/* Pending */}
      {pending.map((task) => (
        <div key={task.id} className="orgo-task-item">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '0.875rem' }}>
              {TASK_ICONS[task.type] || '⏳'}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              Queued
            </span>
          </div>
          <div
            style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}
          >
            {task.description}
          </div>
        </div>
      ))}

      {/* Completed */}
      {completed.length > 0 && (
        <div
          style={{
            fontSize: '0.6875rem',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginTop: '0.5rem',
            paddingBottom: '0.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          Completed
        </div>
      )}

      {completed.map((task) => (
        <div
          key={task.id}
          className={`orgo-task-item ${task.status}`}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span style={{ fontSize: '0.875rem' }}>
                {task.status === 'failed'
                  ? '❌'
                  : TASK_ICONS[task.type] || '✓'}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: task.status === 'failed' ? '#ef4444' : '#6b7280',
                }}
              >
                {task.description}
              </span>
            </div>
            <span
              style={{
                fontSize: '0.625rem',
                color: '#4b5563',
                flexShrink: 0,
              }}
            >
              {task.completedAt ? formatTimeAgo(task.completedAt) : ''}
            </span>
          </div>
          {task.result && (
            <div
              style={{
                fontSize: '0.6875rem',
                color: '#9ca3af',
                marginTop: '0.25rem',
                paddingLeft: '1.375rem',
              }}
            >
              {task.result}
            </div>
          )}
          {task.error && (
            <div
              style={{
                fontSize: '0.6875rem',
                color: '#ef4444',
                marginTop: '0.25rem',
                paddingLeft: '1.375rem',
              }}
            >
              Error: {task.error}
            </div>
          )}
        </div>
      ))}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            color: '#4b5563',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {'⚡'}
          </div>
          <div style={{ fontSize: '0.75rem' }}>
            No tasks yet. SYN will work autonomously or you can trigger tasks
            via chat.
          </div>
        </div>
      )}
    </div>
  );
}
