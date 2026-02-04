'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ownerLogin, seedAuthIfEmpty, isAuthenticated, hasRole } from '@/app/lib/auth/auth-store';
import '../auth.css';

export default function OwnerAccessPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    accessCode: '',
    twoFactorCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [step, setStep] = useState<'credentials' | 'access-code'>('credentials');

  useEffect(() => {
    seedAuthIfEmpty();
    // If already authenticated as owner/dev, redirect to owner dashboard
    if (isAuthenticated() && hasRole('developer')) {
      router.push('/cockpit/owner');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setGeneralError('');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate credentials step
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Move to access code step
    setStep('access-code');
  };

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError('');

    // Validate access code
    const newErrors: Record<string, string> = {};
    if (!formData.accessCode) newErrors.accessCode = 'Access code is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    const result = ownerLogin(
      formData.email,
      formData.password,
      formData.accessCode,
      formData.twoFactorCode
    );

    setIsLoading(false);

    if (!result.success) {
      if (result.errors) {
        setErrors(result.errors);
      } else {
        setGeneralError(result.message);
      }
      // Go back to credentials if auth failed
      if (result.message.includes('Invalid email') || result.message.includes('password')) {
        setStep('credentials');
      }
      return;
    }

    // Success - redirect to owner dashboard
    router.push('/cockpit/owner');
  };

  return (
    <div className="auth-container owner-access">
      <div className="auth-background">
        <div className="auth-grid" />
        <div className="auth-secure-overlay" />
      </div>

      <div className="auth-card owner">
        <div className="auth-header">
          <div className="auth-secure-badge">
            <span className="auth-secure-icon">🔐</span>
            <span className="auth-secure-text">SECURE ACCESS</span>
          </div>
          <h1 className="auth-title">Owner Portal</h1>
          <p className="auth-subtitle">Authorized personnel only</p>
        </div>

        <div className="auth-steps">
          <div className={`auth-step ${step === 'credentials' ? 'active' : 'completed'}`}>
            <span className="auth-step-number">1</span>
            <span className="auth-step-label">Credentials</span>
          </div>
          <div className="auth-step-connector" />
          <div className={`auth-step ${step === 'access-code' ? 'active' : ''}`}>
            <span className="auth-step-number">2</span>
            <span className="auth-step-label">Access Code</span>
          </div>
        </div>

        {step === 'credentials' ? (
          <form className="auth-form" onSubmit={handleCredentialsSubmit}>
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
                placeholder="admin@socialexchange.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
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
              />
              {errors.password && <span className="auth-field-error">{errors.password}</span>}
            </div>

            <button type="submit" className="auth-submit-btn owner">
              Continue to Access Code
              <span className="auth-btn-arrow">→</span>
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleAccessCodeSubmit}>
            {generalError && (
              <div className="auth-error-banner">
                <span className="auth-error-icon">⚠️</span>
                <span>{generalError}</span>
              </div>
            )}

            <div className="auth-access-info">
              <div className="auth-access-icon">🔑</div>
              <p className="auth-access-text">
                Enter your owner/developer access code. This code is provided
                separately and is required for elevated access.
              </p>
            </div>

            <div className="auth-field">
              <label htmlFor="accessCode" className="auth-label">Access Code</label>
              <input
                type="password"
                id="accessCode"
                name="accessCode"
                className={`auth-input mono ${errors.accessCode ? 'error' : ''}`}
                placeholder="SXCHANGE-XXXX-XXXX"
                value={formData.accessCode}
                onChange={handleChange}
                autoComplete="off"
                disabled={isLoading}
              />
              {errors.accessCode && <span className="auth-field-error">{errors.accessCode}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="twoFactorCode" className="auth-label">
                2FA Code <span className="auth-optional">(if enabled)</span>
              </label>
              <input
                type="text"
                id="twoFactorCode"
                name="twoFactorCode"
                className="auth-input mono"
                placeholder="000000"
                value={formData.twoFactorCode}
                onChange={handleChange}
                maxLength={6}
                autoComplete="one-time-code"
                disabled={isLoading}
              />
            </div>

            <div className="auth-form-actions">
              <button
                type="button"
                className="auth-back-btn"
                onClick={() => setStep('credentials')}
                disabled={isLoading}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="auth-submit-btn owner"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="auth-loading">
                    <span className="auth-loading-spinner" />
                    Verifying...
                  </span>
                ) : (
                  'Access Dashboard'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="auth-security-notice">
          <span className="auth-security-icon">🛡️</span>
          <div className="auth-security-text">
            <strong>Security Notice:</strong> All access attempts are logged and monitored.
            Unauthorized access attempts will be reported.
          </div>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-alternate-actions">
          <Link href="/auth/login" className="auth-alternate-btn">
            Standard Sign In
          </Link>
        </div>

        <div className="auth-demo-credentials owner">
          <div className="auth-demo-label">Demo Owner Credentials</div>
          <div className="auth-demo-item">
            <span className="auth-demo-email">owner@socialexchange.com</span>
            <span className="auth-demo-separator">•</span>
            <span className="auth-demo-password">Owner@2024!Secure</span>
          </div>
          <div className="auth-demo-item">
            <span className="auth-demo-label-inline">Access Code:</span>
            <span className="auth-demo-code">SXCHANGE-OWNER-2024</span>
          </div>
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
