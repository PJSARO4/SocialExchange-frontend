import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exchangeCode, decodeEmailFromIdToken } from '@/app/lib/google/oauth';

export const dynamic = 'force-dynamic';

const APP = 'https://social-exchange-frontend.vercel.app';

/**
 * GET /api/google/callback
 * Handles the Google OAuth redirect: exchanges the code for tokens and stores
 * the Drive connection as a NextAuth Account row (provider='google-drive').
 * No schema change needed — reuses the existing Account token fields.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const oauthError = url.searchParams.get('error');
  const state = url.searchParams.get('state');
  const cookieState = request.cookies.get('g_oauth_state')?.value;

  const back = (status: string) =>
    NextResponse.redirect(`${APP}/cockpit/my-e-assets/my-feeds?drive=${status}`);

  if (oauthError) return back('denied');
  if (!code) return back('nocode');
  if (!state || !cookieState || state !== cookieState) return back('state');

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.redirect(`${APP}/auth/signin`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return back('nouser');

  try {
    const tok = await exchangeCode(code);
    const googleEmail = decodeEmailFromIdToken(tok.id_token) || 'google-drive';
    const expires_at = tok.expires_in
      ? Math.floor(Date.now() / 1000) + tok.expires_in
      : null;

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google-drive',
          providerAccountId: googleEmail,
        },
      },
      update: {
        userId: user.id,
        access_token: tok.access_token,
        // Google only returns a refresh_token on first consent; keep the old one otherwise.
        ...(tok.refresh_token ? { refresh_token: tok.refresh_token } : {}),
        expires_at,
        scope: tok.scope,
        token_type: tok.token_type,
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'google-drive',
        providerAccountId: googleEmail,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        expires_at,
        scope: tok.scope,
        token_type: tok.token_type,
      },
    });

    const res = back('connected');
    res.cookies.set('g_oauth_state', '', { maxAge: 0, path: '/' });
    return res;
  } catch (e) {
    console.error('Google callback error:', e);
    return back('error');
  }
}
