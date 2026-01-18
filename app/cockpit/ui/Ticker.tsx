"use client";

import { useEffect, useState } from "react";

type Item = {
  symbol: string;
  price: number;
  change: number;
};

export default function Ticker() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    setItems([
      { symbol: "GiggleLizards", price: 2.19, change: 0.04 },
      { symbol: "NovaPets", price: 1.37, change: -0.05 },
      { symbol: "UrbanSignal", price: 3.85, change: 0.11 },
      { symbol: "EchoBrand", price: 0.94, change: -0.02 },
    ]);
  }, []);

  return (
    <div className="ticker">
      <div className="ticker-track">
        {items.map((item, i) => (
          <div key={i} className="ticker-item">
            <span className="ticker-symbol">{item.symbol}</span>
            <span
              className={`ticker-price ${
                item.change >= 0 ? "up" : "down"
              }`}
            >
              {item.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
