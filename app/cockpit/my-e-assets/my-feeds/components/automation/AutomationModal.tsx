"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChainBuilder } from './chain-builder/ChainBuilder';
import { AutomationChain, ChainNode, NodeConnection } from './chain-builder/types';
import { useWorkflowEvents } from '../../context/WorkflowEventsContext';

interface AutomationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  feedId?: string;
  children?: React.ReactNode;
}

// API automation rule type
interface AutomationRule {
  id: string;
  feed_id: string;
  name: string;
  type: string;
  enabled: boolean;
  settings: Record<string, any>;
  stats: {
    actions_today: number;
    actions_total: number;
    last_run?: string;
  };
  created_at: string;
  updated_at: string;
}

interface RateLimitStatus {
  daily_limits: { likes: number; comments: number; follows: number; dms: number };
  daily_usage: Record<string, number>;
}

// Workflow template definitions
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  nodes: ChainNode[];
  connections: NodeConnection[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'auto-post-library',
    name: 'Auto Post from Library',
    description: 'Automatically post content from your library on a schedule',
    icon: '📚',
    category: 'Publishing',
    difficulty: 'beginner',
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 100, y: 200 }, config: { name: 'When triggered', trigger: 'schedule' } },
      { id: 'pull-1', type: 'pull-content', position: { x: 350, y: 200 }, config: { source: 'library', filter: 'approved', limit: 1 } },
      { id: 'schedule-1', type: 'schedule', position: { x: 600, y: 200 }, config: { timing: 'optimal', timezone: 'auto' } },
      { id: 'end-1', type: 'end', position: { x: 850, y: 200 }, config: {} },
    ],
    connections: [
      { id: 'c1', sourceNodeId: 'start-1', targetNodeId: 'pull-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c2', sourceNodeId: 'pull-1', targetNodeId: 'schedule-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c3', sourceNodeId: 'schedule-1', targetNodeId: 'end-1', sourceHandle: 'default', targetHandle: 'input' },
    ],
  },
  {
    id: 'ai-caption-generator',
    name: 'AI Caption Generator',
    description: 'Enhance content with AI-generated captions before posting',
    icon: '🤖',
    category: 'AI Enhancement',
    difficulty: 'beginner',
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 100, y: 200 }, config: { name: 'Content Added', trigger: 'content_added' } },
      { id: 'ai-1', type: 'ai-enhance', position: { x: 350, y: 200 }, config: { action: 'generate_caption', tone: 'engaging', includeHashtags: true } },
      { id: 'approval-1', type: 'approval', position: { x: 600, y: 200 }, config: { required: true, timeout: 24 } },
      { id: 'end-1', type: 'end', position: { x: 850, y: 200 }, config: {} },
    ],
    connections: [
      { id: 'c1', sourceNodeId: 'start-1', targetNodeId: 'ai-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c2', sourceNodeId: 'ai-1', targetNodeId: 'approval-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c3', sourceNodeId: 'approval-1', targetNodeId: 'end-1', sourceHandle: 'approved', targetHandle: 'input' },
    ],
  },
  {
    id: 'content-repurposer',
    name: 'Content Repurposer',
    description: 'Automatically adapt content for different platforms',
    icon: '🔄',
    category: 'Multi-Platform',
    difficulty: 'intermediate',
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 100, y: 250 }, config: { name: 'New Content', trigger: 'content_added' } },
      { id: 'filter-1', type: 'filter', position: { x: 350, y: 250 }, config: { conditions: [{ field: 'type', operator: 'equals', value: 'image' }] } },
      { id: 'multi-1', type: 'multi-platform', position: { x: 600, y: 150 }, config: { platforms: ['instagram', 'facebook'], adaptCaptions: true } },
      { id: 'multi-2', type: 'multi-platform', position: { x: 600, y: 350 }, config: { platforms: ['twitter'], adaptCaptions: true, shortenLinks: true } },
      { id: 'schedule-1', type: 'schedule', position: { x: 850, y: 250 }, config: { timing: 'stagger', staggerMinutes: 30 } },
      { id: 'end-1', type: 'end', position: { x: 1100, y: 250 }, config: {} },
    ],
    connections: [
      { id: 'c1', sourceNodeId: 'start-1', targetNodeId: 'filter-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c2', sourceNodeId: 'filter-1', targetNodeId: 'multi-1', sourceHandle: 'pass', targetHandle: 'input' },
      { id: 'c3', sourceNodeId: 'filter-1', targetNodeId: 'multi-2', sourceHandle: 'pass', targetHandle: 'input' },
      { id: 'c4', sourceNodeId: 'multi-1', targetNodeId: 'schedule-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c5', sourceNodeId: 'multi-2', targetNodeId: 'schedule-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c6', sourceNodeId: 'schedule-1', targetNodeId: 'end-1', sourceHandle: 'default', targetHandle: 'input' },
    ],
  },
  {
    id: 'competitor-monitor',
    name: 'Competitor Content Monitor',
    description: 'Track and save competitor content for inspiration',
    icon: '👁️',
    category: 'Research',
    difficulty: 'intermediate',
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 100, y: 200 }, config: { name: 'Daily Check', trigger: 'schedule', schedule: '0 9 * * *' } },
      { id: 'scrape-1', type: 'scrape', position: { x: 350, y: 200 }, config: { source: 'competitor', accounts: [], postsPerAccount: 5 } },
      { id: 'filter-1', type: 'filter', position: { x: 600, y: 200 }, config: { conditions: [{ field: 'engagement', operator: 'greater_than', value: 1000 }] } },
      { id: 'analytics-1', type: 'analytics', position: { x: 850, y: 200 }, config: { action: 'track', metrics: ['engagement', 'reach'] } },
      { id: 'end-1', type: 'end', position: { x: 1100, y: 200 }, config: {} },
    ],
    connections: [
      { id: 'c1', sourceNodeId: 'start-1', targetNodeId: 'scrape-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c2', sourceNodeId: 'scrape-1', targetNodeId: 'filter-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c3', sourceNodeId: 'filter-1', targetNodeId: 'analytics-1', sourceHandle: 'pass', targetHandle: 'input' },
      { id: 'c4', sourceNodeId: 'analytics-1', targetNodeId: 'end-1', sourceHandle: 'default', targetHandle: 'input' },
    ],
  },
  {
    id: 'smart-queue',
    name: 'Smart Content Queue',
    description: 'Intelligently schedule content based on optimal timing and analytics',
    icon: '📊',
    category: 'Scheduling',
    difficulty: 'advanced',
    nodes: [
      { id: 'start-1', type: 'start', position: { x: 100, y: 200 }, config: { name: 'Queue Check', trigger: 'schedule', schedule: '0 */6 * * *' } },
      { id: 'pull-1', type: 'pull-content', position: { x: 350, y: 200 }, config: { source: 'queue', status: 'pending', limit: 10 } },
      { id: 'analytics-1', type: 'analytics', position: { x: 600, y: 200 }, config: { action: 'analyze_timing', lookbackDays: 30 } },
      { id: 'ai-1', type: 'ai-enhance', position: { x: 850, y: 200 }, config: { action: 'optimize_timing', useAnalytics: true } },
      { id: 'schedule-1', type: 'schedule', position: { x: 1100, y: 200 }, config: { timing: 'ai_optimized', maxPerDay: 3 } },
      { id: 'end-1', type: 'end', position: { x: 1350, y: 200 }, config: {} },
    ],
    connections: [
      { id: 'c1', sourceNodeId: 'start-1', targetNodeId: 'pull-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c2', sourceNodeId: 'pull-1', targetNodeId: 'analytics-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c3', sourceNodeId: 'analytics-1', targetNodeId: 'ai-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c4', sourceNodeId: 'ai-1', targetNodeId: 'schedule-1', sourceHandle: 'default', targetHandle: 'input' },
      { id: 'c5', sourceNodeId: 'schedule-1', targetNodeId: 'end-1', sourceHandle: 'default', targetHandle: 'input' },
    ],
  },
];

