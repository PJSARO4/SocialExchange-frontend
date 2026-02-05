'use client';

import React, { useState } from 'react';
import {
  EscrowListing,
  Platform,
  AccountNiche,
  ESCROW_CONFIG,
  calculateFees,
  formatCurrency,
} from '../../types/escrow';
import { createEscrowListing } from '../../lib/escrow-store';
import './escrow.css';

interface EscrowListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (listing: EscrowListing) => void;
  sellerId: string;
  sellerUsername: string;
  sellerEmail: string;
}

type Step = 'account' | 'pricing' | 'assets' | 'terms';

const PLATFORMS: { value: Platform; label: string; icon: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: '' },
  { value: 'tiktok', label: 'TikTok', icon: '' },
  { value: 'twitter', label: 'Twitter/X', icon: '' },
  { value: 'youtube', label: 'YouTube', icon: '' },
  { value: 'facebook', label: 'Facebook', icon: '' },
];

const NICHES: { value: AccountNiche; label: string }[] = [
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'fitness', label: 'Fitness & Health' },
  { value: 'food', label: 'Food & Cooking' },
  { value: 'travel', label: 'Travel' },
  { value: 'tech', label: 'Technology' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art & Design' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'pets', label: 'Pets & Animals' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'other', label: 'Other' },
];

