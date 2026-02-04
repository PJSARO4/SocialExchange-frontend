/**
 * Instagram Graph API Client
 *
 * Handles all Instagram API interactions for Business/Creator accounts.
 * Uses Meta's Graph API (v21.0)
 *
 * Required scopes:
 * - instagram_basic: Read profile info and media
 * - instagram_content_publish: Post content
 * - instagram_manage_insights: Read analytics
 * - pages_show_list: List connected Facebook Pages
 * - business_management: Access business accounts
 */

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';
const INSTAGRAM_API_BASE = 'https://graph.instagram.com/v21.0';

export interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  profilePictureUrl: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  biography?: string;
  website?: string;
}

export interface InstagramInsights {
  impressions: number;
  reach: number;
  profileViews: number;
  websiteClicks: number;
  emailContacts: number;
  followerCount: number;
  // Engagement metrics
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSaves: number;
  engagementRate: number;
}

export interface InstagramMedia {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
}

/**
 * Get all Instagram Business accounts connected to a Facebook user
 * This requires the user to have connected their Instagram Business account to a Facebook Page
 */
export async function getConnectedInstagramAccounts(
  accessToken: string
): Promise<InstagramAccount[]> {
  try {
    // Step 1: Get all Facebook Pages the user manages
    const pagesResponse = await fetch(
      `${GRAPH_API_BASE}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      const error = await pagesResponse.json();
      throw new Error(error.error?.message || 'Failed to fetch Facebook Pages');
    }

    const pagesData = await pagesResponse.json();
    const accounts: InstagramAccount[] = [];

    // Step 2: For each page with an Instagram Business account, get the account details
    for (const page of pagesData.data || []) {
      if (page.instagram_business_account) {
        const igAccountId = page.instagram_business_account.id;

        const igResponse = await fetch(
          `${GRAPH_API_BASE}/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography,website&access_token=${accessToken}`
        );

        if (igResponse.ok) {
          const igData = await igResponse.json();
          accounts.push({
            id: igData.id,
            username: igData.username,
            name: igData.name || igData.username,
            profilePictureUrl: igData.profile_picture_url,
            followersCount: igData.followers_count || 0,
            followsCount: igData.follows_count || 0,
            mediaCount: igData.media_count || 0,
            biography: igData.biography,
            website: igData.website,
          });
        }
      }
    }

    return accounts;
  } catch (error) {
    console.error('Error fetching Instagram accounts:', error);
    throw error;
  }
}

/**
 * Get detailed insights for an Instagram Business account
 */
export async function getAccountInsights(
  igAccountId: string,
  accessToken: string,
  period: 'day' | 'week' | 'days_28' = 'days_28'
): Promise<InstagramInsights> {
  try {
    // Get account-level insights
    const metricsToFetch = [
      'impressions',
      'reach',
      'profile_views',
      'website_clicks',
      'email_contacts',
      'follower_count',
    ].join(',');

    const insightsResponse = await fetch(
      `${GRAPH_API_BASE}/${igAccountId}/insights?metric=${metricsToFetch}&period=${period}&access_token=${accessToken}`
    );

    if (!insightsResponse.ok) {
      const error = await insightsResponse.json();
      throw new Error(error.error?.message || 'Failed to fetch insights');
    }

    const insightsData = await insightsResponse.json();

    // Parse the insights data
    const insights: Partial<InstagramInsights> = {};
    for (const metric of insightsData.data || []) {
      const value = metric.values?.[0]?.value || 0;
      switch (metric.name) {
        case 'impressions':
          insights.impressions = value;
          break;
        case 'reach':
          insights.reach = value;
          break;
        case 'profile_views':
          insights.profileViews = value;
          break;
        case 'website_clicks':
          insights.websiteClicks = value;
          break;
        case 'email_contacts':
          insights.emailContacts = value;
          break;
        case 'follower_count':
          insights.followerCount = value;
          break;
      }
    }

    // Get recent media to calculate engagement
    const mediaResponse = await fetch(
      `${GRAPH_API_BASE}/${igAccountId}/media?fields=like_count,comments_count&limit=25&access_token=${accessToken}`
    );

    let totalLikes = 0;
    let totalComments = 0;
    let mediaCount = 0;

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json();
      for (const media of mediaData.data || []) {
        totalLikes += media.like_count || 0;
        totalComments += media.comments_count || 0;
        mediaCount++;
      }
    }

    // Calculate engagement rate
    const engagementRate = insights.followerCount && mediaCount > 0
      ? ((totalLikes + totalComments) / mediaCount / insights.followerCount) * 100
      : 0;

    return {
      impressions: insights.impressions || 0,
      reach: insights.reach || 0,
      profileViews: insights.profileViews || 0,
      websiteClicks: insights.websiteClicks || 0,
      emailContacts: insights.emailContacts || 0,
      followerCount: insights.followerCount || 0,
      totalLikes,
      totalComments,
      totalShares: 0, // Not available via API for all media types
      totalSaves: 0,  // Requires additional permissions
      engagementRate: Math.round(engagementRate * 100) / 100,
    };
  } catch (error) {
    console.error('Error fetching account insights:', error);
    throw error;
  }
}

/**
 * Get recent media posts for an Instagram account
 */
export async function getRecentMedia(
  igAccountId: string,
  accessToken: string,
  limit: number = 25
): Promise<InstagramMedia[]> {
  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${igAccountId}/media?fields=id,media_type,media_url,thumbnail_url,caption,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch media');
    }

    const data = await response.json();

    return (data.data || []).map((media: any) => ({
      id: media.id,
      mediaType: media.media_type,
      mediaUrl: media.media_url,
      thumbnailUrl: media.thumbnail_url,
      caption: media.caption,
      permalink: media.permalink,
      timestamp: media.timestamp,
      likeCount: media.like_count || 0,
      commentsCount: media.comments_count || 0,
    }));
  } catch (error) {
    console.error('Error fetching recent media:', error);
    throw error;
  }
}

/**
 * Publish a photo to Instagram
 * Two-step process: 1) Create container, 2) Publish container
 */
export async function publishPhoto(
  igAccountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<{ id: string; permalink?: string }> {
  try {
    // Step 1: Create a media container
    const containerResponse = await fetch(
      `${GRAPH_API_BASE}/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        }),
      }
    );

    if (!containerResponse.ok) {
      const error = await containerResponse.json();
      throw new Error(error.error?.message || 'Failed to create media container');
    }

    const containerData = await containerResponse.json();
    const containerId = containerData.id;

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      throw new Error(error.error?.message || 'Failed to publish media');
    }

    const publishData = await publishResponse.json();

    return {
      id: publishData.id,
    };
  } catch (error) {
    console.error('Error publishing photo:', error);
    throw error;
  }
}

