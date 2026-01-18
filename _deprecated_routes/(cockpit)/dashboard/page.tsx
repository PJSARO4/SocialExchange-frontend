"use client";

import { useRouter } from "next/navigation";

export default function MarketPanel() {
  const router = useRouter();

  return (
    <div className="border border-gray-800 p-4 font-mono space-y-4">
      {/* PANEL HEADER */}
      <div className="flex justify-between items-center">
        <div className="text-xs tracking-widest text-gray-400">
          MARKET MONITOR
        </div>

        <div className="text-xs tracking-widest text-green-400">
          ACTIVE
        </div>
      </div>

      {/* STATUS */}
      <div className="text-sm text-gray-300">
        Live monitoring of available assets and trade signals.
      </div>

      {/* LISTING PREVIEW */}
      <div className="space-y-2 border border-gray-800 p-3">
        <MarketPreviewLine
          asset="Instagram Theme Page"
          price="$1,200"
          signal="STABLE"
        />
        <MarketPreviewLine
          asset="TikTok Clip Network"
          price="$4,500"
          signal="HOT"
        />
        <MarketPreviewLine
          asset="YouTube Automation Stack"
          price="$8,000"
          signal="LOW ACTIVITY"
        />
      </div>

      {/* ACTION */}
      <div className="flex justify-end">
        <button
          onClick={() => router.push("/market")}
          className="border border-green-400 px-4 py-1 text-xs tracking-widest text-green-400 hover:bg-green-400/10"
        >
          ENTER MARKET →
        </button>
      </div>
    </div>
  );
}

/* =======================
   SUB COMPONENT
======================= */

function MarketPreviewLine({
  asset,
  price,
  signal,
}: {
  asset: string;
  price: string;
  signal: "HOT" | "STABLE" | "LOW ACTIVITY";
}) {
  const signalColor =
    signal === "HOT"
      ? "text-red-400"
      : signal === "STABLE"
      ? "text-green-400"
      : "text-gray-400";

  return (
    <div className="flex justify-between text-sm text-gray-300">
      <div>
        <span className="text-blue-400 mr-2">[ASSET]</span>
        {asset}
      </div>

      <div className="flex gap-3">
        <span className="text-gray-400">{price}</span>
        <span className={`text-xs tracking-widest ${signalColor}`}>
          {signal}
        </span>
      </div>
    </div>
  );
}
