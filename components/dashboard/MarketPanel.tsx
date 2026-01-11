// components/dashboard/MarketPanel.tsx

import { MarketInstrumentCard } from "@/components/market/MarketInstrumentCard"

const MOCK_INSTRUMENTS = [
  {
    symbol: "$PIE",
    name: "Pie Army Media",
    issuer: "Pie Army LLC",
    price: 1.02,
    supply: { total: 1_000_000, circulating: 450_000, locked: 550_000 },
    trustTier: "VERIFIED",
    escrowStatus: "LOCKED",
    volume24h: 124_000,
    change24h: 2.4,
  },
  {
    symbol: "$REX",
    name: "MovieRex",
    issuer: "MovieRex Studio",
    price: 0.87,
    supply: { total: 2_000_000, circulating: 1_200_000, locked: 800_000 },
    trustTier: "UNVERIFIED",
    escrowStatus: "PARTIAL",
    volume24h: 88_000,
    change24h: -1.1,
  },
]

export default function MarketPanel() {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400 uppercase tracking-wide">
        Market Instruments
      </div>

      <div className="space-y-3">
        {MOCK_INSTRUMENTS.map((i) => (
          <MarketInstrumentCard key={i.symbol} instrument={i} />
        ))}
      </div>
    </div>
  )
}
