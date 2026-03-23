'use client';

import { useState } from 'react';
import Link from 'next/link';
import '../../trading-post.css';

const MOCK_ESCROWS: Record<string, any> = {
  'escrow-001': {
    id: 'escrow-001',
    title: '@fashionista_daily',
    platform: 'Instagram',
    price: 2800,
    fee: 280,
    payout: 2520,
    buyerName: 'Sarah Chen',
    sellerName: 'Alex Fashion',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'FUNDS_HELD',
    currentStage: 2,
  },
  'escrow-002': {
    id: 'escrow-002',
    title: '@fitness_journey',
    platform: 'Instagram',
    price: 1950,
    fee: 195,
    payout: 1755,
    buyerName: 'James Wilson',
    sellerName: 'Wellness Pro',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'COMPLETED',
    currentStage: 7,
  },
};

const TIMELINE_STAGES = [
  { number: 1, label: 'Payment', description: 'Buyer payment received' },
  { number: 2, label: 'Funds Held', description: 'Funds secured in escrow' },
  { number: 3, label: 'Credentials Sent', description: 'Seller sends access' },
  { number: 4, label: 'Verification', description: 'Buyer verifies access' },
  { number: 5, label: 'Lock Period', description: '48-hour security lock' },
  { number: 6, label: 'Release', description: 'Funds released to seller' },
  { number: 7, label: 'Complete', description: 'Transaction finished' },
];

export default function EscrowTrackerPage({ params }: { params: { id: string } }) {
  const escrow = MOCK_ESCROWS[params.id];
  const [actionTaken, setActionTaken] = useState(false);

  if (!escrow) {
    return (
      <div className="trading-post">
        <div className="trading-post-container">
          <Link href="/cockpit/trading-post/my-transactions" style={{ color: '#f59e0b', textDecoration: 'none', marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
            ← Back to Transactions
          </Link>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Escrow Not Found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-post">
      <div className="trading-post-container">
        <Link href="/cockpit/trading-post/my-transactions" style={{ color: '#f59e0b', textDecoration: 'none', marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
          ← Back to Transactions
        </Link>

        <div style={{ marginBottom: '2.5rem' }}>
          <h1 className="trading-post-title">🔒 Escrow Tracker</h1>
          <p className="trading-post-subtitle">Monitor your secure account transfer</p>
        </div>

        <div style={{ padding: '1.5rem', background: `rgba(${escrow.status === 'COMPLETED' ? '34, 197, 94' : '245, 158, 11'}, 0.08)`, border: `1px solid rgba(${escrow.status === 'COMPLETED' ? '34, 197, 94' : '245, 158, 11'}, 0.2)`, borderRadius: '12px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.65)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Current Status</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: escrow.status === 'COMPLETED' ? '#22c55e' : '#f59e0b' }}>
              {escrow.status === 'COMPLETED' ? 'Completed' : 'Funds Held'}
            </div>
          </div>
          <div style={{ padding: '0.75rem 1.5rem', background: escrow.status === 'COMPLETED' ? '#22c55e' : '#f59e0b', color: escrow.status === 'COMPLETED' ? '#fff' : '#000', borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem' }}>
            {escrow.status === 'COMPLETED' ? '✓ Completed' : `Stage ${escrow.currentStage}/7`}
          </div>
        </div>

        <div className="escrow-tracker">
          <div className="timeline-container">
            <div className="timeline">
              {TIMELINE_STAGES.map((stage) => (
                <div
                  key={stage.number}
                  className={`timeline-step ${
                    stage.number < escrow.currentStage ? 'completed' : stage.number === escrow.currentStage ? 'active' : ''
                  }`}
                >
                  <div className="timeline-dot">{stage.number}</div>
                  <div className="timeline-label">{stage.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="escrow-details">
            <h2 className="detail-section-title">Transaction Details</h2>
            <div className="escrow-detail-row">
              <div className="escrow-detail-label">Listing</div>
              <div className="escrow-detail-value">{escrow.title}</div>
            </div>
            <div className="escrow-detail-row">
              <div className="escrow-detail-label">Platform</div>
              <div className="escrow-detail-value">{escrow.platform}</div>
            </div>
            <div className="escrow-detail-row">
              <div className="escrow-detail-label">Sale Price</div>
              <div className="escrow-detail-value" style={{ color: '#f59e0b' }}>${escrow.price.toLocaleString()}</div>
            </div>
            <div className="escrow-detail-row">
              <div className="escrow-detail-label">Platform Fee</div>
              <div className="escrow-detail-value">${escrow.fee}</div>
            </div>
            <div className="escrow-detail-row" style={{ borderTop: '2px solid rgba(245, 158, 11, 0.2)', paddingTop: '1rem', marginTop: '1rem' }}>
              <div className="escrow-detail-label" style={{ fontWeight: '700' }}>Seller Payout</div>
              <div className="escrow-detail-value" style={{ fontSize: '1.25rem', color: '#22c55e', fontWeight: '700' }}>${escrow.payout.toLocaleString()}</div>
            </div>
          </div>

          {escrow.status === 'COMPLETED' && (
            <div style={{ padding: '2rem', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>Transaction Completed</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.65)' }}>The account transfer has been successfully completed and funds have been released to the seller.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
