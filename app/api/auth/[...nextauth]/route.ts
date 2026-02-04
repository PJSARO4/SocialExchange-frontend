import NextAuth, { NextAuthOptions } from 'next-auth';

// ============================================
// Instagram Direct Login (Instagram Platform API)
// ============================================
// This uses Instagram's native OAuth flow (launched July 2024)
// Works with Business & Creator accounts WITHOUT requiring a Facebook Page
// Goes directly through instagram.com instead of facebook.com
const InstagramDirectProvider = {
  id: 'instagram-direct',
  name: 'Instagram',
  type: 'oauth' as const,
  authorization: {
    url: 'https://www.instagram.com/oauth/authorize',
    params: {
      scope: 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights',
      response_type: 'code',
    },
  },
  token: {
    url: 'https://api.instagram.com/oauth/access_token',
    async request({ client, params, checks, provider }: any) {
      // Instagram token endpoint requires form-urlencoded POST
      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: params.redirect_uri,
          code: params.code,
        }),
      });
      const tokens = await response.json();
      return { tokens };
    },
  },
  userinfo: {
    url: 'https://graph.instagram.com/me',
    params: {
      fields: 'id,username,account_type,name',
    },
  },
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.name || profile.username,
      email: null, // Instagram doesn't provide email
      image: null, // Would need separate API call for profile pic
    };
  },
  clientId: process.env.INSTAGRAM_CLIENT_ID || process.env.META_CLIENT_ID!,
  clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_CLIENT_SECRET!,
};

// ============================================
// Instagram via Facebook Login (Legacy method)
// ============================================
// This requires Instagram account to be linked to a Facebook Page
// Kept for users who have Page-connected Instagram accounts
const InstagramBusinessProvider = {
  id: 'instagram',
  name: 'Instagram (via Facebook)',
  type: 'oauth' as const,
  authorization: {
    url: 'https://www.facebook.com/v21.0/dialog/oauth',
    params: {
      scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management',
      response_type: 'code',
    },
  },
  token: {
    url: 'https://graph.facebook.com/v21.0/oauth/access_token',
  },
  userinfo: {
    url: 'https://graph.facebook.com/v21.0/me',
    params: {
      fields: 'id,name,email,picture',
    },
  },
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.picture?.data?.url,
    };
  },
  clientId: process.env.META_CLIENT_ID!,
  clientSecret: process.env.META_CLIENT_SECRET!,
};

// Facebook provider for Page management
const FacebookBusinessProvider = {
  id: 'facebook',
  name: 'Facebook',
  type: 'oauth' as const,
  authorization: {
    url: 'https://www.facebook.com/v21.0/dialog/oauth',
    params: {
      scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,business_management',
      response_type: 'code',
    },
  },
  token: {
    url: 'https://graph.facebook.com/v21.0/oauth/access_token',
  },
  userinfo: {
    url: 'https://graph.facebook.com/v21.0/me',
    params: {
      fields: 'id,name,email,picture',
    },
  },
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.picture?.data?.url,
    };
  },
  clientId: process.env.META_CLIENT_ID!,
  clientSecret: process.env.META_CLIENT_SECRET!,
};

export const authOptions: NextAuthOptions = {
  providers: [
    InstagramDirectProvider,      // Instagram Direct Login (no Facebook Page required!)
    InstagramBusinessProvider,    // Instagram via Facebook (for Page-connected accounts)
    FacebookBusinessProvider,     // Facebook Pages
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Log the successful sign in (we'll add DB storage later)
      if (account && user) {
        console.log('✅ User signed in:', user.email);
        console.log('✅ Provider:', account.provider);
        console.log('✅ Access token received:', !!account.access_token);
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // Persist the OAuth access token and user ID to the JWT
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID and provider info to session
      if (session.user) {
        (session.user as any).id = token.userId || token.sub;
        (session.user as any).provider = token.provider;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
