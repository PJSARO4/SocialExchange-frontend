'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; description: string; action: string }> = {
    OAuthCallback: {
      title: 'OAuth Callback Error',
      description: 'There was a problem completing the authentication. This can happen if cookies are blocked or the session expired.',
      action: 'Please try connecting again. Make sure cookies are enabled in your browser.',
    },
    OAuthSignin: {
      title: 'OAuth Sign-in Error',
      description: 'There was a problem starting the authentication process.',
      action: 'Please try again. If the problem persists, check your OAuth credentials.',
    },
    OAuthCreateAccount: {
      title: 'Account Creation Error',
      description: 'Could not create an account with this OAuth provider.',
      action: 'The account may already exist or there was a configuration issue.',
    },
    Callback: {
      title: 'Callback Error',
      description: 'There was an error during the authentication callback.',
      action: 'Please try again.',
    },
    AccessDenied: {
      title: 'Access Denied',
      description: 'You do not have permission to access this resource.',
      action: 'Please make sure you have the correct permissions.',
    },
    Configuration: {
      title: 'Configuration Error',
      description: 'There is a problem with the server configuration.',
      action: 'Please contact support.',
    },
    Default: {
      title: 'Authentication Error',
      description: 'An unexpected error occurred during authentication.',
      action: 'Please try again.',
    },
  };

  const errorInfo = errorMessages[error || ''] || errorMessages.Default;

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
        maxWidth: '500px',
        width: '100%',
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        border: '1px solid #333',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: 'rgba(255, 77, 77, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '32px',
        }}>
          ⚠️
        </div>

        <h1 style={{
          color: '#fff',
          fontSize: '24px',
          marginBottom: '16px',
          fontWeight: '600',
        }}>
          {errorInfo.title}
        </h1>

        <p style={{
          color: '#888',
          fontSize: '14px',
          marginBottom: '12px',
          lineHeight: '1.6',
        }}>
          {errorInfo.description}
        </p>

        <p style={{
          color: '#aaa',
          fontSize: '13px',
          marginBottom: '32px',
          lineHeight: '1.6',
        }}>
          {errorInfo.action}
        </p>

        {error && (
          <p style={{
            color: '#666',
            fontSize: '12px',
            marginBottom: '24px',
            fontFamily: 'monospace',
            backgroundColor: '#0d0d0d',
            padding: '8px 12px',
            borderRadius: '6px',
          }}>
            Error code: {error}
          </p>
        )}

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
        }}>
          <Link
            href="/cockpit/my-e-assets/my-feeds"
            style={{
              backgroundColor: '#333',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
          >
            Back to My Feeds
          </Link>

          <Link
            href="/cockpit/my-e-assets/my-feeds"
            style={{
              backgroundColor: '#E1306C',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'opacity 0.2s',
            }}
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
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
      <ErrorContent />
    </Suspense>
  );
}
