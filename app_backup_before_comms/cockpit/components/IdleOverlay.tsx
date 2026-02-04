'use client';

export default function IdleOverlay({
  onEnter,
}: {
  onEnter: () => void;
}) {
  return (
    <div className="idle-overlay">
      <h1>SOCIAL • EXCHANGE</h1>
      <button onClick={onEnter}>ENTER MISSION CONTROL</button>
      <p>SYSTEM STANDBY</p>
    </div>
  );
}
