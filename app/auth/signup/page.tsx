'use client';

import { useState, Suspense, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

function SignUpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get('callbackUrl') || '/cockpit/my-e-assets/my-feeds';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || 'Failed to create account.');
      return;
    }

    const result = await signIn('credentials', { email, password, redirect: false, callbackUrl });
    setLoading(false);
    if (result && result.error) {
      setError('Account created, but sign in failed. Please sign in manually.');
      router.push('/auth/signin');
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
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Join Social Exchange</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="auth-label">Name</label>
          <input className="auth-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="auth-label">Email</label>
          <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="auth-label">Password</label>
          <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label className="auth-label">Confirm Password</label>
          <input className="auth-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</button>
        </form>
        <p className="auth-footer">Already have an account? <Link href="/auth/signin">Sign in</Link></p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="auth-page" />}>
      <SignUpContent />
    </Suspense>
  );
}
