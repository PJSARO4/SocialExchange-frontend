'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getTransactionsByBrand } from '../lib/e-shares-store';
import './chart-ticker.css';

interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

interface SharePriceChartProps {
  brandId: string;
  currentPrice: number;
  basePrice: number;
}

export default function SharePriceChart({ brandId, currentPrice, basePrice }: SharePriceChartProps) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [timeRange, setTimeRange] = useState<'1H' | '1D' | '1W' | '1M' | 'ALL'>('1D');

  useEffect(() => {
    const transactions = getTransactionsByBrand(brandId);
    const points: PricePoint[] = [];

    if (transactions.length === 0) {
      // Generate synthetic points for demo
      const now = Date.now();
      for (let i = 24; i >= 0; i--) {
        const t = now - i * 3600000;
        const noise = (Math.random() - 0.5) * 0.002;
        points.push({
          timestamp: t,
          price: basePrice + noise + (basePrice * 0.001 * (24 - i) / 24),
          volume: Math.floor(Math.random() * 1000),
        });
      }
    } else {
      let runningPrice = basePrice;
      transactions
        .filter(t => t.type === 'BUY' || t.type === 'SELL')
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach(t => {
          runningPrice = t.pricePerShare;
          points.push({
            timestamp: t.timestamp,
            price: runningPrice,
            volume: t.totalAmount,
          });
        });
    }

    points.push({
      timestamp: Date.now(),
      price: currentPrice,
      volume: 0,
    });

    const now = Date.now();
    const ranges: Record<string, number> = {
      '1H': 3600000,
      '1D': 86400000,
      '1W': 604800000,
      '1M': 2592000000,
      'ALL': Infinity,
    };

    const filtered = timeRange === 'ALL'
      ? points
      : points.filter(p => now - p.timestamp <= ranges[timeRange]);

    setPriceHistory(filtered.length > 0 ? filtered : points);
  }, [brandId, currentPrice, basePrice, timeRange]);

  const priceChange = priceHistory.length >= 2
    ? priceHistory[priceHistory.length - 1].price - priceHistory[0].price
    : 0;
  const priceChangePercent = priceHistory.length >= 2 && priceHistory[0].price > 0
    ? (priceChange / priceHistory[0].price) * 100
    : 0;
  const isPositive = priceChange >= 0;

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    if (timeRange === '1H' || timeRange === '1D') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="share-price-chart">
      <div className="chart-header">
        <div className="chart-price-info">
          <span className="chart-current-price">${currentPrice.toFixed(4)}</span>
          <span className={`chart-price-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(4)} ({priceChangePercent.toFixed(2)}%)
          </span>
        </div>
        <div className="chart-time-range">
          {(['1H', '1D', '1W', '1M', 'ALL'] as const).map(range => (
            <button
              key={range}
              className={`chart-range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <AreaChart data={priceHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#3fffdc' : '#f87171'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? '#3fffdc' : '#f87171'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#6b7280"
              fontSize={10}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(3)}`}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(2, 4, 9, 0.95)',
                border: '1px solid rgba(63, 255, 220, 0.3)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
              }}
              labelFormatter={(v: number) => new Date(v).toLocaleString()}
              formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#3fffdc' : '#f87171'}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
