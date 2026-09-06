'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Silent presence beacon. While a signed-in user is in the cockpit, it posts
 * their current section (a friendly label) to /api/presence/ping every ~60s and
 * on each route change. The server attaches coarse geo from Vercel headers so
 * the admin live map can plot who's online and what they're working on.
 */
function labelFor(path: string): string {
  const p = (path || '').toLowerCase();
  if (p.includes('my-feeds') || p.includes('feeds')) return 'Automation';
  if (p.includes('meme') || p.includes('content-lab') || p.includes('lab')) return 'Content Lab';
  if (p.includes('exchange') || p.includes('trading') || p.includes('market')) return 'Exchange Floor';
  if (p.includes('comms') || p.includes('chat')) return 'Comms';
  if (p.includes('wallet')) return 'Wallet';
  if (p.includes('owner') || p.includes('admin')) return 'Admin';
  if (p.includes('dashboard') || p.includes('home') || p.includes('command')) return 'Command Center';
  return 'Online';
}

export default function PresencePing() {
  const pathname = usePathname();
  const { status } = useSession();
  const lastSent = useRef<string>('');

  useEffect(() => {
    if (status !== 'authenticated') return;

    const send = () => {
      const path = window.location.pathname;
      const activity = labelFor(path);
      lastSent.current = path;
      fetch('/api/presence/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, activity }),
        keepalive: true,
      }).catch(() => {});
    };

    send(); // fire on mount + whenever path changes
    const interval = setInterval(send, 60_000);
    return () => clearInterval(interval);
  }, [pathname, status]);

  return null;
}
