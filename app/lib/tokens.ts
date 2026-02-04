import { query } from "@/app/lib/db";

export type TokenRecord = {
  platform: string;
  accountId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
};

export async function upsertToken(token: TokenRecord) {
  const {
    platform,
    accountId,
    accessToken,
    refreshToken,
    expiresAt,
  } = token;

  await query(
    `
    INSERT INTO tokens (
      id,
      platform,
      account_id,
      access_token,
      refresh_token,
      expires_at,
      created_at,
      updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
    `,
    [
      `${platform}:${accountId}`,
      platform,
      accountId,
      accessToken,
      refreshToken,
      expiresAt,
    ]
  );
}
