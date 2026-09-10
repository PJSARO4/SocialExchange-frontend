# MEME LAB — CODE AUDIT

**Audited:** 2026-09-10
**Against:** `origin/main` @ `f989c00` (local working copy verified byte-identical for all eight files)
**Scope:** read-only audit of `/cockpit/meme-lab`. No code was changed.
**Runtime verification:** live endpoints on `social-exchange-frontend.vercel.app` were exercised in a browser.

---

## 1. Verdict

Everything behind the visible controls is real. Nothing is mocked, stubbed, or UI-only.
The feature is complete and self-contained — and completely disconnected from the
Drive → Bulk Schedule → publish pipeline. There is no seam between them today.

---

## 2. File inventory

| File | Lines | Role |
|---|---:|---|
| `app/cockpit/meme-lab/page.tsx` | 479 | Client component. UI, state, orchestration. |
| `app/cockpit/meme-lab/meme-lab.css` | 299 | All rules scoped under `.meme-lab`. |
| `app/cockpit/meme-lab/lib/captions.ts` | 275 | Pattern-bank caption generator. No LLM. |
| `app/cockpit/meme-lab/lib/render.ts` | 211 | Canvas compositor, text fitting, deep fry. |
| `app/cockpit/meme-lab/lib/exportPackage.ts` | 198 | Metricool CSV, manifest, README, filenames. |
| `app/cockpit/meme-lab/lib/zip.ts` | 127 | Hand-rolled store-only ZIP writer (no JSZip). |
| `app/api/meme-lab/templates/route.ts` | 77 | memegen.link catalogue proxy. |
| `app/api/meme-lab/image/route.ts` | 58 | memegen.link blank-image proxy. |

**Total: ~1,724 lines.** No external runtime dependencies added to `package.json` for this feature.

### Wiring into the cockpit

- `app/cockpit/CockpitLayoutClient.tsx:258` — nav entry, label **"Content Lab"**, sub "Create & Deploy", icon `FlaskConical`, href `/cockpit/meme-lab`.
- `data-section="meme-lab"` is derived from the pathname at `CockpitLayoutClient.tsx:169`. There is **no** `[data-section="meme-lab"]` rule in `cockpit.css`, so the page renders over the live `SpaceEnvironment` canvas rather than a photo backdrop. This is correct and intentional.
- `app/cockpit/ui/PresencePing.tsx:16` already reports this route as `"Content Lab"` for the owner map.
- `app/cockpit/owner/page.tsx:81` assigns it the map dot color `#a78bfa`.

---

## 3. Functional vs. mocked — control by control

| Control | Status | Actual behavior |
|---|---|---|
| **MAKE MEMES** | Real | Shuffles the loaded template list, takes 12, calls `generate(word, 12)`, renders each on `<canvas>`, streams results into the grid as each finishes. Failed templates are skipped silently. |
| **RANDOM** | Real | `randomSubject()` picks from a 43-item hardcoded subject list, then runs the identical path. |
| **Deep Fry** | Real | Slider 0–1, step 0.1. Applies `saturate(1+2.2i) contrast(1+1.0i) brightness(1+0.12i)`, an `overlay`-composited `rgba(255,120,0, 0.16i)` fill, then round-trips through JPEG at quality `max(0.05, 0.32 − 0.24i)` for genuine compression artifacts. |
| **DOWNLOAD PNGS** | Real | One anchor-click download per selected blob, staggered 220ms. Named `{slug}-{n}.png`. |
| **CREATE PACKAGE + CSV** | Real | Builds a ZIP entirely in-browser containing `media/*.png`, `metricool_import.csv`, `manifest.csv`, `README.txt`. |
| **Config panel** | Real | Networks, hours-between-posts, first-post offset, draft flag, public media base URL. Persisted to `localStorage` key `meme-lab-settings`. Per-browser only. |

### Live endpoint verification (2026-09-10)

- `GET /api/meme-lab/templates` → 200, full memegen catalogue filtered to `lines >= 2`.
- `GET /api/meme-lab/image?id=..%2Fetc%2Fpasswd` → `{"error":"Invalid template id"}`. Path traversal is correctly rejected by `ID_PATTERN`.

---

## 4. Data flow — user input to generated output

