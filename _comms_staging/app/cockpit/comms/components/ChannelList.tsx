"use client";

import React from "react";

export type ChannelKey = "system" | "direct" | "market" | "feeds";

export type ChannelItem = {
  key: ChannelKey;
  label: string;
  sublabel: string;
  state: "idle" | "pulse" | "warning" | "critical";
  count: number;
};

export function ChannelList(props: {
  items: ChannelItem[];
  activeKey: ChannelKey;
  onSelect: (key: ChannelKey) => void;
}): React.JSX.Element {
  const { items, activeKey, onSelect } = props;

  return (
    <div className="sx-channels" role="navigation" aria-label="Channel navigation">
      <div className="sx-channels__label">Channels</div>

      <div className="sx-channels__list" role="list">
        {items.map((it) => {
          const active = it.key === activeKey;
          return (
            <button
              key={it.key}
              type="button"
              className={`sx-channel ${active ? "sx-channel--active" : ""}`}
              onClick={() => onSelect(it.key)}
              aria-current={active ? "page" : undefined}
            >
              <span className={`sx-indicator sx-indicator--${it.state}`} aria-hidden="true" />
              <span className="sx-channel__text">
                <span className="sx-channel__top">
                  <span className="sx-channel__name">{it.label}</span>
                  <span className="sx-channel__count" aria-label={`${it.count} visible messages`}>
                    {it.count}
                  </span>
                </span>
                <span className="sx-channel__sub">{it.sublabel}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="sx-channels__divider" aria-hidden="true" />
    </div>
  );
}

