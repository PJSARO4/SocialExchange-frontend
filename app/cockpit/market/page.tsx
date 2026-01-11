// app/cockpit/market/page.tsx

import Link from "next/link";

export default function MarketPage() {
  return (
    <div className="cockpit-page">
      {/* Header */}
      <h1 className="section-title">MARKET</h1>
      <p className="muted">
        Observe and evaluate digital assets available on Social Exchange.
        Listings are reviewed for ownership, continuity, and transfer integrity.
      </p>

      {/* Filters */}
      <div className="market-filters">
        <div className="filter-group">
          <span className="filter-label">Platform</span>
          <button className="active">Instagram</button>
          <button>X</button>
          <button>TikTok</button>
          <button>YouTube</button>
        </div>

        <div className="filter-group">
          <span className="filter-label">Size</span>
          <button>Small</button>
          <button className="active">Mid</button>
          <button>Large</button>
        </div>

        <div className="filter-group">
          <span className="filter-label">Risk</span>
          <button>Low</button>
          <button className="active">Moderate</button>
          <button>Elevated</button>
        </div>

        <div className="filter-group">
          <span className="filter-label">Transfer</span>
          <button className="active">Ready</button>
          <button>Verified</button>
        </div>
      </div>

      {/* E-Feeds */}
      <h2 className="page-title">E-Feeds</h2>
      <p className="muted">
        Operational social accounts available for transfer via escrow.
      </p>

      <div className="market-grid">
        {/* Card 1 */}
        <div className="market-card">
          <div className="card-header">
            <span className="platform">Instagram</span>
            <span className="status ok">Transfer-ready</span>
          </div>

          <h3>@modernlifestyle</h3>

          <div className="card-metrics">
            <div>
              <span className="metric-label">Followers</span>
              <span>212k</span>
            </div>
            <div>
              <span className="metric-label">Engagement</span>
              <span>3.5%</span>
            </div>
            <div>
              <span className="metric-label">Risk</span>
              <span>Moderate</span>
            </div>
          </div>

          <p className="valuation">Indicative valuation: $48,000</p>

          <Link
            href="/cockpit/market/feeds/modernlifestyle"
            className="view-link"
          >
            View listing →
          </Link>
        </div>

        {/* Card 2 */}
        <div className="market-card">
          <div className="card-header">
            <span className="platform">X (Twitter)</span>
            <span className="status warn">Seller verified</span>
          </div>

          <h3>@techsignals</h3>

          <div className="card-metrics">
            <div>
              <span className="metric-label">Followers</span>
              <span>91k</span>
            </div>
            <div>
              <span className="metric-label">Engagement</span>
              <span>2.1%</span>
            </div>
            <div>
              <span className="metric-label">Risk</span>
              <span>Elevated</span>
            </div>
          </div>

          <p className="valuation">Indicative valuation: $19,500</p>

          <Link
            href="/cockpit/market/feeds/techsignals"
            className="view-link"
          >
            View listing →
          </Link>
        </div>
      </div>

      {/* E-Shares */}
      <h2 className="page-title">E-Shares</h2>
      <p className="muted">
        Fractional exposure offerings will appear here.
      </p>
      <p className="muted">No active E-Share listings.</p>

      <p className="muted">
        Trading actions are disabled during this phase. Market data is view-only.
      </p>
    </div>
  );
}
