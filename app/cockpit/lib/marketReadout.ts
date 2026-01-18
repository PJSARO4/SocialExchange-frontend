// app/cockpit/lib/marketReadout.ts

export type MarketFeed = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  previousPrice: number;
  change: number;
  direction: 'up' | 'down' | 'neutral';
};

/**
 * Simulate a small market price movement
 */
export function simulatePriceTick(
  currentPrice: number
): { price: number; change: number } {
  const variance = Math.random() * 0.08 - 0.04; // ±4%
  const nextPrice = Math.max(0.01, currentPrice + variance);
  const change = nextPrice - currentPrice;

  return {
    price: parseFloat(nextPrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
  };
}

/**
 * Apply a live update to all feeds
 */
export function updateMarketFeeds(
  feeds: MarketFeed[]
): MarketFeed[] {
  return feeds.map((feed) => {
    const { price, change } = simulatePriceTick(feed.price);

    let direction: MarketFeed['direction'] = 'neutral';
    if (change > 0) direction = 'up';
    if (change < 0) direction = 'down';

    return {
      ...feed,
      previousPrice: feed.price,
      price,
      change,
      direction,
    };
  });
}
