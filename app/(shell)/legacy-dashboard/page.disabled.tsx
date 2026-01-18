"use client";

export default function DashboardPage() {
  return (
    <div className="h-full w-full text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-8 py-4 text-xs tracking-widest text-white/60">
        SOCIAL EXCHANGE · MISSION CONTROL
      </div>

      {/* Content */}
      <div className="p-8 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-semibold">Mission Control</h1>
          <p className="text-white/50 text-sm">
            System overview and operational status.
          </p>
        </div>

        {/* System Panels */}
        <div className="grid grid-cols-3 gap-6">
          <SystemPanel
            title="ACTIVE LISTINGS"
            value="12"
            footer="Market inventory online"
          />
          <SystemPanel
            title="MESSAGES TODAY"
            value="34"
            footer="Incoming transmissions"
          />
          <SystemPanel
            title="ACCOUNT HEALTH"
            value="98%"
            footer="All systems nominal"
          />
        </div>

        {/* Control Panels */}
        <div className="grid grid-cols-2 gap-6">
          <ControlPanel
            title="MARKETPLACE"
            description="Enable or disable trading operations."
            enabled
          />
          <ControlPanel
            title="COMMS SYSTEM"
            description="Enable pilot communications."
            enabled
          />
        </div>

        {/* Status Console */}
        <div className="border border-white/10 rounded-lg p-6 bg-black/40">
          <div className="text-xs text-white/60 mb-4 tracking-widest">
            SYSTEM STATUS
          </div>

          <div className="space-y-2 text-sm">
            <StatusLine label="Market Engine" status="ONLINE" />
            <StatusLine label="Escrow Service" status="STANDBY" />
            <StatusLine label="Message Relay" status="ONLINE" />
            <StatusLine label="Fraud Detection" status="MONITORING" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── COMPONENTS ───────────────────────── */

function SystemPanel({
  title,
  value,
  footer,
}: {
  title: string;
  value: string;
  footer: string;
}) {
  return (
    <div className="border border-white/10 rounded-lg bg-black/40 p-6">
      <div className="text-xs tracking-widest text-white/50 mb-2">
        {title}
      </div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-xs text-white/40 mt-2">{footer}</div>
    </div>
  );
}

function ControlPanel({
  title,
  description,
  enabled,
}: {
  title: string;
  description: string;
  enabled?: boolean;
}) {
  return (
    <div className="border border-white/10 rounded-lg bg-black/40 p-6 flex items-center justify-between">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-white/40 mt-1">
          {description}
        </div>
      </div>

      <div
        className={`w-12 h-6 rounded-full flex items-center px-1 ${
          enabled ? "bg-green-500" : "bg-white/20"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-black transition-all ${
            enabled ? "translate-x-6" : ""
          }`}
        />
      </div>
    </div>
  );
}

function StatusLine({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  const color =
    status === "ONLINE"
      ? "text-green-400"
      : status === "STANDBY"
      ? "text-yellow-400"
      : "text-blue-400";

  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/70">{label}</span>
      <span className={`font-mono ${color}`}>{status}</span>
    </div>
  );
}
