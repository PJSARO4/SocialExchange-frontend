use client";

import React from "react";
import type { ChannelKey } from "./ChannelList";

export function RightPanel(props: {
  channel: {
    key: ChannelKey;
    name: string;
    description: string;
    messageCount: number;
    visibleCount: number;
    hasArchived: boolean;
    hasIncoming: boolean;
  };
}): React.JSX.Element {
  const { channel } = props;

  return (
    <div className="sx-panel sx-panel--right">
      <div className="sx-panel__header">
        <div className="sx-panel__title">Context</div>
        <div className="sx-panel__subtitle">Channel metadata</div>
      </div>

      <div className="sx-context">
        <div className="sx-context__block">
          <div className="sx-context__label">Channel</div>
          <div className="sx-context__value">{channel.name}</div>
          <div className="sx-context__hint">{channel.description}</div>
        </div>

        <div className="sx-context__grid" role="list">
          <div className="sx-kv" role="listitem">
            <div className="sx-kv__k">Key</div>
            <div className="sx-kv__v">{channel.key}</div>
          </div>
          <div className="sx-kv" role="listitem">
            <div className="sx-kv__k">Visible</div>
            <div className="sx-kv__v">{channel.visibleCount}</div>
          </div>
          <div className="sx-kv" role="listitem">
            <div className="sx-kv__k">Total</div>
            <div className="sx-kv__v">{channel.messageCount}</div>
          </div>
          <div className="sx-kv" role="listitem">
            <div className="sx-kv__k">Incoming</div>
            <div className="sx-kv__v">{channel.hasIncoming ? "Yes" : "No"}</div>
          </div>
          <div className="sx-kv" role="listitem">
            <div className="sx-kv__k">Archived</div>
            <div className="sx-kv__v">{channel.hasArchived ? "Present" : "None"}</div>
          </div>
        </div>

        <div className="sx-context__block">
          <div className="sx-context__label">Notes</div>
          <div className="sx-context__hint">
            This panel is reserved for future thread metadata, entity context, and escalation controls.
          </div>
        </div>
      </div>

      <div className="sx-panel__footer">
        <div className="sx-chip">
          <span className="sx-chip__label">Status</span>
          <span className="sx-chip__value">{channel.hasIncoming ? "Signal" : "Idle"}</span>
        </div>
        <div className="sx-chip">
          <span className="sx-chip__label">Scope</span>
          <span className="sx-chip__value">UI</span>
        </div>
      </div>
    </div>
  );
}

