import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildAuthUrl } from '@/app/lib/google/oauth';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

const APP = 'https://social-exchange-frontend.vercel.app';

/**
 * GET /api/google/start
 * Kicks off the Google Drive OAuth consent flow for the logged-in user.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(`${APP}/auth/signin`);
  }

  const state = randomBytes(16).toString('hex');
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set('g_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
