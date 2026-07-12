'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../trading-post.css';

const STATUS_ACTIVE = new Set([
  'PAYMENT_PENDING', 'FUNDS_HELD', 'TRANSFER_PREP',
  'CREDENTIALS_SENT', 'VERIFICATION_PENDING', 'LOCK_PERIOD', 'RELEASING',
]);

const STATUS_LABEL: Record<string, string> = {
  PAYMENT_PENDING: 'Payment Pending',
  FUNDS_HELD: 'Funds Held',
  TRANSFER_PREP: 'Transfer Prep',
  CREDENTIALS_SENT: 'Credentials Sent',
  VERIFICATION_PENDING: 'Verifying',
  LOCK_PERIOD: 'Lock Period',
  RELEASING: 'Releasing',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

interface EscrowTx {
  id: string;
  status: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  createdAt: string;
  listing: {
    title: string;
    handle: string;
    platform: string;
    price: number;
  } | null;
}

export default function MyTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<EscrowTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/escrow/mine');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return; }
    if (status !== 'authenticated') return;
    load();
  }, [status, router, load]);

  const userId = (session?.user as any)?.id ?? '';

  const totalSpent = transactions
    .filter(t => t.buyerId === userId && t.status === 'COMPLETED')
    .reduce((s, t) => s + Number(t.amount ?? 0), 0);

  const totalEarned = transactions
    .filter(t => t.sellerId === userId && t.status === 'COMPLETED')
    .reduce((s, t) => s + Number(t.amount ?? 0), 0);

  const completed = transactions.filter(t => t.status === 'COMPLETED').length;
  const inProgress = transactions.filter(t => STATUS_ACTIVE.has(t.status)).length;

  if (status === 'loading' || loading) {
    return (
      <div className="trading-post">
        <div className="trading-post-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Loading transactions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trading-post">
        <div className="trading-post-container">
          <Link href="/cockpit/trading-post" style={{ color: '#f59e0b', textDecoration: 'none', marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
            ← Back to Marketplace
          </Link>
          <div style={{ padding: '2rem', background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', color: '#f87171' }}>
            Error loading transactions: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-post">
      <div className="trading-post-container">
        <Link href="/cockpit/trading-post" style={{ color: '#f59e0b', textDecoration: 'none', marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
          ← Back to Marketplace
        </Link>

        <div style={{ marginBottom: '2.5rem' }}>
          <h1 className="trading-post-title">📊 My Transactions</h1>
          <p className="trading-post-subtitle">Track your buying and selling activity</p>
        </div>

        <div className="trading-post-stats" style={{ marginBottom: '3rem' }}>
          <div className="stat-card">
            <div className="stat-value">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-label">Total Spent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-label">Total Earned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          {transactions.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', color: 'rgba(255,255,255,0.35)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No transactions yet</div>
              <div style={{ fontSize: '0.85rem' }}>Browse the marketplace and make your first trade.</div>
            </div>
          ) : transactions.map((tx) => {
            const isBuyer = tx.buyerId === userId;
            const isActive = STATUS_ACTIVE.has(tx.status);
            const title = tx.listing?.title || tx.listing?.handle || 'Unlisted Asset';
            const platform = tx.listing?.platform || '';
            const amount = Number(tx.amount ?? 0);

            return (
              <Link
                key={tx.id}
                href={`/cockpit/trading-post/escrow/${tx.id}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="transaction-card" style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                  <div className="transaction-info">
                    <h3 className="transaction-title">{title}</h3>
                    <div className="transaction-details">
                      {platform && <span>{platform}</span>}
                      <span>{isBuyer ? 'Buyer' : 'Seller'}</span>
                      <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className={`transaction-status ${tx.status === 'COMPLETED' ? 'completed' : isActive ? 'pending' : 'cancelled'}`}>
                      {tx.status === 'COMPLETED' ? '✓ ' : isActive ? '⏳ ' : '✕ '}
                      {STATUS_LABEL[tx.status] ?? tx.status}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="transaction-amount">
                        {isBuyer ? '-' : '+'}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>Have an Account to Sell?</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', marginBottom: '1.5rem' }}>List your social media account on the Exchange Floor and reach thousands of buyers.</p>
          <Link
            href="/cockpit/trading-post/sell"
            style={{
              display: 'inline-block',
              padding: '0.875rem 1.75rem',
              background: '#f59e0b',
              color: '#000',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Create New Listing
          </Link>
        </div>
      </div>
    </div>
  );
}
