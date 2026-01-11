// components/escrow/ControlVerificationPanel.tsx

export function ControlVerificationPanel() {
  return (
    <div className="border border-amber-600 p-4 space-y-3">
      <div className="text-sm font-mono text-amber-400">
        CONTROL VERIFICATION REQUIRED
      </div>

      <ul className="text-xs text-gray-400 space-y-1 list-disc pl-4">
        <li>Buyer has successfully logged in</li>
        <li>Password has been changed</li>
        <li>Recovery email has been updated</li>
        <li>MFA removed or reconfigured</li>
        <li>No active security challenges</li>
      </ul>

      <div className="text-[10px] text-gray-500">
        False attestations or reclaim attempts will freeze funds
        and trigger a permanent ban.
      </div>
    </div>
  )
}
