'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login, seedAuthIfEmpty, isAuthenticated, forceResetAuth, repairAuthIfNeeded } from '@/app/lib/auth/auth-store';
import '../auth.css';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
    twoFactorCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [generalError, setGeneralError] = useState('');

  useEffect(() => {
    seedAuthIfEmpty();
    repairAuthIfNeeded(); // Ensure auth data is valid
    if (isAuthenticated()) {
      router.push('/cockpit/dashboard');
    }
  }, [router]);

  const handleResetDemo = () => {
    forceResetAuth();
    setGeneralError('');
    setErrors({});
    alert('Demo data has been reset! You can now log in with the demo credentials.');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setGeneralError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError('');

    // Simple validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const result = login({
      email: formData.email,
      password: formData.password,
      rememberMe: formData.rememberMe,
      twoFactorCode: formData.twoFactorCode || undefined,
    });

    setIsLoading(false);

    if (result.requiresTwoFactor) {
      setShowTwoFactor(true);
      return;
    }

    if (!result.success) {
      if (result.errors) {
        setErrors(result.errors);
      } else {
        setGeneralError(result.message);
      }
      return;
    }

    // Success - redirect to cockpit dashboard
    router.push('/cockpit/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-grid" />
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">⚡</span>
            <span className="auth-logo-text">SOCIAL EXCHANGE</span>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access your dashboard</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {generalError && (
            <div className="auth-error-banner">
              <span className="auth-error-icon">⚠️</span>
              <span>{generalError}</span>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`auth-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={isLoading}
            />
            {errors.email && <span className="auth-field-error">{errors.email}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className={`auth-input ${errors.password ? 'error' : ''}`}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              disabled={isLoading}
            />
            {errors.password && <span className="auth-field-error">{errors.password}</span>}
          </div>

          {showTwoFactor && (
            <div className="auth-field">
              <label htmlFor="twoFactorCode" className="auth-label">Two-Factor Code</label>
              <input
                type="text"
                id="twoFactorCode"
                name="twoFactorCode"
                className="auth-input"
                placeholder="000000"
                value={formData.twoFactorCode}
                onChange={handleChange}
                maxLength={6}
                autoComplete="one-time-code"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="auth-options">
            <label className="auth-checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="auth-checkbox"
                disabled={isLoading}
              />
              <span className="auth-checkbox-text">Remember me for 30 days</span>
            </label>
            <Link href="/auth/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="auth-loading">
                <span className="auth-loading-spinner" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-alternate-actions">
          <Link href="/auth/signup" className="auth-alternate-btn">
            Create New Account
          </Link>
          <Link href="/auth/owner" className="auth-owner-link">
            🔐 Owner/Developer Access
          </Link>
        </div>

        <div className="auth-demo-credentials">
          <div className="auth-demo-label">Demo Credentials</div>
          <div className="auth-demo-item">
            <span className="auth-demo-email">demo@example.com</span>
            <span className="auth-demo-separator">•</span>
            <span className="auth-demo-password">Demo@2024!User</span>
          </div>
          <div className="auth-demo-item" style={{ marginTop: '0.5rem', fontSize: '0.7rem', opacity: 0.7 }}>
            <span className="auth-demo-email">pjsaro4@gmail.com</span>
            <span className="auth-demo-separator">•</span>
            <span className="auth-demo-password">SocialX@2024!PJ</span>
          </div>
          <button
            type="button"
            onClick={handleResetDemo}
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              fontSize: '0.7rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🔄 Reset Demo Data (if login fails)
          </button>
        </div>
      </div>

      <div className="auth-footer">
        <span>© 2024 Social Exchange</span>
        <span className="auth-footer-separator">•</span>
        <Link href="/cockpit/about" className="auth-footer-link">About</Link>
        <span className="auth-footer-separator">•</span>
        <Link href="/cockpit/about" className="auth-footer-link">Terms</Link>
      </div>
    </div>
  );
}
