'use client';

import { useState, useEffect } from 'react';
import { getPublicBrands, applyMicroFluctuation } from '../lib/e-shares-store';
import './chart-ticker.css';

interface TickerItem {
  id: string;
  name: string;
  price: number;
  change: number;
  direction: 'up' | 'down' | 'neutral';
}

export default function UpperTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    const brands = getPublicBrands();
    setItems(
      brands.map(b => ({
        id: b.id,
        name: b.brandName,
        price: b.pricePerShare,
        change: 0,
        direction: 'neutral' as const,
      }))
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev =>
        prev.map(item => {
          const { value, direction } = applyMicroFluctuation(item.price);
          const change = ((value - item.price) / item.price) * 100;
          return { ...item, price: value, change, direction };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  const displayItems = [...items, ...items];

  return (
    <div className="upper-ticker">
      <div className="upper-ticker-track">
        {displayItems.map((item, i) => (
          <span key={`${item.id}-${i}`} className="ticker-item">
            <span className="ticker-name">{item.name}</span>
            <span className={`ticker-price ${item.direction}`}>
              ${item.price.toFixed(4)}
            </span>
            <span className={`ticker-change ${item.direction}`}>
              {item.direction === 'up' ? '\u25B2' : item.direction === 'down' ? '\u25BC' : '\u2013'}
            </span>
            <span className="ticker-separator">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
