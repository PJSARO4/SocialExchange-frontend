'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/cockpit/my-e-assets/my-feeds';
  const error = searchParams.get('error');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        border: '1px solid #333',
      }}>
        <h1 style={{
          color: '#fff',
          fontSize: '24px',
          marginBottom: '8px',
          fontWeight: '600',
        }}>
          Sign In
        </h1>

        <p style={{
          color: '#888',
          fontSize: '14px',
          marginBottom: '32px',
        }}>
          Connect your social media accounts
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 77, 77, 0.1)',
            border: '1px solid rgba(255, 77, 77, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
          }}>
            <p style={{
              color: '#ff4d4d',
              fontSize: '13px',
              margin: 0,
            }}>
              {error === 'OAuthCallback'
                ? 'Authentication failed. Please try again.'
                : `Error: ${error}`
              }
            </p>
          </div>
        )}

        <p style={{
          color: '#666',
          fontSize: '13px',
          marginBottom: '24px',
        }}>
          To connect accounts, please use the "Connect Account" button in My Feeds.
        </p>

        <Link
          href={callbackUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#E1306C',
            color: '#fff',
            padding: '12px 32px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Go to My Feeds
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        color: '#fff',
      }}>
        Loading...
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
