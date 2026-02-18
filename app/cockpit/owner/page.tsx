'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, hasRole, seedAuthIfEmpty } from '@/app/lib/auth/auth-store';
import { ROLE_PERMISSIONS } from '@/app/lib/auth/types';
import './owner.css';

/**
 * OWNER CONTROL CENTER
 * Sitewide oversight and administration for Social Exchange
 */

// Types for admin dashboard
interface PlatformMetrics {
  totalUsers: number;
  activeUsers24h: number;
  totalCommunities: number;
  activeCommunities: number;
  totalCreditsCirculating: number;
  totalRevenueAllTime: number;
  revenue24h: number;
  revenue7d: number;
  pendingReviews: number;
  flaggedContent: number;
}

interface CommunityOverview {
  id: string;
  name: string;
  creator: string;
  supporters: number;
  creditsHeld: number;
  status: 'active' | 'paused' | 'flagged' | 'archived';
  createdAt: number;
  lastActivity: number;
  revenueGenerated: number;
}

interface UserOverview {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'creator' | 'admin';
  joinedAt: number;
  lastActive: number;
  communitiesOwned: number;
  communitiesJoined: number;
  totalSpent: number;
  status: 'active' | 'suspended' | 'flagged';
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
}

type TabType = 'overview' | 'communities' | 'users' | 'revenue' | 'compliance' | 'settings' | 'api-status';

