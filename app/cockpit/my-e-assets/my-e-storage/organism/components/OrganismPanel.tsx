'use client';

import { useState } from 'react';
import { useOrganism } from '@/app/context/OrganismContext';
import OrganismAvatar from './OrganismAvatar';
import OrganismChatView from './OrganismChatView';
import OrganismTasksView from './OrganismTasksView';
import OrganismSettingsView from './OrganismSettingsView';

// ============================================
// ORGANISM PANEL — Slide-in from right
// Tabs: Chat, Tasks, Settings
// ============================================

type PanelTab = 'chat' | 'tasks' | 'settings';

interface OrganismPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrganismPanel({ isOpen, onClose }: OrganismPanelProps) {
  const { mood, config, tasks } = useOrganism();
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');

  if (!isOpen) return null;

  const runningCount = tasks.filter((t) => t.status === 'running').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;

  const statusColor =
    mood === 'working'
      ? '#a78bfa'
      : mood === 'alert'
        ? '#ef4444'
        : mood === 'thinking'
          ? '#f59e0b'
          : '#3fffdc';

  const statusText =
    mood === 'working'
      ? 'Working'
      : mood === 'alert'
        ? 'Alert'
        : mood === 'thinking'
          ? 'Thinking'
          : mood === 'happy'
            ? 'Online'
            : 'Online';

  return (
    <>
      {/* Overlay */}
      <div className="organism-panel-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="organism-panel">
        {/* Header */}
        <div className="organism-panel-header">
          <OrganismAvatar mood={mood} size="sm" />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: '700',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {config.name}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginTop: '0.125rem',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: statusColor,
                }}
              />
              <span
                style={{
                  fontSize: '0.625rem',
                  color: statusColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {statusText}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              fontSize: '1.25rem',
              cursor: 'pointer',
              padding: '0.25rem',
            }}
          >
            {'✕'}
          </button>
        </div>

        {/* Tabs */}
        <div className="organism-panel-tabs">
          <button
            className={`organism-panel-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button
            className={`organism-panel-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
            {(runningCount + pendingCount) > 0 && (
              <span
                style={{
                  marginLeft: '0.375rem',
                  padding: '0.0625rem 0.375rem',
                  background: 'rgba(63, 255, 220, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.5625rem',
                  color: '#3fffdc',
                }}
              >
                {runningCount + pendingCount}
              </span>
            )}
          </button>
          <button
            className={`organism-panel-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Body */}
        <div className="organism-panel-body">
          {activeTab === 'chat' && <OrganismChatView />}
          {activeTab === 'tasks' && <OrganismTasksView />}
          {activeTab === 'settings' && <OrganismSettingsView />}
        </div>
      </div>
    </>
  );
}
