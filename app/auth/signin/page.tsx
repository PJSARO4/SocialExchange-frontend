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
    <div className="auth-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
        .auth-page { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; overflow: hidden;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          background:
            radial-gradient(ellipse 50% 40% at 15% 10%, rgba(122,92,255,0.18), transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 90%, rgba(0,240,255,0.12), transparent 60%),
            radial-gradient(ellipse 60% 50% at 60% 50%, rgba(198,75,255,0.06), transparent 55%),
            #02040a; }
        .auth-card { position: relative; z-index: 1; max-width: 400px; width: 100%; padding: 40px 36px 34px;
          background: rgba(10,17,24,0.55); border: 1px solid rgba(0,240,255,0.16); border-radius: 18px;
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 0 40px rgba(0,240,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04); }
        .auth-logo { width: 46px; height: 46px; display: block; margin: 0 auto 18px; color: #3FFFDC;
          filter: drop-shadow(0 0 9px rgba(63,255,220,0.6)); }
        .auth-title { font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 800; letter-spacing: 0.02em; margin: 0 0 6px; text-align: center;
          background: linear-gradient(100deg, #ffffff, #8fefff 55%, #b7a5ff); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        .auth-sub { color: #9FB6D4; font-size: 12px; letter-spacing: 0.06em; margin: 0 0 28px; text-align: center; }
        .auth-error { background: rgba(255,95,95,0.08); border: 1px solid rgba(255,95,95,0.3); border-radius: 8px; padding: 11px 13px; margin-bottom: 20px; color: #ff8080; font-size: 12.5px; }
        .auth-label { color: rgba(159,182,212,0.85); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; display: block; margin-bottom: 7px; }
        .auth-input { width: 100%; padding: 11px 13px; border-radius: 9px; border: 1px solid rgba(0,240,255,0.15); background: rgba(255,255,255,0.03); color: #e6f6ff; margin-bottom: 16px; box-sizing: border-box; font-family: inherit; font-size: 14px; transition: border-color .2s, box-shadow .2s; }
        .auth-input::placeholder { color: rgba(159,182,212,0.4); }
        .auth-input:focus { outline: none; border-color: rgba(63,255,220,0.55); box-shadow: 0 0 0 3px rgba(63,255,220,0.1); }
        .auth-btn { width: 100%; margin-top: 10px; padding: 13px; border-radius: 9px; border: 1px solid rgba(63,255,220,0.4); cursor: pointer;
          background: linear-gradient(180deg, rgba(63,255,220,0.16), rgba(63,255,220,0.06)); color: #3FFFDC;
          font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
          transition: background .25s, box-shadow .3s, transform .2s; }
        .auth-btn:hover:not(:disabled) { background: linear-gradient(180deg, rgba(63,255,220,0.26), rgba(63,255,220,0.1)); box-shadow: 0 0 22px rgba(63,255,220,0.22); transform: translateY(-1px); }
        .auth-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .auth-footer { color: #6b8299; font-size: 12.5px; margin: 22px 0 0; text-align: center; }
        .auth-footer a { color: #3FFFDC; text-decoration: none; }
        .auth-footer a:hover { text-decoration: underline; }
      `}</style>
      <div className="auth-card">
        <svg className="auth-logo" viewBox="0 0 100 100" fill="none" aria-hidden="true">
          <g stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 42 L44 20 L76 42 L58 54" />
            <path d="M88 58 L56 80 L24 58 L42 46" />
          </g>
        </svg>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to Social Exchange</p>

        {(error || urlError) && (
          <div className="auth-error">
            {error || (urlError === 'CredentialsSignin' ? 'Invalid email or password.' : `Authentication error: ${urlError}`)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="auth-label">Email</label>
          <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          <label className="auth-label">Password</label>
          <input className="auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          <button className="auth-btn" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>

        <p className="auth-footer">Don&apos;t have an account? <Link href="/auth/signup">Sign up</Link></p>
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
