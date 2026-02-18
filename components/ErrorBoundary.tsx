'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            padding: '2rem',
            background: 'rgba(2, 4, 9, 0.95)',
            border: '1px solid rgba(63, 255, 220, 0.2)',
            borderRadius: '12px',
            textAlign: 'center',
            gap: '1rem',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(63, 255, 220, 0.08)',
              border: '1px solid rgba(63, 255, 220, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3fffdc"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '0.02em',
            }}
          >
            Something went wrong
          </h2>

          {/* Subtitle */}
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: '#9ca3af',
              maxWidth: '400px',
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred while rendering this section.
            Please try again or navigate to a different page.
          </p>

          {/* Error message in dev mode */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre
              style={{
                margin: 0,
                padding: '0.75rem 1rem',
                background: 'rgba(255, 59, 48, 0.08)',
                border: '1px solid rgba(255, 59, 48, 0.2)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#ff6b6b',
                maxWidth: '500px',
                overflow: 'auto',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          {/* Try Again button */}
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '0.5rem',
              padding: '0.625rem 1.5rem',
              background: 'linear-gradient(135deg, #3fffdc 0%, #00d4ff 100%)',
              color: '#020409',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.opacity = '1';
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
