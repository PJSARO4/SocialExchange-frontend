import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'pjsaro4@gmail.com';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [
      totalUsers,
      recentActiveUsers,
      completedEscrows,
      liveEscrows,
      allEscrows,
      totalWalletDeposits,
      recentSignups,
    ] = await Promise.all([
      // Total registered users
      prisma.user.count(),

      // Users active in last 30 days (have wallet transactions)
      prisma.user.count({
        where: {
          wallet: {
            transactions: {
              some: {
                createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
              },
            },
          },
        },
      }),

      // Completed escrows — for fee revenue
      prisma.escrowTransaction.findMany({
        where: { status: 'COMPLETED' },
        select: { amount: true, platformFee: true },
      }),

      // Live/active escrows
      prisma.escrowTransaction.findMany({
        where: {
          status: { in: ['FUNDS_HELD', 'CREDENTIALS_SENT', 'VERIFICATION_PENDING', 'LOCK_PERIOD'] },
        },
        select: {
          id: true,
          status: true,
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // All escrows count by status
      prisma.escrowTransaction.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }),

      // Total USD deposited via Stripe
      prisma.walletTransaction.aggregate({
        where: { type: 'DEPOSIT', paymentStatus: 'completed' },
        _sum: { usdAmount: true },
      }),

      // Signups in last 7 days
      prisma.user.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalFeeRevenue = completedEscrows.reduce((sum, e) => sum + Number(e.platformFee ?? 0), 0);
    const totalTradeVolume = completedEscrows.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);
    const liveEscrowValue = liveEscrows.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

    return NextResponse.json({
      users: {
        total: totalUsers,
        activeThisMonth: recentActiveUsers,
        newThisWeek: recentSignups.length,
        recentSignups: recentSignups.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          joinedAt: u.createdAt,
        })),
      },
      revenue: {
        totalFeeRevenue,
        totalTradeVolume,
        totalDeposited: Number(totalWalletDeposits._sum.usdAmount ?? 0),
        completedTransactions: completedEscrows.length,
      },
      escrows: {
        live: liveEscrows,
        liveCount: liveEscrows.length,
        liveValue: liveEscrowValue,
        byStatus: allEscrows.map(g => ({
          status: g.status,
          count: g._count.id,
          volume: Number(g._sum.amount ?? 0),
        })),
      },
    });
  } catch (error) {
    console.error('[Admin Stats]', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