export default function OwnerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [communities, setCommunities] = useState<CommunityOverview[]>([]);
  const [users, setUsers] = useState<UserOverview[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    seedAuthIfEmpty();

    // Check authorization
    const user = getCurrentUser();
    setCurrentUser(user);

    if (!user) {
      setIsAuthorized(false);
      return;
    }

    const permissions = ROLE_PERMISSIONS[user.role];
    if (!permissions.canAccessOwnerDashboard) {
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
    // Load mock data for demonstration
    loadMockData();
  }, []);

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Show loading state while checking auth
  if (isAuthorized === null) {
    return (
      <div className="owner-loading">
        <div className="owner-loading-spinner" />
        <div className="owner-loading-text">Verifying access...</div>
      </div>
    );
  }

  // Show access denied if not authorized
  if (!isAuthorized) {
    return (
      <div className="owner-access-denied">
        <div className="owner-access-denied-card">
          <div className="owner-access-denied-icon">🔒</div>
          <h1 className="owner-access-denied-title">Access Restricted</h1>
          <p className="owner-access-denied-text">
            This area is restricted to owners and developers only.
            {currentUser ? (
              <span> Your current role ({currentUser.role}) does not have permission to access this dashboard.</span>
            ) : (
              <span> Please sign in with owner or developer credentials.</span>
            )}
          </p>
          <div className="owner-access-denied-actions">
            <Link href="/auth/owner" className="owner-access-btn primary">
              🔐 Owner Login
            </Link>
            <Link href="/cockpit" className="owner-access-btn secondary">
              ← Back to Cockpit
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function loadMockData() {
    const now = Date.now();

    setMetrics({
      totalUsers: 2847,
      activeUsers24h: 341,
      totalCommunities: 156,
      activeCommunities: 89,
      totalCreditsCirculating: 4_230_000,
      totalRevenueAllTime: 127_350,
      revenue24h: 1_847.50,
      revenue7d: 11_290,
      pendingReviews: 7,
      flaggedContent: 2,
    });

    setCommunities([
      {
        id: 'c1',
        name: 'Urban Signal',
        creator: '@marcusj',
        supporters: 12_400,
        creditsHeld: 45_000,
        status: 'active',
        createdAt: now - 90 * 24 * 60 * 60 * 1000,
        lastActivity: now - 15 * 60 * 1000,
        revenueGenerated: 12_400,
      },
      {
        id: 'c2',
        name: 'Tech Insights',
        creator: '@techguru',
        supporters: 8_200,
        creditsHeld: 28_000,
        status: 'active',
        createdAt: now - 75 * 24 * 60 * 60 * 1000,
        lastActivity: now - 45 * 60 * 1000,
        revenueGenerated: 8_200,
      },
      {
        id: 'c3',
        name: 'Fitness Revolution',
        creator: '@fitpro',
        supporters: 5_600,
        creditsHeld: 15_000,
        status: 'active',
        createdAt: now - 60 * 24 * 60 * 60 * 1000,
        lastActivity: now - 2 * 60 * 60 * 1000,
        revenueGenerated: 5_600,
      },
      {
        id: 'c4',
        name: 'Neon Beats',
        creator: '@djneon',
        supporters: 3_100,
        creditsHeld: 8_500,
        status: 'flagged',
        createdAt: now - 120 * 24 * 60 * 60 * 1000,
        lastActivity: now - 6 * 60 * 60 * 1000,
        revenueGenerated: 3_100,
      },
      {
        id: 'c5',
        name: 'Wanderlust Eats',
        creator: '@foodie',
        supporters: 2_800,
        creditsHeld: 6_200,
        status: 'paused',
        createdAt: now - 45 * 24 * 60 * 60 * 1000,
        lastActivity: now - 3 * 24 * 60 * 60 * 1000,
        revenueGenerated: 2_800,
      },
    ]);

    setUsers([
      {
        id: 'u1',
        name: 'Marcus Johnson',
        email: 'marcus@urban.co',
        role: 'creator',
        joinedAt: now - 45 * 24 * 60 * 60 * 1000,
        lastActive: now - 10 * 60 * 1000,
        communitiesOwned: 2,
        communitiesJoined: 5,
        totalSpent: 4_500,
        status: 'active',
      },
      {
        id: 'u2',
        name: 'Sarah Chen',
        email: 'sarah@tech.io',
        role: 'creator',
        joinedAt: now - 60 * 24 * 60 * 60 * 1000,
        lastActive: now - 30 * 60 * 1000,
        communitiesOwned: 1,
        communitiesJoined: 3,
        totalSpent: 2_200,
        status: 'active',
      },
      {
        id: 'u3',
        name: 'Jake Torres',
        email: 'jake@fit.com',
        role: 'user',
        joinedAt: now - 30 * 24 * 60 * 60 * 1000,
        lastActive: now - 2 * 60 * 60 * 1000,
        communitiesOwned: 0,
        communitiesJoined: 8,
        totalSpent: 890,
        status: 'active',
      },
      {
        id: 'u4',
        name: 'DJ Neon',
        email: 'neon@beats.co',
        role: 'creator',
        joinedAt: now - 90 * 24 * 60 * 60 * 1000,
        lastActive: now - 12 * 60 * 60 * 1000,
        communitiesOwned: 1,
        communitiesJoined: 2,
        totalSpent: 1_100,
        status: 'flagged',
      },
      {
        id: 'u5',
        name: 'Admin User',
        email: 'admin@socialexchange.io',
        role: 'admin',
        joinedAt: now - 120 * 24 * 60 * 60 * 1000,
        lastActive: now - 5 * 60 * 1000,
        communitiesOwned: 0,
        communitiesJoined: 0,
        totalSpent: 0,
        status: 'active',
      },
    ]);

    setAlerts([
      {
        id: '1',
        type: 'warning',
        title: 'Rate Limit Warning',
        message: 'Instagram API usage at 78% hourly limit (156/200 calls)',
        timestamp: now - 1 * 60 * 60 * 1000,
        resolved: false,
      },
      {
        id: '2',
        type: 'info',
        title: 'System Update',
        message: 'Platform v2.1 deployed successfully. All services operational.',
        timestamp: now - 3 * 60 * 60 * 1000,
        resolved: false,
      },
      {
        id: '3',
        type: 'error',
        title: 'Failed Payout',
        message: 'Stripe payout to @djneon failed - insufficient platform balance',
        timestamp: now - 6 * 60 * 60 * 1000,
        resolved: false,
      },
      {
        id: '4',
        type: 'success',
        title: 'Compliance Scan Complete',
        message: 'Automated scan completed. 2 items flagged for manual review.',
        timestamp: now - 12 * 60 * 60 * 1000,
        resolved: false,
      },
    ]);
  }

  return (
    <div className="owner-root">
      {/* Header */}
      <div className="owner-header">
        <div className="owner-header-left">
          <h1 className="owner-title">Owner Control Center</h1>
          <p className="owner-subtitle">Social Exchange Platform Administration</p>
        </div>
        <div className="owner-header-right">
          <span className="owner-status online">System Online</span>
          <span className="owner-time">{currentTime.toLocaleString()}</span>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <div className="alerts-banner">
          <span className="alerts-icon">⚠️</span>
          <span>{alerts.filter(a => !a.resolved).length} unresolved alerts require attention</span>
          <button onClick={() => setActiveTab('compliance')}>View Alerts</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="owner-tabs">
        {[
          { key: 'overview', label: 'Overview', icon: '📊' },
          { key: 'communities', label: 'Communities', icon: '👥' },
          { key: 'users', label: 'Users', icon: '👤' },
          { key: 'revenue', label: 'Revenue', icon: '💰' },
          { key: 'compliance', label: 'Compliance', icon: '⚖️' },
          { key: 'settings', label: 'Settings', icon: '⚙️' },
          { key: 'api-status', label: 'API Status', icon: '🔌' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`owner-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="owner-content">
        {activeTab === 'overview' && <OverviewTab metrics={metrics} alerts={alerts} />}
        {activeTab === 'communities' && <CommunitiesTab communities={communities} />}
        {activeTab === 'users' && <UsersTab users={users} />}
        {activeTab === 'revenue' && <RevenueTab metrics={metrics} />}
        {activeTab === 'compliance' && <ComplianceTab alerts={alerts} setAlerts={setAlerts} />}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'api-status' && <ApiStatusTab />}
      </div>
    </div>
  );
}

/* =========================================
   OVERVIEW TAB
========================================= */
function OverviewTab({ metrics, alerts }: { metrics: PlatformMetrics | null; alerts: SystemAlert[] }) {
  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="tab-content">
      <h2>Platform Overview</h2>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-value">{metrics.totalUsers.toLocaleString()}</div>
          <div className="metric-label">Total Users</div>
          <div className="metric-sub">{metrics.activeUsers24h.toLocaleString()} active today</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.totalCommunities}</div>
          <div className="metric-label">Communities</div>
          <div className="metric-sub">{metrics.activeCommunities} active</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{(metrics.totalCreditsCirculating / 1000000).toFixed(2)}M</div>
          <div className="metric-label">Credits Circulating</div>
        </div>
        <div className="metric-card success">
          <div className="metric-value">${metrics.totalRevenueAllTime.toLocaleString()}</div>
          <div className="metric-label">Total Revenue</div>
          <div className="metric-sub">+${metrics.revenue24h.toFixed(2)} today</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <button className="action-btn">
            <span>📝</span> Review Pending ({metrics.pendingReviews})
          </button>
          <button className="action-btn warning">
            <span>🚩</span> Flagged Content ({metrics.flaggedContent})
          </button>
          <button className="action-btn">
            <span>📢</span> Send Announcement
          </button>
          <button className="action-btn">
            <span>📊</span> Generate Report
          </button>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="section">
        <h3>Recent Alerts</h3>
        <div className="alerts-list">
          {alerts.slice(0, 5).map(alert => (
            <div key={alert.id} className={`alert-item ${alert.type} ${alert.resolved ? 'resolved' : ''}`}>
              <div className="alert-icon">
                {alert.type === 'warning' && '⚠️'}
                {alert.type === 'error' && '❌'}
                {alert.type === 'info' && 'ℹ️'}
                {alert.type === 'success' && '✅'}
              </div>
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                <div className="alert-message">{alert.message}</div>
                <div className="alert-time">{new Date(alert.timestamp).toLocaleString()}</div>
              </div>
              {!alert.resolved && (
                <button className="alert-action">Resolve</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================
   COMMUNITIES TAB
========================================= */
function CommunitiesTab({ communities }: { communities: CommunityOverview[] }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'flagged' | 'paused'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = communities.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Communities Management</h2>
        <div className="tab-controls">
          <input
            type="text"
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="flagged">Flagged</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Community</th>
            <th>Creator</th>
            <th>Supporters</th>
            <th>Credits</th>
            <th>Revenue</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(community => (
            <tr key={community.id}>
              <td>
                <div className="community-name">{community.name}</div>
                <div className="community-date">Created {new Date(community.createdAt).toLocaleDateString()}</div>
              </td>
              <td>{community.creator}</td>
              <td>{community.supporters.toLocaleString()}</td>
              <td>{(community.creditsHeld / 1000).toFixed(1)}K</td>
              <td>${community.revenueGenerated.toLocaleString()}</td>
              <td>
                <span className={`status-badge ${community.status}`}>
                  {community.status}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button className="action-btn-small">View</button>
                  <button className="action-btn-small">Edit</button>
                  {community.status === 'flagged' && (
                    <button className="action-btn-small warning">Review</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================
   USERS TAB
========================================= */
function UsersTab({ users }: { users: UserOverview[] }) {
  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>User Management</h2>
        <div className="tab-controls">
          <input type="text" placeholder="Search users..." className="search-input" />
          <select>
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="creator">Creators</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Last Active</th>
            <th>Communities</th>
            <th>Total Spent</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </td>
              <td>
                <span className={`role-badge ${user.role}`}>{user.role}</span>
              </td>
              <td>{new Date(user.joinedAt).toLocaleDateString()}</td>
              <td>{new Date(user.lastActive).toLocaleString()}</td>
              <td>
                {user.communitiesOwned > 0 && <span>{user.communitiesOwned} owned</span>}
                {user.communitiesJoined > 0 && <span>{user.communitiesJoined} joined</span>}
              </td>
              <td>${user.totalSpent.toFixed(2)}</td>
              <td>
                <span className={`status-badge ${user.status}`}>{user.status}</span>
              </td>
              <td>
                <div className="action-buttons">
                  <button className="action-btn-small">View</button>
                  <button className="action-btn-small">Message</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================
   REVENUE TAB
========================================= */
function RevenueTab({ metrics }: { metrics: PlatformMetrics | null }) {
  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="tab-content">
      <h2>Revenue & Analytics</h2>

      <div className="metrics-grid">
        <div className="metric-card success large">
          <div className="metric-value">${metrics.totalRevenueAllTime.toLocaleString()}</div>
          <div className="metric-label">All-Time Revenue</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">${metrics.revenue24h.toFixed(2)}</div>
          <div className="metric-label">Last 24 Hours</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">${metrics.revenue7d.toFixed(2)}</div>
          <div className="metric-label">Last 7 Days</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">5%</div>
          <div className="metric-label">Platform Fee Rate</div>
        </div>
      </div>

      <div className="section">
        <h3>Revenue Breakdown</h3>
        <div className="revenue-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-label">Credit Purchases (Platform Fee)</span>
            <span className="breakdown-value">${(metrics.totalRevenueAllTime * 0.95).toFixed(2)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Premium Features</span>
            <span className="breakdown-value">${(metrics.totalRevenueAllTime * 0.03).toFixed(2)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Creator Subscriptions</span>
            <span className="breakdown-value">${(metrics.totalRevenueAllTime * 0.02).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>Export Options</h3>
        <div className="quick-actions">
          <button className="action-btn">📊 Export CSV</button>
          <button className="action-btn">📄 Generate Tax Report</button>
          <button className="action-btn">📈 Financial Summary</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   COMPLIANCE TAB
========================================= */
function ComplianceTab({
  alerts,
  setAlerts
}: {
  alerts: SystemAlert[];
  setAlerts: React.Dispatch<React.SetStateAction<SystemAlert[]>>
}) {
  function resolveAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  }

  return (
    <div className="tab-content">
      <h2>Compliance & Moderation</h2>

      {/* Compliance Status */}
      <div className="compliance-status">
        <div className="compliance-card success">
          <div className="compliance-icon">✅</div>
          <div className="compliance-title">Howey Test Compliance</div>
          <div className="compliance-desc">All communities using approved utility-based language</div>
        </div>
        <div className="compliance-card success">
          <div className="compliance-icon">✅</div>
          <div className="compliance-title">Terms of Service</div>
          <div className="compliance-desc">Last updated: Jan 15, 2026</div>
        </div>
        <div className="compliance-card warning">
          <div className="compliance-icon">⚠️</div>
          <div className="compliance-title">Content Review</div>
          <div className="compliance-desc">3 items pending review</div>
        </div>
      </div>

      {/* Alerts Management */}
      <div className="section">
        <h3>System Alerts</h3>
        <div className="alerts-full-list">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-item-full ${alert.type} ${alert.resolved ? 'resolved' : ''}`}>
              <div className="alert-header">
                <div className="alert-icon-large">
                  {alert.type === 'warning' && '⚠️'}
                  {alert.type === 'error' && '❌'}
                  {alert.type === 'info' && 'ℹ️'}
                  {alert.type === 'success' && '✅'}
                </div>
                <div className="alert-info">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-time">{new Date(alert.timestamp).toLocaleString()}</div>
                </div>
                <div className="alert-status">
                  {alert.resolved ? (
                    <span className="status-resolved">Resolved</span>
                  ) : (
                    <button className="resolve-btn" onClick={() => resolveAlert(alert.id)}>
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
              <div className="alert-body">{alert.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Tools */}
      <div className="section">
        <h3>Compliance Tools</h3>
        <div className="quick-actions">
          <button className="action-btn">🔍 Run Compliance Scan</button>
          <button className="action-btn">📋 Review Pending Content</button>
          <button className="action-btn">📊 Generate Compliance Report</button>
          <button className="action-btn">⚖️ Update Legal Terms</button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   SETTINGS TAB
========================================= */
function SettingsTab() {
  return (
    <div className="tab-content">
      <h2>Platform Settings</h2>

      <div className="settings-section">
        <h3>Fee Configuration</h3>
        <div className="setting-row">
          <label>Platform Fee Rate</label>
          <div className="setting-input">
            <input type="number" defaultValue={5} min={0} max={20} />
            <span>%</span>
          </div>
          <p className="setting-desc">Applied to all credit purchases</p>
        </div>
        <div className="setting-row">
          <label>Minimum Creator Deposit</label>
          <div className="setting-input">
            <span>$</span>
            <input type="number" defaultValue={100} min={10} />
          </div>
          <p className="setting-desc">Minimum to create a community</p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Community Settings</h3>
        <div className="setting-row">
          <label>Creator Commitment Period</label>
          <div className="setting-input">
            <input type="number" defaultValue={12} min={6} max={24} />
            <span>months</span>
          </div>
          <p className="setting-desc">How long creators must maintain their community</p>
        </div>
        <div className="setting-row">
          <label>Founding Member Window</label>
          <div className="setting-input">
            <input type="number" defaultValue={30} min={7} max={90} />
            <span>days</span>
          </div>
          <p className="setting-desc">Window for founding member status</p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Moderation Settings</h3>
        <div className="setting-row checkbox">
          <input type="checkbox" id="autoScan" defaultChecked />
          <label htmlFor="autoScan">Enable automated compliance scanning</label>
        </div>
        <div className="setting-row checkbox">
          <input type="checkbox" id="manualReview" defaultChecked />
          <label htmlFor="manualReview">Require manual review for new communities</label>
        </div>
        <div className="setting-row checkbox">
          <input type="checkbox" id="contentFilter" defaultChecked />
          <label htmlFor="contentFilter">Enable content filtering for prohibited terms</label>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-btn">Save Changes</button>
        <button className="reset-btn">Reset to Defaults</button>
      </div>
    </div>
  );
}

/* =========================================
   API STATUS TAB
========================================= */
function ApiStatusTab() {
  const apis = [
    {
      name: 'Instagram Graph API',
      status: 'configured' as const,
      endpoints: ['/api/instagram/publish', '/api/instagram/insights', '/api/instagram/profile', '/api/instagram/media', '/api/instagram/stories', '/api/instagram/hashtags'],
      permissions: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_insights'],
      notes: 'OAuth configured. Ready for account connection.',
    },
    {
      name: 'Stripe Payments',
      status: 'needs-keys' as const,
      endpoints: ['/api/stripe/checkout', '/api/stripe/connect', '/api/stripe/webhook'],
      permissions: ['Checkout Sessions', 'Connect Express', 'Webhooks'],
      notes: 'Routes built. Add STRIPE_SECRET_KEY to .env.local',
    },
    {
      name: 'Anthropic AI Copilot',
      status: 'configured' as const,
      endpoints: ['/api/copilot/chat', '/api/copilot/generate'],
      permissions: ['Messages API'],
      notes: 'API key configured. Copilot operational.',
    },
    {
      name: 'Plaid Banking',
      status: 'not-configured' as const,
      endpoints: [],
      permissions: ['Auth', 'Transactions', 'Balance', 'Identity'],
      notes: 'Routes not built yet. Add PLAID_CLIENT_ID to .env.local',
    },
    {
      name: 'Pusher (Real-time)',
      status: 'not-configured' as const,
      endpoints: [],
      permissions: ['Channels', 'Triggers'],
      notes: 'Optional. Add PUSHER_APP_ID to .env.local',
    },
    {
      name: 'File Storage',
      status: 'local' as const,
      endpoints: [],
      permissions: ['Upload', 'Serve'],
      notes: 'Using local ./uploads. Configure S3 or Cloudinary for production.',
    },
  ];

  return (
    <div className="tab-content">
      <h2>API Integration Status</h2>
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-value">{apis.filter(a => a.status === 'configured').length}</div>
          <div className="metric-label">APIs Connected</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{apis.filter(a => a.status === 'needs-keys').length}</div>
          <div className="metric-label">Needs API Keys</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{apis.filter(a => a.status === 'not-configured').length}</div>
          <div className="metric-label">Not Configured</div>
        </div>
        <div className="metric-card success">
          <div className="metric-value">35</div>
          <div className="metric-label">API Routes Built</div>
        </div>
      </div>

      <div className="section">
        <h3>Integration Details</h3>
        <div className="alerts-list">
          {apis.map((api, i) => (
            <div key={i} className={`alert-item ${api.status === 'configured' ? 'success' : api.status === 'needs-keys' ? 'warning' : 'info'}`}>
              <div className="alert-icon">
                {api.status === 'configured' ? '✅' : api.status === 'needs-keys' ? '🔑' : api.status === 'local' ? '📁' : '⬜'}
              </div>
              <div className="alert-content">
                <div className="alert-title">{api.name}</div>
                <div className="alert-message">{api.notes}</div>
                {api.endpoints.length > 0 && (
                  <div className="alert-time">
                    Endpoints: {api.endpoints.join(', ')}
                  </div>
                )}
                {api.permissions.length > 0 && (
                  <div className="alert-time" style={{marginTop: '0.25rem'}}>
                    Scopes: {api.permissions.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
