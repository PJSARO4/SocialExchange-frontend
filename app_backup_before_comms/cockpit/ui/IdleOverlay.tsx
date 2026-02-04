"use client";

type IdleOverlayProps = {
  onActivate: () => void;
};

export default function IdleOverlay({ onActivate }: IdleOverlayProps) {
  return (
    <div
      className="idle-overlay"
      onClick={onActivate}
      role="button"
      aria-label="Exit idle mode"
    >
      <div className="idle-readout">
        <div className="idle-mode">IDLE MODE</div>
        <div className="idle-status">AWAITING INPUT</div>

        <div className="idle-telemetry">
          <span>SYSTEM: NOMINAL</span>
          <span>POWER: 87%</span>
          <span>LINK: STANDBY</span>
        </div>
      </div>
    </div>
  );
}
