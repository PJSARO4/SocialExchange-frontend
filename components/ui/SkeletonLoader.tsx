'use client';

export default function SkeletonLoader({
  width = '100%',
  height = '1rem',
  borderRadius = '6px',
  className = '',
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)',
        backgroundSize: '200% 100%',
        animation: 'ui-skeleton-pulse 1.5s ease-in-out infinite',
      }}
    >
      <style jsx>{`
        @keyframes ui-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