/**
 * Publish a video/reel to Instagram
 */
export async function publishVideo(
  igAccountId: string,
  accessToken: string,
  videoUrl: string,
  caption: string,
  mediaType: 'REELS' | 'VIDEO' = 'REELS'
): Promise<{ id: string }> {
  try {
    // Step 1: Create a media container for video
    const containerResponse = await fetch(
      `${GRAPH_API_BASE}/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: videoUrl,
          caption,
          media_type: mediaType,
          access_token: accessToken,
        }),
      }
    );

    if (!containerResponse.ok) {
      const error = await containerResponse.json();
      throw new Error(error.error?.message || 'Failed to create video container');
    }

    const containerData = await containerResponse.json();
    const containerId = containerData.id;

    // Step 2: Check container status (video processing takes time)
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      const statusResponse = await fetch(
        `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.status_code;
      }
      attempts++;
    }

    if (status !== 'FINISHED') {
      throw new Error(`Video processing failed with status: ${status}`);
    }

    // Step 3: Publish the container
    const publishResponse = await fetch(
      `${GRAPH_API_BASE}/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      throw new Error(error.error?.message || 'Failed to publish video');
    }

    const publishData = await publishResponse.json();

    return {
      id: publishData.id,
    };
  } catch (error) {
    console.error('Error publishing video:', error);
    throw error;
  }
}

/**
 * Exchange short-lived token for long-lived token
 * Short-lived tokens last ~1 hour, long-lived last ~60 days
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to exchange token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in, // In seconds, typically 5184000 (60 days)
  };
}

/**
 * Refresh a long-lived token before it expires
 */
export async function refreshLongLivedToken(
  currentToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_CLIENT_ID}&client_secret=${process.env.META_CLIENT_SECRET}&fb_exchange_token=${currentToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to refresh token');
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}
