# Social Exchange — Epic Space Design System

A reusable design language codified from the redesigned landing hero
(`app/entrance.css`). It lives in **`app/design-system.css`** as CSS custom
properties (`--se-*`) plus a small set of utility classes (`.se-*`).

**Additive & opt-in.** This file is *not* imported anywhere by default. Import
it into a layout/page when you want the tokens and utilities:

```css
@import "./design-system.css";
```

It does **not** load fonts. The hero already loads Orbitron / Exo 2 /
JetBrains Mono. On a page that doesn't, add the Google Fonts `@import` noted at
the top of `design-system.css`.

---

## Color palette

| Token | Hex / value | Intended use |
|---|---|---|
| `--se-void` | `#02040a` | Primary deep-space page base |
| `--se-void-deep` | `#01020a` | Alt deep void (matches hero + cockpit) |
| `--se-panel` | `#0a1118` | Raised panel base |
| `--se-panel-deep` | `#050a0f` | Recessed panel base |
| `--se-cyan` | `#3FFFDC` | **Primary cyan accent** (dots, live signals) |
| `--se-cyan-alt` | `#00f0ff` | Alt cyan — holographic glow, button text |
| `--se-violet` | `#7A5CFF` | Nebula violet (gradients, glow) |
| `--se-magenta` | `#C64BFF` | Nebula magenta (gradients) |
| `--se-gold` | `#FFCB57` | E-Share gold — prices, currency chips |
| `--se-green` | `#00ff88` | Trust green — status OK, "online" dots |
| `--se-green-alt` | `#3AFF6F` | Trust green alt |
| `--se-red` | `#FF5F5F` | Alert red — down ticks, errors |
| `--se-text-hi` | `#E6E6E6` | High-emphasis text |
| `--se-text-lo` | `#9FB6D4` | Low-emphasis / muted text |
| `--se-text-cyan` | `#dafcff` | Cyan-tinted text on emblems |

RGB triplet vars (`--se-cyan-rgb`, `--se-violet-rgb`, …) are provided for
`rgba(var(--se-cyan-rgb), 0.2)`-style composition.

---

## Tokens

**Glass surfaces:** `--se-glass-bg` (0.03), `--se-glass-bg-strong` (0.05),
`--se-glass-bg-faint` (0.02), `--se-glass-border`, `--se-glass-border-strong`,
`--se-glass-blur` (10px), `--se-glass-blur-strong` (16px).

**Radii:** `--se-radius-xs` 4 · `-sm` 6 · `-md` 8 · `-lg` 12 · `-xl` 20 ·
`-pill` 999 · `-circle` 50%.

**Spacing (4px base):** `--se-space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20
· `-6` 24 · `-8` 32 · `-10` 40 · `-12` 48 · `-16` 64.

**Shadows:** `--se-glow`, `--se-glow-strong`, `--se-glow-violet`,
`--se-glow-gold`, `--se-glow-green`, `--se-elev-1`, `--se-elev-2`.

**Nebula:** `--se-nebula` — a ready-made stacked radial gradient over `--se-void`.

**Motion:** `--se-ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`),
`--se-transition` (`0.3s` + that ease).

**Fonts:** `--se-font-display` (Orbitron → Space Grotesk fallback),
`--se-font-mono` (JetBrains Mono), `--se-font-body` (= mono).

---

## Utility classes

| Class | Use | Example |
|---|---|---|
| `.se-glass` | Standard glassmorphic panel/card | `<div class="se-glass">…</div>` |
| `.se-glass-strong` | Elevated glass (popovers, modals) | `<div class="se-glass-strong">…</div>` |
| `.se-glow` | Add cyan glow shadow | `<div class="se-glass se-glow">…</div>` |
| `.se-glow-strong` | Intense glow + inset (hover/active) | `<button class="se-btn-primary se-glow-strong">` |
| `.se-chip` | Pill trust/label chip | `<span class="se-chip">Verified</span>` |
| `.se-btn` | Ghost glass button | `<button class="se-btn">Learn more</button>` |
| `.se-btn-primary` | Primary cyan command button | `<button class="se-btn se-btn-primary">Launch</button>` |
| `.se-headline` | Orbitron gradient headline | `<h1 class="se-headline">Own the exchange</h1>` |
| `.se-eyebrow` | Mono spaced uppercase label | `<p class="se-eyebrow">Social Exchange</p>` |
| `.se-nebula-bg` | Radial nebula page/section background | `<section class="se-nebula-bg">…</section>` |
| `.se-divider` | Glowing hairline separator | `<hr class="se-divider" />` |

`.se-btn-primary` is meant to be combined with `.se-btn` (base structure +
primary skin). A `prefers-reduced-motion` block neutralizes all transitions and
hover transforms defined in this file.

---

## `entrance.css` vs `cockpit.css` conflicts

Where the two existing files disagreed, the design system **prefers the hero's
(`entrance.css`) values** per the redesign brief. Conflicts found:

1. **Cyan accent.** `entrance.css` treats `#00f0ff` as *the* cyan.
   `cockpit.css` also sets `--cyan-primary: #00f0ff`, but its newer
   `live-pulse-dot` / lightbar use `#3fffdc`. The brief names **`#3FFFDC`** as
   the primary accent. Resolution: `--se-cyan = #3FFFDC` (primary),
   `--se-cyan-alt = #00f0ff` (holographic glow / button text).

