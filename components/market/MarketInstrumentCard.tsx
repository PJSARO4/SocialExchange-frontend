"use client"

import Link from "next/link"
import { TrustSignal, EscrowSignal } from "./MarketInstrumentSignals"

export type MarketInstrument = {
  symbol: string
  name: string
  issuer: string
  price: number
  supply: {
    total: number
    circulating: number
    locked: number
  }
  trustTier: "UNVERIFIED" | "VERIFIED" | "ESTABLISHED"
  escrowStatus: "LOCKED" | "PARTIAL" | "RELEASING"
  volume24h: number
  change24h: number
}

export function MarketInstrumentCard({
  instrument,
}: {
  instrument: MarketInstrument
}) {
  const symbolSlug = instrument.symbol.replace("$", "")

  return (
    <Link
      href={`/marketplace/${symbolSlug}`}
      className="
        block
        border border-gray-800
        bg-black
        px-4 py-3
        space-y-3
        transition-colors
        hover:border-gray-600
        cursor-pointer
      "
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-mono text-white">
            {instrument.symbol}
          </div>
          <div className="text-xs text-gray-400">
            {instrument.name} · {instrument.issuer}
          </div>
        </div>

        <TrustSignal tier={instrument.trustTier} />
      </div>

      {/* PRICE + CHANGE */}
      <div className="flex justify-between items-center">
        <div className="text-xl font-mono text-white">
          ${instrument.price.toFixed(2)}
        </div>

        <div
          className={`text-sm font-mono ${
            instrument.change24h >= 0
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {instrument.change24h >= 0 ? "+" : ""}
          {instrument.change24h}% 24h
        </div>
      </div>

      {/* TELEMETRY */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
        <div>
          <div className="uppercase tracking-wide">Circulating</div>
          <div className="font-mono">
            {instrument.supply.circulating.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="uppercase tracking-wide">Locked</div>
          <div className="font-mono">
            {instrument.supply.locked.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="uppercase tracking-wide">Vol 24h</div>
          <div className="font-mono">
            {instrument.volume24h.toLocaleString()}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center border-t border-gray-800 pt-2">
        <EscrowSignal status={instrument.escrowStatus} />

        <span className="text-[10px] text-gray-500 font-mono">
          Exec Fee: $0.009 / token
        </span>
      </div>
    </Link>
  )
}
