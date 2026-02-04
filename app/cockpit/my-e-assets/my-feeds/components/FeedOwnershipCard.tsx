'use client';

interface FeedOwnershipCardProps {
  name: string;
  platform: string;
  sharesOwned: number;
  totalShares: number;
  valuation: number;
}

export default function FeedOwnershipCard({
  name,
  platform,
  sharesOwned,
  totalShares,
  valuation,
}: FeedOwnershipCardProps) {
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
      <h3 style={{ margin: 0 }}>{name}</h3>
      <div style={{ opacity: 0.6, fontSize: 13 }}>{platform}</div>

      <div style={{ marginTop: '0.75rem', fontSize: 14 }}>
        <div>Shares Owned: {sharesOwned}</div>
        <div>Total Shares: {totalShares}</div>
        <div>Ownership: {ownershipPct}%</div>
        <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
          Valuation: ${valuation.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
