// components/accounts/AccountAssetSignals.tsx

type VerificationStatus = "UNVERIFIED" | "VERIFIED"
type EscrowStatus = "AVAILABLE" | "IN_ESCROW" | "LOCKED"

export function VerificationSignal({ status }: { status: VerificationStatus }) {
  const map = {
    UNVERIFIED: "text-red-400 border-red-400",
    VERIFIED: "text-green-400 border-green-400",
  }

  return (
    <span className={`px-2 py-0.5 text-xs border ${map[status]}`}>
      {status}
    </span>
  )
}

export function EscrowSignal({ status }: { status: EscrowStatus }) {
  const map = {
    AVAILABLE: "text-green-400",
    IN_ESCROW: "text-amber-400",
    LOCKED: "text-gray-400",
  }

  return (
    <span className={`text-xs ${map[status]}`}>
      ESCROW: {status}
    </span>
  )
}
