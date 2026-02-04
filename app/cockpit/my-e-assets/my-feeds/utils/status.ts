// app/cockpit/my-e-assets/my-feeds/utils/status.ts

import type { FeedStatus } from '../types';

/**
 * Derive operational UI status for a feed.
 * UI-only logic.
 */
export function getFeedStatus(feed: {
  isConnected: boolean;
  lastSync: string;
}): FeedStatus {
  if (!feed.isConnected) {
    return 'error';
  }

  const lastSyncTime = new Date(feed.lastSync).getTime();
  const ageMs = Date.now() - lastSyncTime;

  // Actively syncing if updated in last 60 seconds
  if (ageMs < 60_000) {
    return 'syncing';
  }

  return 'connected';
}
