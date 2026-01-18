'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getActiveListingsCount,
  getMarketPulse,
} from './exchangeStatus';

export default function TradingPostPage() {
  const [activeListings, setActiveListings] = useState(0);
  const [lastSync, setLastSync] = useState(Date.now());

  /* -----------------------------------------
     INITIAL SYNC
  ----------------------------------------- */
  useEffect(() => {
    setActiveListings(getActiveListingsCount());
    setLastSync(Date.now());
  }, []);

  /* -----------------------------------------
     LIVE "LAST SYNC" TICK
  ----------------------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync((prev) => prev); // trigger re-render only
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="cockpit-panel">
      <header className="panel-header">
        <h1>Trading Post</h1>
        <p className="panel-subtitle">
          Exchange control and market overview
        </p>
      </header>

      {/* =========================
          EXCHANGE STATUS
      ========================= */}
      <div className="exchange-status-panel">
        <div className="status-row">
          <span className="status-label">EXCHANGE</span>
          <span className="status-value online">ONLINE</span>
        </div>

        <div className="status-row">
          <span className="status-label">ACTIVE LISTINGS</span>
          <span className="status-value">{activeListings}</span>
        </div>

        <div className="status-row">
          <span className="status-label">MARKET PULSE</span>
          <span className="status-value">{getMarketPulse()}</span>
        </div>

        <div className="status-row">
          <span className="status-label">LAST SYNC</span>
          <span className="status-value">
            {Math.floor((Date.now() - lastSync) / 1000)}s ago
          </span>
        </div>
      </div>

      {/* =========================
          MODE SELECT
      ========================= */}
      <div className="trade-mode-panel">
        <Link href="/cockpit/trading-post/buy" className="trade-mode">
          <span className="trade-mode-label">BUY</span>
          <span className="trade-mode-desc">
            Browse available E-Assets
          </span>
        </Link>

        <Link href="/cockpit/trading-post/sell" className="trade-mode">
          <span className="trade-mode-label">SELL</span>
          <span className="trade-mode-desc">
            List an E-Asset for trade
          </span>
        </Link>
      </div>
    </section>
  );
}
