'use client';

import { useState, Suspense, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get('callbackUrl') || '/cockpit/my-e-assets/my-feeds';
  const urlError = searchParams?.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (result && result.error) {
      setError('Invalid email or password.');
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <div className="auth-page">
      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a0a; padding: 20px; }
        .auth-card { max-width: 400px; width: 100%; background: #1a1a1a; border-radius: 12px; padding: 40px; border: 1px solid #333; }
        .auth-title { color: #fff; font-size: 24px; margin-bottom: 8px; font-weight: 600; text-align: center; }
        .auth-sub { color: #888; font-size: 14px; margin-bottom: 32px; text-align: center; }
        .auth-error { background: rgba(255,77,77,0.1); border: 1px solid rgba(255,77,77,0.3); border-radius: 8px; padding: 12px; margin-bottom: 24px; color: #ff4d4d; font-size: 13px; }
        .auth-label { color: #aaa; font-size: 13px; display: block; margin-bottom: 6px; }
        .auth-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #333; background: #111; color: #fff; margin-bottom: 16px; box-sizing: border-box; }
        .auth-btn { width: 100%; background: #E1306C; color: #fff; padding: 12px; border-radius: 8px; border: none; font-size: 14px; font-weight: 500; cursor: pointer; margin-top: 8px; }
        .auth-footer { color: #666; font-size: 13px; margin-top: 24px; text-align: center; }
        .auth-footer a { color: #E1306C; text-decoration: none; }
      `}</style>
      <div className="auth-card">
        <h1 className="auth-title">Sign In</h1>
        <p className="auth-sub">Welcome back</p>
        {(error || urlError) && (
          <div className="auth-error">{error || 'Authentication failed. Please try again.'}</div>
        )}
        <form onSubmit={handleSubmit}>
          <label className="auth-label">Email</label>
          <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="auth-label">Password</label>
          <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p className="auth-footer">Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link></p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="auth-page" />}>
      <SignInContent />
    </Suspense>
  );
}
