"use client";

import { useState } from "react";
import { useView } from "@/app/context/ViewContext";

type Channel = "general" | "market" | "escrow";

type Message = {
  id: number;
  author: string;
  content: string;
  time: string;
  system?: boolean;
};

const INITIAL_MESSAGES: Record<Channel, Message[]> = {
  general: [
    {
      id: 1,
      author: "SYSTEM",
      content: "General communications channel online.",
      time: "14:00",
      system: true
    }
  ],
  market: [
    {
      id: 2,
      author: "SYSTEM",
      content: "Market activity feed initialized.",
      time: "14:01",
      system: true
    }
  ],
  escrow: [
    {
      id: 3,
      author: "SYSTEM",
      content: "Escrow monitoring enabled.",
      time: "14:02",
      system: true
    }
  ]
};

export default function CommsLayout() {
  const { view, toggleView } = useView();

  const [activeChannel, setActiveChannel] = useState<Channel>("general");
  const [messages, setMessages] =
    useState<Record<Channel, Message[]>>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;

    const msg: Message = {
      id: Date.now(),
      author: "you",
      content: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    setMessages((prev) => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], msg]
    }));

    setInput("");
  };

  return (
    <div className={`comms-root ${view === "expanded" ? "expanded" : ""}`}>
      {/* Sidebar */}
      <aside className="comms-sidebar">
        <div className="comms-title">COMMS</div>

        <div className="comms-section">
          {(["general", "market", "escrow"] as Channel[]).map((ch) => (
            <div
              key={ch}
              className={`comms-channel ${
                activeChannel === ch ? "active" : ""
              }`}
              onClick={() => setActiveChannel(ch)}
            >
              # {ch}
            </div>
          ))}
        </div>

        <div className="comms-section">
          <div className="comms-channel muted">@ direct</div>
        </div>

        <div className="comms-section">
          <div className="comms-channel system">SYSTEM</div>
        </div>
      </aside>

      {/* Main */}
      <section className="comms-main">
        <div className="system-header">
          <div className="system-title">COMMS</div>
          <button className="system-expand" onClick={toggleView}>
            {view === "docked" ? "⤢" : "⤡"}
          </button>
        </div>

        <div className="comms-feed">
          {messages[activeChannel].map((msg) => (
            <div
              key={msg.id}
              className={`comms-message ${msg.system ? "system" : ""}`}
            >
              <span className="comms-time">[{msg.time}]</span>{" "}
              <span className="comms-author">{msg.author}:</span>{" "}
              <span className="comms-content">{msg.content}</span>
            </div>
          ))}
        </div>

        <div className="comms-input">
          <span className="prompt">&gt;</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Transmit to #${activeChannel}`}
          />
        </div>
      </section>
    </div>
  );
}
