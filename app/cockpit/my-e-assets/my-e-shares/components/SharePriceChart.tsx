'use client';

import { useState, useEffect, useRef } from 'react';
import { getTransactionsByBrand, getPriceHistory } from '../lib/e-shares-api';

interface PricePoint {
  timestamp: number;
  price: number;
}

interface SharePriceChartProps {
  brandId: string;
}

export default function SharePriceChart({ brandId }: SharePriceChartProps) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [timeRange, setTimeRange] = useState<'1H' | '1D' | '1W' | '1M' | 'ALL'>('1D');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Load price history from localStorage
    const storedHistory = getPriceHistory(brandId);

    if (storedHistory.length === 0) {
      // Generate synthetic data for demo
      const now = Date.now();
      const points: PricePoint[] = [];
      const basePrice = 1.0;

      for (let i = 100; i >= 0; i--) {
        const t = now - i * 360000; // Every 6 minutes
        const noise = (Math.random() - 0.5) * 0.02;
        const trend = (basePrice * 0.001 * (100 - i)) / 100;
        points.push({
          timestamp: t,
          price: Math.max(0.01, basePrice + noise + trend),
        });
      }
      setPriceHistory(points);
    } else {
      setPriceHistory(storedHistory);
    }
  }, [brandId]);

  // Draw chart on canvas
  useEffect(() => {
    if (!canvasRef.current || priceHistory.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const now = Date.now();
    const ranges: Record<string, number> = {
      '1H': 3600000,
      '1D': 86400000,
      '1W': 604800000,
      '1M': 2592000000,
      'ALL': Infinity,
    };

    // Filter points by time range
    const filtered = priceHistory.filter((p) => now - p.timestamp <= ranges[timeRange]);
    if (filtered.length < 2) return;

    // Calculate min/max
    const prices = filtered.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Chart dimensions
    const width = rect.width - 40;
    const height = rect.height - 40;
    const marginLeft = 30;
    const marginTop = 20;

    // Clear canvas
    ctx.fillStyle = 'rgba(10, 17, 24, 0.5)';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = marginTop + (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(marginLeft, y);
      ctx.lineTo(marginLeft + width, y);
      ctx.stroke();
    }

    // Draw price area (gradient fill)
    const gradient = ctx.createLinearGradient(0, marginTop, 0, marginTop + height);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0.02)');

    ctx.beginPath();
    filtered.forEach((point, idx) => {
      const x = marginLeft + (width / (filtered.length - 1)) * idx;
      const y = marginTop + height - ((point.price - minPrice) / priceRange) * height;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    // Complete the area
    ctx.lineTo(
      marginLeft + width,
      marginTop + height - ((filtered[filtered.length - 1].price - minPrice) / priceRange) * height
    );
    ctx.lineTo(marginLeft + width, marginTop + height);
    ctx.lineTo(marginLeft, marginTop + height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    filtered.forEach((point, idx) => {
      const x = marginLeft + (width / (filtered.length - 1)) * idx;
      const y = marginTop + height - ((point.price - minPrice) / priceRange) * height;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, marginTop + height);
    ctx.lineTo(marginLeft + width, marginTop + height);
    ctx.stroke();

    // Draw y-axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = marginTop + (height / 4) * i;
      const price = maxPrice - ((maxPrice - minPrice) / 4) * i;
      ctx.fillText(`$${price.toFixed(4)}`, marginLeft - 8, y + 4);
    }

    // Draw x-axis labels
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const labelCount = Math.min(5, filtered.length);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.floor((filtered.length - 1) * (i / (labelCount - 1)));
      const point = filtered[idx];
      const x = marginLeft + (width / (filtered.length - 1)) * idx;
      const date = new Date(point.timestamp);
      const label =
        timeRange === '1H'
          ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      ctx.fillText(label, x, marginTop + height + 20);
    }
  }, [priceHistory, timeRange]);

  if (priceHistory.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 240, 255, 0.02)',
        borderRadius: '8px',
        color: 'var(--text-muted)',
      }}
      >
        Loading chart...
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
      }}
      >
        {['1H', '1D', '1W', '1M', 'ALL'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range as any)}
            className={`market-filter-btn ${timeRange === range ? 'active' : ''}`}
          >
            {range}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '300px',
          borderRadius: '8px',
          background: 'rgba(0, 240, 255, 0.02)',
        }}
      />
    </div>
  );
}
