'use client';

import React, { useState, useEffect } from 'react';
import {
  EscrowTransaction,
  EscrowStatus,
  ESCROW_STATUS_INFO,
  ESCROW_STEPS,
  getCurrentStep,
  getTimeRemaining,
  formatCurrency,
  getActionLabel,
  isTerminalStatus,
} from '../../types/escrow';
import './escrow.css';

interface EscrowStatusCardProps {
  transaction: EscrowTransaction;
  userRole: 'buyer' | 'seller';
  onAction: (action: string) => void;
}

export function EscrowStatusCard({ transaction, userRole, onAction }: EscrowStatusCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const statusInfo = ESCROW_STATUS_INFO[transaction.status];
  const currentStep = getCurrentStep(transaction.status);
  const isComplete = isTerminalStatus(transaction.status);

  // Update countdown timer
  useEffect(() => {
    const getDeadline = () => {
      if (transaction.status === 'offer_accepted') return transaction.paymentDeadline;
      if (transaction.status === 'funds_held') return transaction.credentialDeadline;
      if (transaction.status === 'credentials_sent' || transaction.status === 'verification_pending') {
        return transaction.verificationDeadline;
      }
      return null;
    };

    const deadline = getDeadline();
    if (!deadline) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const remaining = getTimeRemaining(deadline);
      setTimeRemaining(remaining.display);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [transaction]);

  const actions = userRole === 'buyer'
    ? statusInfo.buyerActions
    : statusInfo.sellerActions;

  return (
    <div className="escrow-status-card">
      {/* Progress Bar */}
      <div className="escrow-progress">
        <div className="escrow-progress-bar">
          {ESCROW_STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep || isComplete;
            const isFailed = transaction.status === 'disputed' ||
                            transaction.status === 'refunded' ||
                            transaction.status === 'cancelled' ||
                            transaction.status === 'expired';

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`escrow-progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isFailed && isActive ? 'failed' : ''}`}
                  title={step.description}
                >
                  <div className="escrow-progress-step-circle">
                    {isCompleted ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    ) : isFailed && isActive ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span className="escrow-progress-step-label">{step.shortLabel}</span>
                </div>
                {index < ESCROW_STEPS.length - 1 && (
                  <div className={`escrow-progress-connector ${isCompleted ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Status Badge */}
      <div className="escrow-status-header">
        <div
          className="escrow-status-badge"
          style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color, borderColor: statusInfo.color }}
        >
          <span className="escrow-status-dot" style={{ backgroundColor: statusInfo.color }} />
          {statusInfo.label}
        </div>
        {timeRemaining && (
          <div className="escrow-countdown">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            <span>{timeRemaining}</span>
          </div>
        )}
      </div>

      {/* Status Description */}
      <p className="escrow-status-description">{statusInfo.description}</p>

      {/* Financial Summary */}
      <div className="escrow-financial-summary">
        <div className="escrow-financial-row">
          <span>Sale Price</span>
          <span className="escrow-amount">{formatCurrency(transaction.salePrice)}</span>
        </div>
        {userRole === 'buyer' && (
          <>
            <div className="escrow-financial-row escrow-financial-fee">
              <span>Escrow Fee</span>
              <span>{formatCurrency(transaction.escrowFee)}</span>
            </div>
            <div className="escrow-financial-row escrow-financial-fee">
              <span>Processing Fee</span>
              <span>{formatCurrency(transaction.processingFee)}</span>
            </div>
            <div className="escrow-financial-row escrow-financial-total">
              <span>Total You Pay</span>
              <span className="escrow-amount-highlight">{formatCurrency(transaction.totalBuyerPaid)}</span>
            </div>
          </>
        )}
        {userRole === 'seller' && (
          <>
            <div className="escrow-financial-row escrow-financial-fee">
              <span>Platform Fee (10%)</span>
              <span>-{formatCurrency(transaction.platformFee)}</span>
            </div>
            <div className="escrow-financial-row escrow-financial-total">
              <span>You Receive</span>
              <span className="escrow-amount-highlight">{formatCurrency(transaction.sellerPayout)}</span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className="escrow-actions">
          {actions.map(action => (
            <button
              key={action}
              className={`escrow-action-btn ${action.includes('dispute') || action.includes('reject') ? 'escrow-action-btn--danger' : 'escrow-action-btn--primary'}`}
              onClick={() => onAction(action)}
            >
              {getActionLabel(action)}
            </button>
          ))}
        </div>
      )}

      {/* Status History Timeline */}
      <div className="escrow-timeline">
        <h4 className="escrow-timeline-title">Transaction History</h4>
        <div className="escrow-timeline-items">
          {transaction.statusHistory.slice().reverse().map((entry, index) => {
            const entryInfo = ESCROW_STATUS_INFO[entry.status];
            return (
              <div key={index} className="escrow-timeline-item">
                <div
                  className="escrow-timeline-dot"
                  style={{ backgroundColor: entryInfo.color }}
                />
                <div className="escrow-timeline-content">
                  <div className="escrow-timeline-header">
                    <span className="escrow-timeline-status">{entryInfo.label}</span>
                    <span className="escrow-timeline-actor">{entry.actor}</span>
                  </div>
                  <span className="escrow-timeline-time">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  {entry.note && (
                    <p className="escrow-timeline-note">{entry.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Escrow ID */}
      <div className="escrow-id">
        <span>Escrow ID:</span>
        <code>{transaction.escrowId}</code>
      </div>
    </div>
  );
}

export default EscrowStatusCard;
