import type { PlatformAdapter } from "@/app/lib/platforms/types";

export const instagram: PlatformAdapter = {
  async connect({ handle, displayName }) {
    return {
      platform: "instagram",
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
      accessToken: `ig_access_${accountId}`,
      refreshToken: `ig_refresh_${accountId}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  },

  async refreshToken(refreshToken: string) {
    return {
      accessToken: `ig_access_refreshed_${Date.now()}`,
      refreshToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  },

  async fetchMetrics() {
    return {
      followers: Math.floor(Math.random() * 50000),
      engagement: Number((Math.random() * 8).toFixed(2)),
      postsPerWeek: Math.floor(Math.random() * 10),
      uptime: 99.5,
    };
  },
};
