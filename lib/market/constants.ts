// Stub file - Market Constants

export const MARKET_CATEGORIES = [
  'all',
  'tokens',
  'nfts',
  'services',
  'digital-goods',
] as const;

export type MarketCategory = typeof MARKET_CATEGORIES[number];

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  ETH: 'Ξ',
  BTC: '₿',
} as const;

export const DEFAULT_CURRENCY = 'USD';

export const LISTING_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SOLD: 'sold',
  CANCELLED: 'cancelled',
} as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
] as const;

export default {
  MARKET_CATEGORIES,
  CURRENCY_SYMBOLS,
  DEFAULT_CURRENCY,
  LISTING_STATUS,
  SORT_OPTIONS,
};