```
user types a subject  (or presses RANDOM)
  |
  v
cleanKeyword()                     trim, collapse whitespace, 60-char cap
  |
  v
generate(word, 12)                 captions.ts
  |                                round-robins 7 comedic modes:
  |                                  macro | deadpan | absurd | corporate
  |                                  mismatch | escalate | cursed
  |                                per-mode pattern banks, shuffled, popped
  |                                token substitution: {kw} {kwUpper}
  |                                  {noun} {adj} {place} {number}
  |                                same token twice in one pattern never
  |                                  resolves to the same value
  v
shuffled(templates).slice(0, 12)   template catalogue from the API route
  |
  v
for each (template, caption) pair:
     renderMeme()                  render.ts
       loadImage('/api/meme-lab/image?id=...')
                                   <- same-origin proxy; this is what keeps
                                      the canvas untainted so toBlob() works
       drawImage, scaled to max 900px wide
       drawBlock(top)   \           Impact font stack, uppercase,
       drawBlock(bottom) >          greedy word wrap, font auto-shrinks
                                    (step -2px, floor 13px) until the block
                                    fits 34% of image height; black stroke
                                    at lineWidth = size/6, white fill
       deepFry() if fry > 0
       canvas.toBlob('image/png')  <- HARDCODED PNG
  |
  v
Candidate { id, blob, objectUrl, mode, modeLabel, template, templateName, top, bottom }
held in React state; object URLs tracked in urlsRef and revoked on
regenerate and on unmount
  |
  v
user clicks cards to select  (Set<string> of candidate ids)
  |
  +--> DOWNLOAD PNGS  -> triggerDownload() per blob
  |
  +--> CREATE PACKAGE -> buildPackage() -> buildZip() -> triggerDownload()
```

### Server-side surface

Two routes. Both are **read-only proxies with no side effects and no auth check**.

**`/api/meme-lab/templates`** — `runtime = 'nodejs'`, `revalidate = 3600`. Fetches
`https://api.memegen.link/templates`, keeps only entries whose `id` matches
`/^[a-z0-9-]+$/i` and whose `lines >= 2` (a top and a bottom slot are required),
trims to `{ id, name, lines }`. Returns `Cache-Control: public, s-maxage=3600,
stale-while-revalidate=86400`. On upstream failure returns 502 with an empty
`templates` array, which the UI surfaces as `TEMPLATE SOURCE UNREACHABLE`.

**`/api/meme-lab/image`** — `runtime = 'nodejs'`. Validates `id` against
`/^[a-z0-9][a-z0-9-]{0,63}$/i`, fetches `https://api.memegen.link/images/{id}.png`,
streams the bytes back with `Cache-Control: public, max-age=86400,
s-maxage=604800, immutable` and `Access-Control-Allow-Origin: *`. The upstream
host is hard-coded and the id is strictly validated, so this cannot be used as
an open redirect or SSRF pivot.

**The proxy exists for a specific reason:** a cross-origin image without
permissive CORS headers taints the canvas and makes `toBlob()` throw, which
would break every export path. Serving through our own origin avoids that
entirely. Do not "optimize" this away by pointing `<img>` straight at memegen.

### Export package contents

`memes_{subject-slug}_{YYYY-MM-DD}_{HHMM}.zip`

```
memes_.../
  media/
    01_{mode}_{subject}.png
    02_{mode}_{subject}.png
    ...
  metricool_import.csv    15 columns: Text, Date, Time, Draft,
                          Facebook, Instagram, Twitter, LinkedIn, Pinterest,
                          TikTok, Youtube, GMB, Threads, Bluesky, Image URL
  manifest.csv            internal: file, mode, mode_label, template,
                          top_text, bottom_text, keyword, scheduled
  README.txt              human instructions for the Metricool import
```

Scheduling in the CSV is computed client-side: first slot at
`now + startsInHours` snapped to the hour, then `+ intervalHours` per item.
`Image URL` is populated only if a public media base URL was configured;
otherwise it is left blank and the UI warns that links must be pasted before import.

`zip.ts` implements the subset of APPNOTE.TXT needed for a flat archive —
local file headers, central directory, end-of-central-directory — store-only
(method 0). PNGs are already compressed, so DEFLATE would buy almost nothing.
UTF-8 filename flag (`0x0800`) is set.

---

## 5. The critical fact for the next milestone

**Generated output never leaves the browser.**

There is no database write, no Vercel Blob upload, no Google Drive call, and no
server-side render anywhere in this feature. A meme exists as a `Blob` in React
state and an object URL, and it reaches the outside world only when the user
clicks a download button. Close the tab and it is gone.

This is the gap the milestone has to close.

---

## 6. Four constraints that govern any integration

**1. Rendering is client-side only.**
`render.ts` requires `document.createElement('canvas')`. A cron-driven autonomous
engine has no browser. Either the generation step stays human-triggered, or a
server-side rasterizer is added (`@napi-rs/canvas`, `sharp`, or `satori` — none
are currently in `package.json`). This is the single biggest architectural
implication of the word "autonomous."

**2. PNG output vs. Instagram's JPEG requirement.**
`canvasToBlob()` hardcodes `'image/png'`, and the publishing pipeline is known
to fail on `.png`. The cheap fix is client-side: `deepFry()` already calls
`toDataURL('image/jpeg', quality)`, so the same technique yields JPEG bytes with
no new dependency and no server compute.

