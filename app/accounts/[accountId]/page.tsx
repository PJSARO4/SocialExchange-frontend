// app/accounts/[accountId]/page.tsx

import { EscrowTimeline } from "@/components/escrow/EscrowTimeline"
import { ControlVerificationPanel } from "@/components/escrow/ControlVerificationPanel"
import { EscrowStage } from "@/types/escrow"

export default function AccountDetailPage() {
  const account = {
    handle: "gigglelizards",
    platform: "Instagram",
    category: "Memes",
    price: 4500,
    followers: 125_000,
    engagementRate: 4.2,
    escrowStage: "CREDENTIALS_TRANSFERRED" as EscrowStage,
    history: {
      ageMonths: 38,
      strikes: 0,
      ownershipTransfers: 1,
    },
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 space-y-8">
      {/* HEADER */}
      <header>
        <h1 className="text-2xl font-mono">@{account.handle}</h1>
        <p className="text-sm text-gray-400">
          {account.platform} · {account.category}
        </p>
      </header>

      {/* GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACCOUNT DOSSIER */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-gray-800 p-4 space-y-3">
            <div className="text-sm font-mono text-gray-300">
              Account Dossier
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-gray-400">
              <div>
                FOLLOWERS<br />
                {account.followers.toLocaleString()}
              </div>
              <div>
                ENGAGEMENT<br />
                {account.engagementRate}%
              </div>
              <div>
                AGE<br />
                {account.history.ageMonths} mo
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-800">
              <span className="text-xl text-white">
                ${account.price.toLocaleString()}
              </span>
              <span className="text-xs text-green-400">
                VERIFIED
              </span>
            </div>
          </div>

          <div className="border border-gray-800 p-4 text-xs text-gray-500">
            Ownership transfer requires successful credential
            handoff, control verification, and lock-period monitoring.
          </div>
        </div>

        {/* ESCROW */}
        <div className="space-y-4">
          <EscrowTimeline current={account.escrowStage} />

          {account.escrowStage === "CREDENTIALS_TRANSFERRED" && (
            <ControlVerificationPanel />
          )}

          <div className="border border-gray-800 p-4 text-xs text-gray-500">
            Escrow actions are logged. Founder intervention is
            available in the event of dispute.
          </div>
        </div>
      </section>
    </main>
  )
}
