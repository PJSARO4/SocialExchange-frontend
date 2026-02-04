'use client';

interface AnalyticsDashboardProps {
  account: {
    id: string;
    platform: string;
    handle: string;
    displayName: string;
    followers: number;
    engagement: number;
    postsPerWeek: number;
    uptime: number;
  };
}

export default function AnalyticsDashboard({
  account,
}: AnalyticsDashboardProps) {
  return (
    <div className="analytics-dashboard">
      <div className="analytics-grid">
        <div className="analytics-tile">
          <span className="label">FOLLOWERS</span>
          <span className="value">{account.followers}</span>
        </div>

        <div className="analytics-tile">
          <span className="label">ENGAGEMENT</span>
          <span className="value">{account.engagement}%</span>
        </div>

        <div className="analytics-tile">
          <span className="label">POSTS / WEEK</span>
          <span className="value">{account.postsPerWeek}</span>
        </div>

        <div className="analytics-tile">
          <span className="label">UPTIME</span>
          <span className="value">{account.uptime}%</span>
        </div>
      </div>
    </div>
  );
}
