// app/founder/treasury/page.tsx

export default function TreasuryPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-mono">Treasury</h1>
        <p className="text-sm text-gray-400">
          Founder fee accumulation and settlement visibility.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Metric label="Total Fees Accrued" value="$12,430,000" />
        <Metric label="Fees (Last 24h)" value="$900,000" />
        <Metric label="Avg Fee / Day" value="$640,000" />
        <Metric label="Fee Model" value="$0.009 / token" />
      </section>

      <section className="border border-gray-800 p-4 text-xs text-gray-500">
        Fees are assessed per executed token trade. This model is fixed,
        transparent, and applied uniformly across the exchange.
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
