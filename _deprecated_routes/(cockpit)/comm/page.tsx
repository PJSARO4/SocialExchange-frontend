"use client";

import { useState } from "react";

type Channel = "UNIVERSAL" | "SQUADRONS" | "DIRECT";

const CHANNELS: Channel[] = ["UNIVERSAL", "SQUADRONS", "DIRECT"];

export default function CommPage() {
  const [activeChannel, setActiveChannel] =
    useState<Channel>("UNIVERSAL");

  return (
    <div className="h-full flex flex-col font-mono">
      {/* COMMS HEADER */}
      <div className="border border-gray-800 p-4 flex justify-between items-center">
        <div className="text-xs tracking-widest text-gray-400">
          COMMUNICATIONS ARRAY
        </div>

        <div className="flex gap-2">
          {CHANNELS.map((channel) => (
            <button
              key={channel}
              onClick={() => setActiveChannel(channel)}
              className={`border px-3 py-1 text-xs tracking-widest ${
                activeChannel === channel
                  ? "border-green-400 text-green-400"
                  : "border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {channel}
            </button>
          ))}
        </div>
      </div>

      {/* COMMS BODY */}
      <div className="flex-1 border border-gray-800 border-t-0 p-4 overflow-y-auto">
        {activeChannel === "UNIVERSAL" && <UniversalChat />}
        {activeChannel === "SQUADRONS" && <SquadronChat />}
        {activeChannel === "DIRECT" && <DirectChat />}
      </div>

      {/* COMMS INPUT */}
      <div className="border border-gray-800 border-t-0 p-3">
        <CommInput />
      </div>
    </div>
  );
}

/* =======================
   CHANNEL VIEWS
======================= */

function UniversalChat() {
  return (
    <ChatFrame title="UNIVERSAL CHANNEL">
      <ChatLine
        sender="ATLAS-01"
        message="Welcome to open airspace."
      />
      <ChatLine
        sender="ORION-7"
        message="Anyone tracking new marketplace activity?"
      />
    </ChatFrame>
  );
}

function SquadronChat() {
  return (
    <ChatFrame title="SQUADRON CHANNEL">
      <div className="text-gray-500 text-sm">
        No squadron linked.
      </div>
    </ChatFrame>
  );
}

function DirectChat() {
  return (
    <ChatFrame title="DIRECT COMMUNICATION">
      <div className="text-gray-500 text-sm">
        Select a pilot to establish a direct channel.
      </div>
    </ChatFrame>
  );
}

/* =======================
   SHARED COMPONENTS
======================= */

function ChatFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs tracking-widest text-gray-500">
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ChatLine({
  sender,
  message,
}: {
  sender: string;
  message: string;
}) {
  return (
    <div className="text-sm text-gray-300">
      <span className="text-blue-400 mr-2">
        [{sender}]
      </span>
      {message}
    </div>
  );
}

function CommInput() {
  return (
    <input
      type="text"
      placeholder="TRANSMIT MESSAGE…"
      className="w-full bg-black border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
    />
  );
}
