'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import FeedOwnershipCard from '../components/FeedOwnershipCard';
import ShareIssuancePanel from '../components/ShareIssuancePanel';

export default function FeedOwnershipPage() {
  const router = useRouter();
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);

  const feeds = [
    {
      id: 'urban_signal',
      handle: '@urban_signal',
      platform: 'instagram',
      followers: 12400,
      engagement: 4.2,
    },
    {
      id: 'tech_insights',
      handle: '@tech_insights',
      platform: 'instagram',
      followers: 8900,
      engagement: 3.8,
    },
  ];

  return (
    <div className="feed-ownership-page">
      <h1>Feed Ownership</h1>

      <section className="feed-ownership-grid">
        {feeds.map(feed => (
          <FeedOwnershipCard
            key={feed.id}
            feed={feed}
            onManageAutomation={() =>
              router.push(`/cockpit/my-e-assets/my-feeds/automation?feed=${feed.id}`)
            }
            onManageScheduler={() =>
              router.push(`/cockpit/my-e-assets/my-feeds/scheduler?feed=${feed.id}`)
            }
            onIssueShares={() => {
              setSelectedFeedId(feed.id);
              setShowSharePanel(true);
            }}
          />
        ))}
      </section>

      {showSharePanel && selectedFeedId && (
        <ShareIssuancePanel
          feedId={selectedFeedId}
          onClose={() => {
            setSelectedFeedId(null);
            setShowSharePanel(false);
          }}
        />
      )}
    </div>
  );
}
