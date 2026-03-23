import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/instagram/analytics
 * Fetch analytics/insights for a connected Instagram account
 * Query params: accountId or accessToken
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = request.nextUrl.searchParams.get('accountId');
    const accessToken = request.nextUrl.searchParams.get('accessToken');
    const period = request.nextUrl.searchParams.get('period') || 'lifetime'; // lifetime, last_90_days, last_30_days, last_7_days

    if (!accountId && !accessToken) {
      return NextResponse.json(
        { error: 'Either accountId or accessToken is required' },
        { status: 400 }
      );
    }

    console.log('📊 Fetching analytics for account:', accountId || accessToken?.substring(0, 10) + '...');

    // In production, if accountId is provided:
    // 1. Fetch the InstagramAccount from DB
    // 2. Use its stored accessToken
    // 3. Make Instagram Insights API calls

    // If accessToken is directly provided (during OAuth flow):
    // Use it immediately to fetch data

    let token = accessToken;

    if (accountId && !accessToken) {
      // Fetch from DB (when implemented)
      // const account = await prisma.instagramAccount.findUnique({
      //   where: { id: accountId }
      // });
      // token = account?.accessToken;
    }

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
