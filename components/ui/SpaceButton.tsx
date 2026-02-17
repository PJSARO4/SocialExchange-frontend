'use client';

export default function SpaceButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const colors = {
    primary: { bg: 'rgba(63, 255, 220, 0.1)', border: 'rgba(63, 255, 220, 0.3)', text: '#3fffdc', glow: 'rgba(63, 255, 220, 0.15)' },
    secondary: { bg: 'rgba(0, 212, 255, 0.1)', border: 'rgba(0, 212, 255, 0.3)', text: '#00d4ff', glow: 'rgba(0, 212, 255, 0.15)' },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444', glow: 'rgba(239, 68, 68, 0.15)' },
    ghost: { bg: 'transparent', border: 'rgba(255, 255, 255, 0.1)', text: 'rgba(255, 255, 255, 0.7)', glow: 'rgba(255, 255, 255, 0.05)' },
  };

  const sizes = {
    sm: { padding: '0.35rem 0.9rem', fontSize: '0.75rem' },
    md: { padding: '0.55rem 1.25rem', fontSize: '0.85rem' },
    lg: { padding: '0.75rem 1.75rem', fontSize: '0.95rem' },
  };

  const c = colors[variant];
  const s = sizes[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        padding: s.padding,
        fontSize: s.fontSize,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '8px',
        color: c.text,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : 'auto',
        letterSpacing: '0.02em',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = `0 0 20px ${c.glow}`;
          e.currentTarget.style.borderColor = c.text;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = c.border;
      }}
    >
      {children}
    </button>
  );
}
