import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * Instagram Insights API
 *
 * Fetches account-level and media-level insights from the Instagram Graph API.
 * Requires: instagram_business_manage_insights permission
 *
 * Account metrics (period=day): impressions, reach, profile_views, follower_count
 * Account metrics (period=lifetime): online_followers (by hour)
 * Media metrics: impressions, reach, engagement, saved, video_views
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('access_token');
  const instagramUserId = searchParams.get('instagram_user_id');
  const metricType = searchParams.get('type') || 'account'; // 'account' | 'media'
  const mediaId = searchParams.get('media_id');
  const since = searchParams.get('since');
  const until = searchParams.get('until');
  const period = searchParams.get('period') || 'day';

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Access token is required' },
      { status: 400 }
    );
  }

  if (!instagramUserId) {
    return NextResponse.json(
      { error: 'Instagram user ID is required' },
      { status: 400 }
    );
  }

  try {
    if (metricType === 'media' && mediaId) {
      // Fetch insights for a specific media post
      return await getMediaInsights(mediaId, accessToken);
    }

    // Fetch account-level insights
    return await getAccountInsights(instagramUserId, accessToken, period, since, until);
  } catch (error: any) {
    console.error('❌ Instagram Insights error:', error);

    if (error.message?.includes('permission')) {
      return NextResponse.json({
        error: 'Missing instagram_business_manage_insights permission. Please request this permission in your Meta App Review.',
        details: error.message,
      }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch insights', details: error.message },
      { status: 500 }
    );
  }
}

async function getAccountInsights(
  userId: string,
  accessToken: string,
  period: string,
  since: string | null,
  until: string | null
) {
  // Account-level metrics available with instagram_business_manage_insights
  const metrics = [
    'impressions',
    'reach',
    'profile_views',
    'accounts_engaged',
    'total_interactions',
    'likes',
    'comments',
    'shares',
    'saves',
    'follows_and_unfollows',
  ].join(',');

  let url = `https://graph.facebook.com/v21.0/${userId}/insights?metric=${metrics}&period=${period}&access_token=${accessToken}`;

  if (since) url += `&since=${since}`;
  if (until) url += `&until=${until}`;

  console.log('📊 Fetching account insights...');

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to fetch account insights');
  }

  // Also fetch follower demographics if available
  let demographics = null;
  try {
    const demoUrl = `https://graph.facebook.com/v21.0/${userId}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&access_token=${accessToken}`;
    const demoResponse = await fetch(demoUrl);
    const demoData = await demoResponse.json();
    if (!demoData.error) {
      demographics = demoData.data;
    }
  } catch {
    // Demographics may not be available for all accounts
  }

  // Format the response
  const insights: Record<string, any> = {};
  if (data.data) {
    for (const metric of data.data) {
      insights[metric.name] = {
        title: metric.title,
        description: metric.description,
        period: metric.period,
        values: metric.values,
      };
    }
  }

  return NextResponse.json({
    insights,
    demographics,
    period,
    userId,
  });
}

async function getMediaInsights(mediaId: string, accessToken: string) {
  // Media-level insights
  const metrics = [
    'impressions',
    'reach',
    'engagement',
    'saved',
    'likes',
    'comments',
    'shares',
  ].join(',');

  const url = `https://graph.facebook.com/v21.0/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`;

  console.log(`📊 Fetching media insights for ${mediaId}...`);

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Failed to fetch media insights');
  }

  const insights: Record<string, any> = {};
  if (data.data) {
    for (const metric of data.data) {
      insights[metric.name] = {
        title: metric.title,
        description: metric.description,
        values: metric.values,
      };
    }
  }

  return NextResponse.json({
    mediaId,
    insights,
  });
}
