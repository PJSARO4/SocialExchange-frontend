"use client";

import React, { useMemo, useState } from "react";
import "./comms.css";

import { ChannelList, type ChannelKey, type ChannelItem } from "./components/ChannelList";
import { MessageItem, type CommsMessage } from "./components/MessageItem";
import { RightPanel } from "./components/RightPanel";

type ChannelMeta = {
  key: ChannelKey;
  name: string;
  kind: "system" | "direct" | "market" | "feeds";
  description: string;
};

const CHANNELS: ChannelMeta[] = [
  { key: "system", name: "System", kind: "system", description: "Platform-level notices and integrity signals." },
  { key: "direct", name: "Direct", kind: "direct", description: "Private threads, operator-to-operator." },
  { key: "market", name: "Market", kind: "market", description: "Transaction-adjacent comms and listing signals." },
  { key: "feeds", name: "Feeds", kind: "feeds", description: "Watch streams, ambient pulses, and updates." },
];

const now = Date.now();
const minutes = (n: number) => now - n * 60_000;

const MOCK: Record<ChannelKey, CommsMessage[]> = {
  system: [
    {
      id: "sys-001",
      channel: "system",
      kind: "system",
      priority: "normal",
      sender: { label: "CORE", sublabel: "runtime" },
      timestampMs: minutes(42),
      title: "Checkpoint",
      body: "All cockpit subsystems reporting nominal. No intervention required.",
    },
    {
      id: "sys-002",
      channel: "system",
      kind: "alert",
      priority: "warning",
      sender: { label: "GUARD", sublabel: "policy monitor" },
      timestampMs: minutes(18),
      title: "Signal Drift",
      body: "Elevated anomaly rate detected in inbound comms. Monitoring escalation thresholds.",
    },
    {
      id: "sys-003",
      channel: "system",
      kind: "alert",
      priority: "critical",
      sender: { label: "SENTINEL", sublabel: "integrity" },
      timestampMs: minutes(6),
      title: "Integrity Lock",
      body: "Write operations temporarily gated. Read-only mode engaged for 120 seconds.",
      archived: true,
    },
  ],
  direct: [
    {
      id: "dir-001",
      channel: "direct",
      kind: "user",
      priority: "normal",
      sender: { label: "Operator", sublabel: "lane C/QA" },
      timestampMs: minutes(55),
      body: "Comms shell is up. Starting component pass for message items and states.",
    },
    {
      id: "dir-002",
      channel: "direct",
      kind: "user",
      priority: "normal",
      sender: { label: "Secondary", sublabel: "frontend" },
      timestampMs: minutes(49),
      body: "Keep it restrained. Avoid SaaS-chat styling. Status lights only.",
    },
    {
      id: "dir-003",
      channel: "direct",
      kind: "alert",
      priority: "warning",
      sender: { label: "Operator", sublabel: "lane C/QA" },
      timestampMs: minutes(12),
      title: "Heads-up",
      body: "Market channel will remain empty for now. Ensure empty-state is clean.",
    },
  ],
  market: [],
  feeds: [
    {
      id: "fed-001",
      channel: "feeds",
      kind: "system",
      priority: "normal",
      sender: { label: "WATCH", sublabel: "feed mux" },
      timestampMs: minutes(31),
      title: "Pulse",
      body: "New creator activity detected in monitored segments. No action required.",
    },
    {
      id: "fed-002",
      channel: "feeds",
      kind: "alert",
      priority: "warning",
      sender: { label: "WATCH", sublabel: "feed mux" },
      timestampMs: minutes(3),
      title: "Incoming Signal",
      body: "Transient spike in mentions across three tracked topics.",
      incoming: true,
    },
  ],
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function CommsPage(): React.JSX.Element {
  const [active, setActive] = useState<ChannelKey>("system");
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const allMessages = MOCK[active] ?? [];
  const filtered = useMemo(() => {
    if (showArchived) return allMessages;
    return allMessages.filter((m) => !m.archived);
  }, [allMessages, showArchived]);

  const hasIncoming = useMemo(() => {
    return filtered.some((m) => m.incoming) || (MOCK[active] ?? []).some((m) => m.incoming);
  }, [active, filtered]);

  const channelItems: ChannelItem[] = useMemo(() => {
    return CHANNELS.map((c) => {
      const list = MOCK[c.key] ?? [];
      const unreadLike = list.some((m) => m.incoming && !m.archived);
      const critical = list.some((m) => m.priority === "critical" && !m.archived);
      const warning = list.some((m) => m.priority === "warning" && !m.archived);
      const state: ChannelItem["state"] = critical ? "critical" : warning ? "warning" : unreadLike ? "pulse" : "idle";

      const count = list.filter((m) => (showArchived ? true : !m.archived)).length;

      return {
        key: c.key,
        label: c.name,
        sublabel: c.description,
        state,
        count,
      };
    });
  }, [showArchived]);

  const activeMeta = CHANNELS.find((c) => c.key === active) ?? CHANNELS[0];

  return (
    <div className="sx-comms">
      <div className="sx-comms__frame">
        <aside className="sx-comms__left" aria-label="Channels">
          <div className="sx-panel sx-panel--left">
            <div className="sx-panel__header">
              <div className="sx-panel__title">Comms</div>
              <div className="sx-panel__subtitle">Infrastructure for conversation</div>
            </div>

            <ChannelList items={channelItems} activeKey={active} onSelect={setActive} />

            <div className="sx-panel__footer">
              <div className="sx-chip">
                <span className="sx-chip__label">Mode</span>
                <span className="sx-chip__value">Scaffold</span>
              </div>
              <div className="sx-chip">
                <span className="sx-chip__label">Signals</span>
                <span className="sx-chip__value">{hasIncoming ? "Active" : "Quiet"}</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="sx-comms__main" aria-label="Message stream">
          <div className="sx-panel sx-panel--main">
            <div className="sx-streamHeader">
              <div className="sx-streamHeader__left">
                <div className="sx-streamHeader__titleRow">
                  <div className="sx-streamHeader__title">{activeMeta.name}</div>
                  <div className="sx-streamHeader__lights" aria-hidden="true">
                    <span className={`sx-light ${hasIncoming ? "sx-light--pulse" : "sx-light--idle"}`} />
                    <span className="sx-light sx-light--idle" />
                    <span className="sx-light sx-light--idle" />
                  </div>
                </div>
                <div className="sx-streamHeader__subtitle">{activeMeta.description}</div>
              </div>

              <div className="sx-streamHeader__right">
                <button
                  type="button"
                  className={`sx-btn ${showArchived ? "sx-btn--on" : ""}`}
                  onClick={() => setShowArchived((v) => !v)}
                  aria-pressed={showArchived}
                >
                  {showArchived ? "Showing Archived" : "Archived Hidden"}
                </button>

                <button type="button" className="sx-btn sx-btn--ghost" onClick={() => setActive(active)}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="sx-stream">
              {filtered.length === 0 ? (
                <div className="sx-empty" role="status" aria-live="polite">
                  <div className="sx-empty__title">No messages</div>
                  <div className="sx-empty__body">
                    This channel is quiet. When signals arrive, they will stage here without altering layout.
                  </div>
                  <div className="sx-empty__meta">
                    <div className="sx-empty__tag">State: Empty channel</div>
                    <div className="sx-empty__tag">Ready for data</div>
                  </div>
                </div>
              ) : (
                <div className="sx-stream__list" role="list">
                  {filtered.map((m) => (
                    <MessageItem
                      key={m.id}
                      message={m}
                      timeLabel={formatTime(m.timestampMs)}
                      showChannelTag={false}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="sx-composer" aria-label="Composer (disabled scaffold)">
              <div className="sx-composer__input" aria-disabled="true">
                <span className="sx-composer__placeholder">Composer disabled in UI scaffold.</span>
              </div>
              <button type="button" className="sx-btn sx-btn--disabled" disabled>
                Send
              </button>
            </div>
          </div>
        </main>

        <aside className="sx-comms__right" aria-label="Context panel">
          <RightPanel
            channel={{
              key: activeMeta.key,
              name: activeMeta.name,
              description: activeMeta.description,
              messageCount: allMessages.length,
              visibleCount: filtered.length,
              hasArchived: allMessages.some((m) => m.archived),
              hasIncoming: allMessages.some((m) => m.incoming && !m.archived),
            }}
          />
        </aside>
      </div>
    </div>
  );
}

