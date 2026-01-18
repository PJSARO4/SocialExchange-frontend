'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { seedMarketIfEmpty, MarketListing } from '../seedMarket';
import { applyMicroFluctuation } from '../marketReadout';

type LiveListing = MarketListing & {
  direction?: 'up' | 'down';
};

export default function BuyPage() {
  const [listings, setListings] = useState<LiveListing[]>([]);

  /* -----------------------------------------
     INITIAL LOAD — SEED + READ MARKET
  ----------------------------------------- */
  useEffect(() => {
    seedMarketIfEmpty();

    const stored = localStorage.getItem('market-listings');
    if (!stored) return;

    try {
      setListings(JSON.parse(stored));
    } catch {
      setListings([]);
    }
  }, []);

  /* -----------------------------------------
     TELEMETRY LOOP — STABLE & CONTINUOUS
  ----------------------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setListings((prev) => {
        if (prev.length === 0) return prev;

        return prev.map((asset) => {
          const { value, direction } = applyMicroFluctuation(asset.price);
          return {
            ...asset,
            price: value,
            direction,
          };
        });
      });
    }, 4000); // calm, predictable cadence

    return () => clearInterval(interval);
  }, []);

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */
  return (
    <section className="cockpit-panel">
      <header className="panel-header">
        <h1>Trading Post — Buy</h1>
        <p className="panel-subtitle">Live market telemetry</p>
      </header>

      {listings.length === 0 ? (
        <p>No assets currently listed for sale.</p>
      ) : (
        <ul className="market-feed enhanced">
          {listings.map((asset) => (
            <li key={asset.id} className="market-row">
              <div className="market-row-main">
                <div className="asset-block">
                  <span className="asset-name">{asset.name}</span>
                  <span className="asset-description">
                    {asset.description}
                  </span>
                </div>

                <div className="price-block">
                  <span className={`asset-price ${asset.direction ?? ''}`}>
                    {asset.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="market-row-footer">
                <Link
                  href={`/cockpit/trading-post/buy/${asset.id}`}
                  className="inspect-command"
                >
                  INSPECT →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
