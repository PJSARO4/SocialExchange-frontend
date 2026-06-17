// @ts-nocheck
/**
 * Listing Service for Trading Post
 * Manages social media account listings
 */

import { prisma } from '@/lib/prisma';
import { Prisma, ListingStatus, SaleStatus, Platform } from '@prisma/client';

export interface CreateListingRequest {
  title: string;
  description?: string;
  platform: Platform;
  handle?: string;
  profileUrl?: string;
  followers: number;
  following?: number;
  postsCount?: number;
  engagementRate?: number;
  avgLikesPerPost?: number;
  avgCommentsPerPost?: number;
  niche?: string;
  contentCategory?: string;
  price: number;
  proofUrls: string[];
}

export interface ListingFilter {
  status?: ListingStatus;
  saleStatus?: SaleStatus;
  platform?: Platform;
  niche?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price' | 'followers' | 'views';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export async function createListing(sellerId: string, data: CreateListingRequest) {
  const listing = await prisma.listing.create({
    data: {
      sellerId,
      title: data.title,
      description: data.description,
      platform: data.platform,
      handle: data.handle,
      profileUrl: data.profileUrl,
      followers: data.followers,
      following: data.following || 0,
      postsCount: data.postsCount || 0,
      engagementRate: data.engagementRate ? new Prisma.Decimal(data.engagementRate) : null,
      avgLikesPerPost: data.avgLikesPerPost,
      avgCommentsPerPost: data.avgCommentsPerPost,
      niche: data.niche,
      contentCategory: data.contentCategory,
      price: data.price,
      proofUrls: data.proofUrls,
      status: 'ACTIVE',
      saleStatus: 'AVAILABLE',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    include: {
      seller: { select: { id: true, name: true, email: true } },
    },
  });
  return listing;
}

export async function getListing(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, email: true, image: true } },
      escrow: { select: { id: true, status: true, createdAt: true } },
    },
  });
}

export async function listListings(filters: ListingFilter = {}) {
  const { status = 'ACTIVE', saleStatus = 'AVAILABLE', platform, niche, minFollowers, maxFollowers, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', limit = 20, offset = 0 } = filters;

  const where: Prisma.ListingWhereInput = {
    status, saleStatus,
    platform: platform ? { equals: platform } : undefined,
    niche: niche ? { equals: niche } : undefined,
    followers: (minFollowers != null || maxFollowers != null)
      ? { gte: minFollowers, lte: maxFollowers }
      : undefined,
    price: (minPrice != null || maxPrice != null)
      ? { gte: minPrice != null ? new Prisma.Decimal(minPrice) : undefined, lte: maxPrice != null ? new Prisma.Decimal(maxPrice) : undefined }
      : undefined,
  };

  // Remove top-level undefined keys
  (Object.keys(where) as (keyof typeof where)[]).forEach(
    (key) => where[key] === undefined && delete where[key]
  );

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { seller: { select: { id: true, name: true, image: true } } },
      orderBy: { [sortBy]: sortOrder },
      take: limit, skip: offset,
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total, limit, offset, hasMore: offset + limit < total };
}

export async function getSellerListings(sellerId: string, limit = 50) {
  return prisma.listing.findMany({
    where: { sellerId },
    include: { escrow: { select: { id: true, status: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function updateListing(id: string, sellerId: string, data: Partial<CreateListingRequest>) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.sellerId !== sellerId) throw new Error('Unauthorized');
  if (listing.saleStatus !== 'AVAILABLE') throw new Error('Cannot update listing that is not available');

  return prisma.listing.update({
    where: { id },
    data: {
      title: data.title, description: data.description, followers: data.followers, following: data.following,
      postsCount: data.postsCount,
      engagementRate: data.engagementRate ? new Prisma.Decimal(data.engagementRate) : undefined,
      avgLikesPerPost: data.avgLikesPerPost, avgCommentsPerPost: data.avgCommentsPerPost, niche: data.niche,
      contentCategory: data.contentCategory, price: data.price, proofUrls: data.proofUrls,
    },
  });
}

export async function deleteListing(id: string, sellerId: string) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing || listing.sellerId !== sellerId) throw new Error('Unauthorized');
  if (listing.saleStatus !== 'AVAILABLE') throw new Error('Cannot delete');

  return prisma.listing.update({
    where: { id },
    data: { status: 'DELISTED', saleStatus: 'CANCELLED' },
  });
}

export async function recordListingView(id: string) {
  return prisma.listing.update({
    where: { id },
    data: { views: { increment: 1 } },
  });
}

export async function recordListingSave(id: string) {
  return prisma.listing.update({
    where: { id },
    data: { saves: { increment: 1 } },
  });
}

export async function getTrendingListings(limit = 10) {
  return prisma.listing.findMany({
    where: { status: 'ACTIVE', saleStatus: 'AVAILABLE' },
    include: { seller: { select: { id: true, name: true, image: true } } },
    orderBy: { views: 'desc' },
    take: limit,
  });
}

export async function getExpiringListings() {
  const expiringIn7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  return prisma.listing.findMany({
    where: { status: 'ACTIVE', saleStatus: 'AVAILABLE', expiresAt: { gte: now, lte: expiringIn7Days } },
    orderBy: { expiresAt: 'asc' },
  });
}

export async function autoExpireListings() {
  const now = new Date();
  return prisma.listing.updateMany({
    where: { status: 'ACTIVE', saleStatus: 'AVAILABLE', expiresAt: { lt: now } },
    data: { status: 'EXPIRED', saleStatus: 'CANCELLED' },
  });
}

export async function getListingStats(sellerId?: string) {
  const where = sellerId ? { sellerId } : {};
  const [totalListings, activeListings, soldListings, averagePrice] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.count({ where: { ...where, status: 'ACTIVE', saleStatus: 'AVAILABLE' } }),
    prisma.listing.count({ where: { ...where, saleStatus: 'SOLD' } }),
    prisma.listing.aggregate({ where, _avg: { price: true } }),
  ]);

  return { totalListings, activeListings, soldListings, averagePrice: averagePrice._avg.price };
}
