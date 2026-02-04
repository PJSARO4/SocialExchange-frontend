export type Platform = "instagram" | "twitter";

export type PlatformMetrics = {
  followers: number;
  engagement: number;
  postsPerWeek: number;
  uptime: number;
};

export type PlatformAdapter = {
  connect(input: {
    handle: string;
    displayName: string;
  }): Promise<any>;

  authorize(accountId: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }>;

  refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }>;

  fetchMetrics(handle: string): Promise<PlatformMetrics>;
};
