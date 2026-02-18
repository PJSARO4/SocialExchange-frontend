'use client';

import { useState } from 'react';
import Link from 'next/link';
import '../auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);

    // Simulate sending reset email
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-grid" />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">🔐</span>
            <span className="auth-logo-text">SOCIAL EXCHANGE</span>
          </div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            {submitted
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              If an account exists for <strong style={{ color: '#3fffdc' }}>{email}</strong>,
              you will receive a password reset link shortly.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '2rem' }}>
              This feature is coming soon. For now, use the demo credentials on the login page.
            </p>
            <Link
              href="/auth/login"
              className="auth-submit-btn"
              style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <span className="auth-loading">
                  <span className="auth-loading-spinner" />
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-alternate-actions">
          <Link href="/auth/login" className="auth-alternate-btn">
            Back to Sign In
          </Link>
        </div>
      </div>

      <div className="auth-footer">
        <span>© 2024 Social Exchange</span>
        <span className="auth-footer-separator">•</span>
        <Link href="/cockpit/about" className="auth-footer-link">About</Link>
      </div>
    </div>
  );
}
