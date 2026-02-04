export interface Feed {
  id: string;
  platform: string;
  handle: string;
  displayName: string;
  isConnected: boolean;
  automationEnabled: boolean;
  lastSync: string | null;
  metrics?: {
    followers?: number;
    engagement?: number;
    postsPerWeek?: number;
    uptime?: number;
  };
}
