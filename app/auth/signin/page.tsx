// @ts-nocheck
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const urlError = searchParams?.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/cockpit/home',
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
      } else {
        router.push('/cockpit/home');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

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
        maxWidth: '420px',
        width: '100%',
        backgroundColor: '#111',
        borderRadius: '16px',
        padding: '44px 40px',
        border: '1px solid #222',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3fffdc 0%, #00b4d8 100%)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: '800',
            color: '#000',
          }}>
            SE
          </div>
          <h1 style={{
            color: '#fff',
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '6px',
          }}>
            Welcome back
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Sign in to Social Exchange
          </p>
        </div>

        {/* Error Banner */}
        {(error || urlError) && (
          <div style={{
            backgroundColor: 'rgba(255, 77, 77, 0.08)',
            border: '1px solid rgba(255, 77, 77, 0.25)',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '24px',
          }}>
            <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>
              {error || (urlError === 'CredentialsSignin' ? 'Invalid email or password.' : `Authentication error: ${urlError}`)}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: '#aaa',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '11px 14px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#3fffdc'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#aaa',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '6px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '11px 14px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#3fffdc'}
              onBlur={e => e.target.style.borderColor = '#2a2a2a'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#1a1a1a' : 'linear-gradient(135deg, #3fffdc 0%, #00b4d8 100%)',
              color: loading ? '#555' : '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '28px',
          paddingTop: '24px',
          borderTop: '1px solid #1e1e1e',
          textAlign: 'center',
        }}>
          <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/signup"
              style={{
                color: '#3fffdc',
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
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
        fontSize: '14px',
      }}>
        Loading...
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
