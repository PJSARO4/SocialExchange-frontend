'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a safe fallback if context not available
    return {
      addToast: (type: ToastType, message: string) => {
        console.log(`[Toast ${type}]: ${message}`);
      },
      removeToast: () => {},
    };
  }
  return context;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: '\u2705',
  error: '\u26A0\uFE0F',
  info: '\u2139\uFE0F',
  warning: '\u26A1',
};

const TOAST_COLORS: Record<ToastType, { border: string; bg: string; text: string }> = {
  success: {
    border: 'rgba(16, 185, 129, 0.5)',
    bg: 'rgba(16, 185, 129, 0.1)',
    text: '#10b981',
  },
  error: {
    border: 'rgba(239, 68, 68, 0.5)',
    bg: 'rgba(239, 68, 68, 0.1)',
    text: '#ef4444',
  },
  info: {
    border: 'rgba(0, 224, 255, 0.5)',
    bg: 'rgba(0, 224, 255, 0.1)',
    text: '#00e0ff',
  },
  warning: {
    border: 'rgba(255, 200, 0, 0.5)',
    bg: 'rgba(255, 200, 0, 0.1)',
    text: '#ffc800',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timerRef = useRef<Record<string, NodeJS.Timeout>>({});

  const removeToast = useCallback((id: string) => {
    if (timerRef.current[id]) {
      clearTimeout(timerRef.current[id]);
      delete timerRef.current[id];
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast: Toast = { id, type, message, duration };
    setToasts(prev => [...prev.slice(-4), toast]); // Max 5 toasts

    timerRef.current[id] = setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxWidth: '360px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const colors = TOAST_COLORS[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                backdropFilter: 'blur(12px)',
                color: '#e0e0e0',
                fontSize: '0.85rem',
                fontFamily: "'SF Mono', 'Consolas', monospace",
                animation: 'toastSlideIn 0.3s ease-out',
                pointerEvents: 'auto',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}
              onClick={() => removeToast(toast.id)}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                {TOAST_ICONS[toast.type]}
              </span>
              <span style={{ flex: 1, color: colors.text, lineHeight: 1.4 }}>
                {toast.message}
              </span>
              <span
                style={{
                  color: '#666',
                  fontSize: '1rem',
                  flexShrink: 0,
                  marginLeft: '0.5rem',
                }}
              >
                x
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
