'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#02040a',
          color: '#e0e0e0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          margin: 0,
        }}
      >
        <h1
          style={{
            fontSize: '4rem',
            fontWeight: 700,
            color: '#ff4444',
            margin: 0,
            lineHeight: 1,
          }}
        >
          System Error
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            color: '#888',
            marginTop: '1rem',
            marginBottom: '0.5rem',
          }}
        >
          A critical error occurred in the command center.
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            color: '#555',
            marginBottom: '2rem',
            fontFamily: 'monospace',
          }}
        >
          {error?.digest ? `Error ID: ${error.digest}` : 'Unknown error'}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #ff4444, #cc0000)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
          }}
        >
          Restart Systems
        </button>
      </body>
    </html>
  );
}
