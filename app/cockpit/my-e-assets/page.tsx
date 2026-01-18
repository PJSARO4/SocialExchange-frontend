'use client';

import { useEffect, useState } from 'react';

type OwnedAsset = {
  id: string;
  name: string;
  description: string;
  price: number;
  acquiredAt: number;
};

const OWNED_KEY = 'owned-assets';

export default function MyEAssetsPage() {
  const [assets, setAssets] = useState<OwnedAsset[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(OWNED_KEY);
    if (!raw) return;

    try {
      setAssets(JSON.parse(raw));
    } catch {
      setAssets([]);
    }
  }, []);

  return (
    <section className="cockpit-panel">
      <header className="panel-header">
        <h1>My E-Assets</h1>
        <p className="panel-subtitle">
          Owned assets under your control
        </p>
      </header>

      {assets.length === 0 ? (
        <div className="empty-state">
          <p>No E-Assets currently owned.</p>
        </div>
      ) : (
        <ul className="market-feed enhanced">
          {assets.map((asset) => (
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
                <span className="inspect-command">
                  STATUS: OWNED
                </span>
                <span className="asset-meta">
                  Acquired {new Date(asset.acquiredAt).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
