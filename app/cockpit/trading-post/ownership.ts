import { MarketListing } from './seedMarket';

const MARKET_KEY = 'market-listings';
const OWNED_KEY = 'owned-assets';

export function acquireAsset(asset: MarketListing) {
  if (typeof window === 'undefined') return;

  // --- Remove from market ---
  const marketRaw = localStorage.getItem(MARKET_KEY);
  const market: MarketListing[] = marketRaw ? JSON.parse(marketRaw) : [];

  const updatedMarket = market.filter((a) => a.id !== asset.id);
  localStorage.setItem(MARKET_KEY, JSON.stringify(updatedMarket));

  // --- Add to owned ---
  const ownedRaw = localStorage.getItem(OWNED_KEY);
  const owned = ownedRaw ? JSON.parse(ownedRaw) : [];

  owned.push({
    ...asset,
    acquiredAt: Date.now(),
  });

  localStorage.setItem(OWNED_KEY, JSON.stringify(owned));
}
