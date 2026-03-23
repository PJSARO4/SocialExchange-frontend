'use client';

interface FeedOwnershipCardProps {
  feed: {
    id: string;
    handle: string;
    platform: string;
    followers: number;
    engagement: number;
  };
  onManageAutomation?: () => void;
  onManageScheduler?: () => void;
  onIssueShares?: () => void;
}

export default function FeedOwnershipCard({
  feed,
  onManageAutomation,
  onManageScheduler,
  onIssueShares,
}: FeedOwnershipCardProps) {
  const sharesOwned = 100;
  const totalShares = 100;
  const valuation = 50000;
  const ownershipPct = ((sharesOwned / totalShares) * 100).toFixed(2);

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        padding: '1rem',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <h3 style={{ margin: 0 }}>{feed.handle}</h3>
      <div style={{ opacity: 0.6, fontSize: 13 }}>{feed.platform}</div>

      <div style={{ marginTop: '0.75rem', fontSize: 14 }}>
        <div>Followers: {feed.followers.toLocaleString()}</div>
        <div>Engagement: {feed.engagement}%</div>
        <div>Ownership: {ownershipPct}%</div>
        <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
          Valuation: ${valuation.toLocaleString()}
        </div>
      </div>

      {(onManageAutomation || onManageScheduler || onIssueShares) && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {onManageAutomation && (
            <button
              onClick={onManageAutomation}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Automation
            </button>
          )}
          {onManageScheduler && (
            <button
              onClick={onManageScheduler}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Scheduler
            </button>
          )}
          {onIssueShares && (
            <button
              onClick={onIssueShares}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Issue Shares
            </button>
          )}
        </div>
      )}
    </div>
  );
}
