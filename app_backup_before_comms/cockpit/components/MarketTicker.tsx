"use client";

import { useEffect, useState } from "react";

type TickerItem = {
  symbol: string;
  price: number;
  direction: "up" | "down";
};

export default function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([
    { symbol: "GiggleLizards", price: 2.19, direction: "up" },
    { symbol: "NovaPets", price: 1.42, direction: "down" },
    { symbol: "UrbanSignal", price: 3.81, direction: "up" },
    { symbol: "EchoBrand", price: 0.88, direction: "down" },
  ]);

  // Mock live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev =>
        prev.map(item => {
          const delta = (Math.random() * 0.05).toFixed(2);
          const up = Math.random() > 0.5;
          return {
            ...item,
            price: Number(
              (item.price + (up ? +delta : -delta)).toFixed(2)
            ),
            direction: up ? "up" : "down",
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ticker">
      {items.map(item => (
        <div key={item.symbol}>
          <span>{item.symbol}</span>{" "}
          <span className={item.direction}>
            {item.price.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}
