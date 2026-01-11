// app/market/page.tsx

import { MarketInstrumentCard } from "@/components/market/MarketInstrumentCard"

const MARKET_DATA = [
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

export default function MarketPage() {
  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-xl text-white font-mono">
          SocialExchange Market
        </h1>
        <p className="text-sm text-gray-400">
          Tokenized social assets · Exchange execution fee $0.009 / token
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MARKET_DATA.map((i) => (
          <MarketInstrumentCard key={i.symbol} instrument={i} />
        ))}
      </section>
    </main>
  )
}
