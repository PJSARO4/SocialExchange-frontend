'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  signup,
  seedAuthIfEmpty,
  isAuthenticated,
} from '@/app/lib/auth/auth-store';
import { validatePassword, validateEmail, validateUsername } from '@/app/lib/auth/types';
import '../auth.css';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    color: string;
  }>({ score: 0, label: '', color: '' });

  useEffect(() => {
    seedAuthIfEmpty();
    if (isAuthenticated()) {
      router.push('/cockpit/dashboard');
    }
  }, [router]);

  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong', 'Excellent'];
    const colors = ['', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#3fffdc'];

    setPasswordStrength({
      score,
      label: labels[Math.min(score, 6)],
      color: colors[Math.min(score, 6)],
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));

    // Calculate password strength
    if (name === 'password') {
      calculatePasswordStrength(value);
    }

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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Real-time validation on blur
    if (name === 'email' && value) {
      const validation = validateEmail(value);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, email: validation.errors[0] }));
      }
    }

    if (name === 'username' && value) {
      const validation = validateUsername(value);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, username: validation.errors[0] }));
      }
    }

    if (name === 'password' && value) {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, password: validation.errors[0] }));
      }
    }

    if (name === 'confirmPassword' && value && formData.password !== value) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError('');

    // Validate all fields
    const newErrors: Record<string, string> = {};

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors[0];
    }

    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.errors[0];
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Simulate network delay and captcha verification
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = signup({
      ...formData,
      captchaToken: 'demo-captcha-token', // Would be real captcha in production
    });

    setIsLoading(false);

    if (!result.success) {
      if (result.errors) {
        setErrors(result.errors);
      } else {
        setGeneralError(result.message);
      }
      return;
    }

    // Success - redirect to cockpit
    router.push('/cockpit/dashboard');
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-grid" />
      </div>

      <div className="auth-card signup">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">⚡</span>
            <span className="auth-logo-text">SOCIAL EXCHANGE</span>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the future of social media management</p>
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
              onBlur={handleBlur}
              autoComplete="email"
              disabled={isLoading}
            />
            {errors.email && <span className="auth-field-error">{errors.email}</span>}
          </div>

          <div className="auth-row">
            <div className="auth-field">
              <label htmlFor="username" className="auth-label">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                className={`auth-input ${errors.username ? 'error' : ''}`}
                placeholder="yourname"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="username"
                disabled={isLoading}
              />
              {errors.username && <span className="auth-field-error">{errors.username}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="displayName" className="auth-label">Display Name</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                className={`auth-input ${errors.displayName ? 'error' : ''}`}
                placeholder="Your Name"
                value={formData.displayName}
                onChange={handleChange}
                autoComplete="name"
                disabled={isLoading}
              />
              {errors.displayName && <span className="auth-field-error">{errors.displayName}</span>}
            </div>
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
              onBlur={handleBlur}
              autoComplete="new-password"
              disabled={isLoading}
            />
            {passwordStrength.score > 0 && (
              <div className="auth-password-strength">
                <div className="auth-password-strength-bar">
                  <div
                    className="auth-password-strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 6) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                <span
                  className="auth-password-strength-label"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </span>
              </div>
            )}
            {errors.password && <span className="auth-field-error">{errors.password}</span>}
            <div className="auth-password-requirements">
              <span className="auth-requirement-label">Requirements:</span>
              <ul className="auth-requirements-list">
                <li className={formData.password.length >= 12 ? 'met' : ''}>
                  At least 12 characters
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                  One uppercase letter
                </li>
                <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                  One lowercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'met' : ''}>
                  One number
                </li>
                <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'met' : ''}>
                  One special character
                </li>
              </ul>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="••••••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <span className="auth-field-error">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="auth-field">
            <label className={`auth-checkbox-label terms ${errors.acceptTerms ? 'error' : ''}`}>
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="auth-checkbox"
                disabled={isLoading}
              />
              <span className="auth-checkbox-text">
                I agree to the{' '}
                <Link href="/cockpit/about" className="auth-inline-link">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/cockpit/about" className="auth-inline-link">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.acceptTerms && <span className="auth-field-error">{errors.acceptTerms}</span>}
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="auth-loading">
                <span className="auth-loading-spinner" />
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-alternate-actions">
          <Link href="/auth/login" className="auth-alternate-btn">
            Sign In to Existing Account
          </Link>
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
