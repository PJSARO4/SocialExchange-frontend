'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Asset = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function SellConfirmPage() {
  const router = useRouter();
  const { assetId } = useParams<{ assetId: string }>();

  const [asset, setAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const ownedRaw = localStorage.getItem('owned-assets');
    if (!ownedRaw) return;

    try {
      const owned: Asset[] = JSON.parse(ownedRaw);
      const found = owned.find((a) => a.id === assetId);
      if (found) setAsset(found);
    } catch {}
  }, [assetId]);

  function handleConfirm() {
    if (!asset) return;

    // 1. Remove from owned-assets
    const owned: Asset[] = JSON.parse(
      localStorage.getItem('owned-assets') || '[]'
    ).filter((a) => a.id !== asset.id);

    localStorage.setItem('owned-assets', JSON.stringify(owned));

    // 2. Add to market-listings
    const market = JSON.parse(
      localStorage.getItem('market-listings') || '[]'
    );

    market.push(asset);
    localStorage.setItem('market-listings', JSON.stringify(market));

    // 3. Redirect to Buy
    router.push('/cockpit/trading-post/buy');
  }

  if (!asset) {
    return (
      <section className="cockpit-panel">
        <p>Asset not found.</p>
      </section>
    );
  }

  return (
    <section className="cockpit-panel">
      <header className="panel-header">
        <h1>Confirm Listing</h1>
        <p className="panel-subtitle">
          List asset on the open exchange
        </p>
      </header>

      <div className="market-row">
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
      </div>

      <div className="confirm-actions">
        <button
          className="confirm-btn"
          onClick={handleConfirm}
        >
          CONFIRM LISTING
        </button>

        <button
          className="abort-btn"
          onClick={() => router.back()}
        >
          ABORT
        </button>
      </div>
    </section>
  );
}
