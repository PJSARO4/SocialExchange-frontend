'use client';

const MOCK_TICKER = [
  { symbol: '$GiggleLizards', price: 2.19, change: +0.14 },
  { symbol: '$NovaPets', price: 1.42, change: -0.07 },
  { symbol: '$UrbanSignal', price: 3.81, change: +0.03 },
  { symbol: '$EchoBrands', price: 0.88, change: -0.01 },
];

export default function ESharesTicker() {
  return (
    <div className="eshares-ticker">
      <div className="ticker-track">
        {[...MOCK_TICKER, ...MOCK_TICKER].map((asset, idx) => {
          const direction =
            asset.change > 0 ? 'up' : asset.change < 0 ? 'down' : 'flat';

          return (
            <div key={`${asset.symbol}-${idx}`} className={`ticker-item ${direction}`}>
              <span className="ticker-symbol">{asset.symbol}</span>
              <span className="ticker-price">{asset.price.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
