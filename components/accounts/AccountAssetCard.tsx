// components/accounts/AccountAssetCard.tsx

import Link from "next/link"
import { VerificationSignal, EscrowSignal } from "./AccountAssetSignals"

export type AccountAsset = {
  id: string
  handle: string
  platform: "Instagram" | "TikTok" | "YouTube"
  category: string
  followers: number
  engagementRate: number
  price: number
  verification: "UNVERIFIED" | "VERIFIED"
  escrowStatus: "AVAILABLE" | "IN_ESCROW" | "LOCKED"
  history: {
    ageMonths: number
    strikes: number
    ownershipTransfers: number
  }
}

export function AccountAssetCard({ asset }: { asset: AccountAsset }) {
  return (
    <Link
      href={`/accounts/${asset.id}`}
      className="block border border-gray-800 bg-black px-4 py-3 space-y-3 hover:border-gray-600 transition-colors"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-mono text-white">
            @{asset.handle}
          </div>
          <div className="text-xs text-gray-400">
            {asset.platform} · {asset.category}
          </div>
        </div>

        <VerificationSignal status={asset.verification} />
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
        <div>
          FOLLOWERS<br />
          {asset.followers.toLocaleString()}
        </div>
        <div>
          ENGAGEMENT<br />
          {asset.engagementRate}%
        </div>
        <div>
          AGE<br />
          {asset.history.ageMonths} mo
        </div>
      </div>

      {/* PRICE + ESCROW */}
      <div className="flex justify-between items-center">
        <div className="text-xl text-white">
          ${asset.price.toLocaleString()}
        </div>
        <EscrowSignal status={asset.escrowStatus} />
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center border-t border-gray-800 pt-2 text-[10px] text-gray-500">
        <span>Transfers: {asset.history.ownershipTransfers}</span>
        <span>Strikes: {asset.history.strikes}</span>
      </div>
    </Link>
  )
}
