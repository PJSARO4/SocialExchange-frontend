// app/founder/market/page.tsx

export default function FounderMarketPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-lg font-mono">Market Controls</h1>

      <div className="border border-gray-800 p-4 space-y-2">
        <div className="text-sm text-gray-400">
          Global market state
        </div>
        <div className="text-xl font-mono text-green-400">
          ACTIVE
        </div>
      </div>

      <button
        disabled
        className="border border-red-800 text-red-400 px-4 py-2 text-sm opacity-40 cursor-not-allowed"
      >
        PAUSE ENTIRE MARKET (ARMED CONFIRMATION)
      </button>
    </main>
  )
}
