'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#02040a',
        color: '#e0e0e0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '6rem',
          fontWeight: 700,
          color: '#00e0ff',
          margin: 0,
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: '1.25rem',
          color: '#888',
          marginTop: '1rem',
          marginBottom: '2rem',
        }}
      >
        Signal lost. This sector doesn&apos;t exist.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 2rem',
          background: 'linear-gradient(135deg, #00e0ff, #0080ff)',
          color: '#000',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        Return to Command Center
      </Link>
    </div>
  );
}
