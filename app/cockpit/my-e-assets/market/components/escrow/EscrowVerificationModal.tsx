'use client';

import React, { useState, useEffect } from 'react';
import {
  EscrowTransaction,
  VerificationItem,
  DisputeReason,
  DISPUTE_REASONS,
  getTimeRemaining,
} from '../../types/escrow';
import {
  updateVerificationItem,
  completeVerification,
  raiseDispute,
} from '../../lib/escrow-store';
import './escrow.css';

interface EscrowVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (transaction: EscrowTransaction) => void;
  transaction: EscrowTransaction;
}

export function EscrowVerificationModal({
  isOpen,
  onClose,
  onComplete,
  transaction,
}: EscrowVerificationModalProps) {
  const [checklist, setChecklist] = useState<VerificationItem[]>(transaction.verification.checklist);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState<DisputeReason>('credentials_invalid');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');

  // Update countdown
  useEffect(() => {
    if (!transaction.verificationDeadline) return;

    const updateTimer = () => {
      const remaining = getTimeRemaining(transaction.verificationDeadline!);
      setTimeRemaining(remaining.display);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [transaction.verificationDeadline]);

  if (!isOpen) return null;

  const allRequiredChecked = checklist
    .filter(item => item.required)
    .every(item => item.checked);

  const checkedCount = checklist.filter(item => item.checked).length;

  const handleCheck = (itemId: string, checked: boolean) => {
    const updated = updateVerificationItem(transaction.id, itemId, checked);
    if (updated) {
      setChecklist(updated.verification.checklist);
    }
  };

  const handleComplete = async () => {
    if (!allRequiredChecked) {
      setError('Please verify all required items before completing');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = completeVerification(transaction.id);
      if (updated) {
        onComplete(updated);
        onClose();
      } else {
        setError('Failed to complete verification');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeDescription.trim()) {
      setError('Please describe the issue');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = raiseDispute(
        transaction.id,
        disputeReason,
        disputeDescription,
        'buyer'
      );
      if (updated) {
        onComplete(updated);
        onClose();
      } else {
        setError('Failed to raise dispute');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="escrow-modal-overlay" onClick={onClose}>
      <div className="escrow-modal escrow-modal--verification" onClick={e => e.stopPropagation()}>
        <div className="escrow-modal-header">
          <h2>{showDispute ? 'Raise a Dispute' : 'Verify Account Access'}</h2>
          <button className="escrow-modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="escrow-modal-body">
          {error && <div className="escrow-error">{error}</div>}

          {!showDispute ? (
            <>
              {/* Countdown Timer */}
              {timeRemaining && (
                <div className="escrow-verification-timer">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  <span>Verification period ends in: <strong>{timeRemaining}</strong></span>
                </div>
              )}

              {/* Progress */}
              <div className="escrow-verification-progress">
                <div className="escrow-verification-progress-bar">
                  <div
                    className="escrow-verification-progress-fill"
                    style={{ width: `${(checkedCount / checklist.length) * 100}%` }}
                  />
                </div>
                <span>{checkedCount} of {checklist.length} verified</span>
              </div>

              {/* Instructions */}
              <div className="escrow-verification-instructions">
                <p>
                  Please verify each item below to confirm the account matches the listing.
                  Once all required items are checked, you can complete the verification
                  and release funds to the seller.
                </p>
              </div>

              {/* Checklist */}
              <div className="escrow-verification-checklist">
                {checklist.map(item => (
                  <label
                    key={item.id}
                    className={`escrow-verification-item ${item.checked ? 'checked' : ''} ${item.required ? 'required' : ''}`}
                  >
                    <div className="escrow-verification-checkbox">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={e => handleCheck(item.id, e.target.checked)}
                      />
                      <span className="escrow-verification-checkmark">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div className="escrow-verification-content">
                      <span className="escrow-verification-label">
                        {item.label}
                        {item.required && <span className="escrow-required-mark">*</span>}
                      </span>
                      <span className="escrow-verification-desc">{item.description}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Important Notes */}
              <div className="escrow-verification-notes">
                <h4>Important</h4>
                <ul>
                  <li>Take your time to thoroughly verify the account</li>
                  <li>Change the password immediately after logging in</li>
                  <li>Check that follower count matches (within 5%)</li>
                  <li>If anything doesn't match, raise a dispute</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="escrow-verification-actions">
                <button
                  className="escrow-btn escrow-btn--danger"
                  onClick={() => setShowDispute(true)}
                >
                  Something's Wrong - Raise Dispute
                </button>
                <button
                  className="escrow-btn escrow-btn--primary"
                  onClick={handleComplete}
                  disabled={!allRequiredChecked || isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Complete Verification & Release Funds'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Dispute Form */}
              <div className="escrow-dispute-form">
                <div className="escrow-form-group">
                  <label>What's the issue?</label>
                  <select
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value as DisputeReason)}
                    className="escrow-select"
                  >
                    {Object.entries(DISPUTE_REASONS).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                  <span className="escrow-form-hint">
                    {DISPUTE_REASONS[disputeReason].description}
                  </span>
                </div>

                <div className="escrow-form-group">
                  <label>Describe the issue in detail</label>
                  <textarea
                    value={disputeDescription}
                    onChange={e => setDisputeDescription(e.target.value)}
                    placeholder="Please provide as much detail as possible about what's wrong..."
                    rows={5}
                  />
                </div>

                <div className="escrow-dispute-warning">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                  </svg>
                  <div>
                    <strong>Before raising a dispute:</strong>
                    <ul>
                      <li>Make sure you've tried all provided credentials</li>
                      <li>Contact the seller through messages first</li>
                      <li>Disputes are reviewed by platform moderators</li>
                      <li>False disputes may result in account penalties</li>
                    </ul>
                  </div>
                </div>

                <div className="escrow-dispute-actions">
                  <button
                    className="escrow-btn escrow-btn--secondary"
                    onClick={() => setShowDispute(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="escrow-btn escrow-btn--danger"
                    onClick={handleRaiseDispute}
                    disabled={isSubmitting || !disputeDescription.trim()}
                  >
                    {isSubmitting ? 'Submitting...' : 'Raise Dispute'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default EscrowVerificationModal;
