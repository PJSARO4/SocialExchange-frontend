// app/cockpit/assets/feeds/[id]/page.tsx

/**
 * CORE PRODUCT FILE
 * E-Feed Detail View — asset state and verification surface.
 */

export default async function FeedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const platform =
    id.includes("instagram") ? "Instagram" : "X (Twitter)";

  return (
    <div>
      <h1>E-Feed</h1>

      {/* ACCOUNT OVERVIEW */}
      <section style={{ marginTop: "24px" }}>
        <h2>Account Overview</h2>
        <p>
          Platform: {platform}
          <br />
          Handle: @{id}
          <br />
          Category: Lifestyle / Media
        </p>
      </section>

      {/* METRICS */}
      <section style={{ marginTop: "32px" }}>
        <h2>Performance Snapshot</h2>
        <ul>
          <li>Followers: {platform === "Instagram" ? "124,000" : "58,000"}</li>
          <li>Average engagement: {platform === "Instagram" ? "3.8%" : "2.4%"}</li>
          <li>30-day growth: {platform === "Instagram" ? "+2.1%" : "+1.3%"}</li>
        </ul>
      </section>

      {/* OPERATIONAL STATUS */}
      <section style={{ marginTop: "32px" }}>
        <h2>Operational Status</h2>
        <p>
          This account is currently under your control. No automation,
          delegated access, or third-party integrations are active.
        </p>
      </section>

      {/* TRANSFER READINESS */}
      <section style={{ marginTop: "32px" }}>
        <h2>Transfer Readiness</h2>
        <p>
          Before an account can be transferred or listed, Social Exchange
          verifies ownership, access integrity, and historical performance.
          This process protects both buyers and sellers.
        </p>

        <p style={{ opacity: 0.7, marginTop: "8px" }}>
          Current state: Not verified for transfer
        </p>
      </section>
    </div>
  );
}
