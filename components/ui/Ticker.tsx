"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "AUTH GATE — Awaiting entry",
  "SYSTEM READY",
  "EXCHANGE FLOW: ACTIVE",
];

type Props = {
  active?: boolean;
};

export default function Ticker({ active = false }: Props): JSX.Element {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (active) {
      // cycle indefinitely
      const id = setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 3000);
      return () => clearInterval(id);
    }

    // otherwise run sequence once then lock to first message
    let step = 0;
    setIndex(0);
    const id = setInterval(() => {
      step++;
      if (step < MESSAGES.length) {
        setIndex(step);
      } else {
        setIndex(0);
        clearInterval(id);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="ticker-root" role="status" aria-live="polite">
      <div className="ticker-inner w-full flex items-center justify-center">
        <div key={index} className="ticker-msg text-slate-300/80">
          {MESSAGES[index]}
        </div>
      </div>
    </div>
  );
}
