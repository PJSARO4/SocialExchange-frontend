'use client';

export type MarketListing = {
  id: string;
  name: string;
  description: string;
  price: number;
};

const SEED_KEY = 'market-listings';

export function seedMarketIfEmpty() {
  if (typeof window === 'undefined') return;

  const existing = localStorage.getItem(SEED_KEY);

  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) return;
    } catch {
      // fall through and reseed if corrupted
    }
  }

  const seedData: MarketListing[] = [
    {
      id: 'e-ax7',
      name: 'AX-7 Relay Core',
      description: 'Encrypted signal relay core recovered from deep-orbit debris.',
      price: 14.32,
    },
    {
      id: 'e-nv3',
      name: 'NV-3 Navigation Shard',
      description: 'Partial navigation matrix with residual jump-path data.',
      price: 22.91,
    },
    {
      id: 'e-px9',
      name: 'PX-9 Power Coupler',
      description: 'Experimental coupler tuned for low-noise energy transfer.',
      price: 31.47,
    },
  ];

  localStorage.setItem(SEED_KEY, JSON.stringify(seedData));
}
