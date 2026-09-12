import { NextRequest, NextResponse } from 'next/server';

import {
  getTenantUser,
  notFound,
  resolveConnectedOwnedFeed,
  unauthorized,
} from '@/lib/security/tenant';

export const dynamic = 'force-dynamic';

/**
 * GET /api/instagram/analytics
 * Fetch analytics/insights for a connected Instagram account
 * Query params: feedId (optional), period
 *
 * SEC-1: this route required a session but accepted the Instagram credential
 * directly from the query string, so any authenticated user could pull
 * analytics for any account whose token they held. The credential is now
 * resolved from a feed the session user owns. Metric handling is unchanged.
 */
export async function GET(request: NextRequest) {
  try {
    if (request.nextUrl.searchParams.has('accessToken')) {
      return NextResponse.json(
        {
          error:
            'accessToken is no longer accepted in the query string. Pass feedId; the server resolves the token.',
        },
        { status: 400 }
      );
    }

    const user = await getTenantUser();
    if (!user) return unauthorized();

    const period = request.nextUrl.searchParams.get('period') || 'lifetime'; // lifetime, last_90_days, last_30_days, last_7_days

    const feed = await resolveConnectedOwnedFeed(
      user.id,
      request.nextUrl.searchParams.get('feedId')
    );
    if (!feed) return notFound('Feed');

    // Never log a token or a token prefix.
    console.log('📊 Fetching analytics for owned feed:', feed.handle);

    // In production, if accountId is provided:
    // 1. Fetch the InstagramAccount from DB
    // 2. Use its stored accessToken
    // 3. Make Instagram Insights API calls

    // If accessToken is directly provided (during OAuth flow):
    // Use it immediately to fetch data

    const token = feed.accessToken;

    if (!token) {
      return NextResponse.json(
        { error: 'No access token available for this account' },
        { status: 400 }
      );
    }

    // Fetch profile data and insights from Instagram API
    const profileData = await fetchProfileData(token);
    const insights = await fetchInsights(token, period);

    return NextResponse.json({
      success: true,
      profile: profileData,
      insights: insights,
      period,
    });

  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function fetchProfileData(accessToken: string) {
  const fields = [
    'id',
    'username',
    'name',
    'account_type',
    'profile_picture_url',
    'followers_count',
    'follows_count',
    'media_count',
    'biography',
    'ig_id', // Instagram ID
    'website',
  ].join(',');

  const url = `https://graph.instagram.com/me?fields=${fields}&access_token=${accessToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Failed to fetch profile');
    }

    return {
      id: data.id,
      username: data.username,
      name: data.name,
      accountType: data.account_type,
      profilePictureUrl: data.profile_picture_url,
      followersCount: data.followers_count,
      followsCount: data.follows_count,
      mediaCount: data.media_count,
      biography: data.biography,
      website: data.website,
    };
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    throw error;
  }
}

async function fetchInsights(accessToken: string, period: string) {
  // Insights require instagram_business_manage_insights permission
  const insightMetrics = [
    'impressions',
    'reach',
    'profile_views',
    'follower_growth',
    'email_contacts',
    'phone_call_clicks',
    'text_message_clicks',
    'get_directions_clicks',
    'website_clicks',
  ];

  const url = `https://graph.instagram.com/me/insights?metric=${insightMetrics.join(',')}&period=${period}&access_token=${accessToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.warn('Insights fetch warning:', data.error.message);
      // Return empty insights if not available
      return {};
    }

    // Format insights data
    const insights: Record<string, number> = {};
    if (data.data) {
      data.data.forEach((item: any) => {
        insights[item.name] = item.values?.[0]?.value || 0;
      });
    }

    return insights;
  } catch (error: any) {
    console.warn('Insights fetch error:', error.message);
    // Return empty object if insights fail (not critical)
    return {};
  }
}