**3. `bulk-schedule` is Drive-coupled.**
`POST /api/automation/bulk-schedule` accepts `files: { id, name, mimeType }[]`
as **Google Drive file IDs** and calls `downloadDriveToBlob()` itself. It cannot
currently accept a raw blob or an arbitrary media URL. Meme Lab output is not in
Drive, so the two halves do not meet.

**4. The caption is generated twice, in two different places.**
Meme Lab knows the joke (`top` / `bottom`). `bulk-schedule` regenerates a caption
from the *filename* via `generateCaption({ mode: 'filename' })` →
`prettifyName()`. If Meme Lab output travels through Drive, the joke text must
survive the round trip or posts get captions describing a filename.

---

## 7. Recommended integration point

**Push generated images into the Drive `to_post` folder. Change nothing downstream.**

The seam is the export rail in `page.tsx` (lines 446–475), alongside
DOWNLOAD PNGS and CREATE PACKAGE + CSV. A third action POSTs the selected
candidates to a **new** route — `app/api/meme-lab/to-drive/route.ts` — which
authenticates the session, converts to JPEG, and uploads into `to_post` via a
**new** `uploadDriveFile()` added to `app/lib/google/drive.ts`.

Why this is the safest point:

- **`bulk-schedule` is the proven-working code and stays untouched.** It already
  reads `to_post`, downloads to Blob, captions, schedules, and moves originals to
  `posted`. More files in the folder is a no-op change from its perspective.
- **The OAuth scope is already full `drive`** (`app/lib/google/oauth.ts:15`, added
  to enable `moveDriveFile`). `files.create` works with the same token. No new
  consent screen — subject to the same "has PJ reconnected since the full-scope
  change" question that already gates the auto-move feature.
- **Purely additive.** One new route, one new library function, one new button.
  Nothing existing is modified, so nothing existing can regress.
- **Solves the caption problem without a schema change.** Encode the joke into
  the filename (`slugify(top + ' ' + bottom)`); `generateCaption`'s existing
  `filename` mode reconstructs it. No new field on `ScheduledPostNew`.

**Rejected alternative:** bypass Drive entirely — upload JPEG to Vercel Blob and
write `ScheduledPostNew` rows directly. Fewer hops, but it requires refactoring
`bulk-schedule` to accept media URLs instead of Drive IDs, which puts the one
proven-working automation path back on the table. Not worth it for milestone one.

### Pipeline reference (unchanged, for context)

```
Drive to_post
  -> BulkScheduleModal          app/cockpit/my-e-assets/my-feeds/components/automation/
  -> POST /api/automation/bulk-schedule
       downloadDriveToBlob()    app/lib/google/drive.ts  -> Vercel Blob (public)
       generateCaption()        app/lib/social/caption.ts (filename | template | ai/Ollama)
       prisma.scheduledPostNew.create({ status: 'PENDING' })
       moveDriveFile()          to_post -> posted   (optional, needs write scope)
  -> GitHub Actions cron, every 10 min
  -> GET /api/cron/publish-scheduled   (auth: CRON_TOKEN || CRON_SECRET)
       claims PENDING + QUEUED
       graph.instagram.com: create container -> poll status_code until FINISHED
       -> media_publish
```

---

## 8. Risks and observations

**Third-party single point of failure.** Every template image comes from
`api.memegen.link` — a free public service with no SLA. If it goes down or
rate-limits, MAKE MEMES produces nothing. Both proxy routes cache aggressively,
which softens but does not remove this.

**"Original content" is doing some work.** The templates are themselves existing,
recognizable meme images. For a personal meme account this is normal. For a
platform positioned commercially, the generation engine's IP posture is worth
settling before more layers are built on top of it. Not a milestone-one blocker.

**Both API routes are unauthenticated.** `/api/meme-lab/templates` and
`/api/meme-lab/image` have no `getServerSession` check, so anyone can use them as
a free memegen proxy on our bandwidth. Low severity, trivially fixed, worth doing
before any public launch.

**CSP note.** `middleware.ts` sets `img-src 'self' data: blob: ...` — which covers
canvas object URLs today. It does **not** include the Vercel Blob storage domain.
If a future Content Lab screen previews an uploaded Blob URL, that CSP line needs
the storage host added or images will silently fail to render.

**Metricool export is a parallel dead end.** The CSV/ZIP path is a faithful port
of the MEMEMaker desktop app and has nothing to do with the internal publishing
pipeline. It still works and is worth keeping, but it is not the path the
milestone should build on.

**Minor:** `DOWNLOAD PNGS` fires up to 12 sequential anchor-click downloads;
some browsers block multiple automatic downloads after the first few. Settings
live in `localStorage` only, so they do not follow the user across devices.

---

## 9. Protected — do not change

The cockpit shell, `cockpit.css`, the `SpaceEnvironment` canvas scene, and the
existing Meme Lab visual design are treated as protected. This audit proposes no
redesign. The recommended integration adds one button to an existing rail and
changes no layout, palette, or backdrop behavior.
