// app/cockpit/assets/page.tsx

/**
 * CORE PRODUCT FILE
 * Assets Landing — user ownership and exposure overview.
 */

import Link from "next/link";

export default function AssetsPage() {
  return (
    <div>
      <h1>Assets</h1>

      {/* E-FEEDS */}
      <section style={{ marginTop: "32px" }}>
        <h2>E-Feeds</h2>
        <p>
          Social media accounts you own or operate. E-Feeds are active digital
          properties that can be managed, evaluated, or prepared for transfer.
        </p>

        {/* FEED 1 */}
        <div style={{ marginTop: "20px" }}>
          <Link href="/cockpit/assets/feeds/instagram-demo">
            Instagram · @examplebrand
          </Link>
          <div style={{ marginTop: "6px", opacity: 0.7 }}>
            Operational · 124k followers
          </div>
        </div>

        {/* FEED 2 */}
        <div style={{ marginTop: "16px" }}>
          <Link href="/cockpit/assets/feeds/x-demo">
            X (Twitter) · @examplemedia
          </Link>
          <div style={{ marginTop: "6px", opacity: 0.7 }}>
            Operational · 58k followers
          </div>
        </div>
      </section>

      {/* E-SHARES */}
      <section style={{ marginTop: "48px" }}>
        <h2>E-Shares</h2>
        <p>
          Fractional ownership in accounts or brands. E-Shares provide economic
          exposure without account control or access.
        </p>

        <div style={{ marginTop: "16px", opacity: 0.6 }}>
          No E-Shares currently held.
        </div>
      </section>
    </div>
  );
}
