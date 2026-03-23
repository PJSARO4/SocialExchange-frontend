// components/escrow/EscrowTimeline.tsx

import { EscrowStage } from "@/types/escrow"

const STAGES: EscrowStage[] = [
  EscrowStage.INITIATED,
  EscrowStage.PENDING,
  EscrowStage.FUNDED,
  EscrowStage.IN_PROGRESS,
  EscrowStage.CREDENTIALS_TRANSFERRED,
  EscrowStage.COMPLETED,
]

export function EscrowTimeline({ current }: { current: EscrowStage }) {
  return (
    <div className="border border-gray-800 p-4 space-y-3">
      <div className="text-sm font-mono text-gray-300">
        Escrow Lifecycle
      </div>

      <div className="space-y-2">
        {STAGES.map((stage) => {
          const idx = STAGES.indexOf(stage)
          const curIdx = STAGES.indexOf(current)

          const state =
            idx < curIdx
              ? "complete"
              : idx === curIdx
              ? "active"
              : "pending"

          return (
            <div
              key={stage}
              className="flex justify-between items-center text-xs"
            >
              <span
                className={
                  state === "complete"
                    ? "text-green-400"
                    : state === "active"
                    ? "text-amber-400"
                    : "text-gray-600"
                }
              >
                {stage.replace(/_/g, " ")}
              </span>

              <span
                className={
                  state === "complete"
                    ? "text-green-400"
                    : state === "active"
                    ? "text-amber-400"
                    : "text-gray-700"
                }
              >
                ●
              </span>
            </div>
          )
        })}
      </div>

      <div className="text-[10px] text-gray-500">
        Funds cannot be released until irreversible account control
        has been verified.
      </div>
    </div>
  )
}
