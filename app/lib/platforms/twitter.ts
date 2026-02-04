import type { PlatformAdapter } from "@/app/lib/platforms/types";

export const twitter: PlatformAdapter = {
  async connect({ handle, displayName }) {
    return {
      platform: "twitter",
      handle,
      displayName,
      isConnected: true,
      automationEnabled: false,
      lastSync: new Date(),
      metrics: {
        followers: 0,
        engagement: 0,
        postsPerWeek: 0,
        uptime: 100,
      },
    };
  },

  async authorize(accountId: string) {
    return {
      accessToken: `tw_access_${accountId}`,
      refreshToken: `tw_refresh_${accountId}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  },

  async refreshToken(refreshToken: string) {
    return {
      accessToken: `tw_access_refreshed_${Date.now()}`,
      refreshToken,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  },

  async fetchMetrics() {
    return {
      followers: Math.floor(Math.random() * 20000),
      engagement: Number((Math.random() * 6).toFixed(2)),
      postsPerWeek: Math.floor(Math.random() * 7),
      uptime: 98.9,
    };
  },
};
