'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type OwnedAsset = {
  id: string;
  name: string;
  description: string;
  price: number;
};

type OpsAsset = {
  id: string;
  status: 'ONLINE' | 'PAUSED';
};

export default function SellPage() {
  const [sellable, setSellable] = useState<OwnedAsset[]>([]);

  useEffect(() => {
    const ownedRaw = localStorage.getItem('owned-assets');
    const opsRaw = localStorage.getItem('operations-assets');

    if (!ownedRaw || !opsRaw) {
      setSellable([]);
      return;
    }

    try {
      const owned: OwnedAsset[] = JSON.parse(ownedRaw);
      const ops: OpsAsset[] = JSON.parse(opsRaw);

      const onlineIds = new Set(
        ops.filter((a) => a.status === 'ONLINE').map((a) => a.id)
      );

      const eligible = owned.filter((asset) =>
        onlineIds.has(asset.id)
      );

      setSellable(eligible);
    } catch {
      setSellable([]);
    }
  }, []);

  return (
    <section className="cockpit-panel">
      <header className="panel-header">
        <h1>Trading Post — Sell</h1>
        <p className="panel-subtitle">
          List owned E-Assets for exchange
        </p>
      </header>

      {sellable.length === 0 ? (
        <p className="empty-state">
          No ONLINE assets available for listing.
        </p>
      ) : (
        <ul className="market-feed enhanced">
          {sellable.map((asset) => (
            <li key={asset.id} className="market-row">
              <div className="market-row-main">
                <div className="asset-block">
                  <span className="asset-name">{asset.name}</span>
                  <span className="asset-description">
                    {asset.description}
                  </span>
                </div>

                <div className="price-block">
                  <span className="asset-price">
                    {asset.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="market-row-footer">
                <Link
                  href={`/cockpit/trading-post/sell/${asset.id}`}
                  className="inspect-command"
                >
                  LIST FOR SALE →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
