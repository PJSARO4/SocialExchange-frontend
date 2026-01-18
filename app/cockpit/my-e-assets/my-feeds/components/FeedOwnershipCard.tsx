'use client';

interface Props {
  feed: {
    id: string;
    platform: string;
    handle: string;
    displayName: string;
    status: {
      active: boolean;
      automated: boolean;
      inEscrow: boolean;
    };
    metrics: {
      followers: number;
      engagement: number;
      automationUptime: number;
      postsPerWeek: number;
    };
    shares: any;
    ticker?: string;
  };
  onManageAutomation: () => void;
  onManageScheduler: () => void;
  onIssueShares: () => void;
}

export default function FeedOwnershipCard({
  feed,
  onManageAutomation,
  onManageScheduler,
  onIssueShares,
}: Props) {
  return (
    <div className="feed-ownership-card">
      <div className="feed-card-header">
        <h3>{feed.displayName}</h3>
        <span>{feed.handle}</span>
      </div>

      <div className="feed-card-metrics">
        <div>Followers: {feed.metrics.followers.toLocaleString()}</div>
        <div>Engagement: {feed.metrics.engagement}%</div>
        <div>Posts / Week: {feed.metrics.postsPerWeek}</div>
      </div>

      <div className="feed-card-actions">
        <button onClick={onManageAutomation}>Automation</button>
        <button onClick={onManageScheduler}>Scheduler</button>
        <button onClick={onIssueShares}>Issue Shares</button>
      </div>
    </div>
  );
}
