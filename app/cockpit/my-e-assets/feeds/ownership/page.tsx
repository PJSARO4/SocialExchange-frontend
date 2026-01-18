'use client';

import { useRouter } from 'next/navigation';
import FeedOwnershipCard from './FeedOwnershipCard';
import './ownership.css';

const feeds = [
  {
    id: '1',
    handle: 'urban_signal',
    platform: 'instagram',
    followers: 12400,
    engagement: 4.2,
  },
  {
    id: '2',
    handle: 'tech_insights',
    platform: 'instagram',
    followers: 8900,
    engagement: 3.8,
  },
];

export default function FeedOwnershipPage() {
  const router = useRouter();

  return (
    <div className="feed-ownership-page">
      <h1>Feed Ownership</h1>
      <p>Manage scheduling, automation, and share issuance.</p>

      <div className="feed-ownership-grid">
        {feeds.map(feed => (
          <FeedOwnershipCard
            key={feed.id}
            feed={feed}
            onScheduler={() =>
              router.push(`/cockpit/my-e-assets/feeds/scheduler?feed=${feed.id}`)
            }
            onAutomation={() =>
              router.push(`/cockpit/my-e-assets/feeds/automation?feed=${feed.id}`)
            }
            onIssueShares={() =>
              alert(`Share issuance for ${feed.handle} (UI stub)`)
            }
          />
        ))}
      </div>
    </div>
  );
}
