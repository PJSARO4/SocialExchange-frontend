'use client';

export function getActiveListingsCount(): number {
  if (typeof window === 'undefined') return 0;

  const stored = localStorage.getItem('market-listings');
  if (!stored) return 0;

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function getMarketPulse(): 'LOW' | 'NOMINAL' | 'HIGH' {
  // simulated for now — future hook for real metrics
  return 'NOMINAL';
}
