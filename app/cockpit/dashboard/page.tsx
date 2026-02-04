'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, seedAuthIfEmpty, logout } from '@/app/lib/auth/auth-store';
import { ROLE_PERMISSIONS } from '@/app/lib/auth/types';

import './command-center.css';

// Types
interface QuickStat {
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: string;
}

interface Activity {
  id: string;
  type: 'post' | 'transaction' | 'follower' | 'alert' | 'system';
  message: string;
  time: string;
  icon: string;
}

interface ScheduledPost {
  id: string;
  platform: 'instagram' | 'tiktok' | 'twitter' | 'youtube';
  account: string;
  time: string;
  caption: string;
  status: 'scheduled' | 'draft' | 'automated';
}

interface MarketItem {
  id: string;
  name: string;
  platform: string;
  followers: string;
  price: number;
  change: number;
}

export default function CommandCenter() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    seedAuthIfEmpty();
    const currentUser = getCurrentUser();
    setUser(currentUser);

    // If not logged in, redirect to login
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Empty state - real data will come from connected feeds and APIs
  const quickStats: QuickStat[] = [
    { label: 'Total Followers', value: '—', change: 'Connect feeds', changeType: 'neutral', icon: '👥' },
    { label: 'Engagement Rate', value: '—', change: 'No data', changeType: 'neutral', icon: '📈' },
    { label: 'Scheduled Posts', value: '0', change: 'None', changeType: 'neutral', icon: '📅' },
    { label: 'Community Credits', value: '0', change: '—', changeType: 'neutral', icon: '💎' },
    { label: 'Portfolio Value', value: '$0', change: '—', changeType: 'neutral', icon: '💰' },
    { label: 'Active Listings', value: '0', change: 'None', changeType: 'neutral', icon: '🏷️' },
  ];

  const recentActivity: Activity[] = [
    { id: '1', type: 'system', message: 'Welcome to Social Exchange! Connect your feeds to get started.', time: 'Just now', icon: '👋' },
  ];

  const upcomingPosts: ScheduledPost[] = [];

  const marketTrending: MarketItem[] = [];

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  if (!user) {
    return (
      <div className="cc-loading">
        <div className="cc-loading-spinner" />
        <span>Loading command center...</span>
      </div>
    );
  }

  return (
    <div className="command-center-v2">
      {/* Top Bar */}
      <header className="cc-topbar">
        <div className="cc-topbar-left">
          <div className="cc-time">
            <span className="cc-time-value">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="cc-time-date">
              {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="cc-topbar-center">
          <span className="cc-system-status">
            <span className="cc-status-dot online" />
            ALL SYSTEMS OPERATIONAL
          </span>
        </div>
        <div className="cc-topbar-right">
          <div className="cc-user-menu">
            <div className="cc-user-info">
              <span className="cc-user-name">{user.displayName}</span>
              <span className="cc-user-role">{user.role.toUpperCase()}</span>
            </div>
            <button className="cc-logout-btn" onClick={handleLogout}>
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="cc-welcome">
        <div className="cc-welcome-text">
          <h1 className="cc-welcome-greeting">{greeting}, {user.displayName.split(' ')[0]}</h1>
          <p className="cc-welcome-summary">
            Connect your social feeds to start managing your digital presence.
          </p>
        </div>
        <div className="cc-quick-actions">
          <Link href="/cockpit/my-e-assets/my-feeds" className="cc-quick-action">
            <span className="cc-qa-icon">📅</span>
            <span className="cc-qa-label">Schedule Post</span>
          </Link>
          <Link href="/cockpit/my-e-assets/my-e-shares" className="cc-quick-action">
            <span className="cc-qa-icon">💎</span>
            <span className="cc-qa-label">View Credits</span>
          </Link>
          <Link href="/cockpit/my-e-assets/market" className="cc-quick-action">
            <span className="cc-qa-icon">🏪</span>
            <span className="cc-qa-label">Marketplace</span>
          </Link>
          {permissions?.canAccessOwnerDashboard && (
            <Link href="/cockpit/owner" className="cc-quick-action owner">
              <span className="cc-qa-icon">🔐</span>
              <span className="cc-qa-label">Owner Panel</span>
            </Link>
          )}
        </div>
      </section>

      {/* Stats Grid */}
      <section className="cc-stats-grid">
        {quickStats.map((stat, index) => (
          <div key={index} className="cc-stat-card">
            <div className="cc-stat-icon">{stat.icon}</div>
            <div className="cc-stat-content">
              <span className="cc-stat-value">{stat.value}</span>
              <span className="cc-stat-label">{stat.label}</span>
            </div>
            {stat.change && (
              <span className={`cc-stat-change ${stat.changeType}`}>
                {stat.changeType === 'up' && '↑'}
                {stat.changeType === 'down' && '↓'}
                {stat.change}
              </span>
            )}
          </div>
        ))}
      </section>

      {/* Main Grid */}
      <div className="cc-main-grid">
        {/* Activity Feed */}
        <section className="cc-panel cc-activity">
          <div className="cc-panel-header">
            <h2 className="cc-panel-title">Recent Activity</h2>
            <span className="cc-panel-badge">Live</span>
          </div>
          <div className="cc-activity-list">
            {recentActivity.map((activity) => (
              <div key={activity.id} className={`cc-activity-item ${activity.type}`}>
                <span className="cc-activity-icon">{activity.icon}</span>
                <div className="cc-activity-content">
                  <span className="cc-activity-message">{activity.message}</span>
                  <span className="cc-activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="cc-panel-link">View All Activity →</button>
        </section>

        {/* Upcoming Posts */}
        <section className="cc-panel cc-schedule">
          <div className="cc-panel-header">
            <h2 className="cc-panel-title">Upcoming Posts</h2>
            <Link href="/cockpit/my-e-assets/my-feeds" className="cc-panel-action">
              Manage
            </Link>
          </div>
          <div className="cc-schedule-list">
            {upcomingPosts.length === 0 ? (
              <div className="cc-empty-state">
                <span className="cc-empty-icon">📅</span>
                <span className="cc-empty-text">No posts scheduled</span>
              </div>
            ) : upcomingPosts.map((post) => (
              <div key={post.id} className="cc-schedule-item">
                <div className="cc-schedule-platform">
                  {post.platform === 'instagram' && '📸'}
                  {post.platform === 'tiktok' && '🎵'}
                  {post.platform === 'twitter' && '𝕏'}
                  {post.platform === 'youtube' && '▶️'}
                </div>
                <div className="cc-schedule-content">
                  <div className="cc-schedule-header">
                    <span className="cc-schedule-account">{post.account}</span>
                    <span className={`cc-schedule-status ${post.status}`}>{post.status}</span>
                  </div>
                  <span className="cc-schedule-time">{post.time}</span>
                  <span className="cc-schedule-caption">{post.caption}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/cockpit/my-e-assets/my-feeds" className="cc-panel-link">
            View Full Schedule →
          </Link>
        </section>

        {/* Market Trending */}
        <section className="cc-panel cc-market">
          <div className="cc-panel-header">
            <h2 className="cc-panel-title">Market Trending</h2>
            <Link href="/cockpit/my-e-assets/market" className="cc-panel-action">
              Browse
            </Link>
          </div>
          <div className="cc-market-list">
            {marketTrending.length === 0 ? (
              <div className="cc-empty-state">
                <span className="cc-empty-icon">🏪</span>
                <span className="cc-empty-text">No market listings yet</span>
              </div>
            ) : marketTrending.map((item) => (
              <div key={item.id} className="cc-market-item">
                <div className="cc-market-info">
                  <span className="cc-market-name">{item.name}</span>
                  <span className="cc-market-meta">{item.platform} • {item.followers}</span>
                </div>
                <div className="cc-market-price">
                  <span className="cc-market-value">${item.price.toLocaleString()}</span>
                  <span className={`cc-market-change ${item.change >= 0 ? 'up' : 'down'}`}>
                    {item.change >= 0 ? '+' : ''}{item.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/cockpit/my-e-assets/market" className="cc-panel-link">
            View Marketplace →
          </Link>
        </section>

        {/* E-Shares Overview */}
        <section className="cc-panel cc-shares">
          <div className="cc-panel-header">
            <h2 className="cc-panel-title">Community Credits</h2>
            <Link href="/cockpit/my-e-assets/my-e-shares" className="cc-panel-action">
              Manage
            </Link>
          </div>
          <div className="cc-shares-overview">
            <div className="cc-shares-stat">
              <span className="cc-shares-value">0</span>
              <span className="cc-shares-label">Credits Held</span>
            </div>
            <div className="cc-shares-stat">
              <span className="cc-shares-value">0</span>
              <span className="cc-shares-label">Communities</span>
            </div>
            <div className="cc-shares-stat">
              <span className="cc-shares-value">—</span>
              <span className="cc-shares-label">Highest Tier</span>
            </div>
          </div>
          <div className="cc-shares-communities">
            <div className="cc-empty-state">
              <span className="cc-empty-icon">💎</span>
              <span className="cc-empty-text">No communities joined yet</span>
            </div>
          </div>
          <Link href="/cockpit/my-e-assets/my-e-shares" className="cc-panel-link">
            View All Communities →
          </Link>
        </section>
      </div>

      {/* Navigation Cards */}
      <section className="cc-nav-cards">
        <Link href="/cockpit/my-e-assets/my-feeds" className="cc-nav-card feeds">
          <div className="cc-nav-card-icon">📡</div>
          <div className="cc-nav-card-content">
            <h3 className="cc-nav-card-title">E-Feeds</h3>
            <p className="cc-nav-card-desc">Manage & automate your social media accounts</p>
          </div>
          <span className="cc-nav-card-arrow">→</span>
        </Link>

        <Link href="/cockpit/my-e-assets/my-e-shares" className="cc-nav-card shares">
          <div className="cc-nav-card-icon">💎</div>
          <div className="cc-nav-card-content">
            <h3 className="cc-nav-card-title">E-Shares</h3>
            <p className="cc-nav-card-desc">Community credits & creator support</p>
          </div>
          <span className="cc-nav-card-arrow">→</span>
        </Link>

        <Link href="/cockpit/my-e-assets/market" className="cc-nav-card market">
          <div className="cc-nav-card-icon">🏪</div>
          <div className="cc-nav-card-content">
            <h3 className="cc-nav-card-title">Market</h3>
            <p className="cc-nav-card-desc">Buy & sell digital assets securely</p>
          </div>
          <span className="cc-nav-card-arrow">→</span>
        </Link>

        <Link href="/cockpit/about" className="cc-nav-card about">
          <div className="cc-nav-card-icon">📚</div>
          <div className="cc-nav-card-content">
            <h3 className="cc-nav-card-title">Resources</h3>
            <p className="cc-nav-card-desc">FAQ, guides, and documentation</p>
          </div>
          <span className="cc-nav-card-arrow">→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="cc-footer">
        <span className="cc-footer-brand">SOCIAL EXCHANGE</span>
        <span className="cc-footer-version">v1.0.0</span>
        <span className="cc-footer-status">
          <span className="cc-status-indicator" />
          Connected
        </span>
      </footer>
    </div>
  );
}
