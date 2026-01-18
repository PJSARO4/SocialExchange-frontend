'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import ActivityLogPanel from '../components/ActivityLogPanel';
import CommsPanel from '../components/CommsPanel';
import NewListingsPanel from '../components/NewListingsPanel';
import PriceSignalsPanel from '../components/PriceSignalsPanel';
import FinancialSnapshotPanel from '../components/FinancialSnapshotPanel';
import ManagementHubPanel from '../components/ManagementHubPanel';

import './command-center.css';

export default function DashboardPage() {
  const router = useRouter();

  const [activityLogs, setActivityLogs] = useState<
    { id: number; time: string; event: string; user: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/logs')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setActivityLogs(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const displayLogs =
    loading || error || activityLogs.length === 0
      ? [{ id: 0, time: '--:--', event: 'No activity available', user: 'System' }]
      : activityLogs;

  const upcomingPosts = [
    {
      id: 1,
      platform: 'instagram' as const,
      feedName: '@urban_signal',
      scheduledDate: 'Jan 18, 2026',
      scheduledTime: '09:00 AM',
      caption:
        'New collection dropping tomorrow. Stay tuned for exclusive previews.',
      status: 'scheduled' as const,
    },
    {
      id: 2,
      platform: 'instagram' as const,
      feedName: '@tech_insights',
      scheduledDate: 'Jan 18, 2026',
      scheduledTime: '02:30 PM',
      caption:
        'Breaking: AI automation is transforming how content pipelines operate.',
      status: 'automated' as const,
    },
    {
      id: 3,
      platform: 'instagram' as const,
      feedName: '@lifestyle_studio',
      scheduledDate: 'Jan 19, 2026',
      scheduledTime: '11:00 AM',
      caption:
        'Weekend vibes incoming. Five systems to scale passive reach.',
      status: 'draft' as const,
    },
  ];

  return (
    <div className="command-center">
      <div className="command-center-header">
        <h1 className="command-center-title">Command Center</h1>
        <p className="command-center-subtitle">Live intelligence feed</p>
      </div>

      <div className="command-center-grid">
        <ActivityLogPanel logs={displayLogs} />
        <CommsPanel
          messages={[
            { id: 1, from: 'Trader_4421', preview: 'Interested...', unread: true },
            { id: 2, from: 'Buyer_8832', preview: 'Negotiable?', unread: true },
            { id: 3, from: 'System', preview: 'Offer accepted', unread: false },
          ]}
        />
      </div>

      <div className="command-center-panels">
        <NewListingsPanel
          listings={[
            { id: 1, title: 'Premium Instagram Account', category: 'Social', price: 850 },
            { id: 2, title: 'Gaming YouTube Channel', category: 'Content', price: 1200 },
            { id: 3, title: 'Shopify Store', category: 'Business', price: 3400 },
          ]}
        />

        <PriceSignalsPanel
          signals={[
            { asset: 'IG_Premium_Tech', current: 432, delta: 1.6, direction: 'up' },
            { asset: 'YT_Gaming_Pro', current: 882, delta: -0.9, direction: 'down' },
          ]}
        />

        <FinancialSnapshotPanel
          snapshot={{
            fundsRaised: 12450,
            investmentGains: 3280,
            tradingProfit: 1870,
          }}
        />
      </div>

      <ManagementHubPanel
        upcomingPosts={upcomingPosts}
        onNavigateToFeeds={() =>
          router.push('/cockpit/my-e-assets/my-feeds')
        }
      />
    </div>
  );
}
