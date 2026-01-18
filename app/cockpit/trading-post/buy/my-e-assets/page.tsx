'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Asset = {
  id: string;
  name: string;
  description: string;
  price: number;
  locked?: boolean;
};

const OWNED_KEY = 'owned-assets';
const MARKET_KEY = 'market-listings';

export default function MyEAssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);

  /* -----------------------------------------
     LOAD OWNED ASSETS
  ----------------------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem(OWNED_KEY);
    if (!stored) return;

    try {
      setAssets(JSON.parse(stored));
    } catch {
      setAssets([]);
    }
  }, []);

  /* -----------------------------------------
     LIST FOR SALE (SELL FLOW)
  ----------------------------------------- */
  function listForSale(asset: Asset) {
    if (asset.locked) return;

    // Remove from owned-assets
    const updatedOwned = assets.filter((a) => a.id !== asset.id);
    localStorage.setItem(OWNED_KEY, JSON.stringify(updatedOwned));
    setAssets(updatedOwned);

    // Add to market-listings with metadata
    const market = JSON.parse(
      localStorage.getItem(MARKET_KEY) || '[]'
    );

    market.push({
      ...asset,
      listedAt: Date.now(),
      sellerId: 'pilot-001',
      locked: false,
    });

    localStorage.setItem(MARKET_KEY, JSON.stringify(market));

    // Flash + redirect
    sessionStorage.setItem('market-flash', 'listed');
    router.push('/cockpit/trading-post/buy');
  }

  return (
    <section className="cockpit-panel">
      <header className="panel-header">
        <h1>My E-Assets</h1>
        <p className="panel-subtitle">
          Assets under your custody
        </p>
      </header>

      {assets.length === 0 ? (
        <p>No E-Assets currently owned.</p>
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
                  {asset.locked && (
                    <span className="asset-status paused">
                      IN ESCROW
                    </span>
                  )}
                </div>
              </div>

              <div className="market-row-footer">
                <button
                  className="inspect-command"
                  disabled={asset.locked}
                  onClick={() => listForSale(asset)}
                >
                  {asset.locked
                    ? 'ESCROW LOCKED'
                    : 'LIST FOR SALE →'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
