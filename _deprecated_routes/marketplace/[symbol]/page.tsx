// app/marketplace/[symbol]/page.tsx

import { notFound } from "next/navigation"
import { MarketInstrumentCard } from "@/components/market/MarketInstrumentCard"

// ----------------------------
// MOCK DATA (SIMULATION ONLY)
// ----------------------------
const MARKET_INSTRUMENTS = {
  PIE: {
    symbol: "$PIE",
    name: "Pie Army Media",
    issuer: "Pie Army LLC",
    price: 1.02,
    supply: {
      total: 1_000_000,
      circulating: 450_000,
      locked: 550_000,
    },
    trustTier: "VERIFIED",
    escrowStatus: "LOCKED",
    volume24h: 124_000,
    change24h: 2.4,
    description:
      "Pie Army Media is a community-driven entertainment brand focused on short-form humor and viral content distribution.",

    history: [
      { date: "2025-12-20", price: 0.96, volume: 88_000 },
      { date: "2025-12-21", price: 0.99, volume: 102_000 },
      { date: "2025-12-22", price: 1.00, volume: 118_000 },
      { date: "2025-12-23", price: 1.02, volume: 124_000 },
    ],

    activityLog: [
      {
        date: "2025-12-22",
        message: "Issuer completed scheduled escrow audit.",
      },
      {
        date: "2025-12-21",
        message: "No token issuance or unlock events.",
      },
      {
        date: "2025-12-20",
        message: "Initial market listing completed.",
      },
    ],

    lockups: [
      {
        tranche: "Founders",
        amount: 300_000,
        unlock: "2026-06-01",
      },
      {
        tranche: "Growth Reserve",
        amount: 250_000,
        unlock: "2026-12-01",
      },
    ],
  },
}

export default function InstrumentDetailPage({
  params,
}: {
  params: { symbol: string }
}) {
  const key = params.symbol.toUpperCase()
  const instrument = MARKET_INSTRUMENTS[key as keyof typeof MARKET_INSTRUMENTS]

  if (!instrument) notFound()

  return (
    <main className="min-h-screen bg-black text-white p-6 space-y-10">
      {/* HEADER */}
      <header className="space-y-2 max-w-4xl">
        <h1 className="text-2xl font-mono">
          {instrument.symbol} — Instrument Overview
        </h1>
        <p className="text-sm text-gray-400">
          {instrument.description}
        </p>
      </header>

      {/* PRIMARY CARD */}
      <section className="max-w-md">
        <MarketInstrumentCard instrument={instrument} />
      </section>

      {/* SUPPLY METRICS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        <Metric label="Total Supply" value={instrument.supply.total} />
        <Metric label="Circulating" value={instrument.supply.circulating} />
        <Metric label="Locked" value={instrument.supply.locked} />
      </section>

      {/* HISTORICAL SNAPSHOT */}
      <section className="border border-gray-800 p-4 max-w-4xl space-y-3">
        <h2 className="text-sm font-mono">Historical Snapshot</h2>

        <div className="space-y-2 text-sm">
          {instrument.history.map((h) => (
            <div
              key={h.date}
              className="flex justify-between border-b border-gray-900 pb-1"
            >
              <span className="text-gray-500">{h.date}</span>
              <span className="font-mono">${h.price.toFixed(2)}</span>
              <span className="text-gray-400">
                Vol {h.volume.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ISSUER ACTIVITY */}
      <section className="border border-gray-800 p-4 max-w-4xl space-y-3">
        <h2 className="text-sm font-mono">Issuer Activity Log</h2>

        <ul className="text-sm text-gray-400 space-y-2">
          {instrument.activityLog.map((a, idx) => (
            <li key={idx} className="flex gap-4">
              <span className="text-gray-500">{a.date}</span>
              <span>{a.message}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* LOCKUP SCHEDULE */}
      <section className="border border-gray-800 p-4 max-w-4xl space-y-3">
        <h2 className="text-sm font-mono">Lockup & Release Schedule</h2>

        <div className="space-y-2 text-sm">
          {instrument.lockups.map((l) => (
            <div
              key={l.tranche}
              className="flex justify-between border-b border-gray-900 pb-1"
            >
              <span>{l.tranche}</span>
              <span className="font-mono">
                {l.amount.toLocaleString()}
              </span>
              <span className="text-gray-500">
                Unlocks {l.unlock}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500">
          Locked supply cannot be sold prior to scheduled release.
        </p>
      </section>

      {/* EXECUTION FEES */}
      <section className="border border-gray-800 p-4 max-w-4xl">
        <h2 className="text-sm font-mono mb-2">Execution Fees</h2>
        <p className="text-sm text-gray-400">
          All executions incur a flat exchange fee of{" "}
          <span className="font-mono text-white">$0.009 per token</span>.
        </p>
      </section>

      {/* DISCLAIMER */}
      <footer className="border-t border-gray-800 pt-4 text-xs text-gray-500 max-w-4xl">
        Instrument data shown is for interface development and simulation only.
        Trading, issuance, and settlement are disabled in this phase.
      </footer>
    </main>
  )
}

function Metric({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="border border-gray-800 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-lg font-mono">
        {value.toLocaleString()}
      </div>
    </div>
  )
}