type ViewMode = 'list' | 'templates' | 'builder';

// Storage key for chains
const STORAGE_KEY = 'se-automation-chains';

// Load chains from localStorage
function loadChains(): AutomationChain[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save chains to localStorage
function saveChains(chains: AutomationChain[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chains));
}

export function AutomationModal({ isOpen, onClose, feedId, children }: AutomationModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [chains, setChains] = useState<AutomationChain[]>([]);
  const [editingChain, setEditingChain] = useState<AutomationChain | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // API-connected state
  const [apiRules, setApiRules] = useState<AutomationRule[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimitStatus | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [togglingRuleId, setTogglingRuleId] = useState<string | null>(null);

  // Try to use workflow events context
  let workflowEventsContext: ReturnType<typeof useWorkflowEvents> | null = null;
  try {
    workflowEventsContext = useWorkflowEvents();
  } catch {
    // Context not available
  }

  // Fetch automation rules from API
  const fetchApiRules = useCallback(async () => {
    if (!feedId) return;
    setApiLoading(true);
    setApiError(null);
    try {
      const response = await fetch(`/api/automation?feed_id=${feedId}&include_actions=true`);
      const data = await response.json();
      if (response.ok && data.rules) {
        setApiRules(data.rules);
        if (data.daily_limits) {
          setRateLimits({
            daily_limits: data.daily_limits,
            daily_usage: data.daily_usage || {},
          });
        }
      } else {
        // API unavailable (demo mode) — fallback to localStorage only
        console.log('Automation API unavailable, using localStorage only');
      }
    } catch {
      // Silently fall back to localStorage mode
      console.log('Automation API not reachable, localStorage mode');
    } finally {
      setApiLoading(false);
    }
  }, [feedId]);

  // Toggle an API rule's enabled state
  const toggleApiRule = async (ruleId: string, currentEnabled: boolean) => {
    setTogglingRuleId(ruleId);
    try {
      const response = await fetch('/api/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId, enabled: !currentEnabled }),
      });
      const data = await response.json();
      if (response.ok && data.rule) {
        setApiRules(prev => prev.map(r => r.id === ruleId ? data.rule : r));
      }
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    } finally {
      setTogglingRuleId(null);
    }
  };

  // Delete an API rule
  const deleteApiRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/automation?id=${ruleId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok && data.success) {
        setApiRules(prev => prev.filter(r => r.id !== ruleId));
      }
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  // Fetch rate limit status
  const fetchRateLimits = useCallback(async () => {
    if (!feedId) return;
    try {
      const response = await fetch(`/api/rate-limits?feed_id=${feedId}`);
      const data = await response.json();
      if (response.ok) {
        setRateLimits(prev => prev ? {
          ...prev,
          daily_usage: data.usage || prev.daily_usage,
        } : null);
      }
    } catch {
      // Silent fail
    }
  }, [feedId]);

  // Sync workflow events for a chain
  const syncChainEvents = useCallback((chain: AutomationChain) => {
    if (!workflowEventsContext) return;

    // Find the start node to get schedule config
    const startNode = chain.nodes.find(n => n.type === 'start');
    const trigger = startNode?.data?.trigger || startNode?.data?.triggerType || 'manual';
    const cronExpression = startNode?.data?.schedule;

    if (chain.enabled && trigger === 'schedule' && cronExpression) {
      workflowEventsContext.syncWorkflowEvents(chain.id, chain.name, {
        trigger: 'schedule',
        cronExpression,
        startDate: new Date().toISOString(),
      });
    } else {
      // Clear events for this workflow if disabled or not scheduled
      workflowEventsContext.syncWorkflowEvents(chain.id, chain.name, {
        trigger: 'manual',
      });
    }
  }, [workflowEventsContext]);

  // Load chains on mount + fetch API rules
  useEffect(() => {
    setChains(loadChains());
    if (isOpen) {
      fetchApiRules();
      fetchRateLimits();
    }
  }, [isOpen, fetchApiRules, fetchRateLimits]);

  // Save chains when they change
  useEffect(() => {
    if (chains.length > 0) {
      saveChains(chains);
    }
  }, [chains]);

  if (!isOpen) return null;

  // Get unique categories from templates
  const categories = ['all', ...new Set(WORKFLOW_TEMPLATES.map(t => t.category))];

  // Filter templates
  const filteredTemplates = WORKFLOW_TEMPLATES.filter(template => {
    const matchesSearch = !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalChains = chains.length;
  const activeChains = chains.filter(c => c.enabled).length;
  const totalRuns = chains.reduce((sum, c) => sum + (c.stats?.totalRuns || 0), 0);

  // Create new chain from template
  const handleCreateFromTemplate = (template: WorkflowTemplate) => {
    const timestamp = Date.now();

    // Create node ID mapping
    const nodeIdMap: Record<string, string> = {};
    template.nodes.forEach(node => {
      nodeIdMap[node.id] = `${node.id}-${timestamp}`;
    });

    // Transform template nodes to proper ChainNode structure with data property
    const transformedNodes: ChainNode[] = template.nodes.map(n => ({
      id: nodeIdMap[n.id],
      type: n.type,
      position: n.position,
      data: {
        label: n.config?.name || n.type.charAt(0).toUpperCase() + n.type.slice(1).replace(/-/g, ' '),
        description: '',
        isConfigured: false,
        ...n.config, // Spread config into data
      },
    }));

    // Transform connections with updated node IDs
    const transformedConnections: NodeConnection[] = template.connections.map(c => ({
      id: `${c.id}-${timestamp}`,
      sourceNodeId: nodeIdMap[c.sourceNodeId] || c.sourceNodeId,
      targetNodeId: nodeIdMap[c.targetNodeId] || c.targetNodeId,
      sourceHandle: c.sourceHandle || 'output',
      targetHandle: c.targetHandle || 'input',
    }));

    const newChain: AutomationChain = {
      id: `chain-${timestamp}`,
      name: template.name,
      description: template.description,
      feedId: feedId || '',
      enabled: false,
      nodes: transformedNodes,
      connections: transformedConnections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: 0,
      status: 'draft',
    };

    setEditingChain(newChain);
    setViewMode('builder');
  };

  // Create blank chain
  const handleCreateBlank = () => {
    const timestamp = Date.now();
    const newChain: AutomationChain = {
      id: `chain-${timestamp}`,
      name: 'New Workflow',
      description: '',
      feedId: feedId || '',
      enabled: false,
      nodes: [
        {
          id: `start-${timestamp}`,
          type: 'start',
          position: { x: 100, y: 200 },
          data: {
            label: 'Start',
            description: 'Trigger for this workflow',
            isConfigured: false,
            triggerType: 'manual',
          },
        },
      ],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: 0,
      status: 'draft',
    };
    setEditingChain(newChain);
    setViewMode('builder');
  };

  // Save chain from builder
  const handleSaveChain = (chain: AutomationChain) => {
    const updatedChain = { ...chain, updatedAt: new Date().toISOString() };
    setChains(prev => {
      const existing = prev.find(c => c.id === chain.id);
      if (existing) {
        return prev.map(c => c.id === chain.id ? updatedChain : c);
      }
      return [...prev, updatedChain];
    });

    // Sync workflow events if enabled
    if (updatedChain.enabled) {
      syncChainEvents(updatedChain);
    }

    setViewMode('list');
    setEditingChain(null);
  };

  // Delete chain
  const handleDeleteChain = (chainId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      // Clear workflow events for this chain
      if (workflowEventsContext) {
        workflowEventsContext.syncWorkflowEvents(chainId, '', { trigger: 'manual' });
      }
      setChains(prev => prev.filter(c => c.id !== chainId));
    }
  };

  // Toggle chain enabled
  const handleToggleChain = (chainId: string) => {
    setChains(prev => {
      const updatedChains = prev.map(c =>
        c.id === chainId ? { ...c, enabled: !c.enabled } : c
      );

      // Sync events for the toggled chain
      const toggledChain = updatedChains.find(c => c.id === chainId);
      if (toggledChain) {
        syncChainEvents(toggledChain);
      }

      return updatedChains;
    });
  };

  // Edit existing chain
  const handleEditChain = (chain: AutomationChain) => {
    setEditingChain(chain);
    setViewMode('builder');
  };

  // Back from builder
  const handleBackFromBuilder = () => {
    setViewMode('list');
    setEditingChain(null);
  };

  return (
    <div className="automation-modal-overlay" onClick={onClose}>
      <div className="automation-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="automation-modal-header">
          <div className="header-left">
            {viewMode !== 'list' && (
              <button className="back-btn" onClick={handleBackFromBuilder}>
                ← Back
              </button>
            )}
            <h2>
              {viewMode === 'list' && '⚡ Automation Workflows'}
              {viewMode === 'templates' && '📋 Workflow Templates'}
              {viewMode === 'builder' && `🔧 ${editingChain?.name || 'New Workflow'}`}
            </h2>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </header>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="automation-list-view">
            {/* Stats Bar */}
            <div className="automation-stats">
              <div className="stat">
                <span className="stat-value">{totalChains}</span>
                <span className="stat-label">Total Workflows</span>
              </div>
              <div className="stat">
                <span className="stat-value active">{activeChains}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat">
                <span className="stat-value">{totalRuns}</span>
                <span className="stat-label">Total Runs</span>
              </div>
            </div>

            {/* Rate Limits Dashboard */}
            {rateLimits && (
              <div className="automation-stats" style={{ marginBottom: '1rem', background: 'rgba(255, 200, 0, 0.05)' }}>
                <div className="stat">
                  <span className="stat-value" style={{ color: '#ffc800' }}>
                    {rateLimits.daily_usage?.LIKE || 0}/{rateLimits.daily_limits.likes}
                  </span>
                  <span className="stat-label">Likes Today</span>
                </div>
                <div className="stat">
                  <span className="stat-value" style={{ color: '#ffc800' }}>
                    {rateLimits.daily_usage?.COMMENT || 0}/{rateLimits.daily_limits.comments}
                  </span>
                  <span className="stat-label">Comments Today</span>
                </div>
                <div className="stat">
                  <span className="stat-value" style={{ color: '#ffc800' }}>
                    {rateLimits.daily_usage?.FOLLOW || 0}/{rateLimits.daily_limits.follows}
                  </span>
                  <span className="stat-label">Follows Today</span>
                </div>
                <div className="stat">
                  <span className="stat-value" style={{ color: '#ffc800' }}>
                    {rateLimits.daily_usage?.DM || 0}/{rateLimits.daily_limits.dms}
                  </span>
                  <span className="stat-label">DMs Today</span>
                </div>
              </div>
            )}

            {/* API Loading State */}
            {apiLoading && (
              <div className="automation-stats" style={{ justifyContent: 'center', color: '#888' }}>
                Loading automation rules...
              </div>
            )}

            {/* API Error */}
            {apiError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '6px', color: '#ff6464', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {apiError}
              </div>
            )}

            {/* Server-Side Automation Rules */}
            {apiRules.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#00ffc8', fontSize: '0.875rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Server Rules (Instagram API)
                </h3>
                {apiRules.map(rule => (
                  <div key={rule.id} className={`workflow-item ${rule.enabled ? 'enabled' : 'disabled'}`} style={{ marginBottom: '0.5rem' }}>
                    <div className="workflow-status">
                      <button
                        className={`toggle-btn ${rule.enabled ? 'on' : 'off'}`}
                        onClick={() => toggleApiRule(rule.id, rule.enabled)}
                        disabled={togglingRuleId === rule.id}
                      >
                        {togglingRuleId === rule.id ? '...' : rule.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="workflow-info">
                      <h4>{rule.name}</h4>
                      <p>Type: {rule.type} | Today: {rule.stats.actions_today} actions | Total: {rule.stats.actions_total}</p>
                      <div className="workflow-meta">
                        <span>{rule.stats.last_run ? `Last run: ${new Date(rule.stats.last_run).toLocaleString()}` : 'Never run'}</span>
                      </div>
                    </div>
                    <div className="workflow-actions">
                      <button className="icon-btn" onClick={() => deleteApiRule(rule.id)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="automation-actions">
              <button className="action-btn primary" onClick={handleCreateBlank}>
                + Create New Workflow
              </button>
              <button className="action-btn" onClick={() => setViewMode('templates')}>
                📋 Browse Templates
              </button>
            </div>

            {apiRules.length > 0 && chains.length > 0 && (
              <h3 style={{ color: '#00ffc8', fontSize: '0.875rem', margin: '1rem 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Local Workflows (Chain Builder)
              </h3>
            )}

            {/* Workflow List */}
            <div className="workflow-list">
              {chains.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">⚡</span>
                  <h3>No Workflows Yet</h3>
                  <p>Create your first automation workflow to streamline your content management</p>
                  <button className="action-btn primary" onClick={() => setViewMode('templates')}>
                    Browse Templates
                  </button>
                </div>
              ) : (
                chains.map(chain => (
                  <div key={chain.id} className={`workflow-item ${chain.enabled ? 'enabled' : 'disabled'}`}>
                    <div className="workflow-status">
                      <button
                        className={`toggle-btn ${chain.enabled ? 'on' : 'off'}`}
                        onClick={() => handleToggleChain(chain.id)}
                      >
                        {chain.enabled ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div className="workflow-info">
                      <h4>{chain.name}</h4>
                      <p>{chain.description || 'No description'}</p>
                      <div className="workflow-meta">
                        <span>{chain.nodes.length} nodes</span>
                        <span>•</span>
                        <span>{chain.stats?.totalRuns || 0} runs</span>
                        <span>•</span>
                        <span>Updated {new Date(chain.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="workflow-actions">
                      <button className="icon-btn" onClick={() => handleEditChain(chain)} title="Edit">
                        ✏️
                      </button>
                      <button className="icon-btn" onClick={() => handleDeleteChain(chain.id)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Templates View */}
        {viewMode === 'templates' && (
          <div className="automation-templates-view">
            {/* Search & Filter */}
            <div className="templates-toolbar">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="template-search"
              />
              <div className="category-filter">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`category-btn ${filterCategory === cat ? 'active' : ''}`}
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Grid */}
            <div className="template-grid">
              {filteredTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-icon">{template.icon}</div>
                  <div className="template-content">
                    <h4>{template.name}</h4>
                    <p>{template.description}</p>
                    <div className="template-meta">
                      <span className={`difficulty ${template.difficulty}`}>
                        {template.difficulty}
                      </span>
                      <span className="category">{template.category}</span>
                    </div>
                  </div>
                  <button
                    className="use-template-btn"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Builder View */}
        {viewMode === 'builder' && editingChain && (
          <div className="automation-builder-view">
            {/* Workflow Name Input */}
            <div className="builder-toolbar">
              <input
                type="text"
                value={editingChain.name}
                onChange={e => setEditingChain({ ...editingChain, name: e.target.value })}
                className="workflow-name-input"
                placeholder="Workflow name..."
              />
              <input
                type="text"
                value={editingChain.description}
                onChange={e => setEditingChain({ ...editingChain, description: e.target.value })}
                className="workflow-desc-input"
                placeholder="Description (optional)..."
              />
              <button
                className="save-btn"
                onClick={() => handleSaveChain(editingChain)}
              >
                💾 Save Workflow
              </button>
            </div>

            {/* Chain Builder */}
            <div className="builder-canvas-container">
              <ChainBuilder
                chain={editingChain}
                onChainChange={setEditingChain}
                feedId={feedId || ''}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="automation-modal-footer">
          <span className="footer-info">
            {viewMode === 'list' && `${chains.filter(c => c.enabled).length} active workflows`}
            {viewMode === 'templates' && `${filteredTemplates.length} templates available`}
            {viewMode === 'builder' && 'Drag nodes to build your workflow'}
          </span>
        </footer>
      </div>

      <style jsx>{`
        .automation-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .automation-modal-content {
          background: linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%);
          border: 1px solid #00ffc8;
          border-radius: 12px;
          width: 100%;
          max-width: 1200px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .automation-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(0, 255, 200, 0.2);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .automation-modal-header h2 {
          color: #00ffc8;
          font-size: 1.25rem;
          margin: 0;
        }

        .back-btn {
          background: transparent;
          border: 1px solid rgba(0, 255, 200, 0.3);
          color: #00ffc8;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .back-btn:hover {
          background: rgba(0, 255, 200, 0.1);
        }

        .close-btn {
          background: transparent;
          border: none;
          color: #888;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
        }

        .close-btn:hover {
          color: #ff4444;
        }

        /* List View */
        .automation-list-view {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .automation-stats {
          display: flex;
          gap: 2rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(0, 255, 200, 0.05);
          border-radius: 8px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #fff;
        }

        .stat-value.active {
          color: #00ffc8;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #888;
          text-transform: uppercase;
        }

        .automation-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .action-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          background: transparent;
          border: 1px solid rgba(0, 255, 200, 0.3);
          color: #00ffc8;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(0, 255, 200, 0.1);
        }

        .action-btn.primary {
          background: rgba(0, 255, 200, 0.2);
          border-color: #00ffc8;
        }

        .workflow-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #888;
        }

        .empty-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          margin-bottom: 1.5rem;
        }

        .workflow-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .workflow-item:hover {
          border-color: rgba(0, 255, 200, 0.3);
          background: rgba(0, 255, 200, 0.05);
        }

        .workflow-item.enabled {
          border-color: rgba(0, 255, 200, 0.3);
        }

        .toggle-btn {
          padding: 0.35rem 0.75rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
          cursor: pointer;
          border: none;
        }

        .toggle-btn.on {
          background: #00ffc8;
          color: #000;
        }

        .toggle-btn.off {
          background: #333;
          color: #888;
        }

        .workflow-info {
          flex: 1;
        }

        .workflow-info h4 {
          color: #fff;
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
        }

        .workflow-info p {
          color: #888;
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
        }

        .workflow-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #666;
        }

        .workflow-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Templates View */
        .automation-templates-view {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .templates-toolbar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .template-search {
          flex: 1;
          min-width: 200px;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #fff;
          font-size: 0.875rem;
        }

        .template-search:focus {
          outline: none;
          border-color: #00ffc8;
        }

        .category-filter {
          display: flex;
          gap: 0.5rem;
        }

        .category-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #888;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .category-btn:hover,
        .category-btn.active {
          border-color: #00ffc8;
          color: #00ffc8;
        }

        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .template-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.2s;
        }

        .template-card:hover {
          border-color: rgba(0, 255, 200, 0.3);
          background: rgba(0, 255, 200, 0.05);
        }

        .template-icon {
          font-size: 2rem;
        }

        .template-content h4 {
          color: #fff;
          margin: 0 0 0.5rem 0;
        }

        .template-content p {
          color: #888;
          font-size: 0.875rem;
          margin: 0 0 0.75rem 0;
        }

        .template-meta {
          display: flex;
          gap: 0.5rem;
        }

        .difficulty {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          text-transform: uppercase;
        }

        .difficulty.beginner {
          background: rgba(0, 255, 200, 0.2);
          color: #00ffc8;
        }

        .difficulty.intermediate {
          background: rgba(255, 200, 0, 0.2);
          color: #ffc800;
        }

        .difficulty.advanced {
          background: rgba(255, 100, 100, 0.2);
          color: #ff6464;
        }

        .category {
          padding: 0.25rem 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          font-size: 0.7rem;
          color: #888;
        }

        .use-template-btn {
          width: 100%;
          padding: 0.75rem;
          background: rgba(0, 255, 200, 0.1);
          border: 1px solid #00ffc8;
          color: #00ffc8;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .use-template-btn:hover {
          background: rgba(0, 255, 200, 0.2);
        }

        /* Builder View */
        .automation-builder-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .builder-toolbar {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(0, 255, 200, 0.2);
        }

        .workflow-name-input {
          flex: 0 0 200px;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: #fff;
          font-weight: bold;
        }

        .workflow-desc-input {
          flex: 1;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: #888;
        }

        .workflow-name-input:focus,
        .workflow-desc-input:focus {
          outline: none;
          border-color: #00ffc8;
        }

        .save-btn {
          padding: 0.5rem 1.5rem;
          background: #00ffc8;
          border: none;
          border-radius: 4px;
          color: #000;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-btn:hover {
          background: #00ddb0;
        }

        .builder-canvas-container {
          flex: 1;
          overflow: hidden;
        }

        /* Footer */
        .automation-modal-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(0, 255, 200, 0.2);
          display: flex;
          justify-content: center;
        }

        .footer-info {
          color: #666;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

export default AutomationModal;
