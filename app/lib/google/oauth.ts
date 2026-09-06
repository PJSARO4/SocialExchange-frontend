/**
 * Google OAuth + Drive helpers (REST, no SDK).
 *
 * Scope note: we request drive.readonly so Social Exchange can list + download
 * from an existing Drive folder the user already has (needed for autonomous
 * "pull from my folder" automation). drive.readonly is a *restricted* scope, so
 * for a public launch we would either complete Google's OAuth verification or
 * switch to the Google Picker + drive.file scope (only files the user picks,
 * no verification). Fine while the OAuth app is in Testing mode with test users.
 */

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';

// Full drive scope: needed to MOVE files (to-post -> posted) as well as read.
// (Restricted scope — for public launch, verify or use Picker + drive.file.)
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
export const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  'https://social-exchange-frontend.vercel.app/api/google/callback';

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: `openid email ${DRIVE_SCOPE}`,
    access_type: 'offline', // get a refresh_token for autonomous pulls
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as TokenResponse;
  if (data.error) throw new Error(data.error_description || data.error);
  return data;
}

export async function refreshGoogleToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    grant_type: 'refresh_token',
  });
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as TokenResponse;
  if (data.error) throw new Error(data.error_description || data.error);
  return data;
}

/** Pull the account email out of the id_token without verifying (display only). */
export function decodeEmailFromIdToken(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split('.')[1], 'base64').toString('utf8')
    );
    return payload.email || null;
  } catch {
    return null;
  }
}