2. **Alert red.** `entrance.css` uses `#ff5f5f`; `cockpit.css` uses
   `#ff006e` (`--red-signal`). Resolution: hero wins → `--se-red = #FF5F5F`.

3. **Body/base font.** `entrance.css` uses JetBrains Mono for body copy.
   `cockpit.css` sets `--font-base: 'Inter'`. Resolution: hero wins →
   `--se-font-body` maps to JetBrains Mono. (Cockpit may keep Inter for dense
   dashboard text; migrate incrementally.)

4. **Trust green.** Both use `#00ff88`; the brief adds `#3AFF6F`. Kept both:
   `--se-green` / `--se-green-alt`.

5. **Void base.** Brief specifies `#02040a` as the primary base while both
   existing files use `#01020a`. Kept the brief's `#02040a` as `--se-void`
   and preserved `#01020a` as `--se-void-deep` for continuity.

No existing files were modified; these notes only document the token choices.

---

## Migrating an existing cockpit page to this system

1. **Import the system** at the top of the page/module CSS:
   `@import "../design-system.css";` (adjust path).
2. **Swap raw hex for tokens.** Replace literal `#00f0ff` → `var(--se-cyan-alt)`
   (glow) or `var(--se-cyan)` (signal dots), `#01020a` → `var(--se-void-deep)`,
   `rgba(255,255,255,0.03)` → `var(--se-glass-bg)`, etc.
3. **Replace bespoke glass blocks** (background + border + `backdrop-filter`)
   with `.se-glass` / `.se-glass-strong`; delete the now-duplicated declarations.
4. **Replace ad-hoc buttons** (`.command-button`, `.idle-resume`,
   `.inspect-command`) with `.se-btn` + `.se-btn-primary`, keeping the existing
   class only if TSX depends on it (then apply both).
5. **Standardize glow** — swap hand-written `box-shadow: 0 0 20px …` for
   `.se-glow` / `.se-glow-strong` or `var(--se-glow*)`.
6. **Headlines & eyebrows** — point Orbitron titles at `.se-headline` and mono
   labels at `.se-eyebrow`; drop the local gradient/letter-spacing rules.
7. **Backgrounds** — replace stacked radial gradients with `.se-nebula-bg` or
   `var(--se-nebula)` where the epic-space look is wanted.
8. **Spacing & radii** — replace magic px with `--se-space-*` / `--se-radius-*`.
9. **Motion** — reuse `--se-ease-out-expo` / `--se-transition`; confirm the
   page still degrades under `prefers-reduced-motion`.
10. **Verify** class names required by `.tsx` are untouched, then remove dead CSS.
