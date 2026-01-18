'use client';

export function applyMicroFluctuation(price: number) {
  const delta = Math.random() * 0.04 + 0.01;
  const direction = Math.random() > 0.5 ? 1 : -1;

  const newPrice = price + delta * direction;

  return {
    value: parseFloat(newPrice.toFixed(2)),
    direction: direction > 0 ? 'up' : 'down',
  };
}
