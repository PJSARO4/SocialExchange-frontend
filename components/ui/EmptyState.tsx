'use client';

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{title}</h3>
      {description && (
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.85rem', maxWidth: '400px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '0.75rem',
            padding: '0.6rem 1.5rem',
            background: 'rgba(63, 255, 220, 0.1)',
            border: '1px solid rgba(63, 255, 220, 0.3)',
            borderRadius: '8px',
            color: '#3fffdc',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(63, 255, 220, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(63, 255, 220, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(63, 255, 220, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
