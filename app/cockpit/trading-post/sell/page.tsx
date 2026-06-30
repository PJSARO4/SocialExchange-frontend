// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  Music,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';

const PLATFORMS = ['Instagram', 'TikTok', 'Twitter/X', 'YouTube', 'Facebook', 'Snapchat', 'Pinterest', 'LinkedIn'];
const NICHES = ['Fashion', 'Fitness', 'Business/Finance', 'Gaming', 'Food/Cooking', 'Travel', 'Beauty', 'Parenting', 'Tech', 'Entertainment', 'Sports', 'Education', 'Other'];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E1306C',
  'TikTok': '#00F2EA',
  'Twitter/X': '#1DA1F2',
  YouTube: '#FF0000',
  Facebook: '#1877F2',
  Snapchat: '#FFFC00',
  Pinterest: '#E60023',
  LinkedIn: '#0A66C2',
};

type Step = 'platform' | 'details' | 'pricing' | 'review';

interface FormData {
  platform: string;
  handle: string;
  profileUrl: string;
  title: string;
  description: string;
  niche: string;
  followers: string;
  engagementRate: string;
  monthlyIncome: string;
  price: string;
  agreeTerms: boolean;
}

const EMPTY_FORM: FormData = {
  platform: '',
  handle: '',
  profileUrl: '',
  title: '',
  description: '',
  niche: '',
  followers: '',
  engagementRate: '',
  monthlyIncome: '',
  price: '',
  agreeTerms: false,
};

