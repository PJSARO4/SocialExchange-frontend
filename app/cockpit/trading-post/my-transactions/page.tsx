'use client';

import Link from 'next/link';
import '../../trading-post.css';

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    type: 'sell',
    title: '@fitness_journey',
    platform: 'Instagram',
    counterparty: 'James Wilson',
    amount: 1950,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'completed',
  },
  {
    id: '2',
    type: 'buy',
    title: '@fashionista_daily',
    platform: 'Instagram',
    counterparty: 'Alex Fashion',
    amount: 2800,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
];

export default function MyTransactionsPage() {
  const stats = {
    totalBought: 2800,
    totalSold: 1950,
    completed: 1,
    pending: 1,
  };

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
            <div className="stat-value">${stats.totalBought.toLocaleString()}</div>
            <div className="stat-label">Total Spent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${stats.totalSold.toLocaleString()}</div>
            <div className="stat-label">Total Earned</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          {MOCK_TRANSACTIONS.map((tx) => (
            <div key={tx.id} className="transaction-card">
              <div className="transaction-info">
                <h3 className="transaction-title">{tx.title}</h3>
                <div className="transaction-details">
                  <span>{tx.platform}</span>
                  <span>{tx.type === 'buy' ? 'from' : 'to'} {tx.counterparty}</span>
                  <span>{tx.date.toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={`transaction-status ${tx.status}`}>
                  {tx.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="transaction-amount">
                    {tx.type === 'buy' ? '-' : '+'}${tx.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>Have an Account to Sell?</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', marginBottom: '1.5rem' }}>List your social media account on the Trading Post and reach thousands of buyers.</p>
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
