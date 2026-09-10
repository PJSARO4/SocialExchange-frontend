/**
 * Canvas starfield with depth parallax.
 *
 * Runs on its own requestAnimationFrame loop, completely outside React —
 * no state, no re-renders. Three depth bands drift at different speeds so
 * the viewer slowly perceives motion rather than seeing a moving wallpaper.
 *
 * Returns a teardown function.
 */

export interface StarfieldOptions {
  reducedMotion?: boolean;
}

interface Star {
  x: number;      // 0..1 normalized
  y: number;      // 0..1 normalized
  r: number;      // radius in css px
  a: number;      // base alpha
  vx: number;     // drift per second (normalized)
  vy: number;
  tw: number;     // twinkle phase
  tws: number;    // twinkle speed
}

// depth bands: [count, radius range, alpha range, speed multiplier]
const BANDS: Array<[number, [number, number], [number, number], number]> = [
  [170, [0.35, 0.75], [0.20, 0.45], 0.20], // far
  [70, [0.6, 1.05], [0.35, 0.65], 0.55],   // mid
  [22, [0.9, 1.5], [0.6, 0.95], 1.0],      // near
];

export function createStarfield(canvas: HTMLCanvasElement, opts: StarfieldOptions = {}) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars: Star[] = [];
  let raf = 0;
  let last = 0;
  let running = true;

  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  function build() {
    stars = [];
    for (const [count, rRange, aRange, speed] of BANDS) {
      // scale count with viewport area so small screens stay cheap
      const scaled = Math.round(count * Math.min(1.2, Math.max(0.5, (width * height) / (1600 * 900))));
      for (let i = 0; i < scaled; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          r: rand(rRange[0], rRange[1]),
          a: rand(aRange[0], aRange[1]),
          // extremely slow horizontal drift, a touch of vertical
          vx: -(0.0016 * speed) * rand(0.8, 1.2),
          vy: (0.00035 * speed) * rand(-1, 1),
          tw: Math.random() * Math.PI * 2,
          tws: rand(0.15, 0.5) * speed,
        });
      }
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
    draw(0);
  }

  function draw(dt: number) {
    ctx!.clearRect(0, 0, width, height);
    for (const s of stars) {
      if (dt > 0) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < -0.02) s.x = 1.02;
        else if (s.x > 1.02) s.x = -0.02;
        if (s.y < -0.02) s.y = 1.02;
        else if (s.y > 1.02) s.y = -0.02;
        s.tw += s.tws * dt;
      }
      const twinkle = 0.82 + 0.18 * Math.sin(s.tw);
      ctx!.globalAlpha = s.a * twinkle;
      ctx!.beginPath();
      ctx!.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      ctx!.fillStyle = '#dbeeff';
      ctx!.fill();
    }
    ctx!.globalAlpha = 1;
  }

  function frame(t: number) {
    if (!running) return;
    const dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
    last = t;
    draw(dt);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf) return;
    last = 0;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // Don't burn cycles on a hidden tab.
  function onVisibility() {
    if (document.hidden) stop();
    else if (!opts.reducedMotion) start();
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);

  if (opts.reducedMotion) {
    draw(0); // static single paint
  } else {
    start();
  }

  return () => {
    stop();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
