// app/accounts/page.tsx

import { AccountAssetCard } from "@/components/accounts/AccountAssetCard"

const ACCOUNT_ASSETS = [
  {
    id: "gigglelizards",
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
  {
    id: "moviereex",
    handle: "moviereex",
    platform: "TikTok",
    category: "Film Clips",
    followers: 89_000,
    engagementRate: 3.6,
    price: 3_200,
    verification: "UNVERIFIED",
    escrowStatus: "IN_ESCROW",
    history: {
      ageMonths: 24,
      strikes: 1,
      ownershipTransfers: 0,
    },
  },
]

export default function AccountsPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-mono tracking-wide">
          Account Exchange
        </h1>
        <p className="text-sm text-gray-400 max-w-3xl">
          Whole-asset transfers for verified social media accounts.
          All transactions settle through escrow.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ACCOUNT_ASSETS.map((asset) => (
          <AccountAssetCard key={asset.id} asset={asset} />
        ))}
      </section>
    </main>
  )
}
