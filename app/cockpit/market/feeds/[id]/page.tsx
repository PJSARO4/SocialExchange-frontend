// app/cockpit/market/feeds/[id]/page.tsx

interface FeedData {
  platform: string;
  handle: string;
  category: string;
  followers: string;
  engagement: string;
  growth: string;
  stability: string;
  valuation: string;
  age: string;
  risk: string;
  revenue: string;
  complexity: string;
}

const FEEDS: Record<string, FeedData> = {
  modernlifestyle: {
    platform: "Instagram",
    handle: "@modernlifestyle",
    category: "Lifestyle / Brand",
    followers: "212,000",
    engagement: "3.5%",
    growth: "+1.8%",
    stability: "Consistent",
    valuation: "$48,000",
    age: "4.2 years",
    risk: "Moderate",
    revenue: "Mixed (brand + affiliate)",
    complexity: "Standard",
  },

  techsignals: {
    platform: "X (Twitter)",
    handle: "@techsignals",
    category: "Technology / News",
    followers: "91,000",
    engagement: "2.1%",
    growth: "+0.6%",
    stability: "Volatile",
    valuation: "$19,500",
    age: "2.7 years",
    risk: "Elevated",
    revenue: "Advertising-based",
    complexity: "Moderate",
  },
};

export default function MarketFeedDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const feed = FEEDS[params.id];

  if (!feed) {
    return (
      <div className="cockpit-page">
        <h1 className="section-title">Market Listing</h1>
        <p className="muted">This listing could not be found.</p>
      </div>
    );
  }

  return (
    <div className="cockpit-page">
      {/* Header */}
      <h1 className="section-title">Market Listing · E-Feed</h1>
      <h2 className="page-title">Account Overview</h2>

      {/* Account Overview */}
      <div className="section">
        <p><strong>Platform:</strong> {feed.platform}</p>
        <p><strong>Handle:</strong> {feed.handle}</p>
        <p><strong>Category:</strong> {feed.category}</p>
        <p><strong>Listing Type:</strong> Full account transfer (via escrow)</p>
      </div>

      {/* Performance Summary */}
      <div className="section">
        <h3 className="section-subtitle">Performance Summary</h3>
        <ul className="metric-list">
          <li>Followers: {feed.followers}</li>
          <li>Average engagement: {feed.engagement}</li>
          <li>30-day growth trend: {feed.growth}</li>
          <li>Audience stability: {feed.stability}</li>
        </ul>
      </div>

      {/* Valuation */}
      <div className="section">
        <h3 className="section-subtitle">Valuation Overview</h3>
        <p><strong>Indicative valuation:</strong> {feed.valuation}</p>
        <p className="muted">
          This valuation is set by the seller and reviewed by Social Exchange using
          historical performance, audience quality, and platform risk factors.
          Final pricing is confirmed during escrow.
        </p>
      </div>

      {/* Risk */}
      <div className="section">
        <h3 className="section-subtitle">Risk &amp; Continuity</h3>
        <ul className="metric-list">
          <li>Account age: {feed.age}</li>
          <li>Platform policy risk: {feed.risk}</li>
          <li>Revenue dependency: {feed.revenue}</li>
          <li>Transfer complexity: {feed.complexity}</li>
        </ul>
        <p className="muted">
          Social Exchange evaluates operational and platform risks to reduce the
          likelihood of disruption after transfer.
        </p>
      </div>

      {/* Operational */}
      <div className="section">
        <h3 className="section-subtitle">Operational Status</h3>
        <p>
          This account is currently operated by the seller. No automation,
          delegated access, or third-party integrations are active.
        </p>
      </div>

      {/* Escrow */}
      <div className="section">
        <h3 className="section-subtitle">Transfer &amp; Escrow</h3>
        <p>
          All E-Feed transfers on Social Exchange are completed through escrow.
          Funds and account access are held securely during verification and
          transfer. The seller is paid only after successful handoff and confirmation.
        </p>
        <p><strong>Escrow status:</strong> Available · Transfer not yet initiated</p>
      </div>

      {/* Footer */}
      <div className="section muted">
        Market trading actions are currently disabled.
        Listings are view-only during this phase.
      </div>
    </div>
  );
}
