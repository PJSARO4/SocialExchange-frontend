// components/dashboard/AccountsPanel.tsx

import { AccountAssetCard, type AccountAsset } from "@/components/accounts/AccountAssetCard"

const PREVIEW_ASSETS: AccountAsset[] = [
  {
    id: "1",
    handle: "gigglelizards",
    platform: "Instagram",
    category: "Memes",
    followers: 125_000,
    engagementRate: 4.2,
    price: 4_500,
    verification: "VERIFIED",
    escrowStatus: "AVAILABLE",
    history: {
      ageMonths: 38,
      strikes: 0,
      ownershipTransfers: 1,
    },
  },
]

export default function AccountsPanel() {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-400 uppercase tracking-wide">
        Account Exchange
      </div>

      {PREVIEW_ASSETS.map((asset) => (
        <AccountAssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  )
}
