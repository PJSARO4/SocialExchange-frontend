
// app/founder/page.tsx

const MOCK_METRICS = {
  marketStatus: "ACTIVE",
  instrumentsActive: 2,
  tokensTraded24h: 212_000,
  tokensTradedLifetime: 4_820_000,
  founderFees24h: 1_908, // $0.009 * tokens
  founderFeesLifetime: 43_380,
}

export default function FounderOverviewPage() {
  return (
    <main className="space-y-10">
      {/* HEADER */}
      <header className="space-y-2">
        <h1 className="text-xl font-mono">Founder Treasury HUD</h1>
        <p className="text-sm text-gray-400">
          Internal market telemetry. Values shown are simulated.
        </p>
      </header>

      {/* CORE METRICS */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric
          label="Market Status"
          value={MOCK_METRICS.marketStatus}
          status={MOCK_METRICS.marketStatus === "ACTIVE" ? "green" : "red"}
        />
        <Metric
          label="Active Instruments"
          value={MOCK_METRICS.instrumentsActive.toString()}
        />
        <Metric
          label="Tokens Traded (24h)"
          value={MOCK_METRICS.tokensTraded24h.toLocaleString()}
        />
        <Metric
          label="Tokens Traded (Lifetime)"
          value={MOCK_METRICS.tokensTradedLifetime.toLocaleString()}
        />
      </section>

      {/* TREASURY */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <Metric
          label="Founder Fees (24h)"
          value={`$${MOCK_METRICS.founderFees24h.toLocaleString()}`}
          emphasis
        />
        <Metric
          label="Founder Fees (Lifetime)"
          value={`$${MOCK_METRICS.founderFeesLifetime.toLocaleString()}`}
          emphasis
        />
      </section>

      {/* DISCLAIMER */}
      <footer className="border-t border-gray-800 pt-4 text-xs text-gray-500 max-w-3xl">
        Treasury data shown is for interface development only. No real trades,
        balances, or settlements are active.
      </footer>
    </main>
  )
}

function Metric({
  label,
  value,
  emphasis,
  status,
}: {
  label: string
  value: string
  emphasis?: boolean
  status?: "green" | "red"
}) {
  return (
    <div className="border border-gray-800 p-4 space-y-1">
      <div className="text-xs text-gray-500 uppercase tracking-wide">
        {label}
      </div>
      <div
        className={`text-lg font-mono ${
          emphasis ? "text-white" : "text-gray-300"
        } ${status === "green" ? "text-green-400" : ""} ${
          status === "red" ? "text-red-400" : ""
        }`}
      >
        {value}
      </div>
    </div>
  )
}
