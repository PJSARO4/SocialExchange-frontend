"use client";

import { useSystem, System } from "@/app/context/SystemContext";

const ITEMS: { id: System; label: string }[] = [
  { id: "comms", label: "COMMS" },
  { id: "assets", label: "ASSETS" },
  { id: "trade", label: "TRADE" },
  { id: "escrow", label: "ESCROW" }
];

export default function BottomDock() {
  const { system, setSystem } = useSystem();

  return (
    <div className="bottom-dock">
      <div className="bottom-dock-inner">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSystem(item.id)}
            className={`dock-item ${system === item.id ? "active" : ""}`}
          >
            {item.label}
          </button>
        ))}

        <div className="dock-status">SYSTEM ONLINE</div>
      </div>
    </div>
  );
}
