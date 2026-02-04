"use client";

import React from "react";
import type { ChannelKey } from "./ChannelList";

export type MessageKind = "system" | "user" | "alert";
export type MessagePriority = "normal" | "warning" | "critical";

export type CommsMessage = {
  id: string;
  channel: ChannelKey;
  kind: MessageKind;
  priority: MessagePriority;
  sender: { label: string; sublabel?: string };
  timestampMs: number;
  title?: string;
  body: string;
  incoming?: boolean;
  archived?: boolean;
};

function priorityLabel(p: MessagePriority): string {
  if (p === "critical") return "Critical";
  if (p === "warning") return "Warning";
  return "Normal";
}

export function MessageItem(props: {
  message: CommsMessage;
  timeLabel: string;
  showChannelTag?: boolean;
}): React.JSX.Element {
  const { message, timeLabel, showChannelTag = false } = props;

  const frameClass = [
    "sx-msg",
    `sx-msg--${message.kind}`,
    `sx-msg--${message.priority}`,
    message.incoming ? "sx-msg--incoming" : "",
    message.archived ? "sx-msg--archived" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={frameClass} role="listitem" aria-label={`${message.kind} message`}>
      <div className="sx-msg__meta">
        <div className="sx-msg__sender">
          <span className="sx-msg__senderMain">{message.sender.label}</span>
          {message.sender.sublabel ? <span className="sx-msg__senderSub">{message.sender.sublabel}</span> : null}
        </div>

        <div className="sx-msg__flags">
          {showChannelTag ? <span className="sx-tag sx-tag--dim">{message.channel}</span> : null}

          <span className={`sx-tag sx-tag--prio sx-tag--${message.priority}`}>{priorityLabel(message.priority)}</span>

          {message.archived ? <span className="sx-tag sx-tag--dim">Archived</span> : null}
          {message.incoming ? <span className="sx-tag sx-tag--live">Incoming</span> : null}

          <span className="sx-msg__time" aria-label={`Timestamp ${timeLabel}`}>
            {timeLabel}
          </span>
        </div>
      </div>

      <div className="sx-msg__bubble">
        {message.title ? <div className="sx-msg__title">{message.title}</div> : null}
        <div className="sx-msg__body">{message.body}</div>
      </div>
    </div>
  );
}