export function EscrowListingModal({
  isOpen,
  onClose,
  onSuccess,
  sellerId,
  sellerUsername,
  sellerEmail,
}: EscrowListingModalProps) {
  const [step, setStep] = useState<Step>('account');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    platform: 'instagram' as Platform,
    handle: '',
    displayName: '',
    bio: '',
    niche: 'lifestyle' as AccountNiche,
    niches: ['lifestyle'] as AccountNiche[],
    accountAge: '',
    followers: '',
    following: '',
    posts: '',
    avgLikes: '',
    avgComments: '',
    engagementRate: '',
    askingPrice: '',
    minimumOffer: '',
    acceptsOffers: true,
    buyNowEnabled: false,
    buyNowPrice: '',
    title: '',
    description: '',
    highlights: ['', '', ''],
    hasMonetization: false,
    monthlyRevenue: '',
    revenueSource: '',
    emailIncluded: true,
    originalEmailIncluded: false,
    contentLibraryIncluded: false,
    brandDealsIncluded: false,
    websiteIncluded: false,
    otherSocials: '',
    termsAccepted: false,
  });

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNicheToggle = (niche: AccountNiche) => {
    setFormData(prev => {
      const niches = prev.niches.includes(niche)
        ? prev.niches.filter(n => n !== niche)
        : [...prev.niches, niche];
      return {
        ...prev,
        niches,
        niche: niches[0] || 'other',
      };
    });
  };

  const handleHighlightChange = (index: number, value: string) => {
    setFormData(prev => {
      const highlights = [...prev.highlights];
      highlights[index] = value;
      return { ...prev, highlights };
    });
  };

  const calculateEngagement = () => {
    const followers = parseFloat(formData.followers) || 0;
    const avgLikes = parseFloat(formData.avgLikes) || 0;
    const avgComments = parseFloat(formData.avgComments) || 0;
    if (followers > 0) {
      const rate = ((avgLikes + avgComments) / followers) * 100;
      setFormData(prev => ({ ...prev, engagementRate: rate.toFixed(2) }));
    }
  };

  const feePreview = calculateFees(parseFloat(formData.askingPrice) || 0);

  const validateStep = (): boolean => {
    setError(null);

    if (step === 'account') {
      if (!formData.handle || !formData.displayName) {
        setError('Please fill in account handle and display name');
        return false;
      }
      if (!formData.followers || parseFloat(formData.followers) < ESCROW_CONFIG.MINIMUM_LISTING_PRICE) {
        setError(`Minimum ${ESCROW_CONFIG.MINIMUM_LISTING_PRICE} followers required`);
        return false;
      }
    }

    if (step === 'pricing') {
      const price = parseFloat(formData.askingPrice);
      if (!price || price < ESCROW_CONFIG.MINIMUM_LISTING_PRICE) {
        setError(`Minimum listing price is ${formatCurrency(ESCROW_CONFIG.MINIMUM_LISTING_PRICE)}`);
        return false;
      }
      if (!formData.title || !formData.description) {
        setError('Please provide a title and description');
        return false;
      }
    }

    if (step === 'terms') {
      if (!formData.termsAccepted) {
        setError('You must accept the terms to continue');
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;

    const steps: Step[] = ['account', 'pricing', 'assets', 'terms'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['account', 'pricing', 'assets', 'terms'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const listing = createEscrowListing({
        sellerId,
        sellerUsername,
        sellerEmail,
        sellerRating: 5.0,
        sellerCompletedSales: 0,
        sellerVerified: false,
        platform: formData.platform,
        handle: formData.handle,
        displayName: formData.displayName,
        bio: formData.bio,
        niche: formData.niche,
        niches: formData.niches,
        accountAge: formData.accountAge,
        metrics: {
          followers: parseInt(formData.followers) || 0,
          following: parseInt(formData.following) || 0,
          posts: parseInt(formData.posts) || 0,
          avgLikes: parseInt(formData.avgLikes) || 0,
          avgComments: parseInt(formData.avgComments) || 0,
          engagementRate: parseFloat(formData.engagementRate) || 0,
        },
        askingPrice: parseFloat(formData.askingPrice) || 0,
        minimumOffer: parseFloat(formData.minimumOffer) || parseFloat(formData.askingPrice) * 0.5,
        acceptsOffers: formData.acceptsOffers,
        buyNowEnabled: formData.buyNowEnabled,
        buyNowPrice: formData.buyNowEnabled ? parseFloat(formData.buyNowPrice) : undefined,
        title: formData.title,
        description: formData.description,
        highlights: formData.highlights.filter(h => h.trim()),
        monetization: {
          hasMonetization: formData.hasMonetization,
          monthlyRevenue: formData.hasMonetization ? parseFloat(formData.monthlyRevenue) : undefined,
          revenueSource: formData.hasMonetization ? formData.revenueSource : undefined,
        },
        assetsIncluded: {
          email: formData.emailIncluded,
          originalEmail: formData.originalEmailIncluded,
          contentLibrary: formData.contentLibraryIncluded,
          brandDeals: formData.brandDealsIncluded,
          website: formData.websiteIncluded,
          otherSocials: formData.otherSocials.split(',').map(s => s.trim()).filter(Boolean),
        },
        termsAccepted: formData.termsAccepted,
        termsAcceptedAt: new Date().toISOString(),
      });

      onSuccess(listing);
      onClose();
    } catch (err) {
      setError('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="escrow-modal-overlay" onClick={onClose}>
      <div className="escrow-modal" onClick={e => e.stopPropagation()}>
        <div className="escrow-modal-header">
          <h2>Create Escrow Listing</h2>
          <button className="escrow-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="escrow-modal-steps">
          {(['account', 'pricing', 'assets', 'terms'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`escrow-modal-step ${step === s ? 'active' : ''} ${(['account', 'pricing', 'assets', 'terms'] as Step[]).indexOf(step) > i ? 'completed' : ''}`}
            >
              <span className="escrow-modal-step-num">{i + 1}</span>
              <span className="escrow-modal-step-label">
                {s === 'account' && 'Account'}
                {s === 'pricing' && 'Pricing'}
                {s === 'assets' && 'Assets'}
                {s === 'terms' && 'Review'}
              </span>
            </div>
          ))}
        </div>

        <div className="escrow-modal-body">
          {error && <div className="escrow-error">{error}</div>}

          {/* Step 1: Account Details */}
          {step === 'account' && (
            <div className="escrow-form-section">
              <h3>Account Details</h3>

              <div className="escrow-form-group">
                <label>Platform</label>
                <div className="escrow-platform-select">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      className={`escrow-platform-btn ${formData.platform === p.value ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, platform: p.value }))}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="escrow-form-row">
                <div className="escrow-form-group">
                  <label>Handle/Username *</label>
                  <input
                    type="text"
                    name="handle"
                    value={formData.handle}
                    onChange={handleInputChange}
                    placeholder="@username"
                  />
                </div>
                <div className="escrow-form-group">
                  <label>Display Name *</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="Account Name"
                  />
                </div>
              </div>

              <div className="escrow-form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Account bio/description"
                  rows={3}
                />
              </div>

              <div className="escrow-form-group">
                <label>Niches (select all that apply)</label>
                <div className="escrow-niche-grid">
                  {NICHES.map(n => (
                    <button
                      key={n.value}
                      type="button"
                      className={`escrow-niche-btn ${formData.niches.includes(n.value) ? 'active' : ''}`}
                      onClick={() => handleNicheToggle(n.value)}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="escrow-form-group">
                <label>Account Age</label>
                <input
                  type="text"
                  name="accountAge"
                  value={formData.accountAge}
                  onChange={handleInputChange}
                  placeholder="e.g., 2 years 3 months"
                />
              </div>

              <h4>Metrics</h4>
              <div className="escrow-form-row escrow-form-row-3">
                <div className="escrow-form-group">
                  <label>Followers *</label>
                  <input
                    type="number"
                    name="followers"
                    value={formData.followers}
                    onChange={handleInputChange}
                    onBlur={calculateEngagement}
                    placeholder="127000"
                  />
                </div>
                <div className="escrow-form-group">
                  <label>Following</label>
                  <input
                    type="number"
                    name="following"
                    value={formData.following}
                    onChange={handleInputChange}
                    placeholder="500"
                  />
                </div>
                <div className="escrow-form-group">
                  <label>Posts</label>
                  <input
                    type="number"
                    name="posts"
                    value={formData.posts}
                    onChange={handleInputChange}
                    placeholder="1500"
                  />
                </div>
              </div>

              <div className="escrow-form-row escrow-form-row-3">
                <div className="escrow-form-group">
                  <label>Avg Likes</label>
                  <input
                    type="number"
                    name="avgLikes"
                    value={formData.avgLikes}
                    onChange={handleInputChange}
                    onBlur={calculateEngagement}
                    placeholder="4000"
                  />
                </div>
                <div className="escrow-form-group">
                  <label>Avg Comments</label>
                  <input
                    type="number"
                    name="avgComments"
                    value={formData.avgComments}
                    onChange={handleInputChange}
                    onBlur={calculateEngagement}
                    placeholder="150"
                  />
                </div>
                <div className="escrow-form-group">
                  <label>Engagement Rate (%)</label>
                  <input
                    type="text"
                    name="engagementRate"
                    value={formData.engagementRate}
                    onChange={handleInputChange}
                    placeholder="3.5"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 'pricing' && (
            <div className="escrow-form-section">
              <h3>Pricing & Description</h3>

              <div className="escrow-form-row">
                <div className="escrow-form-group">
                  <label>Asking Price (USD) *</label>
                  <input
                    type="number"
                    name="askingPrice"
                    value={formData.askingPrice}
                    onChange={handleInputChange}
                    placeholder="3000"
                    min={ESCROW_CONFIG.MINIMUM_LISTING_PRICE}
                  />
                </div>
                <div className="escrow-form-group">
                  <label>Minimum Offer (USD)</label>
                  <input
                    type="number"
                    name="minimumOffer"
                    value={formData.minimumOffer}
                    onChange={handleInputChange}
                    placeholder="2500"
                  />
                </div>
              </div>

              {/* Fee Preview */}
              {parseFloat(formData.askingPrice) > 0 && (
                <div className="escrow-fee-preview">
                  <h4>Fee Breakdown</h4>
                  <div className="escrow-fee-row">
                    <span>Sale Price</span>
                    <span>{formatCurrency(feePreview.salePrice)}</span>
                  </div>
                  <div className="escrow-fee-row escrow-fee-deduct">
                    <span>Platform Fee (10%)</span>
                    <span>-{formatCurrency(feePreview.platformFee)}</span>
                  </div>
                  <div className="escrow-fee-row escrow-fee-total">
                    <span>You Receive</span>
                    <span>{formatCurrency(feePreview.sellerReceives)}</span>
                  </div>
                </div>
              )}

              <div className="escrow-form-row">
                <div className="escrow-form-group escrow-checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="acceptsOffers"
                      checked={formData.acceptsOffers}
                      onChange={handleInputChange}
                    />
                    Accept Offers
                  </label>
                </div>
                <div className="escrow-form-group escrow-checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="buyNowEnabled"
                      checked={formData.buyNowEnabled}
                      onChange={handleInputChange}
                    />
                    Enable Buy Now
                  </label>
                </div>
              </div>

              {formData.buyNowEnabled && (
                <div className="escrow-form-group">
                  <label>Buy Now Price (USD)</label>
                  <input
                    type="number"
                    name="buyNowPrice"
                    value={formData.buyNowPrice}
                    onChange={handleInputChange}
                    placeholder="3500"
                  />
                </div>
              )}

              <div className="escrow-form-group">
                <label>Listing Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Premium Lifestyle Account - 127K Engaged Followers"
                />
              </div>

              <div className="escrow-form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your account, its history, growth, and why it's valuable..."
                  rows={5}
                />
              </div>

              <div className="escrow-form-group">
                <label>Highlights (up to 3)</label>
                {formData.highlights.map((h, i) => (
                  <input
                    key={i}
                    type="text"
                    value={h}
                    onChange={e => handleHighlightChange(i, e.target.value)}
                    placeholder={`Highlight ${i + 1}`}
                    style={{ marginBottom: '8px' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Assets */}
          {step === 'assets' && (
            <div className="escrow-form-section">
              <h3>Assets Included</h3>

              <div className="escrow-assets-grid">
                <label className="escrow-asset-item">
                  <input
                    type="checkbox"
                    name="emailIncluded"
                    checked={formData.emailIncluded}
                    onChange={handleInputChange}
                  />
                  <span className="escrow-asset-label">Email Access</span>
                  <span className="escrow-asset-desc">Login email provided</span>
                </label>

                <label className="escrow-asset-item">
                  <input
                    type="checkbox"
                    name="originalEmailIncluded"
                    checked={formData.originalEmailIncluded}
                    onChange={handleInputChange}
                  />
                  <span className="escrow-asset-label">Original Email</span>
                  <span className="escrow-asset-desc">Original creation email</span>
                </label>

                <label className="escrow-asset-item">
                  <input
                    type="checkbox"
                    name="contentLibraryIncluded"
                    checked={formData.contentLibraryIncluded}
                    onChange={handleInputChange}
                  />
                  <span className="escrow-asset-label">Content Library</span>
                  <span className="escrow-asset-desc">Raw photos/videos</span>
                </label>

                <label className="escrow-asset-item">
                  <input
                    type="checkbox"
                    name="brandDealsIncluded"
                    checked={formData.brandDealsIncluded}
                    onChange={handleInputChange}
                  />
                  <span className="escrow-asset-label">Brand Deals</span>
                  <span className="escrow-asset-desc">Existing partnerships</span>
                </label>

                <label className="escrow-asset-item">
                  <input
                    type="checkbox"
                    name="websiteIncluded"
                    checked={formData.websiteIncluded}
                    onChange={handleInputChange}
                  />
                  <span className="escrow-asset-label">Website/Domain</span>
                  <span className="escrow-asset-desc">Associated website</span>
                </label>
              </div>

              <div className="escrow-form-group">
                <label>Other Social Accounts (comma separated)</label>
                <input
                  type="text"
                  name="otherSocials"
                  value={formData.otherSocials}
                  onChange={handleInputChange}
                  placeholder="twitter, youtube"
                />
              </div>

              <h4>Monetization</h4>
              <div className="escrow-form-group escrow-checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="hasMonetization"
                    checked={formData.hasMonetization}
                    onChange={handleInputChange}
                  />
                  This account has monetization/revenue
                </label>
              </div>

              {formData.hasMonetization && (
                <div className="escrow-form-row">
                  <div className="escrow-form-group">
                    <label>Monthly Revenue (USD)</label>
                    <input
                      type="number"
                      name="monthlyRevenue"
                      value={formData.monthlyRevenue}
                      onChange={handleInputChange}
                      placeholder="500"
                    />
                  </div>
                  <div className="escrow-form-group">
                    <label>Revenue Source</label>
                    <input
                      type="text"
                      name="revenueSource"
                      value={formData.revenueSource}
                      onChange={handleInputChange}
                      placeholder="Sponsored posts, affiliates"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Terms */}
          {step === 'terms' && (
            <div className="escrow-form-section">
              <h3>Review & Terms</h3>

              <div className="escrow-review-summary">
                <div className="escrow-review-item">
                  <span className="escrow-review-label">Account</span>
                  <span className="escrow-review-value">{formData.handle} on {formData.platform}</span>
                </div>
                <div className="escrow-review-item">
                  <span className="escrow-review-label">Followers</span>
                  <span className="escrow-review-value">{parseInt(formData.followers).toLocaleString()}</span>
                </div>
                <div className="escrow-review-item">
                  <span className="escrow-review-label">Asking Price</span>
                  <span className="escrow-review-value">{formatCurrency(parseFloat(formData.askingPrice) || 0)}</span>
                </div>
                <div className="escrow-review-item">
                  <span className="escrow-review-label">You Receive</span>
                  <span className="escrow-review-value escrow-review-highlight">{formatCurrency(feePreview.sellerReceives)}</span>
                </div>
              </div>

              <div className="escrow-terms-box">
                <h4>Escrow Terms & Conditions</h4>
                <ul>
                  <li>You confirm you are the rightful owner of this account</li>
                  <li>All metrics and information provided are accurate</li>
                  <li>You will transfer credentials within 24 hours of payment</li>
                  <li>Platform fee of 10% will be deducted from the sale</li>
                  <li>Funds are held in escrow until buyer verification</li>
                  <li>Disputes will be resolved by platform mediation</li>
                </ul>
              </div>

              <div className="escrow-form-group escrow-checkbox-group">
                <label className="escrow-terms-accept">
                  <input
                    type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                  />
                  I accept the escrow terms and conditions
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="escrow-modal-footer">
          {step !== 'account' && (
            <button className="escrow-btn escrow-btn--secondary" onClick={prevStep}>
              Back
            </button>
          )}
          {step !== 'terms' ? (
            <button className="escrow-btn escrow-btn--primary" onClick={nextStep}>
              Continue
            </button>
          ) : (
            <button
              className="escrow-btn escrow-btn--primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.termsAccepted}
            >
              {isSubmitting ? 'Creating...' : 'Create Listing'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EscrowListingModal;
