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

// What each user is working on -> dot color (matches PresencePing labels)
const ACTIVITY_COLOR: Record<string, string> = {
  'Automation': '#06b6d4',
  'Content Lab': '#a78bfa',
  'Exchange Floor': '#f59e0b',
  'Comms': '#22c55e',
  'Wallet': '#eab308',
  'Admin': '#ef4444',
  'Command Center': '#3b82f6',
  'Online': '#94a3b8',
};

function activityColor(activity?: string | null): string {
  if (!activity) return '#64748b';
  return ACTIVITY_COLOR[activity] || '#94a3b8';
}

function timeAgo(iso?: string | null): string {
  if (!iso) return 'never';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Equirectangular projection into a viewBox of WxH.
function project(lat: number, lng: number, w: number, h: number): [number, number] {
  const x = ((lng + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return [x, y];
}

// Stylized continent outlines as [lng, lat] vertex rings — crude but recognizable,
// projected equirectangularly so dots land in the right place over real land.
const WORLD_SHAPES: [number, number][][] = [
  // North America
  [[-168,65],[-150,71],[-95,72],[-72,68],[-58,60],[-55,50],[-66,44],[-80,26],[-97,18],[-105,23],[-117,32],[-125,40],[-132,54],[-168,65]],
  // Greenland
  [[-45,60],[-30,60],[-20,70],[-25,80],[-45,82],[-55,76],[-50,66],[-45,60]],
  // South America
  [[-80,9],[-62,11],[-50,0],[-35,-6],[-40,-23],[-55,-35],[-67,-45],[-74,-52],[-73,-40],[-78,-20],[-81,-4],[-80,9]],
  // Europe
  [[-10,36],[-9,44],[-2,49],[3,52],[10,58],[26,60],[42,66],[40,55],[30,46],[28,41],[16,38],[3,42],[-10,36]],
  // Africa
  [[-17,21],[-16,32],[10,37],[24,33],[34,31],[43,12],[51,12],[42,-2],[40,-16],[27,-34],[18,-35],[12,-16],[8,4],[-8,5],[-17,21]],
  // Asia
  [[30,46],[42,66],[68,73],[100,77],[140,73],[160,68],[178,66],[168,60],[150,60],[145,44],[140,34],[122,31],[120,22],[108,14],[97,8],[88,22],[78,8],[72,20],[60,25],[52,40],[40,42],[30,46]],
  // India peninsula accent
  [[70,24],[78,8],[86,20],[80,26],[70,24]],
  // Australia
  [[113,-22],[130,-12],[142,-11],[150,-25],[147,-38],[135,-36],[123,-34],[115,-35],[113,-22]],
];

/** Live world map: glowing dots per located user, colored by current activity. */
function UserMap({ users }: { users: any[] }) {
  const W = 1000, H = 500;
  const located = users.filter((u) => u.location);

  // Jitter overlapping dots (city-level geo clusters everyone in a metro to one point)
  const seen: Record<string, number> = {};
  const dots = located.map((u) => {
    const key = `${u.location.lat.toFixed(1)},${u.location.lng.toFixed(1)}`;
    const n = (seen[key] = (seen[key] || 0) + 1);
    const [bx, by] = project(u.location.lat, u.location.lng, W, H);
    const ring = Math.floor((n - 1) / 8);
    const ang = ((n - 1) % 8) * (Math.PI / 4);
    const r = ring * 9 + (ring ? 9 : 0);
    return { u, x: bx + Math.cos(ang) * r, y: by + Math.sin(ang) * r, color: activityColor(u.activity), online: u.online };
  });

  return (
    <div style={{ position: 'relative', width: '100%', background: 'radial-gradient(ellipse at 50% 40%, rgba(59,130,246,0.06), rgba(0,0,0,0) 70%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="land" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Soft landmass hints (evocative, not exact coastlines) */}
        {[
          [180, 150, 150, 90],   // N. America
          [300, 330, 80, 110],   // S. America
          [510, 170, 70, 70],    // Europe
          [540, 300, 100, 130],  // Africa
          [720, 180, 190, 120],  // Asia
          [860, 380, 70, 50],    // Australia
        ].map(([cx, cy, rx, ry], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#land)" />
        ))}

        {/* Graticule */}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={(i / 10) * W} y1={0} x2={(i / 10) * W} y2={H} stroke="rgba(255,255,255,0.045)" strokeWidth={1} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={(i / 6) * H} x2={W} y2={(i / 6) * H} stroke="rgba(255,255,255,0.045)" strokeWidth={1} />
        ))}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(255,255,255,0.09)" strokeWidth={1} />

        {/* User dots */}
        {dots.map(({ u, x, y, color, online }) => (
          <g key={u.id} filter="url(#glow)">
            {online && (
              <circle cx={x} cy={y} r={5} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6}>
                <animate attributeName="r" values="5;16" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="2.2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={x} cy={y} r={online ? 5 : 3.5} fill={color} opacity={online ? 1 : 0.55}>
              <title>{`${u.name || u.email || 'User'} — ${u.activity || 'idle'}${u.location.city ? ' · ' + u.location.city : ''}`}</title>
            </circle>
          </g>
        ))}
      </svg>

      {located.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
          No located users yet. Dots appear once signed-in users browse the cockpit<br />(location comes from their connection — city-level, no GPS).
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1rem', padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {Object.entries(ACTIVITY_COLOR).map(([label, color]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Full user directory table. */
function UserTable({ users }: { users: any[] }) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 720 }}>
        <thead>
          <tr style={{ textAlign: 'left', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
            <th style={{ padding: '0.7rem 1rem' }}>User</th>
            <th style={{ padding: '0.7rem 1rem' }}>Status</th>
            <th style={{ padding: '0.7rem 1rem' }}>Working on</th>
            <th style={{ padding: '0.7rem 1rem' }}>Location</th>
            <th style={{ padding: '0.7rem 1rem' }}>Feeds</th>
            <th style={{ padding: '0.7rem 1rem' }}>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const color = activityColor(u.activity);
            const loc = u.location
              ? [u.location.city, u.location.region, u.location.country].filter(Boolean).join(', ')
              : '—';
            return (
              <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.7rem 1rem' }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{u.name || 'Unnamed'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>{u.email}</div>
                </td>
                <td style={{ padding: '0.7rem 1rem', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: u.online ? '#86efac' : 'rgba(255,255,255,0.4)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: u.online ? '#22c55e' : '#475569', boxShadow: u.online ? '0 0 6px #22c55e' : 'none' }} />
                    {u.online ? 'Online' : timeAgo(u.lastActiveAt)}
                  </span>
                </td>
                <td style={{ padding: '0.7rem 1rem' }}>
                  {u.activity ? (
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600, color, background: `rgba(${hexToRgb(color)},0.12)`, border: `1px solid rgba(${hexToRgb(color)},0.25)` }}>{u.activity}</span>
                  ) : <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
                </td>
                <td style={{ padding: '0.7rem 1rem', color: 'rgba(255,255,255,0.55)' }}>{loc}</td>
                <td style={{ padding: '0.7rem 1rem', color: 'rgba(255,255,255,0.55)' }}>{u.feeds}</td>
                <td style={{ padding: '0.7rem 1rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                  {new Date(u.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
  const [directory, setDirectory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return; }
    if (status !== 'authenticated') return;
    if (session?.user?.email !== ADMIN_EMAIL) { router.push('/cockpit/home'); return; }

    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()).catch(() => null),
    ])
      .then(([s, u]) => { setStats(s); setDirectory(u); setLoading(false); })
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

      {/* Live user map */}
      <SectionHeader title="Live User Map" icon="🌍" />
      {directory?.users ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <MetricCard label="Total Users" value={Number(directory.total).toLocaleString()} color="#06b6d4" />
            <MetricCard label="Online Now" value={Number(directory.onlineNow).toLocaleString()} sub="Active in last 5 min" color="#22c55e" />
            <MetricCard label="On the Map" value={Number(directory.located).toLocaleString()} sub="City-level location known" color="#a78bfa" />
          </div>
          <UserMap users={directory.users} />
        </>
      ) : (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px' }}>
          User directory unavailable
        </div>
      )}

      {/* All users */}
      {directory?.users?.length > 0 && (
        <>
          <SectionHeader title="All Users" icon="👤" />
          <UserTable users={directory.users} />
        </>
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
