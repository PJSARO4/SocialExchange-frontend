"use client";

export default function CinematicBackground(): JSX.Element {
  return (
    <div className="cinematic-root" aria-hidden="true">
      <div className="cinematic-layer a" />
      <div className="cinematic-layer b" />
      <div className="cinematic-veil" />
      <div className="cinematic-noise" />
    </div>
  );
}
