// app/lib/feeds.ts

/**
 * Canonical UI-facing Feed type (camelCase)
 */
export interface Feed {
  id: string;
  platform: string;
  handle: string;
  displayName: string;
  isConnected: boolean;
  automationEnabled: boolean;
  followers: number;
  engagement: number;
  postsPerWeek: number;
  uptime: number;
  lastSync: Date | null;
}

/**
 * Normalize a raw DB feed row (snake_case → camelCase)
 */
export function normalizeFeed(row: any): Feed {
  return {
    id: row.id,
    platform: row.platform,
    handle: row.handle,
    displayName: row.display_name,
    isConnected: row.is_connected,
    automationEnabled: row.automation_enabled,
    followers: row.followers ?? 0,
    engagement: row.engagement ?? 0,
    postsPerWeek: row.posts_per_week ?? 0,
    uptime: row.uptime ?? 0,
    lastSync: row.last_sync ? new Date(row.last_sync) : null,
  };
}

/**
 * Normalize an array of DB feed rows
 */
export function normalizeFeeds(rows: any[]): Feed[] {
  return rows.map(normalizeFeed);
}
