'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';

import { createBrandListing, goPublic, getMyBrands, getBrandById } from '../lib/e-shares-api';
import ErrorBoundary from '@/components/ErrorBoundary';
import '../e-shares.css';

type IPOStep = 'brand' | 'setup' | 'details' | 'review';

interface IPOFormData {
  brandId: string;
  brandName: string;
  tickerSymbol: string;
  totalShares: number;
  initialPrice: number;
  founderRetainPercent: number;
}

const INITIAL_FORM_DATA: IPOFormData = {
  brandId: '',
  brandName: '',
  tickerSymbol: '',
  totalShares: 10000,
  initialPrice: 1.0,
  founderRetainPercent: 30,
};

export default function IPOPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<IPOStep>('brand');
  const [formData, setFormData] = useState<IPOFormData>(INITIAL_FORM_DATA);
  const [myBrands, setMyBrands] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = 'demo-user-main';
  const completedSteps = {
    brand: formData.brandId !== '',
    setup: formData.tickerSymbol !== '' && formData.totalShares > 0,
    details: formData.initialPrice > 0 && formData.founderRetainPercent >= 0,
  };

  useEffect(() => {
    const brands = getMyBrands(currentUserId);
    setMyBrands(brands);
    setIsLoading(false);
  }, [currentUserId]);

  const handleInputChange = (field: keyof IPOFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBrandSelect = (brandId: string) => {
    const brand = myBrands.find((b) => b.id === brandId);
    if (brand) {
      setFormData((prev) => ({
        ...prev,
        brandId,
        brandName: brand.brandName || '',
      }));
      setCurrentStep('setup');
    }
  };

  const handleNext = () => {
    if (currentStep === 'brand') {
      if (completedSteps.brand) setCurrentStep('setup');
    } else if (currentStep === 'setup') {
      if (completedSteps.setup) setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (completedSteps.details) setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'setup') setCurrentStep('brand');
    else if (currentStep === 'details') setCurrentStep('setup');
    else if (currentStep === 'review') setCurrentStep('details');
  };

  const handleLaunch = async () => {
    if (!formData.brandId) {
      setMessage({ type: 'error', text: 'Please select a brand' });
      return;
    }

    setIsProcessing(true);
    try {
      // Update brand with IPO details before going public
      const brand = getBrandById(formData.brandId);
      if (brand) {
        brand.id = formData.tickerSymbol.toLowerCase();
        brand.totalShares = formData.totalShares;
        brand.pricePerShare = formData.initialPrice;
        brand.basePrice = formData.initialPrice;
        brand.marketCap = formData.totalShares * formData.initialPrice;
        brand.transparencyAgreementSigned = true;
        brand.transparencyAgreementDate = Date.now();

        // Save the updated brand
        const savedBrand = {
          ...brand,
          id: formData.brandId,
        };
        // Use the localStorage directly through a simple object manipulation
        const key = `e-shares-brand-${formData.brandId}`;
        localStorage.setItem(key, JSON.stringify(savedBrand));

        // Launch the IPO
        goPublic(formData.brandId);

        setMessage({
          type: 'success',
          text: 'Brand launched successfully!',
        });

        // Redirect after success
        setTimeout(() => {
          router.push('/cockpit/my-e-assets/my-e-shares');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: 'Brand not found',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Launch failed',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="e-shares-root">
        <div className="arena-loading">
          <div className="arena-spinner"></div>
          <p>Loading your brands...</p>
        </div>
      </div>
    );
  }

  const founderShares = (formData.totalShares * formData.founderRetainPercent) / 100;
  const publicShares = formData.totalShares - founderShares;
  const initialMarketCap = formData.totalShares * formData.initialPrice;

  return (
    <ErrorBoundary>
      <div className="e-shares-root">
        <button
          onClick={() => router.back()}
          className="holding-action"
          style={{ marginBottom: '2rem' }}
        >
          <ArrowLeft style={{ width: 14, height: 14, marginRight: 4 }} />
          Back
        </button>

        <div className="ipo-container">
          {/* Header */}
          <div className="e-shares-header">
            <h1 className="e-shares-title">Launch Your Brand</h1>
            <p className="e-shares-subtitle">
              Take your brand public and start trading on the Investment Arena
            </p>
          </div>

          {/* Stepper */}
          <div className="ipo-stepper">
            {[
              { id: 'brand', label: 'Select Brand' },
              { id: 'setup', label: 'Ticker & Shares' },
              { id: 'details', label: 'Pricing' },
              { id: 'review', label: 'Review' },
            ].map((step, idx) => {
              const isActive = currentStep === step.id;
              const isCompleted =
                (step.id === 'brand' && completedSteps.brand) ||
                (step.id === 'setup' && completedSteps.setup) ||
                (step.id === 'details' && completedSteps.details) ||
                (step.id === 'review' &&
                  completedSteps.brand &&
                  completedSteps.setup &&
                  completedSteps.details);

              return (
                <div
                  key={step.id}
                  className={`ipo-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="ipo-step-number">
                    {isCompleted ? <Check style={{ width: 20, height: 20 }} /> : idx + 1}
                  </div>
                  <div className="ipo-step-label">{step.label}</div>
                </div>
              );
            })}
          </div>

          {/* STEP 1: Brand Selection */}
          {currentStep === 'brand' && (
            <div className="ipo-form-container">
              <div className="ipo-form-title">Select Your Brand</div>
              <div className="ipo-form-description">
                Choose which brand you'd like to launch publicly on the Investment Arena. You can
                only launch brands you own.
              </div>

              {myBrands.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'rgba(255, 68, 68, 0.05)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                }}
                >
                  <AlertCircle style={{ width: 32, height: 32, margin: '0 auto 1rem', opacity: 0.5 }} />
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No Brands Yet</div>
                  <div style={{ fontSize: '0.875rem' }}>
                    You need to create or own a brand before launching an IPO. Go to the Feeds section
                    to set up your first brand.
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginTop: '1.5rem',
                }}
                >
                  {myBrands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleBrandSelect(brand.id)}
                      className={`brand-card ${formData.brandId === brand.id ? '' : ''}`}
                      style={{
                        padding: '1.5rem',
                        textAlign: 'left',
                        background:
                          formData.brandId === brand.id
                            ? 'rgba(0, 240, 255, 0.15)'
                            : 'var(--arena-glass)',
                        border:
                          formData.brandId === brand.id
                            ? '2px solid var(--neon-cyan)'
                            : '1px solid var(--arena-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.75rem',
                      }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            background: 'linear-gradient(135deg, #00f0ff, #ffa500)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#02040a',
                          }}
                        >
                          {brand.brandName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {brand.brandName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {brand.handle}
                          </div>
                        </div>
                      </div>
                      {brand.description && (
                        <div style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.4',
                        }}
                        >
                          {brand.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="ipo-form-actions">
                <button
                  className="ipo-button"
                  onClick={() => router.back()}
                >
                  Cancel
                </button>
                <button
                  className={`ipo-button primary ${!completedSteps.brand ? 'opacity-disabled' : ''}`}
                  onClick={handleNext}
                  disabled={!completedSteps.brand}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Ticker & Shares */}
          {currentStep === 'setup' && (
            <div className="ipo-form-container">
              <div className="ipo-form-title">Ticker Symbol & Share Structure</div>
              <div className="ipo-form-description">
                Define your ticker symbol and the total number of shares to issue. We recommend
                starting with 10,000 shares.
              </div>

              <div className="ipo-form-fields">
                <div className="ipo-form-field">
                  <label className="ipo-form-label">Ticker Symbol</label>
                  <input
                    type="text"
                    className="ipo-form-input"
                    placeholder="e.g., TECH, CREA, MARK"
                    value={formData.tickerSymbol}
                    onChange={(e) =>
                      handleInputChange('tickerSymbol', e.target.value.toUpperCase().slice(0, 6))
                    }
                    maxLength={6}
                  />
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.5rem',
                  }}
                  >
                    {formData.tickerSymbol.length}/6 characters
                  </div>
                </div>

                <div className="ipo-form-field">
                  <label className="ipo-form-label">Total Shares to Issue</label>
                  <input
                    type="number"
                    className="ipo-form-input"
                    placeholder="10000"
                    value={formData.totalShares}
                    onChange={(e) => handleInputChange('totalShares', parseInt(e.target.value) || 0)}
                    min={1000}
                    step={1000}
                  />
                </div>
              </div>

              <div className="ipo-form-actions">
                <button className="ipo-button" onClick={handleBack}>
                  Back
                </button>
                <button
                  className={`ipo-button primary ${!completedSteps.setup ? 'opacity-disabled' : ''}`}
                  onClick={handleNext}
                  disabled={!completedSteps.setup}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing */}
          {currentStep === 'details' && (
            <div className="ipo-form-container">
              <div className="ipo-form-title">Pricing & Distribution</div>
              <div className="ipo-form-description">
                Set your initial share price and decide what percentage of shares to retain as the
                founder.
              </div>

              <div className="ipo-form-fields">
                <div className="ipo-form-field">
                  <label className="ipo-form-label">Initial Price per Share (USD)</label>
                  <input
                    type="number"
                    className="ipo-form-input"
                    placeholder="1.00"
                    value={formData.initialPrice}
                    onChange={(e) => handleInputChange('initialPrice', parseFloat(e.target.value) || 0)}
                    min={0.01}
                    step={0.01}
                  />
                </div>

                <div className="ipo-form-field">
                  <label className="ipo-form-label">Founder Retention %</label>
                  <input
                    type="range"
                    className="ipo-form-input"
                    style={{
                      cursor: 'pointer',
                      padding: 0,
                      height: '6px',
                      background: `linear-gradient(to right, var(--neon-cyan) 0%, var(--neon-cyan) ${formData.founderRetainPercent}%, var(--arena-border) ${formData.founderRetainPercent}%, var(--arena-border) 100%)`,
                    }}
                    value={formData.founderRetainPercent}
                    onChange={(e) => handleInputChange('founderRetainPercent', parseInt(e.target.value) || 0)}
                    min={0}
                    max={100}
                  />
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginTop: '0.75rem',
                    fontSize: '0.875rem',
                  }}
                  >
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>You Keep</div>
                      <div style={{ fontWeight: 600, color: 'var(--neon-cyan)', fontSize: '1rem' }}>
                        {founderShares.toLocaleString()} shares
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Public Offering</div>
                      <div style={{ fontWeight: 600, color: 'var(--neon-green)', fontSize: '1rem' }}>
                        {publicShares.toLocaleString()} shares
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ipo-form-actions">
                <button className="ipo-button" onClick={handleBack}>
                  Back
                </button>
                <button
                  className={`ipo-button primary ${!completedSteps.details ? 'opacity-disabled' : ''}`}
                  onClick={handleNext}
                  disabled={!completedSteps.details}
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {currentStep === 'review' && (
            <div className="ipo-form-container">
              <div className="ipo-form-title">Review & Launch</div>
              <div className="ipo-form-description">
                Review your IPO details below. Once launched, your brand will be live on the
                Investment Arena.
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'rgba(0, 240, 255, 0.02)',
                border: '1px solid var(--arena-border)',
                borderRadius: '8px',
              }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Brand
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{formData.brandName}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Ticker
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--neon-cyan)' }}>
                    ${formData.tickerSymbol}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Initial Price
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    ${formData.initialPrice.toFixed(2)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Initial Market Cap
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                    ${initialMarketCap.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Share Distribution
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginTop: '0.75rem',
                  }}
                  >
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(0, 240, 255, 0.05)',
                      borderRadius: '4px',
                      border: '1px solid var(--neon-cyan)',
                    }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your Shares</div>
                      <div style={{ fontWeight: 600, color: 'var(--neon-cyan)' }}>
                        {founderShares.toLocaleString()} ({formData.founderRetainPercent}%)
                      </div>
                    </div>
                    <div style={{
                      padding: '0.75rem',
                      background: 'rgba(0, 255, 136, 0.05)',
                      borderRadius: '4px',
                      border: '1px solid var(--neon-green)',
                    }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Public Offering</div>
                      <div style={{ fontWeight: 600, color: 'var(--neon-green)' }}>
                        {publicShares.toLocaleString()} ({100 - formData.founderRetainPercent}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {message && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: message.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                  color: message.type === 'success' ? 'var(--neon-green)' : 'var(--neon-red)',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                }}
                >
                  {message.text}
                </div>
              )}

              <div className="ipo-form-actions">
                <button className="ipo-button" onClick={handleBack} disabled={isProcessing}>
                  Back
                </button>
                <button
                  className="ipo-button primary"
                  onClick={handleLaunch}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Launching...' : 'Launch IPO'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
