'use client';

import { useTheme } from '@/app/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${theme}`}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </div>
      </div>

      <style jsx>{`
        .theme-toggle {
          position: fixed;
          bottom: 70px;
          left: 76px;
          z-index: 1100;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .theme-toggle-track {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          padding: 2px;
          transition: all 0.3s ease;
        }

        [data-theme="dark"] .theme-toggle-track {
          background: linear-gradient(135deg, #0a1a2e, #0d2840);
          border: 1.5px solid rgba(0, 255, 200, 0.25);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
        }

        [data-theme="light"] .theme-toggle-track {
          background: linear-gradient(135deg, #e2e8f0, #f0f4f8);
          border: 1.5px solid rgba(0, 0, 0, 0.12);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        .theme-toggle-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          transition: transform 0.3s ease;
        }

        .theme-toggle-thumb.dark {
          transform: translateX(0);
        }

        .theme-toggle-thumb.light {
          transform: translateX(20px);
        }

        .theme-toggle:hover .theme-toggle-track {
          border-color: rgba(0, 255, 200, 0.5);
        }

        [data-theme="light"] .theme-toggle:hover .theme-toggle-track {
          border-color: rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </button>
  );
}
