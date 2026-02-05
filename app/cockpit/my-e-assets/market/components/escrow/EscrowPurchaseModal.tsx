'use client';

import React, { useState } from 'react';
import {
  EscrowListing,
  EscrowOffer,
  ESCROW_CONFIG,
  calculateFees,
  formatCurrency,
  calculateMinimumOffer,
} from '../../types/escrow';
import { createEscrowOffer, createEscrowTransaction } from '../../lib/escrow-store';
import './escrow.css';

interface EscrowPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (offer: EscrowOffer) => void;
  listing: EscrowListing;
  buyerId: string;
  buyerUsername: string;
  buyerEmail: string;
}

type PurchaseStep = 'details' | 'offer' | 'confirm';

export function EscrowPurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  listing,
  buyerId,
  buyerUsername,
  buyerEmail,
}: EscrowPurchaseModalProps) {
  const [step, setStep] = useState<PurchaseStep>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState(listing.askingPrice.toString());
  const [offerMessage, setOfferMessage] = useState('');
  const [isBuyNow, setIsBuyNow] = useState(false);

  if (!isOpen) return null;

  const amount = parseFloat(offerAmount) || 0;
  const fees = calculateFees(amount);
  const minimumOffer = calculateMinimumOffer(listing.askingPrice);

  const handleMakeOffer = async () => {
    setError(null);

    if (amount < minimumOffer) {
      setError(`Minimum offer is ${formatCurrency(minimumOffer)}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const offer = createEscrowOffer({
        listingId: listing.id,
        buyerId,
        buyerUsername,
        buyerEmail,
        buyerRating: 5.0,
        buyerCompletedPurchases: 0,
        buyerVerified: false,
        amount,
        message: offerMessage,
      });

      onSuccess(offer);
      onClose();
    } catch (err) {
      setError('Failed to submit offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyNow = async () => {
    if (!listing.buyNowEnabled || !listing.buyNowPrice) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Create an offer at buy-now price that's auto-accepted
      const offer = createEscrowOffer({
        listingId: listing.id,
        buyerId,
        buyerUsername,
        buyerEmail,
        buyerRating: 5.0,
        buyerCompletedPurchases: 0,
        buyerVerified: false,
        amount: listing.buyNowPrice,
        message: 'Buy Now',
      });

      // Auto-accept and create transaction
      // In production, this would trigger payment flow
      onSuccess(offer);
      onClose();
    } catch (err) {
      setError('Failed to process. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="escrow-modal-overlay" onClick={onClose}>
      <div className="escrow-modal escrow-modal--purchase" onClick={e => e.stopPropagation()}>
        <div className="escrow-modal-header">
          <h2>{step === 'details' ? 'Listing Details' : step === 'offer' ? 'Make an Offer' : 'Confirm Purchase'}</h2>
          <button className="escrow-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="escrow-modal-body">
          {error && <div className="escrow-error">{error}</div>}

          {/* Step 1: Listing Details */}
          {step === 'details' && (
            <div className="escrow-purchase-details">
              {/* Listing Header */}
              <div className="escrow-listing-header">
                <div className="escrow-listing-avatar">
                  {listing.profileImageUrl ? (
                    <img src={listing.profileImageUrl} alt={listing.displayName} />
                  ) : (
                    <div className="escrow-listing-avatar-placeholder">
                      {listing.displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="escrow-listing-info">
                  <h3>{listing.displayName}</h3>
                  <span className="escrow-listing-handle">{listing.handle}</span>
                  <span className="escrow-listing-platform">{listing.platform}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="escrow-metrics-grid">
                <div className="escrow-metric">
                  <span className="escrow-metric-value">{listing.metrics.followers.toLocaleString()}</span>
                  <span className="escrow-metric-label">Followers</span>
                </div>
                <div className="escrow-metric">
                  <span className="escrow-metric-value">{listing.metrics.engagementRate.toFixed(2)}%</span>
                  <span className="escrow-metric-label">Engagement</span>
                </div>
                <div className="escrow-metric">
                  <span className="escrow-metric-value">{listing.metrics.posts.toLocaleString()}</span>
                  <span className="escrow-metric-label">Posts</span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="escrow-listing-content">
                <h4>{listing.title}</h4>
                <p>{listing.description}</p>

                {listing.highlights.length > 0 && (
                  <ul className="escrow-listing-highlights">
                    {listing.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Assets Included */}
              <div className="escrow-assets-summary">
                <h5>Assets Included</h5>
                <div className="escrow-assets-tags">
                  {listing.assetsIncluded.email && <span className="escrow-asset-tag">Email</span>}
                  {listing.assetsIncluded.originalEmail && <span className="escrow-asset-tag">Original Email</span>}
                  {listing.assetsIncluded.contentLibrary && <span className="escrow-asset-tag">Content Library</span>}
                  {listing.assetsIncluded.brandDeals && <span className="escrow-asset-tag">Brand Deals</span>}
                  {listing.assetsIncluded.website && <span className="escrow-asset-tag">Website</span>}
                </div>
              </div>

              {/* Seller Info */}
              <div className="escrow-seller-info">
                <h5>Seller</h5>
                <div className="escrow-seller-row">
                  <span>{listing.sellerUsername}</span>
                  <span className="escrow-seller-rating">
                    {listing.sellerRating.toFixed(1)} ({listing.sellerCompletedSales} sales)
                    {listing.sellerVerified && <span className="escrow-verified-badge">Verified</span>}
                  </span>
                </div>
              </div>

              {/* Pricing */}
              <div className="escrow-pricing-box">
                <div className="escrow-price-main">
                  <span className="escrow-price-label">Asking Price</span>
                  <span className="escrow-price-value">{formatCurrency(listing.askingPrice)}</span>
                </div>
                {listing.acceptsOffers && (
                  <div className="escrow-price-sub">
                    Minimum offer: {formatCurrency(minimumOffer)}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="escrow-purchase-actions">
                {listing.acceptsOffers && (
                  <button
                    className="escrow-btn escrow-btn--secondary"
                    onClick={() => {
                      setIsBuyNow(false);
                      setStep('offer');
                    }}
                  >
                    Make an Offer
                  </button>
                )}
                {listing.buyNowEnabled && listing.buyNowPrice && (
                  <button
                    className="escrow-btn escrow-btn--primary"
                    onClick={() => {
                      setIsBuyNow(true);
                      setOfferAmount(listing.buyNowPrice!.toString());
                      setStep('confirm');
                    }}
                  >
                    Buy Now - {formatCurrency(listing.buyNowPrice)}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Make Offer */}
          {step === 'offer' && (
            <div className="escrow-offer-form">
              <div className="escrow-form-group">
                <label>Your Offer (USD)</label>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={e => setOfferAmount(e.target.value)}
                  min={minimumOffer}
                  placeholder={listing.askingPrice.toString()}
                  className="escrow-offer-input"
                />
                <span className="escrow-form-hint">
                  Minimum: {formatCurrency(minimumOffer)} | Asking: {formatCurrency(listing.askingPrice)}
                </span>
              </div>

              {/* Fee Preview */}
              <div className="escrow-fee-preview">
                <h4>Fee Breakdown</h4>
                <div className="escrow-fee-row">
                  <span>Offer Amount</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
                <div className="escrow-fee-row escrow-fee-add">
                  <span>Escrow Fee (2.5%)</span>
                  <span>+{formatCurrency(fees.escrowFee)}</span>
                </div>
                <div className="escrow-fee-row escrow-fee-add">
                  <span>Processing Fee</span>
                  <span>+{formatCurrency(fees.processingFee)}</span>
                </div>
                <div className="escrow-fee-row escrow-fee-total">
                  <span>Total You Pay</span>
                  <span>{formatCurrency(fees.totalBuyerPays)}</span>
                </div>
              </div>

              <div className="escrow-form-group">
                <label>Message to Seller (optional)</label>
                <textarea
                  value={offerMessage}
                  onChange={e => setOfferMessage(e.target.value)}
                  placeholder="Tell the seller why you're interested..."
                  rows={3}
                />
              </div>

              <div className="escrow-offer-note">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span>
                  Your offer will expire in {ESCROW_CONFIG.OFFER_EXPIRY_HOURS} hours if not accepted.
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="escrow-confirm-form">
              <div className="escrow-confirm-summary">
                <div className="escrow-confirm-account">
                  <span className="escrow-confirm-label">Account</span>
                  <span className="escrow-confirm-value">{listing.handle}</span>
                </div>
                <div className="escrow-confirm-price">
                  <span className="escrow-confirm-label">{isBuyNow ? 'Buy Now Price' : 'Your Offer'}</span>
                  <span className="escrow-confirm-value escrow-confirm-highlight">
                    {formatCurrency(amount)}
                  </span>
                </div>
              </div>

              <div className="escrow-fee-preview">
                <div className="escrow-fee-row">
                  <span>{isBuyNow ? 'Price' : 'Offer'}</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
                <div className="escrow-fee-row escrow-fee-add">
                  <span>Escrow Fee</span>
                  <span>+{formatCurrency(fees.escrowFee)}</span>
                </div>
                <div className="escrow-fee-row escrow-fee-add">
                  <span>Processing</span>
                  <span>+{formatCurrency(fees.processingFee)}</span>
                </div>
                <div className="escrow-fee-row escrow-fee-total">
                  <span>Total</span>
                  <span>{formatCurrency(fees.totalBuyerPays)}</span>
                </div>
              </div>

              <div className="escrow-protection-box">
                <h5>Buyer Protection</h5>
                <ul>
                  <li>Funds held securely until you verify the account</li>
                  <li>7-day verification period after receiving credentials</li>
                  <li>Full refund if account doesn't match listing</li>
                  <li>Dispute resolution if issues arise</li>
                </ul>
              </div>

              <div className="escrow-confirm-note">
                {isBuyNow ? (
                  <p>By clicking "Confirm Purchase", you agree to buy this account at the Buy Now price. Payment will be processed immediately.</p>
                ) : (
                  <p>By clicking "Submit Offer", your offer will be sent to the seller. If accepted, you will have {ESCROW_CONFIG.PAYMENT_WINDOW_HOURS} hours to complete payment.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="escrow-modal-footer">
          {step !== 'details' && (
            <button
              className="escrow-btn escrow-btn--secondary"
              onClick={() => setStep(step === 'confirm' ? (isBuyNow ? 'details' : 'offer') : 'details')}
            >
              Back
            </button>
          )}
          {step === 'offer' && (
            <button
              className="escrow-btn escrow-btn--primary"
              onClick={() => setStep('confirm')}
              disabled={amount < minimumOffer}
            >
              Review Offer
            </button>
          )}
          {step === 'confirm' && (
            <button
              className="escrow-btn escrow-btn--primary"
              onClick={isBuyNow ? handleBuyNow : handleMakeOffer}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : isBuyNow ? 'Confirm Purchase' : 'Submit Offer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EscrowPurchaseModal;
