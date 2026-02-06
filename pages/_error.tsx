/**
 * Custom Error Page (Pages Router)
 *
 * This file exists to prevent a build-time crash where Next.js generates
 * a default _error.js that inherits providers (SessionProvider) which
 * call useContext during static prerendering — causing a null crash.
 *
 * By providing a plain _error page with no context dependencies,
 * the 404 and 500 pages can be statically generated safely.
 */

import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode: number | undefined;
}

function ErrorPage({ statusCode }: ErrorProps) {
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
        margin: 0,
      }}
    >
      <h1
        style={{
          fontSize: '6rem',
          fontWeight: 700,
          color: statusCode === 404 ? '#00e0ff' : '#ff4444',
          margin: 0,
          lineHeight: 1,
        }}
      >
        {statusCode || 'Error'}
      </h1>
      <p
        style={{
          fontSize: '1.25rem',
          color: '#888',
          marginTop: '1rem',
          marginBottom: '2rem',
        }}
      >
        {statusCode === 404
          ? 'Signal lost. This sector doesn\u2019t exist.'
          : 'A system malfunction occurred.'}
      </p>
      <a
        href="/"
        style={{
          padding: '0.75rem 2rem',
          background:
            statusCode === 404
              ? 'linear-gradient(135deg, #00e0ff, #0080ff)'
              : 'linear-gradient(135deg, #ff4444, #cc0000)',
          color: statusCode === 404 ? '#000' : '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        }}
      >
        Return to Command Center
      </a>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
