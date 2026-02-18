'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { logTransaction } from '../../../systems/transactionLog';
import './feed-detail.css';

type MarketListing = {
  id: string;
  name: string;
  description: string;
  price: number;
  sellerId: string;
  listedAt: number;
};

type OwnedAsset = MarketListing & {
  acquiredAt: number;
  status: 'OWNED';
};

export default function BuyConfirmPage() {
  const router = useRouter();
  const { feedId } = useParams<{ feedId: string }>();

  const [asset, setAsset] = useState<MarketListing | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('market-listings');
      if (!raw) return;

      const listings: MarketListing[] = JSON.parse(raw);
      const found = listings.find(l => l.id === feedId);
      if (found) setAsset(found);
    } catch {
      // Ignore parse errors
    }
  }, [feedId]);

  function confirmPurchase() {
    if (!asset) return;
    setPurchasing(true);

    // Simulate processing delay
    setTimeout(() => {
      try {
        // remove from market
        const market = JSON.parse(
          localStorage.getItem('market-listings') || '[]'
        ).filter((l: MarketListing) => l.id !== asset.id);

        localStorage.setItem('market-listings', JSON.stringify(market));

        // add to owned assets
        const owned: OwnedAsset[] = JSON.parse(
          localStorage.getItem('owned-assets') || '[]'
        );

        owned.push({
          ...asset,
          acquiredAt: Date.now(),
          status: 'OWNED',
        });

        localStorage.setItem('owned-assets', JSON.stringify(owned));

        // log transaction
        logTransaction({
          type: 'BUY',
          assetId: asset.id,
        });

        setSuccess(true);
        setPurchasing(false);

        // Redirect after showing success
        setTimeout(() => {
          router.push('/cockpit/my-e-assets');
        }, 1500);
      } catch {
        setPurchasing(false);
      }
    }, 800);
  }

  if (!asset) {
    return (
      <section className="cockpit-panel">
        <Link href="/cockpit/trading-post/buy" className="back-link">
          ← Back to Listings
        </Link>
        <div className="empty-state">Asset not found or no longer available.</div>
      </section>
    );
  }

  return (
    <section className="feed-detail-root">
      {/* Back Navigation */}
      <Link href="/cockpit/trading-post/buy" className="back-link">
        ← Back to Listings
      </Link>

      {/* Header */}
      <div className="feed-header">
        <h1>{asset.name}</h1>
        <span className="status">AVAILABLE</span>
      </div>

      {/* Asset Details */}
      <div className="feed-body">
        <div className="feed-panel">
          <h3>DESCRIPTION</h3>
          <p>{asset.description}</p>
        </div>

        <div className="feed-panel">
          <h3>ASKING PRICE</h3>
          <p className="price">${asset.price.toFixed(2)}</p>
        </div>

        <div className="feed-panel">
          <h3>LISTED</h3>
          <p>{asset.listedAt ? new Date(asset.listedAt).toLocaleDateString() : 'Recently'}</p>
        </div>
      </div>

      {/* Actions */}
      {success ? (
        <div className="confirm-actions">
          <div className="confirm-btn" style={{ textAlign: 'center', cursor: 'default' }}>
            ✅ ACQUISITION COMPLETE — Redirecting...
          </div>
        </div>
      ) : (
        <div className="confirm-actions">
          <button
            className="confirm-btn"
            onClick={confirmPurchase}
            disabled={purchasing}
          >
            {purchasing ? 'PROCESSING...' : 'CONFIRM PURCHASE'}
          </button>

          <button
            className="abort-btn"
            onClick={() => router.back()}
            disabled={purchasing}
          >
            ABORT
          </button>
        </div>
      )}
    </section>
  );
}
