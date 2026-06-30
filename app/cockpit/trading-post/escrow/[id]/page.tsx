// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import '../../trading-post.css';

// ── Status helpers ────────────────────────────────────────────────────
const STATUS_STAGE: Record<string, number> = {
  PAYMENT_PENDING:     1,
  FUNDS_HELD:          2,
  TRANSFER_PREP:       2, // sub-step of Funds Held in timeline
  CREDENTIALS_SENT:    3,
  VERIFICATION_PENDING:4,
  LOCK_PERIOD:         5,
  RELEASING:           6,
  COMPLETED:           7,
  DISPUTED:            2,
  CANCELLED:           0,
  REFUNDED:            0,
};

const STATUS_LABEL: Record<string, string> = {
  PAYMENT_PENDING:     'Payment Pending',
  FUNDS_HELD:          'Funds Held in Escrow',
  TRANSFER_PREP:       'Transfer Preparation',
  CREDENTIALS_SENT:    'Credentials Sent',
  VERIFICATION_PENDING:'Buyer Verifying',
  LOCK_PERIOD:         '48-Hour Lock Period',
  RELEASING:           'Releasing Funds',
  COMPLETED:           'Completed',
  DISPUTED:            'Disputed',
  CANCELLED:           'Cancelled',
  REFUNDED:            'Refunded',
};

const STATUS_COLOR: Record<string, string> = {
  PAYMENT_PENDING:     '#f59e0b',
  FUNDS_HELD:          '#3b82f6',
  TRANSFER_PREP:       '#06b6d4',
  CREDENTIALS_SENT:    '#a78bfa',
  VERIFICATION_PENDING:'#a78bfa',
  LOCK_PERIOD:         '#f59e0b',
  RELEASING:           '#06b6d4',
  COMPLETED:           '#22c55e',
  DISPUTED:            '#ef4444',
  CANCELLED:           '#6b7280',
  REFUNDED:            '#6b7280',
};

const TIMELINE_STAGES = [
  { number: 1, label: 'Payment',      description: 'Buyer payment received' },
  { number: 2, label: 'Funds Held',   description: 'Funds secured in escrow' },
  { number: 3, label: 'Credentials',  description: 'Seller sends access' },
  { number: 4, label: 'Verification', description: 'Buyer verifies access' },
  { number: 5, label: 'Lock Period',  description: '48-hour security lock' },
  { number: 6, label: 'Release',      description: 'Funds released to seller' },
  { number: 7, label: 'Complete',     description: 'Transaction finished' },
];

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '245, 158, 11';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

// ── Transfer Preparation Checklist (Seller) ──────────────────────────

const CHECKLIST_ITEMS = [
  {
    id: 'remove_2fa',
    label: 'Remove 2-Factor Authentication',
    detail: 'Go to account security settings and disable any authenticator app or SMS-based 2FA.',
  },
  {
    id: 'change_email',
    label: 'Change recovery email to the escrow address',
    detail: '', // filled in dynamically with escrow email
    highlight: true,
  },
  {
    id: 'remove_phone',
    label: 'Remove linked phone number',
    detail: 'Remove any phone number used for account recovery or SMS login.',
  },
  {
    id: 'unlink_social',
    label: 'Unlink Facebook / Google login',
    detail: 'In account settings, disconnect any third-party logins that could be used to access the account.',
  },
  {
    id: 'new_password',
    label: 'Set a new password you\'ve never used before',
    detail: 'You\'ll submit the new password in the next step. Do not reuse an old password.',
  },
];

