'use client';

import React, { useState } from 'react';
import { Feed } from '../../types/feed';
import { ChainBuilder, AutomationChain } from './chain-builder';

interface AutomationRule {
  id: string;
  name: string;
  type: 'engagement' | 'follow' | 'dm' | 'comment' | 'chain';
  enabled: boolean;
  settings: Record<string, any>;
  stats: {
    actionsToday: number;
    actionsTotal: number;
  };
  chain?: AutomationChain; // Optional chain data for chain-type rules
}

interface AutomationModalProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
}

export const AutomationModal: React.FC<AutomationModalProps> = ({ feed, isOpen, onClose }) => {
  console.log('[AutomationModal] Rendering - isOpen:', isOpen, 'feed:', feed?.handle);

  const [activeTab, setActiveTab] = useState<'rules' | 'activity' | 'settings'>('rules');
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [editingChain, setEditingChain] = useState<AutomationRule | null>(null);
  const [isCreatingNewChain, setIsCreatingNewChain] = useState(false);

  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Auto-Like New Followers',
      type: 'engagement',
      enabled: true,
      settings: {
        likesPerUser: 3,
        delay: '30-60 seconds'
      },
      stats: {
        actionsToday: 45,
        actionsTotal: 1250
      }
    },
    {
      id: '2',
      name: 'Welcome DM',
      type: 'dm',
      enabled: false,
      settings: {
        message: 'Hey! Thanks for the follow 🙏 Let me know if you have any questions!',
        delay: '5 minutes'
      },
      stats: {
        actionsToday: 0,
        actionsTotal: 320
      }
    },
    {
      id: '3',
      name: 'Auto-Comment Reply',
      type: 'comment',
      enabled: true,
      settings: {
        replyToKeywords: ['love', 'amazing', 'great'],
        responses: ['Thank you so much! 💜', 'Really appreciate it! 🙏', 'You\'re the best! ✨']
      },
      stats: {
        actionsToday: 12,
        actionsTotal: 567
      }
    },
    {
      id: '4',
      name: 'Hashtag Engagement',
      type: 'engagement',
      enabled: true,
      settings: {
        hashtags: ['photography', 'lifestyle', 'travel'],
        actionsPerHour: 20,
        actionTypes: ['like', 'comment']
      },
      stats: {
        actionsToday: 89,
        actionsTotal: 3420
      }
    }
  ]);

  const activityLog = [
    { time: '2 min ago', action: 'Liked', target: '@travel_mike\'s photo', type: 'like' },
    { time: '5 min ago', action: 'Commented', target: '@fitness_jane\'s reel', type: 'comment' },
    { time: '8 min ago', action: 'Liked', target: '@foodie_sam\'s story', type: 'like' },
    { time: '12 min ago', action: 'Followed back', target: '@creative_alex', type: 'follow' },
    { time: '15 min ago', action: 'Sent DM', target: '@new_follower_123', type: 'dm' },
    { time: '18 min ago', action: 'Liked', target: '@art_daily\'s post', type: 'like' },
    { time: '22 min ago', action: 'Commented', target: '@motivate_daily\'s carousel', type: 'comment' },
    { time: '25 min ago', action: 'Liked', target: '@style_guru\'s photo', type: 'like' },
  ];

  const dailyLimits = {
    likes: { used: 145, limit: 500 },
    comments: { used: 23, limit: 100 },
    follows: { used: 12, limit: 50 },
    dms: { used: 5, limit: 30 }
  };

  if (!isOpen) return null;

  // If editing a chain, show the chain builder
  if (editingChain || isCreatingNewChain) {
    return (
      <ChainBuilder
        chain={editingChain?.chain}
        feedId={feed.id}
        feedHandle={feed.handle}
        onSave={(chain) => {
          if (editingChain) {
            // Update existing rule with chain
            setRules(rules.map(rule =>
              rule.id === editingChain.id
                ? { ...rule, chain, name: chain.name }
                : rule
            ));
          } else {
            // Create new rule from chain
            const newRule: AutomationRule = {
              id: `chain-${Date.now()}`,
              name: chain.name,
              type: 'chain',
              enabled: chain.enabled,
              settings: {},
              stats: { actionsToday: 0, actionsTotal: 0 },
              chain,
            };
            setRules([...rules, newRule]);
          }
          setEditingChain(null);
          setIsCreatingNewChain(false);
        }}
        onClose={() => {
          setEditingChain(null);
          setIsCreatingNewChain(false);
        }}
      />
    );
  }

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const handleEditRule = (rule: AutomationRule) => {
    setEditingChain(rule);
  };

  const handleCreateNewChain = () => {
    setIsCreatingNewChain(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'engagement':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        );
      case 'follow':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        );
      case 'dm':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        );
      case 'comment':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
        );
      case 'chain':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <span className="activity-icon like">❤️</span>;
      case 'comment':
        return <span className="activity-icon comment">💬</span>;
      case 'follow':
        return <span className="activity-icon follow">👤</span>;
      case 'dm':
        return <span className="activity-icon dm">✉️</span>;
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="automation-modal" onClick={e => e.stopPropagation()}>
        <div className="automation-header">
          <div className="automation-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <h2>Automation</h2>
            <span className="automation-account">@{feed.handle}</span>
          </div>
          <div className="automation-master-toggle">
            <span>{automationEnabled ? 'Active' : 'Paused'}</span>
            <button
              className={`toggle-switch ${automationEnabled ? 'on' : ''}`}
              onClick={() => setAutomationEnabled(!automationEnabled)}
            >
              <span className="toggle-knob"></span>
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="automation-tabs">
          <button
            className={`automation-tab ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Rules
          </button>
          <button
            className={`automation-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Activity
          </button>
          <button
            className={`automation-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v10"/>
            </svg>
            Limits
          </button>
        </div>

        <div className="automation-content">
          {activeTab === 'rules' && (
            <div className="rules-view">
              <div className="rules-header">
                <p>Manage your automated actions. All automations follow Instagram's guidelines.</p>
                <button className="add-rule-btn" onClick={handleCreateNewChain}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Rule
                </button>
              </div>

              <div className="rules-list">
                {rules.map(rule => (
                  <div key={rule.id} className={`rule-card ${rule.enabled ? 'enabled' : 'disabled'}`}>
                    <div className="rule-icon">
                      {getTypeIcon(rule.type)}
                    </div>
                    <div className="rule-info">
                      <h4>{rule.name}</h4>
                      <div className="rule-meta">
                        <span className="rule-type">{rule.type}</span>
                        <span className="rule-stats">
                          {rule.stats.actionsToday} today · {rule.stats.actionsTotal.toLocaleString()} total
                        </span>
                      </div>
                      <div className="rule-settings">
                        {Object.entries(rule.settings).map(([key, value]) => (
                          <span key={key} className="setting-tag">
                            {key}: {Array.isArray(value) ? value.join(', ') : value}
                          </span>
                        )).slice(0, 2)}
                      </div>
                    </div>
                    <div className="rule-actions">
                      <button className="rule-edit" title="Edit" onClick={() => handleEditRule(rule)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        className={`toggle-switch small ${rule.enabled ? 'on' : ''}`}
                        onClick={() => toggleRule(rule.id)}
                      >
                        <span className="toggle-knob"></span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="quick-actions">
                <h4>Quick Automation Templates</h4>
                <div className="template-grid">
                  {[
                    { name: 'Growth Mode', desc: 'Aggressive engagement', icon: '🚀' },
                    { name: 'Maintenance', desc: 'Keep followers happy', icon: '🛡️' },
                    { name: 'Engagement Boost', desc: 'Focus on comments', icon: '💬' },
                    { name: 'Sleep Mode', desc: 'Minimal activity', icon: '😴' }
                  ].map(template => (
                    <button key={template.name} className="template-btn">
                      <span className="template-icon">{template.icon}</span>
                      <span className="template-name">{template.name}</span>
                      <span className="template-desc">{template.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-view">
              <div className="activity-summary">
                <div className="summary-stat">
                  <span className="stat-value">146</span>
                  <span className="stat-label">Actions Today</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">4.2K</span>
                  <span className="stat-label">This Week</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">98%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>

              <div className="activity-log">
                <h4>Recent Activity</h4>
                <div className="log-list">
                  {activityLog.map((item, index) => (
                    <div key={index} className="log-item">
                      {getActivityIcon(item.type)}
                      <div className="log-info">
                        <span className="log-action">{item.action}</span>
                        <span className="log-target">{item.target}</span>
                      </div>
                      <span className="log-time">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="activity-chart">
                <h4>Activity Over Time</h4>
                <div className="mini-chart">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((height, i) => (
                    <div key={i} className="chart-bar" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
                <div className="chart-labels">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-view">
              <div className="limits-section">
                <h4>Daily Limits</h4>
                <p className="limits-note">Stay within these limits to keep your account safe</p>

                <div className="limits-grid">
                  {Object.entries(dailyLimits).map(([key, value]) => (
                    <div key={key} className="limit-card">
                      <div className="limit-header">
                        <span className="limit-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        <span className="limit-count">{value.used} / {value.limit}</span>
                      </div>
                      <div className="limit-bar">
                        <div
                          className="limit-progress"
                          style={{
                            width: `${(value.used / value.limit) * 100}%`,
                            backgroundColor: value.used / value.limit > 0.8 ? '#ff6b6b' : value.used / value.limit > 0.5 ? '#ffd93d' : '#6bcb77'
                          }}
                        ></div>
                      </div>
                      <div className="limit-remaining">
                        {value.limit - value.used} remaining today
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="safety-settings">
                <h4>Safety Settings</h4>

                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">Human-like Delays</span>
                    <span className="setting-desc">Add random delays between actions</span>
                  </div>
                  <button className="toggle-switch on">
                    <span className="toggle-knob"></span>
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">Action Cooldown</span>
                    <span className="setting-desc">30-60 seconds between actions</span>
                  </div>
                  <select className="setting-select">
                    <option>15-30 seconds</option>
                    <option selected>30-60 seconds</option>
                    <option>1-2 minutes</option>
                    <option>2-5 minutes</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">Quiet Hours</span>
                    <span className="setting-desc">Pause automation during sleep</span>
                  </div>
                  <button className="toggle-switch on">
                    <span className="toggle-knob"></span>
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <span className="setting-name">Skip Private Accounts</span>
                    <span className="setting-desc">Only engage with public profiles</span>
                  </div>
                  <button className="toggle-switch">
                    <span className="toggle-knob"></span>
                  </button>
                </div>
              </div>

              <div className="danger-zone">
                <h4>⚠️ Danger Zone</h4>
                <button className="reset-btn">Reset All Automation Settings</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomationModal;
