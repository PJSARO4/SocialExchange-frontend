/**
 * Instagram Account Storage Module
 *
 * This module handles all database operations for Instagram OAuth accounts.
 * When Prisma is fully connected, these functions will use the InstagramAccount model.
 *
 * IMPORTANT: This file is a placeholder for when DATABASE_URL is properly configured.
 * Currently, tokens are stored in the Account model via NextAuth.
 */

import { prisma } from '@/lib/prisma';

// Type definitions
export interface InstagramAccountData {
  instagramUserId: string;
  handle: string;
  displayName?: string;
  accountType?: string;
  profilePictureUrl?: string;
  biography?: string;
  accessToken: string;
  accessTokenExpires?: Date;
  refreshToken?: string;
  scopes?: string[];
}

export interface StoredInstagramAccount extends InstagramAccountData {
  id: string;
  userId: string;
  isConnected: boolean;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTokenRefreshAt?: Date;
  lastTokenRefreshError?: string;
}

/**
 * Save or update an Instagram account connection
 */
export async function saveInstagramAccount(
  userId: string,
  accountData: InstagramAccountData
): Promise<StoredInstagramAccount> {
  try {
    // WHEN DATABASE IS READY, use this:
    // return await prisma.instagramAccount.upsert({
    //   where: {
    //     userId_instagramUserId: {
    //       userId,
    //       instagramUserId: accountData.instagramUserId,
    //     },
    //   },
    //   update: {
    //     accessToken: accountData.accessToken,
    //     accessTokenExpires: accountData.accessTokenExpires,
    //     refreshToken: accountData.refreshToken,
    //     displayName: accountData.displayName,
    //     biography: accountData.biography,
    //     profilePictureUrl: accountData.profilePictureUrl,
    //     lastSyncAt: new Date(),
    //   },
    //   create: {
    //     userId,
    //     instagramUserId: accountData.instagramUserId,
    //     handle: accountData.handle,
    //     displayName: accountData.displayName,
    //     biography: accountData.biography,
    //     accountType: accountData.accountType,
    //     profilePictureUrl: accountData.profilePictureUrl,
    //     accessToken: accountData.accessToken,
    //     accessTokenExpires: accountData.accessTokenExpires,
    //     refreshToken: accountData.refreshToken,
    //     scopes: accountData.scopes || [],
    //     isConnected: true,
    //     isPrimary: false,
    //   },
    // });

    // TEMPORARY: Mock response while DB is not ready
    console.log('[Instagram Storage] Saving account (mock):', accountData.handle);
    return {
      id: `ig-${accountData.instagramUserId}`,
      userId,
      ...accountData,
      isConnected: true,
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('[Instagram Storage] Error saving account:', error);
    throw error;
  }
}

/**
 * Get all Instagram accounts for a user
 */
export async function getUserInstagramAccounts(
  userId: string
): Promise<StoredInstagramAccount[]> {
  try {
    // WHEN DATABASE IS READY:
    // return await prisma.instagramAccount.findMany({
    //   where: { userId },
    //   orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    // });

    // TEMPORARY: Return empty array
    console.log('[Instagram Storage] Fetching accounts for user:', userId);
    return [];
  } catch (error) {
    console.error('[Instagram Storage] Error fetching accounts:', error);
    throw error;
  }
}

/**
 * Get a single Instagram account by ID
 */
export async function getInstagramAccount(
  accountId: string,
  userId: string
): Promise<StoredInstagramAccount | null> {
  try {
    // WHEN DATABASE IS READY:
    // return await prisma.instagramAccount.findFirst({
    //   where: { id: accountId, userId },
    // });

    // TEMPORARY: Return null
    console.log('[Instagram Storage] Fetching account:', accountId);
    return null;
  } catch (error) {
    console.error('[Instagram Storage] Error fetching account:', error);
    throw error;
  }
}

/**
 * Update Instagram account (e.g., after token refresh)
 */
export async function updateInstagramAccount(
  accountId: string,
  userId: string,
  updates: Partial<InstagramAccountData>
): Promise<StoredInstagramAccount> {
  try {
    // WHEN DATABASE IS READY:
    // return await prisma.instagramAccount.update({
    //   where: { id: accountId },
    //   data: {
    //     ...updates,
    //     updatedAt: new Date(),
    //   },
    // });

    // TEMPORARY: Mock response
    console.log('[Instagram Storage] Updating account:', accountId);
    throw new Error('Database not yet configured');
  } catch (error) {
    console.error('[Instagram Storage] Error updating account:', error);
    throw error;
  }
}

/**
 * Disconnect (delete) an Instagram account
 */
export async function disconnectInstagramAccount(
  accountId: string,
  userId: string
): Promise<boolean> {
  try {
    // WHEN DATABASE IS READY:
    // await prisma.instagramAccount.delete({
    //   where: { id: accountId },
    // });
    // return true;

    // TEMPORARY: Mock response
    console.log('[Instagram Storage] Disconnecting account:', accountId);
    return true;
  } catch (error) {
    console.error('[Instagram Storage] Error disconnecting account:', error);
    throw error;
  }
}

/**
 * Get accounts that need token refresh (expiring within 7 days)
 */
export async function getAccountsNeedingRefresh(): Promise<StoredInstagramAccount[]> {
  try {
    const now = new Date();
    const refershWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // WHEN DATABASE IS READY:
    // return await prisma.instagramAccount.findMany({
    //   where: {
    //     AND: [
    //       { autoRefreshEnabled: true },
    //       { isConnected: true },
    //       {
    //         accessTokenExpires: {
    //           lte: refershWindow,
    //           gt: now,
    //         },
    //       },
    //     ],
    //   },
    // });

    // TEMPORARY: Return empty array
    console.log('[Instagram Storage] Checking for accounts needing refresh');
    return [];
  } catch (error) {
    console.error('[Instagram Storage] Error fetching refresh candidates:', error);
    throw error;
  }
}

/**
 * Refresh an Instagram access token
 * Meta tokens last 60 days, we refresh them proactively
 */
export async function refreshInstagramToken(
  accountId: string,
  userId: string,
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  try {
    // Check required env vars
    if (!process.env.INSTAGRAM_CLIENT_ID || !process.env.INSTAGRAM_CLIENT_SECRET) {
      throw new Error('Instagram client credentials not configured');
    }

    console.log('[Instagram Token Refresh] Refreshing token for account:', accountId);

    // Call Instagram API to refresh token
    const response = await fetch('https://graph.instagram.com/refresh_access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'ig_refresh_token',
        access_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('[Instagram Token Refresh] Error:', data.error);
      // Mark account as needing re-authorization
      // await updateInstagramAccount(accountId, userId, {
      //   isConnected: false,
      //   lastTokenRefreshError: data.error.message,
      // });
      return null;
    }

    const newAccessToken = data.access_token;
    const expiresIn = data.expires_in || 5184000; // 60 days in seconds

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Update the account with new token
    // await updateInstagramAccount(accountId, userId, {
    //   accessToken: newAccessToken,
    //   accessTokenExpires: expiresAt,
    //   lastTokenRefreshAt: new Date(),
    //   lastTokenRefreshError: null,
    // });

    console.log('[Instagram Token Refresh] Token refreshed successfully');

    return {
      accessToken: newAccessToken,
      expiresAt,
    };
  } catch (error) {
    console.error('[Instagram Token Refresh] Error:', error);
    throw error;
  }
}

/**
 * Update cached metrics for an account (called after API sync)
 */
export async function updateAccountMetrics(
  accountId: string,
  userId: string,
  metrics: {
    followers: number;
    following: number;
    mediaCount: number;
    engagementRate: number;
  }
): Promise<void> {
  try {
    // WHEN DATABASE IS READY:
    // await prisma.instagramAccount.update({
    //   where: { id: accountId },
    //   data: {
    //     cachedFollowers: metrics.followers,
    //     cachedFollowing: metrics.following,
    //     cachedMediaCount: metrics.mediaCount,
    //     cachedEngagementRate: metrics.engagementRate,
    //     lastMetricsSyncAt: new Date(),
    //   },
    // });

    console.log('[Instagram Storage] Metrics updated for:', accountId);
  } catch (error) {
    console.error('[Instagram Storage] Error updating metrics:', error);
    throw error;
  }
}
