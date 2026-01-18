'use client';

export default function CockpitFrame() {
  return (
    <div className="cockpit-frame">
      {/* Canopy glass */}
      <div className="cockpit-canopy" />

      {/* Structural struts */}
      <div className="cockpit-strut left" />
      <div className="cockpit-strut right" />

      {/* Bottom dashboard silhouette */}
      <div className="cockpit-dashboard" />
    </div>
  );
}
