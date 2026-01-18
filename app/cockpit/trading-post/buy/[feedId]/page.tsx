'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logTransaction } from '../../../systems/transactionLog';

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

  useEffect(() => {
    const raw = localStorage.getItem('market-listings');
    if (!raw) return;

    const listings: MarketListing[] = JSON.parse(raw);
    const found = listings.find(l => l.id === feedId);
    if (found) setAsset(found);
  }, [feedId]);

  function confirmPurchase() {
    if (!asset) return;

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

    router.push('/cockpit/my-e-assets');
  }

  if (!asset) return null;

  return (
    <section className="cockpit-panel">
      <h1>Confirm Acquisition</h1>
      <p>{asset.name}</p>

      <div className="confirm-actions">
        <button onClick={confirmPurchase}>CONFIRM PURCHASE</button>
        <button onClick={() => router.back()}>ABORT</button>
      </div>
    </section>
  );
}
