import { NextRequest, NextResponse } from 'next/server';

// Instagram Graph API endpoint to fetch user profile with metrics
export async function GET(request: NextRequest) {
  const accessToken = request.nextUrl.searchParams.get('access_token');

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Access token is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch user profile with business account fields
    // Note: followers_count and media_count require instagram_business_basic permission
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
    ].join(',');

    const url = `https://graph.instagram.com/me?fields=${fields}&access_token=${accessToken}`;

    console.log('📊 Fetching Instagram profile data...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Instagram API Error:', data.error);
      return NextResponse.json(
        { error: data.error.message || 'Failed to fetch Instagram data' },
        { status: 400 }
      );
    }

    console.log('✅ Instagram Profile Data:', JSON.stringify(data, null, 2));

    return NextResponse.json({
      id: data.id,
      username: data.username,
      name: data.name,
      accountType: data.account_type,
      profilePictureUrl: data.profile_picture_url,
      followersCount: data.followers_count,
      followsCount: data.follows_count,
      mediaCount: data.media_count,
      biography: data.biography,
    });
  } catch (error) {
    console.error('❌ Error fetching Instagram profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram profile' },
      { status: 500 }
    );
  }
}
