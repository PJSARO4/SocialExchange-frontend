"use client";

import { useState } from "react";

type AssetMode = "feeds" | "eshares";

export default function AssetsShell() {
  const [mode, setMode] = useState<AssetMode>("feeds");

  return (
    <div className="assets-root">
      {/* Header */}
      <div className="assets-header">
        <div className="assets-title">ASSETS</div>

        <div className="assets-tabs">
          <button
            className={`assets-tab ${mode === "feeds" ? "active" : ""}`}
            onClick={() => setMode("feeds")}
          >
            MY FEEDS
          </button>
          <button
            className={`assets-tab ${mode === "eshares" ? "active" : ""}`}
            onClick={() => setMode("eshares")}
          >
            E-SHARES
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="assets-panel">
        {mode === "feeds" && (
          <div className="assets-placeholder">
            <div className="assets-section-title">My Feeds</div>
            <p>
              Operational social accounts you own and manage.
            </p>
            <p className="assets-muted">
              Automation, scheduling, storage, and sale-readiness
              will appear here.
            </p>
          </div>
        )}

        {mode === "eshares" && (
          <div className="assets-placeholder">
            <div className="assets-section-title">E-Shares</div>
            <p>
              Financial positions in social assets listed on the exchange.
            </p>
            <p className="assets-muted">
              Share disclosures, ownership limits, and platform fees
              are enforced at the system level.
            </p>
            <div className="assets-disclosure">
              Platform fee: <strong>$0.009 per share</strong> ·
              Operators cannot rug pull shareholders.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
