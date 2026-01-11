// components/market/MarketInstrumentSignals.tsx

type TrustTier = "UNVERIFIED" | "VERIFIED" | "ESTABLISHED"
type EscrowStatus = "LOCKED" | "PARTIAL" | "RELEASING"

export function TrustSignal({ tier }: { tier: TrustTier }) {
  const map = {
    UNVERIFIED: "text-red-400 border-red-400",
    VERIFIED: "text-amber-400 border-amber-400",
    ESTABLISHED: "text-green-400 border-green-400",
  }

  return (
    <span className={`px-2 py-0.5 text-xs border ${map[tier]}`}>
      {tier}
    </span>
  )
}

export function EscrowSignal({ status }: { status: EscrowStatus }) {
  const map = {
    LOCKED: "text-green-400",
    PARTIAL: "text-amber-400",
    RELEASING: "text-red-400",
  }

  return (
    <span className={`text-xs ${map[status]}`}>
      ESCROW: {status}
    </span>
  )
}
