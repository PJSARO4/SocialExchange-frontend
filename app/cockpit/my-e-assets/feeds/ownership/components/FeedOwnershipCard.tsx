'use client';

export interface FeedOwnership {
  id: string;
  platform: string;
  handle: string;
  equityOwned: number;
  valuation: number;
  monthlyRevenue: number;
  status: string;
}

interface FeedOwnershipCardProps {
  feed: FeedOwnership;
  onClick?: () => void;
}

export default function FeedOwnershipCard({
  feed,
  onClick,
}: FeedOwnershipCardProps) {
  if (!feed) return null;

  return (
    <div
      className="feed-ownership-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="feed-ownership-header">
        <span className="feed-platform">{feed.platform}</span>
        <span className="feed-status">{feed.status}</span>
      </div>

      <div className="feed-handle">@{feed.handle}</div>

      <div className="feed-metrics">
        <div className="feed-metric">
          <span className="feed-metric-label">Equity Owned</span>
          <span className="feed-metric-value">{feed.equityOwned}%</span>
        </div>

        <div className="feed-metric">
          <span className="feed-metric-label">Valuation</span>
          <span className="feed-metric-value">
            ${feed.valuation.toLocaleString()}
          </span>
        </div>

        <div className="feed-metric">
          <span className="feed-metric-label">Monthly Revenue</span>
          <span className="feed-metric-value">
            ${feed.monthlyRevenue.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
