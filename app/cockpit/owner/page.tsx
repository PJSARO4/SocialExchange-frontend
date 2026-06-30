// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'pjsaro4@gmail.com';

const STATUS_LABEL: Record<string, string> = {
  PAYMENT_PENDING: 'Pending',
  FUNDS_HELD: 'Funds Held',
  CREDENTIALS_SENT: 'Creds Sent',
  VERIFICATION_PENDING: 'Verifying',
  LOCK_PERIOD: 'Lock Period',
  COMPLETED: 'Complete',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  FUNDS_HELD: '#3b82f6',
  CREDENTIALS_SENT: '#a78bfa',
  VERIFICATION_PENDING: '#a78bfa',
  LOCK_PERIOD: '#f59e0b',
  COMPLETED: '#22c55e',
  DISPUTED: '#ef4444',
  CANCELLED: '#6b7280',
};

function MetricCard({ label, value, sub, color = '#f59e0b' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(${hexToRgb(color)}, 0.2)`,
      borderRadius: '12px',
    }}>
      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.4rem' }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', marginTop: '2rem' }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{title}</h2>
    </div>
  );
}

function ShellCard({ title, description, badge = 'Coming Soon' }: { title: string; description: string; badge?: string }) {
  return (
    <div style={{
      padding: '1.25rem 1.5rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '1rem',
    }}>
      <div>
        <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem', fontSize: '0.9rem' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>{description}</div>
      </div>
      <div style={{ padding: '0.25rem 0.65rem', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
        {badge}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '245, 158, 11';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return; }
    if (status !== 'authenticated') return;
    if (session?.user?.email !== ADMIN_EMAIL) { router.push('/cockpit/home'); return; }

    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [status, session, router]);

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div style={{ width: 24, height: 24, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Loading admin data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#f87171' }}>Error: {error}</div>
    );
  }

  if (!stats) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            🔐 OWNER ACCESS · {ADMIN_EMAIL}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>Admin Dashboard</h1>
        </div>
        <div style={{ padding: '0.5rem 1rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', fontSize: '0.8rem', color: '#86efac' }}>
          ● Systems Operational
        </div>
      </div>

      {/* Revenue metrics */}
      <SectionHeader title="Revenue" icon="💰" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '0.5rem' }}>
        <MetricCard
          label="Fee Revenue Collected"
          value={`$${stats.revenue.totalFeeRevenue.toFixed(2)}`}
          sub="10% of completed trades"
          color="#22c55e"
        />
        <MetricCard
          label="Total Trade Volume"
          value={`$${stats.revenue.totalTradeVolume.toFixed(2)}`}
          sub={`${stats.revenue.completedTransactions} completed transactions`}
          color="#f59e0b"
        />
        <MetricCard
          label="Total USD Deposited"
          value={`$${stats.revenue.totalDeposited.toFixed(2)}`}
          sub="Via Stripe"
          color="#a78bfa"
        />
      </div>

      {/* User metrics */}
      <SectionHeader title="Users" icon="👥" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <MetricCard label="Total Users" value={stats.users.total.toLocaleString()} color="#06b6d4" />
        <MetricCard label="Active This Month" value={stats.users.activeThisMonth.toLocaleString()} sub="Had wallet activity" color="#3b82f6" />
        <MetricCard label="New This Week" value={stats.users.newThisWeek.toLocaleString()} color="#f87171" />
      </div>

      {/* Recent signups */}
      {stats.users.recentSignups.length > 0 && (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Recent Signups (last 7 days)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.users.recentSignups.map((u: any) => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 600 }}>{u.name || 'Unnamed'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', marginLeft: '0.75rem' }}>{u.email}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                  {new Date(u.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Escrows */}
      <SectionHeader title="Live Escrows" icon="🔒" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <MetricCard label="Active Escrows" value={stats.escrows.liveCount.toLocaleString()} color="#3b82f6" />
        <MetricCard label="Value Held in Escrow" value={`$${stats.escrows.liveValue.toFixed(2)}`} sub="Secured, pending release" color="#a78bfa" />
      </div>

      {stats.escrows.live.length > 0 ? (
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Active Transactions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.escrows.live.map((e: any) => {
              const color = STATUS_COLOR[e.status] ?? '#f59e0b';
              return (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{e.id.slice(0, 12)}…</div>
                  <div style={{ padding: '0.2rem 0.65rem', background: `rgba(${hexToRgb(color)}, 0.12)`, border: `1px solid rgba(${hexToRgb(color)}, 0.25)`, borderRadius: '999px', fontSize: '0.72rem', color, fontWeight: 600 }}>
                    {STATUS_LABEL[e.status] ?? e.status}
                  </div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.875rem' }}>${Number(e.amount).toFixed(2)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px' }}>
          No active escrows
        </div>
      )}

      {/* Escrow breakdown by status */}
      {stats.escrows.byStatus.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem', marginBottom: '0.5rem' }}>
          {stats.escrows.byStatus.map((s: any) => (
            <div key={s.status} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '0.78rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{STATUS_LABEL[s.status] ?? s.status}: </span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Shell sections — future tools */}
      <SectionHeader title="Admin Tools" icon="⚙️" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <ShellCard title="User Management" description="Search, ban, or promote users to moderator" />
        <ShellCard title="Dispute Resolution" description="Review and resolve open escrow disputes" />
        <ShellCard title="Listing Moderation" description="Review flagged listings, remove or approve" />
        <ShellCard title="Payout Controls" description="Trigger or pause seller withdrawals" />
        <ShellCard title="Platform Fee Settings" description="Adjust the 10% platform fee percentage" />
        <ShellCard title="Email Broadcasts" description="Send announcements to all users" />
        <ShellCard title="System Logs" description="View real-time API errors and system events" />
        <ShellCard title="Feature Flags" description="Toggle features on/off without deploying" />
      </div>
    </div>
  );
}
