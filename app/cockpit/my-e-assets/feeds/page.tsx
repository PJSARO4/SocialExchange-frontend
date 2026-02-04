'use client';

import { useRouter } from 'next/navigation';

export default function FeedsPage() {
  const router = useRouter();

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>Feeds</h1>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
        Manage your social feeds and automation
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
        <button
          onClick={() => router.push('/cockpit/my-e-assets/feeds/ownership')}
          style={{
            padding: '1rem',
            background: 'rgba(63, 255, 220, 0.1)',
            border: '1px solid rgba(63, 255, 220, 0.3)',
            borderRadius: '4px',
            color: '#3fffdc',
            cursor: 'pointer',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          Ownership
        </button>
        
        <button
          onClick={() => router.push('/cockpit/my-e-assets/my-feeds')}
          style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            color: '#d1d5db',
            cursor: 'pointer',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          My Feeds
        </button>
      </div>
    </div>
  );
}