'use client';

import { useRouter } from 'next/navigation';

interface Props {
  listings: Array<{
    id: number;
    title: string;
    category: string;
    price: number;
  }>;
}

export default function NewListingsPanel({ listings }: Props) {
  const router = useRouter();

  return (
    <div className="panel panel-new-listings">
      <div className="panel-header">
        <h2 className="panel-title">New Listings</h2>
      </div>
      <div className="panel-body">
        {listings.map(listing => (
          <div key={listing.id} className="listing-item">
            <div className="listing-title">{listing.title}</div>
            <div className="listing-meta">
              <span className="listing-category">{listing.category}</span>
              <span className="listing-price">${listing.price}</span>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push('/cockpit/market')}
        className="panel-action-button"
      >
        Browse Market
      </button>
    </div>
  );
}
