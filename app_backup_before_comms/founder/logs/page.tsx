// app/founder/page.tsx

export default function FounderOverview() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-mono">Founder Overview</h1>
        <p className="text-sm text-gray-400">
          Exchange-level telemetry and system health.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric label="Tokens Traded (24h)" value="100,000,000" />
        <Metric label="Founder Fees (24h)" value="$900,000" />
        <Metric label="Active Instruments" value="12" />
      </section>

      <section className="border border-gray-800 p-4 text-sm text-gray-400">
        This deck is restricted to SocialExchange operators. All values shown
        are simulated during UI development.
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-800 p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl text-white">{value}</div>
    </div>
  )
}