export default function SellMyAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('platform');
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [listingId, setListingId] = useState('');

  const steps: Step[] = ['platform', 'details', 'pricing', 'review'];
  const stepIndex = steps.indexOf(step);

  function update(key: keyof FormData, val: any) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: form.platform,
          handle: form.handle,
          profileUrl: form.profileUrl,
          title: form.title,
          description: form.description,
          niche: form.niche,
          followers: parseInt(form.followers) || 0,
          engagementRate: parseFloat(form.engagementRate) || null,
          monthlyIncome: parseFloat(form.monthlyIncome) || null,
          price: parseFloat(form.price),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setListingId(data.id || data.listing?.id || '');
        setSubmitted(true);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to create listing. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const accentColor = form.platform ? (PLATFORM_COLORS[form.platform] || '#3fffdc') : '#3fffdc';

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '16px',
          padding: '48px 40px',
        }}>
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '50%',
            backgroundColor: '#3fffdc18',
            border: '2px solid #3fffdc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <CheckCircle size={30} color="#3fffdc" />
          </div>
          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>
            Listing Created!
          </h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '32px' }}>
            Your {form.platform} account has been listed on the marketplace. Buyers can now find and purchase it.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href={listingId ? `/cockpit/trading-post/listing/${listingId}` : '/cockpit/trading-post/my-listings'}
              style={{
                backgroundColor: '#3fffdc',
                color: '#000',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              View My Listing
            </Link>
            <Link
              href="/cockpit/trading-post"
              style={{
                backgroundColor: 'transparent',
                color: '#666',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                border: '1px solid #222',
              }}
            >
              Back to Trading Post
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{
        background: '#111',
        borderBottom: '1px solid #1e1e1e',
        padding: '24px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Link href="/cockpit/trading-post" style={{ color: '#555', fontSize: '13px', textDecoration: 'none' }}>Trading Post</Link>
          <span style={{ color: '#333' }}>›</span>
          <span style={{ color: '#aaa', fontSize: '13px' }}>Sell My Account</span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>List Your Account</h1>
      </div>

      {/* Progress */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid #1e1e1e',
        backgroundColor: '#0d0d0d',
      }}>
        {[
          { key: 'platform', label: 'Platform' },
          { key: 'details', label: 'Details' },
          { key: 'pricing', label: 'Pricing' },
          { key: 'review', label: 'Review' },
        ].map((s, i) => {
          const active = s.key === step;
          const done = i < stepIndex;
          return (
            <div
              key={s.key}
              style={{
                flex: 1,
                padding: '14px 16px',
                textAlign: 'center',
                borderBottom: active ? `2px solid ${accentColor}` : '2px solid transparent',
                color: active ? '#fff' : done ? '#555' : '#333',
                fontSize: '13px',
                fontWeight: active ? '600' : '400',
                cursor: done ? 'pointer' : 'default',
              }}
              onClick={() => done && setStep(s.key as Step)}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: done ? '#3fffdc' : active ? accentColor : '#1a1a1a',
                color: done || active ? '#000' : '#444',
                fontSize: '11px',
                fontWeight: '700',
                marginRight: '6px',
              }}>
                {done ? '✓' : i + 1}
              </span>
              {s.label}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>

        {/* STEP 1: Platform */}
        {step === 'platform' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Choose Platform</h2>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '28px' }}>Which social media platform is the account on?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {PLATFORMS.map(p => {
                const color = PLATFORM_COLORS[p] || '#888';
                const selected = form.platform === p;
                return (
                  <button
                    key={p}
                    onClick={() => update('platform', p)}
                    style={{
                      backgroundColor: selected ? `${color}15` : '#111',
                      border: `1px solid ${selected ? color : '#222'}`,
                      borderRadius: '10px',
                      padding: '16px 20px',
                      color: selected ? color : '#aaa',
                      fontSize: '14px',
                      fontWeight: selected ? '600' : '400',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: selected ? color : '#333',
                    }} />
                    {p}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => form.platform && setStep('details')}
                disabled={!form.platform}
                style={{
                  backgroundColor: form.platform ? accentColor : '#1a1a1a',
                  color: form.platform ? '#000' : '#444',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: form.platform ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Details */}
        {step === 'details' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Account Details</h2>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '28px' }}>Tell buyers about the account you&apos;re selling.</p>

            {[
              { label: 'Listing Title', key: 'title', placeholder: 'e.g. Premium Fashion Instagram with 50K Followers', type: 'text' },
              { label: 'Username / Handle', key: 'handle', placeholder: '@yourhandle', type: 'text', prefix: '@' },
              { label: 'Profile URL', key: 'profileUrl', placeholder: 'https://instagram.com/yourhandle', type: 'url' },
              { label: 'Follower Count', key: 'followers', placeholder: '50000', type: 'number' },
              { label: 'Engagement Rate (%)', key: 'engagementRate', placeholder: '3.5', type: 'number' },
              { label: 'Monthly Income ($)', key: 'monthlyIncome', placeholder: '250', type: 'number', optional: true },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '20px' }}>
                <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>
                  {field.label} {field.optional && <span style={{ color: '#444', fontSize: '11px' }}>(optional)</span>}
                </label>
                <div style={{ position: 'relative' }}>
                  {field.prefix && (
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#444', fontSize: '14px' }}>
                      {field.prefix}
                    </span>
                  )}
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => update(field.key as keyof FormData, e.target.value)}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      backgroundColor: '#111',
                      border: '1px solid #222',
                      borderRadius: '8px',
                      padding: field.prefix ? '10px 12px 10px 24px' : '10px 12px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = accentColor}
                    onBlur={e => e.target.style.borderColor = '#222'}
                  />
                </div>
              </div>
            ))}

            {/* Niche */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Niche / Category</label>
              <select
                value={form.niche}
                onChange={e => update('niche', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#111',
                  border: '1px solid #222',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: form.niche ? '#fff' : '#555',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value="">Select a niche</option>
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Description</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe the account, its audience, content style, monetization history, and why it's valuable..."
                rows={5}
                style={{
                  width: '100%',
                  backgroundColor: '#111',
                  border: '1px solid #222',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = accentColor}
                onBlur={e => e.target.style.borderColor = '#222'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep('platform')} style={{
                backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '8px',
                padding: '11px 24px', color: '#666', fontSize: '14px', cursor: 'pointer',
              }}>Back</button>
              <button
                onClick={() => {
                  if (!form.title || !form.handle || !form.followers || !form.niche) {
                    setError('Please fill in all required fields.');
                    return;
                  }
                  setError('');
                  setStep('pricing');
                }}
                style={{
                  backgroundColor: accentColor,
                  color: '#000', border: 'none', borderRadius: '8px',
                  padding: '11px 28px', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
            {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
          </div>
        )}

        {/* STEP 3: Pricing */}
        {step === 'pricing' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Set Your Price</h2>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '28px' }}>
              Set a competitive price. A 10% platform fee is deducted upon completion.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Listing Price (USD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#3fffdc', fontSize: '18px', fontWeight: '600' }}>$</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => update('price', e.target.value)}
                  placeholder="0.00"
                  min="1"
                  style={{
                    width: '100%',
                    backgroundColor: '#111',
                    border: `1px solid ${accentColor}55`,
                    borderRadius: '10px',
                    padding: '14px 14px 14px 32px',
                    color: '#fff',
                    fontSize: '22px',
                    fontWeight: '700',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Fee Breakdown */}
            {form.price && parseFloat(form.price) > 0 && (
              <div style={{
                backgroundColor: '#111',
                border: '1px solid #1e1e1e',
                borderRadius: '10px',
                padding: '18px',
                marginBottom: '24px',
              }}>
                <h4 style={{ color: '#888', fontSize: '12px', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payout Breakdown</h4>
                {[
                  { label: 'Listing price', value: `$${parseFloat(form.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
                  { label: 'Platform fee (10%)', value: `-$${(parseFloat(form.price) * 0.10).toFixed(2)}`, color: '#EF4444' },
                  { label: 'You receive', value: `$${(parseFloat(form.price) * 0.90).toFixed(2)}`, color: '#3fffdc', bold: true },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: '8px', borderTop: row.bold ? '1px solid #1e1e1e' : 'none',
                    paddingTop: row.bold ? '10px' : '0',
                    marginTop: row.bold ? '4px' : '0',
                  }}>
                    <span style={{ color: '#666', fontSize: '13px' }}>{row.label}</span>
                    <span style={{ color: row.color || '#aaa', fontSize: '13px', fontWeight: row.bold ? '700' : '400' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep('details')} style={{
                backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '8px',
                padding: '11px 24px', color: '#666', fontSize: '14px', cursor: 'pointer',
              }}>Back</button>
              <button
                onClick={() => {
                  if (!form.price || parseFloat(form.price) < 1) {
                    setError('Please enter a valid price.');
                    return;
                  }
                  setError('');
                  setStep('review');
                }}
                style={{
                  backgroundColor: accentColor,
                  color: '#000', border: 'none', borderRadius: '8px',
                  padding: '11px 28px', fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
            {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 'review' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Review & Submit</h2>
            <p style={{ color: '#555', fontSize: '14px', marginBottom: '28px' }}>Review your listing before going live.</p>

            {/* Preview Card */}
            <div style={{
              backgroundColor: '#111',
              border: `1px solid ${accentColor}33`,
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '24px',
            }}>
              <div style={{
                background: `linear-gradient(135deg, ${accentColor}22 0%, ${accentColor}08 100%)`,
                borderBottom: `1px solid ${accentColor}22`,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ color: accentColor, fontWeight: '600', fontSize: '13px' }}>{form.platform}</span>
              </div>
              <div style={{ padding: '18px' }}>
                <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{form.title}</h3>
                <p style={{ color: '#555', fontSize: '13px', marginBottom: '14px' }}>@{form.handle} · {form.niche}</p>
                <p style={{ color: '#777', fontSize: '13px', lineHeight: '1.6', marginBottom: '16px' }}>{form.description || <em>No description.</em>}</p>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                  {form.followers && <span style={{ color: '#aaa', fontSize: '13px' }}>👥 {parseInt(form.followers).toLocaleString()} followers</span>}
                  {form.engagementRate && <span style={{ color: '#aaa', fontSize: '13px' }}>📈 {form.engagementRate}% engagement</span>}
                  {form.monthlyIncome && <span style={{ color: '#aaa', fontSize: '13px' }}>💰 ${form.monthlyIncome}/mo income</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontSize: '22px', fontWeight: '700' }}>${parseFloat(form.price).toLocaleString()}</span>
                  <span style={{ color: '#3fffdc', fontSize: '13px' }}>You receive ${(parseFloat(form.price) * 0.90).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div style={{
              backgroundColor: '#0d0d0d',
              border: '1px solid #1e1e1e',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={form.agreeTerms}
                  onChange={e => update('agreeTerms', e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#3fffdc', cursor: 'pointer' }}
                />
                <label htmlFor="terms" style={{ color: '#888', fontSize: '13px', lineHeight: '1.6', cursor: 'pointer' }}>
                  I confirm that I own this account and have the right to sell it. I agree to the{' '}
                  <span style={{ color: '#3fffdc' }}>Terms of Service</span> and understand that funds will be held in escrow until the buyer verifies the transfer.
                </label>
              </div>
            </div>

            {error && (
              <div style={{
                backgroundColor: 'rgba(255,77,77,0.08)',
                border: '1px solid rgba(255,77,77,0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} color="#ff6b6b" />
                <span style={{ color: '#ff6b6b', fontSize: '13px' }}>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep('pricing')} style={{
                backgroundColor: 'transparent', border: '1px solid #222', borderRadius: '8px',
                padding: '11px 24px', color: '#666', fontSize: '14px', cursor: 'pointer',
              }}>Back</button>
              <button
                onClick={() => {
                  if (!form.agreeTerms) { setError('Please agree to the terms.'); return; }
                  setError('');
                  handleSubmit();
                }}
                disabled={submitting || !form.agreeTerms}
                style={{
                  backgroundColor: submitting ? '#1a1a1a' : accentColor,
                  color: submitting ? '#444' : '#000',
                  border: 'none', borderRadius: '8px',
                  padding: '11px 28px', fontSize: '14px', fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {submitting ? 'Submitting...' : '🚀 List My Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
