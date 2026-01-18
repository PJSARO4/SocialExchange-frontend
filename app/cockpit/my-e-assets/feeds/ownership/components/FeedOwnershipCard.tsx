'use client';

interface FeedOwnershipCardProps {
  feed: {
    id: string;
    handle: string;
    platform: string;
    followers: number;
    engagement: number;
  };
  onScheduler: () => void;
  onAutomation: () => void;
  onIssueShares: () => void;
}

export default function FeedOwnershipCard({
  feed,
  onScheduler,
  onAutomation,
  onIssueShares,
}: FeedOwnershipCardProps) {
  return (
    <div className="feed-ownership-card">
      <div className="feed-ownership-header">
        <strong>@{feed.handle}</strong>
        <span className="platform">{feed.platform}</span>
      </div>

      <div className="feed-ownership-metrics">
        <div>Followers: {feed.followers}</div>
        <div>Engagement: {feed.engagement}%</div>
      </div>

      <div className="feed-ownership-actions">
        <button onClick={onScheduler}>Scheduler</button>
        <button onClick={onAutomation}>Automation</button>
        <button onClick={onIssueShares}>Issue Shares</button>
      </div>
    </div>
  );
}
