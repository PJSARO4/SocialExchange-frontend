'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, seedAuthIfEmpty, logout } from '@/app/lib/auth/auth-store';
import { ROLE_PERMISSIONS } from '@/app/lib/auth/types';

// Store imports for real data
import {
  getMyHoldings,
  seedESharesMarketIfEmpty,
  getBrandListings,
  getTransactionsByUser,
} from '../my-e-assets/my-e-shares/lib/e-shares-store';
import { getWallet } from '../my-e-assets/my-e-shares/lib/wallet-store';
import {
  getListings,
  getActiveListings,
  seedMarketplaceIfEmpty,
} from '../my-e-assets/market/lib/market-store';

import './command-center.css';

const currentUserId = 'demo-user-main';

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

interface CommunityItem {
  id: string;
  name: string;
  price: string;
  changeDir: 'up' | 'down' | 'neutral';
}

// Helper: format numbers with K/M suffix
function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

// Helper: format time ago
function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CommandCenter() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  // Live data state
  const [quickStats, setQuickStats] = useState<QuickStat[]>([
    { label: 'Total Followers', value: '—', change: 'Loading...', changeType: 'neutral', icon: '👥' },
    { label: 'Engagement Rate', value: '—', change: 'Loading...', changeType: 'neutral', icon: '📈' },
    { label: 'Scheduled Posts', value: '0', change: 'None', changeType: 'neutral', icon: '📅' },
    { label: 'Community Credits', value: '$0', change: '—', changeType: 'neutral', icon: '💎' },
    { label: 'Portfolio Value', value: '$0', change: '—', changeType: 'neutral', icon: '💰' },
    { label: 'Active Listings', value: '0', change: 'None', changeType: 'neutral', icon: '🏷️' },
  ]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([
    { id: '1', type: 'system', message: 'Welcome to Social Exchange! Connect your feeds to get started.', time: 'Just now', icon: '👋' },
  ]);
  const [marketTrending, setMarketTrending] = useState<MarketItem[]>([]);
  const [communityItems, setCommunityItems] = useState<CommunityItem[]>([]);
  const [communityCreditsHeld, setCommunityCreditsHeld] = useState(0);
  const [communitiesJoined, setCommunitiesJoined] = useState(0);
  const [highestTier, setHighestTier] = useState('—');

  // Load all dashboard data from stores
  const loadDashboardData = useCallback(() => {
    try {
      // --- Market listings data ---
      const allMarketListings = getListings();
      const activeMarketListings = getActiveListings();

      // Total followers: sum from all market listings
      const totalFollowers = allMarketListings.reduce(
        (sum, l) => sum + (l.metrics?.followers || 0),
        0
      );

      // Average engagement from market listings
      const engagementRates = allMarketListings
        .filter((l) => l.metrics?.engagementRate)
        .map((l) => l.metrics.engagementRate);
      const avgEngagement =
        engagementRates.length > 0
          ? engagementRates.reduce((s, r) => s + r, 0) / engagementRates.length
          : 0;

      // --- E-Shares / Community data ---
      const brandListings = getBrandListings();
      const holdings = getMyHoldings(currentUserId);
      const wallet = getWallet(currentUserId);

      // Portfolio value: sum of holdings * current brand prices
      let portfolioValue = 0;
      holdings.forEach((h: any) => {
        const brand = brandListings.find((b: any) => b.id === (h.brandId || h.communityId));
        if (brand) {
          // Use currentValue if available, else calculate from credits/shares
          portfolioValue += h.currentValue || (h.credits || h.shares || 0) * (brand.pricePerShare || 0.01);
        }
      });

      // Active listings count
      const activeListingsCount = activeMarketListings.length;

      // Credits balance
      const creditsBalance = wallet.balance;

      // Build quick stats
      setQuickStats([
        {
          label: 'Total Followers',
          value: totalFollowers > 0 ? formatFollowers(totalFollowers) : '—',
          change: totalFollowers > 0 ? `${allMarketListings.length} accounts` : 'Connect feeds',
          changeType: totalFollowers > 0 ? 'up' : 'neutral',
          icon: '👥',
        },
        {
          label: 'Engagement Rate',
          value: avgEngagement > 0 ? `${avgEngagement.toFixed(1)}%` : '—',
          change: avgEngagement > 0 ? `Avg across ${engagementRates.length} listings` : 'Connect feeds',
          changeType: avgEngagement >= 3 ? 'up' : avgEngagement > 0 ? 'neutral' : 'neutral',
          icon: '📈',
        },
        {
          label: 'Scheduled Posts',
          value: '0',
          change: 'Connect feeds',
          changeType: 'neutral',
          icon: '📅',
        },
        {
          label: 'Credits Balance',
          value: `$${creditsBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          change: creditsBalance > 0 ? 'Available' : 'Deposit to start',
          changeType: creditsBalance > 0 ? 'up' : 'neutral',
          icon: '💎',
        },
        {
          label: 'Portfolio Value',
          value: portfolioValue > 0
            ? `$${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '$0.00',
          change: holdings.length > 0 ? `${holdings.length} holdings` : 'No holdings yet',
          changeType: portfolioValue > 0 ? 'up' : 'neutral',
          icon: '💰',
        },
        {
          label: 'Active Listings',
          value: activeListingsCount.toString(),
          change: activeListingsCount > 0 ? `${activeListingsCount} on market` : 'None',
          changeType: activeListingsCount > 0 ? 'up' : 'neutral',
          icon: '🏷️',
        },
      ]);

      // --- Community Credits panel data ---
      // Top 3 brand listings with name, price, change direction
      const topBrands = [...brandListings]
        .filter((b: any) => b.status === 'PUBLIC' || b.status === 'TRADING' || b.status === 'ACTIVE')
        .sort((a: any, b: any) => (b.marketCap || 0) - (a.marketCap || 0))
        .slice(0, 3);

      setCommunityItems(
        topBrands.map((b: any) => ({
          id: b.id,
          name: b.brandName,
          price: `$${(b.pricePerShare || 0.01).toFixed(4)}`,
          changeDir: (b.priceChange24h || 0) >= 0 ? 'up' as const : 'down' as const,
        }))
      );

      // Holdings-based stats for community panel
      const totalCreditsHeld = holdings.reduce((sum: number, h: any) => sum + (h.credits || h.shares || 0), 0);
      setCommunityCreditsHeld(totalCreditsHeld);
      setCommunitiesJoined(holdings.length);

      // Determine highest tier based on max credits in a single holding
      const maxCredits = holdings.reduce((max: number, h: any) => Math.max(max, h.credits || h.shares || 0), 0);
      if (maxCredits >= 5000) setHighestTier('Founding');
      else if (maxCredits >= 1000) setHighestTier('Champion');
      else if (maxCredits >= 500) setHighestTier('Supporter');
      else if (maxCredits >= 100) setHighestTier('Backer');
      else setHighestTier(holdings.length > 0 ? 'Backer' : '—');

      // --- Market Trending panel data ---
      // Top 3 market listings by views + saves
      const trendingListings = [...allMarketListings]
        .filter((l) => l.status === 'active')
        .sort((a, b) => (b.views + b.saves * 5) - (a.views + a.saves * 5))
        .slice(0, 3);

      setMarketTrending(
        trendingListings.map((l) => ({
          id: l.id,
          name: l.displayName || l.handle,
          platform: l.platform,
          followers: formatFollowers(l.metrics?.followers || 0),
          price: l.askingPrice,
          change: l.metrics?.engagementRate
            ? parseFloat(l.metrics.engagementRate.toFixed(1))
            : 0,
        }))
      );

      // --- Recent Activity from transactions ---
      const eShareTxns = getTransactionsByUser(currentUserId);
      const walletTxns = wallet.transactions || [];

      // Combine and sort by timestamp descending
      type ActivitySource = { ts: number; msg: string; type: Activity['type']; icon: string };
      const activitySources: ActivitySource[] = [];

      // E-Share transactions
      eShareTxns.forEach((t: any) => {
        const txType = t.type || '';
        let msg = '';
        let icon = '💎';
        if (txType === 'BUY' || txType === 'SUPPORT') {
          msg = `Purchased ${t.shares || t.credits || 0} credits in ${t.brandName || t.communityName || 'community'}`;
          icon = '🛒';
        } else if (txType === 'SELL' || txType === 'TRANSFER') {
          msg = `Sold ${t.shares || t.credits || 0} credits in ${t.brandName || t.communityName || 'community'}`;
          icon = '💸';
        } else if (txType === 'DEPOSIT' || txType === 'SETUP') {
          msg = `Deposited $${(t.totalAmount || t.amount || 0).toFixed(2)} for ${t.brandName || t.communityName || 'community'}`;
          icon = '🏦';
        } else if (txType === 'MINT') {
          msg = `${t.shares || t.credits || 0} credits minted for ${t.brandName || t.communityName || 'community'}`;
          icon = '✨';
        } else {
          msg = `${txType} transaction: ${t.brandName || t.communityName || ''}`;
          icon = '📋';
        }
        activitySources.push({ ts: t.timestamp, msg, type: 'transaction', icon });
      });

      // Wallet transactions
      walletTxns.forEach((t: any) => {
        activitySources.push({
          ts: t.timestamp,
          msg: t.description || `Wallet ${t.type}: $${Math.abs(t.amount).toFixed(2)}`,
          type: 'transaction',
          icon: t.type === 'deposit' ? '🏦' : t.type === 'buy' ? '🛒' : '💸',
        });
      });

      // Sort newest first, take top 8
      activitySources.sort((a, b) => b.ts - a.ts);
      const topActivities = activitySources.slice(0, 8);

      if (topActivities.length > 0) {
        setRecentActivity(
          topActivities.map((a, i) => ({
            id: `activity-${i}-${a.ts}`,
            type: a.type,
            message: a.msg,
            time: timeAgo(a.ts),
            icon: a.icon,
          }))
        );
      } else {
        setRecentActivity([
          {
            id: '1',
            type: 'system',
            message: 'Welcome to Social Exchange! Explore the marketplace to get started.',
            time: 'Just now',
            icon: '👋',
          },
        ]);
      }
    } catch (err) {
      console.warn('Dashboard data load error:', err);
      // Keep existing state on error - graceful degradation
    }
  }, []);

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

    // Seed stores and load initial data
    try {
      seedESharesMarketIfEmpty();
      seedMarketplaceIfEmpty();
    } catch (err) {
      console.warn('Store seeding error:', err);
    }
    loadDashboardData();

    // Update time every minute
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Refresh dashboard data every 10 seconds for live stats
    const dataTimer = setInterval(() => {
      loadDashboardData();
    }, 10000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(dataTimer);
    };
  }, [router, loadDashboardData]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const upcomingPosts: ScheduledPost[] = [];

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
              <span className="cc-shares-value">{communityCreditsHeld.toLocaleString()}</span>
              <span className="cc-shares-label">Credits Held</span>
            </div>
            <div className="cc-shares-stat">
              <span className="cc-shares-value">{communitiesJoined}</span>
              <span className="cc-shares-label">Communities</span>
            </div>
            <div className="cc-shares-stat">
              <span className="cc-shares-value">{highestTier}</span>
              <span className="cc-shares-label">Highest Tier</span>
            </div>
          </div>
          <div className="cc-shares-communities">
            {communityItems.length === 0 ? (
              <div className="cc-empty-state">
                <span className="cc-empty-icon">💎</span>
                <span className="cc-empty-text">No communities listed yet</span>
              </div>
            ) : (
              communityItems.map((item) => (
                <div key={item.id} className="cc-market-item">
                  <div className="cc-market-info">
                    <span className="cc-market-name">{item.name}</span>
                  </div>
                  <div className="cc-market-price">
                    <span className="cc-market-value">{item.price}</span>
                    <span className={`cc-market-change ${item.changeDir}`}>
                      {item.changeDir === 'up' ? '↑' : item.changeDir === 'down' ? '↓' : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
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
