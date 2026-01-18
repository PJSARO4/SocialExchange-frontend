"use client";

import { useState } from "react";
import IdleCruise from "./IdleCruise";

export default function BottomDeck() {
  const [idle, setIdle] = useState(false);

  return (
    <>
      {idle && <IdleCruise onExit={() => setIdle(false)} />}

      <footer className="cockpit-footer">
        <div className="deck-node active">LOGS</div>

        <div
          className={`deck-node power ${idle ? "idle" : "on"}`}
          onClick={() => setIdle(!idle)}
          title="Toggle Cruise Mode"
        >
          ●
        </div>

        <div className="deck-node">SIGNAL</div>
      </footer>
    </>
  );
}
