// app/marketplace/page.tsx

import { MarketInstrumentCard } from "@/components/market/MarketInstrumentCard"

const MARKET_INSTRUMENTS = [
  {
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
  },
  {
    symbol: "$REX",
    name: "MovieRex",
    issuer: "MovieRex Studio",
    price: 0.87,
    supply: {
      total: 2_000_000,
      circulating: 1_200_000,
      locked: 800_000,
    },
    trustTier: "UNVERIFIED",
    escrowStatus: "PARTIAL",
    volume24h: 88_000,
    change24h: -1.1,
  },
]

export default function MarketplacePage() {
  return (
    <main className="min-h-screen bg-black text-white p-6 space-y-8">
      {/* HEADER */}
      <header className="space-y-2">
        <h1 className="text-2xl font-mono tracking-wide">
          SocialExchange Market
        </h1>
        <p className="text-sm text-gray-400 max-w-3xl">
          Exchange for tokenized social assets. Brands issue fixed-supply
          instruments backed by real social presence. All executions settle
          through escrow.
        </p>
        <p className="text-xs text-gray-500">
          Exchange Execution Fee: <span className="text-gray-300">$0.009 per token</span>
        </p>
      </header>

      {/* MARKET GRID */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MARKET_INSTRUMENTS.map((instrument) => (
            <MarketInstrumentCard
              key={instrument.symbol}
              instrument={instrument}
            />
          ))}
        </div>
      </section>

      {/* FOOTER / DISCLAIMER */}
      <footer className="pt-6 border-t border-gray-800 text-xs text-gray-500 max-w-4xl">
        Instruments shown are for simulation and interface development only.
        Trading, issuance, and settlement mechanics will be enabled in later
        phases. SocialExchange does not guarantee performance or returns.
      </footer>
    </main>
  )
}
