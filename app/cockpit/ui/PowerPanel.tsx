'use client';

import { useCruise } from '../context/CruiseContext';

export default function PowerPanel() {
  const { cruiseActive, toggleCruise } = useCruise();

  return (
    <div
      className={`power-control ${cruiseActive ? 'active' : ''}`}
      onClick={toggleCruise}
      role="button"
      aria-label="Toggle Autopilot Cruise Mode"
    >
      <div className="power-reactor">
        <div className="power-ring" />
        <div className="power-core" />
      </div>
      <div className="power-label">
        {cruiseActive ? 'CRUISE' : 'POWER'}
      </div>
    </div>
  );
}
