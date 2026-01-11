"use client";

export default function EntryView({
  onEnter,
}: {
  onEnter: () => void;
}) {
  return (
    <div className="entry-root">
      <div className="entry-bg" />
      <div className="entry-content">
        <h1 className="entry-title">
          SOCIAL <span>•</span> EXCHANGE
        </h1>

        <p className="entry-quote">“Noise hides intention.”</p>

        <button className="entry-button" onClick={onEnter}>
          ENTER MISSION CONTROL
        </button>

        <p className="entry-sub">
          Access is monitored. Actions are logged.
        </p>
      </div>
    </div>
  );
}
