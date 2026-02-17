'use client';

export default function LoadingSpinner({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: size,
          height: size,
          border: '2px solid rgba(63, 255, 220, 0.15)',
          borderTopColor: '#3fffdc',
          borderRadius: '50%',
          animation: 'ui-spin 1s linear infinite',
        }}
      />
      <style jsx>{`
        @keyframes ui-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