function TransferPrepChecklist({
  escrowId,
  escrowEmail,
  onSuccess,
}: {
  escrowId: string;
  escrowEmail: string;
  onSuccess: () => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allChecked = CHECKLIST_ITEMS.every(item => checked[item.id]);

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSubmit = async () => {
    if (!allChecked) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace/transfer-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '1.75rem',
      background: 'rgba(6, 182, 212, 0.06)',
      border: '1px solid rgba(6, 182, 212, 0.25)',
      borderRadius: '12px',
      marginTop: '1.5rem',
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
        🔐 Security Transfer Checklist
      </h3>
      <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        Before sending credentials, complete each step below. This prevents the seller from reclaiming the account
        after sale by removing all recovery back-doors.
      </p>

      {/* Escrow email callout */}
      <div style={{
        padding: '0.85rem 1.1rem',
        background: 'rgba(6,182,212,0.1)',
        border: '1px solid rgba(6,182,212,0.3)',
        borderRadius: '8px',
        marginBottom: '1.25rem',
      }}>
        <div style={{ fontSize: '0.72rem', color: 'rgba(6,182,212,0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
          Platform Escrow Email — use exactly as shown
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#67e8f9', fontWeight: 700, wordBreak: 'break-all' }}>
          {escrowEmail}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.35rem' }}>
          We control this inbox. During the lock period, we can verify ownership and prevent unauthorized recovery.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
        {CHECKLIST_ITEMS.map((item) => {
          const detail = item.id === 'change_email'
            ? `In account settings → Email/Login, replace your current recovery email with: ${escrowEmail}`
            : item.detail;

          return (
            <label
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                padding: '0.85rem 1rem',
                background: checked[item.id] ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${checked[item.id] ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  minWidth: 20,
                  borderRadius: '4px',
                  border: `2px solid ${checked[item.id] ? '#22c55e' : 'rgba(255,255,255,0.25)'}`,
                  background: checked[item.id] ? '#22c55e' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '1px',
                  transition: 'all 200ms ease',
                }}
                onClick={() => toggle(item.id)}
              >
                {checked[item.id] && (
                  <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                    <path d="M1 3.5L4 6.5L10 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div onClick={() => toggle(item.id)} style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: checked[item.id] ? '#86efac' : '#e2e8f0',
                  textDecoration: checked[item.id] ? 'line-through' : 'none',
                  marginBottom: detail ? '0.25rem' : 0,
                  opacity: checked[item.id] ? 0.7 : 1,
                }}>
                  {item.label}
                </div>
                {detail && (
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.45 }}>
                    {detail}
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
        {Object.values(checked).filter(Boolean).length} of {CHECKLIST_ITEMS.length} steps completed
      </div>

      {error && <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem' }}>⚠ {error}</div>}

      <button
        onClick={handleSubmit}
        disabled={!allChecked || loading}
        style={{
          width: '100%',
          padding: '0.85rem 1.5rem',
          background: !allChecked
            ? 'rgba(255,255,255,0.05)'
            : loading
            ? 'rgba(6,182,212,0.4)'
            : 'linear-gradient(135deg, #06b6d4, #0891b2)',
          color: !allChecked ? 'rgba(255,255,255,0.3)' : '#fff',
          border: `1px solid ${!allChecked ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: !allChecked || loading ? 'not-allowed' : 'pointer',
          transition: 'all 200ms ease',
        }}
      >
        {loading ? 'Submitting...' : allChecked ? '✓ Preparation Complete — Send Credentials' : `Complete all ${CHECKLIST_ITEMS.length} steps to continue`}
      </button>
    </div>
  );
}

// ── Seller credential submission form ─────────────────────────────────

function SellerCredentialForm({ escrowId, onSuccess }: { escrowId: string; onSuccess: () => void }) {
  const [credentials, setCredentials] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentials.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowId, credentialsDescription: credentials }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send credentials');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '1.75rem',
      background: 'rgba(59, 130, 246, 0.07)',
      border: '1px solid rgba(59, 130, 246, 0.25)',
      borderRadius: '12px',
      marginTop: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: '0.72rem', color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Security prep confirmed</span>
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
        📤 Send Account Credentials
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginBottom: '1.25rem' }}>
        Funds are secured and the recovery chain is in our control. Submit the new login credentials below —
        they are AES-256 encrypted and only visible to the buyer.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <textarea
          value={credentials}
          onChange={e => setCredentials(e.target.value)}
          placeholder={'Username: @handle\nPassword: ••••••••\nLogin email: account@example.com\n\nAdditional notes...'}
          rows={7}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            color: '#e2e8f0',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            resize: 'vertical',
            outline: 'none',
          }}
          required
        />
        {error && <div style={{ color: '#f87171', fontSize: '0.8rem' }}>⚠ {error}</div>}
        <button
          type="submit"
          disabled={loading || !credentials.trim()}
          style={{
            padding: '0.75rem 1.5rem',
            background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Encrypting & Sending...' : '🔐 Send Encrypted Credentials'}
        </button>
      </form>
    </div>
  );
}

// ── Buyer confirmation panel ──────────────────────────────────────────

function BuyerConfirmButton({
  escrowId,
  credentialsDescription,
  onSuccess,
}: {
  escrowId: string;
  credentialsDescription: string | null;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to confirm');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '1.75rem',
      background: 'rgba(167, 139, 250, 0.07)',
      border: '1px solid rgba(167, 139, 250, 0.25)',
      borderRadius: '12px',
      marginTop: '1.5rem',
    }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
        📥 Credentials Received
      </h3>
      {credentialsDescription && (
        <pre style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '1rem',
          fontSize: '0.82rem',
          color: '#a5f3fc',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          marginBottom: '1.25rem',
          maxHeight: '220px',
          overflowY: 'auto',
        }}>
          {credentialsDescription}
        </pre>
      )}
      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', marginBottom: '1rem' }}>
        Log in and verify you have full access. Once confirmed, a 48-hour security window starts before funds release to the seller.
        You can open a dispute any time during that window if something is wrong.
      </p>
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          ✓ I Have Verified Access
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#fbbf24',
          }}>
            ⚠ By confirming, you acknowledge successful access. This starts the 48-hour release timer.
          </div>
          {error && <div style={{ color: '#f87171', fontSize: '0.8rem' }}>⚠ {error}</div>}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: loading ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Confirming...' : '✓ Confirm & Start Timer'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function EscrowTrackerPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [escrow, setEscrow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const currentUserId = (session as any)?.user?.id;

  const fetchEscrow = useCallback(async () => {
    try {
      const res = await fetch(`/api/marketplace/escrow/${params.id}`);
      if (!res.ok) throw new Error('Escrow not found');
      const data = await res.json();
      setEscrow(data);
      setFetchError('');
    } catch (err: any) {
      setFetchError(err.message || 'Failed to load escrow');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchEscrow(); }, [fetchEscrow]);

  if (loading) {
    return (
      <div className="trading-post">
        <div className="trading-post-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '3rem', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Loading escrow...</span>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError || !escrow) {
    return (
      <div className="trading-post">
        <div className="trading-post-container">
          <Link href="/cockpit/trading-post/my-transactions" style={{ color: '#f59e0b', textDecoration: 'none', marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
            ← Back to Transactions
          </Link>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Escrow Not Found</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>{fetchError}</p>
          </div>
        </div>
      </div>
    );
  }

  const status = escrow.status as string;
  const currentStage = STATUS_STAGE[status] ?? 1;
  const statusColor = STATUS_COLOR[status] ?? '#f59e0b';
  const statusLabel = STATUS_LABEL[status] ?? status;

  const isSeller = currentUserId && escrow.sellerId === currentUserId;
  const isBuyer  = currentUserId && escrow.buyerId  === currentUserId;

  const listingTitle    = escrow.listings?.[0]?.title ?? escrow.listingTitle ?? escrow.listingId ?? 'Account Transfer';
  const listingPlatform = escrow.listings?.[0]?.platform ?? escrow.listingPlatform ?? '—';

  const amount = Number(escrow.listingPrice ?? escrow.amount ?? 0);
  const fee    = Number(escrow.platformFee ?? amount * 0.1);
  const payout = Number(escrow.sellerPayout ?? amount - fee);

  const createdDate = escrow.createdAt
    ? new Date(escrow.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  // Derive escrow email (same formula as server)
  const escrowEmail = escrow.escrowEmail ?? `escrow-${escrow.id?.slice(0, 12)}@socialexchange.com`;

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

        {/* Status Banner */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: `rgba(${hexToRgb(statusColor)}, 0.08)`,
          border: `1px solid rgba(${hexToRgb(statusColor)}, 0.25)`,
          borderRadius: '12px',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Status</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: statusColor }}>{statusLabel}</div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>Started {createdDate}</div>
          </div>
          <div style={{
            padding: '0.6rem 1.25rem',
            background: statusColor,
            color: status === 'FUNDS_HELD' ? '#000' : '#fff',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}>
            {status === 'COMPLETED' ? '✓ Completed' : `Stage ${currentStage}/7`}
          </div>
        </div>

        <div className="escrow-tracker">
          {/* Timeline */}
          <div className="timeline-container">
            <div className="timeline">
              {TIMELINE_STAGES.map((stage) => (
                <div
                  key={stage.number}
                  className={`timeline-step ${
                    stage.number < currentStage ? 'completed' : stage.number === currentStage ? 'active' : ''
                  }`}
                >
                  <div className="timeline-dot">{stage.number < currentStage ? '✓' : stage.number}</div>
                  <div className="timeline-label">{stage.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="escrow-details">
            <h2 className="detail-section-title">Transaction Details</h2>
            <div className="escrow-detail-row">
              <div className="escrow-detail-label">Listing</div>
              <div className="escrow-detail-value">{listingTitle}</div>
            </div>
            <div className="escrow-detail-row">
              <div className="escrow-detail-label">Platform</div>
              <div className="escrow-detail-value">{listingPlatform}</div>
            </div>
            <div className="escrow-detail-row">
              <div className="escrow-detail-label">Sale Price</div>
              <div className="escrow-detail-value" style={{ color: '#f59e0b' }}>{`$${amount.toFixed(2)}`}</div>
            </div>
            <div className="escrow-detail-row">
              <div className="escrow-detail-label">Platform Fee (10%)</div>
              <div className="escrow-detail-value">{`$${fee.toFixed(2)}`}</div>
            </div>
            <div className="escrow-detail-row" style={{ borderTop: '2px solid rgba(245,158,11,0.2)', paddingTop: '1rem', marginTop: '1rem' }}>
              <div className="escrow-detail-label" style={{ fontWeight: 700 }}>Seller Payout</div>
              <div className="escrow-detail-value" style={{ fontSize: '1.2rem', color: '#22c55e', fontWeight: 700 }}>{`$${payout.toFixed(2)}`}</div>
            </div>
            {isSeller && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                You are the <strong style={{ color: '#3b82f6' }}>SELLER</strong> in this transaction
              </div>
            )}
            {isBuyer && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                You are the <strong style={{ color: '#a78bfa' }}>BUYER</strong> in this transaction
              </div>
            )}
          </div>

          {/* ── Action Panels ── */}

          {/* Seller: step 1 — security checklist */}
          {isSeller && status === 'FUNDS_HELD' && (
            <TransferPrepChecklist
              escrowId={escrow.id}
              escrowEmail={escrowEmail}
              onSuccess={fetchEscrow}
            />
          )}

          {/* Seller: step 2 — credential submission (after checklist done) */}
          {isSeller && status === 'TRANSFER_PREP' && (
            <SellerCredentialForm escrowId={escrow.id} onSuccess={fetchEscrow} />
          )}

          {isSeller && status === 'CREDENTIALS_SENT' && (
            <div style={{ padding: '1.5rem', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '12px', marginTop: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⏳</div>
              <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Waiting for Buyer Verification</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Your credentials have been delivered. The buyer will confirm access and start the 48-hour release timer.</p>
            </div>
          )}

          {/* Buyer: waiting for seller to complete security prep */}
          {isBuyer && status === 'FUNDS_HELD' && (
            <div style={{ padding: '1.5rem', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', marginTop: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>🔐</div>
              <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Waiting for Seller</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Your funds are secured. The seller is completing our security transfer checklist before sending credentials.</p>
            </div>
          )}

          {/* Buyer: seller completing checklist */}
          {isBuyer && status === 'TRANSFER_PREP' && (
            <div style={{ padding: '1.5rem', background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', marginTop: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>🛡</div>
              <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Security Handoff in Progress</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                The seller has confirmed security preparation — they've removed 2FA and changed the recovery email
                to our escrow address. Credentials will arrive shortly.
              </p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(6,182,212,0.7)', fontFamily: 'monospace' }}>
                Recovery chain: {escrowEmail}
              </div>
            </div>
          )}

          {isBuyer && status === 'CREDENTIALS_SENT' && (
            <BuyerConfirmButton
              escrowId={escrow.id}
              credentialsDescription={escrow.credentialsDescription ?? null}
              onSuccess={fetchEscrow}
            />
          )}

          {(status === 'VERIFICATION_PENDING' || status === 'LOCK_PERIOD') && (
            <div style={{ padding: '1.5rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', marginTop: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⏱</div>
              <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>48-Hour Security Lock</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>Access has been verified. Funds will be automatically released to the seller after the 48-hour security window.</p>
              {escrow.verifiedAt && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#f59e0b' }}>
                  Verified at: {new Date(escrow.verifiedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {status === 'COMPLETED' && (
            <div style={{ padding: '2rem', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', marginTop: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✓</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Transaction Completed</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>The account transfer has been successfully completed and funds have been released to the seller.</p>
            </div>
          )}

          {status === 'DISPUTED' && (
            <div style={{ padding: '1.5rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', marginTop: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>⚠️</div>
              <h3 style={{ color: '#f87171', fontWeight: 700, marginBottom: '0.5rem' }}>Transaction Disputed</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>A dispute has been opened. Our team will review and reach out within 24 hours.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
