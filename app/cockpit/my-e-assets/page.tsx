'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  getMyHoldings,
  getMyBrands,
  getMarketStats,
  seedESharesMarketIfEmpty,
} from './my-e-shares/lib/e-shares-store';

export default function MyEAssetsPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    portfolioValue: 0,
    holdingsCount: 0,
    brandsListed: 0,
    totalMarketCap: 0,
  });

  // Demo user ID
  const currentUserId = 'demo-user-main';

  useEffect(() => {
    seedESharesMarketIfEmpty();

    const holdings = getMyHoldings(currentUserId);
    const myBrands = getMyBrands(currentUserId);
    const marketStats = getMarketStats();

    const portfolioValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

    setStats({
      portfolioValue,
      holdingsCount: holdings.length,
      brandsListed: myBrands.length,
      totalMarketCap: marketStats.totalMarketCap,
    });
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '900px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#fff' }}>
        My E-Assets
      </h1>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
        Manage your digital social assets and investments
      </p>

      {/* Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            padding: '1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#3fffdc',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            ${stats.portfolioValue.toFixed(2)}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '0.25rem',
            }}
          >
            Portfolio Value
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#fff',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {stats.holdingsCount}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '0.25rem',
            }}
          >
            Holdings
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#fff',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {stats.brandsListed}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '0.25rem',
            }}
          >
            My Brands
          </div>
        </div>

        <div
          style={{
            padding: '1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#fff',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            ${stats.totalMarketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: '0.25rem',
            }}
          >
            Market Cap
          </div>
        </div>
      </div>

      {/* Asset Categories */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* E-Shares Card */}
        <div
          onClick={() => router.push('/cockpit/my-e-assets/my-e-shares')}
          style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(63, 255, 220, 0.1) 0%, rgba(0, 180, 216, 0.05) 100%)',
            border: '1px solid rgba(63, 255, 220, 0.3)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(63, 255, 220, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              marginBottom: '0.75rem',
            }}
          >
            📈
          </div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#3fffdc',
              marginBottom: '0.5rem',
            }}
          >
            E-Shares
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#9ca3af',
              lineHeight: 1.5,
              marginBottom: '1rem',
            }}
          >
            Invest in digital brands, support creators, and grow your portfolio.
            Browse the marketplace or list your own brand.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(63, 255, 220, 0.2)',
                borderRadius: '4px',
                color: '#3fffdc',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
              }}
            >
              Marketplace
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(63, 255, 220, 0.2)',
                borderRadius: '4px',
                color: '#3fffdc',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
              }}
            >
              Portfolio
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(63, 255, 220, 0.2)',
                borderRadius: '4px',
                color: '#3fffdc',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
              }}
            >
              List Brand
            </span>
          </div>
          <div
            style={{
              marginTop: '1rem',
              fontSize: '0.8125rem',
              color: '#3fffdc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            Enter E-Shares →
          </div>
        </div>

        {/* My Feeds Card */}
        <div
          onClick={() => router.push('/cockpit/my-e-assets/my-feeds')}
          style={{
            padding: '1.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              marginBottom: '0.75rem',
            }}
          >
            📱
          </div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '0.5rem',
            }}
          >
            My Feeds
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#9ca3af',
              lineHeight: 1.5,
              marginBottom: '1rem',
            }}
          >
            Manage your connected social accounts, schedule content, and
            automate your posting workflow.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
              }}
            >
              Scheduler
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
              }}
            >
              Automation
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.25px',
              }}
            >
              Analytics
            </span>
          </div>
          <div
            style={{
              marginTop: '1rem',
              fontSize: '0.8125rem',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            Manage Feeds →
          </div>
        </div>
      </div>

      {/* Transparency Notice */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#f59e0b',
                marginBottom: '0.25rem',
              }}
            >
              E-Shares Transparency Notice
            </div>
            <p
              style={{
                fontSize: '0.8125rem',
                color: '#9ca3af',
                lineHeight: 1.5,
              }}
            >
              E-Shares are designed for community support, not guaranteed profit.
              Share values fluctuate based on market activity and social metrics.
              Please invest responsibly and only what you can afford to support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
