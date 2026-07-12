# Swatchbook

A General Text app: a lifelong, plaintext record of every colour and finish decision you
make, across homes, workshops, and hobbies. The unit isn't *a wall*, it's *a colour or finish
choice you'll want to reproduce years later*, so home paint, a woodworking finish schedule, a
miniature's paint recipe, a glaze, and a car's touch-up code are all the same shape of thing.
One app, many domains; no backend, all state is plaintext files you own.

The guiding idea: **the format is the product, the app is a window onto it.** A *template*
(home paint, woodworking, …) is only a presentation layer: it relabels the tiers, chooses
which fields show, and decides whether the ordered recipe is emphasized. A file written under
one template reads fine under any other.

Built against the app guide: https://www.generaltext.org/llms.txt
(local source: `projects/generaltext/content/docs/building-apps.md`).

## Data model

The app's only writable scope is its data folder, `_gtApps/swatchbook/data/`. Paths passed to
`window.gt` are **relative** to that folder: the runtime maps `v1/...` to wherever the app is
installed, so we never hardcode `_gtApps/swatchbook/...`. The platform-owned siblings
(`installed.json`, `code/`) are off limits.

Data is versioned inside `data/` by **format** version, starting at `data/v1/`. This is
deliberately decoupled from the app's `0.x` semver: the on-disk format is the real product, so
it carries its own version line (per the original spec). A breaking format change bumps to
`v2/` and the app migrates itself (read `v1/`, transform, write `v2/`); the platform does not
migrate for us.

The store is three line-oriented **JSONL** files (one JSON object per line) so concurrent
edits merge cleanly at the character level and any other tool can read them:

```
v1/projects.jsonl     one Project per line   (the container; sets the domain)
v1/parts.jsonl        one Part per line      (a room / piece / model / panel …)
v1/entries.jsonl      one Entry per line     (a colour or finish decision — the chip)
```

**Project**: the container; `domain` selects the template.

```json
{"id":"…","name":"Maple Street House","subtitle":"412 Maple St","domain":"home","created":"…","updated":"…"}
```

**Part**: a room / piece / model. `extra` holds domain-specific part fields (e.g. wood species).

```json
{"id":"…","projectId":"…","name":"Tabletop","extra":{"species":"Black walnut"},"created":"…","updated":"…"}
```

**Entry**: the chip. A stable core plus two extension points, `steps` and `extra`:

```json
{
  "id":"…","partId":"…",
  "name":"Oiled & waxed",
  "brand":"","code":"","hex":"#5a4632","approx":false,
  "finish":"Satin","line":"","type":"Danish oil","surface":"",
  "date":"2026-05-03","description":"…",
  "steps":[{"role":"Sand","product":"120 → 220 grit"},{"role":"Finish coat","product":"Watco Danish Oil","brand":"Watco","note":"2 coats"}],
  "extra":{},
  "created":"…","updated":"…"
}
```

Conventions:

- **`steps`** is an ordered recipe: render order *is* application order. Each step is
  `{role, product?, brand?, code?, hex?, note?}`. Empty/absent for single-colour entries; the
  star of the show for woodworking, miniatures, ceramics, etc.
- **`extra`** holds domain-specific fields keyed by documented ids (`species`, `cone`,
  `atmosphere`, `reference`…), so the core schema stays stable and forward-compatible.
- **`hex`** is optional: empty/absent means "no colour yet" (a first-class state). `approx:
  true` marks a swatch that only *represents* the result (e.g. a fired glaze you can't
  photograph). The swatch is a representation, never a measurement.
- **Dates** are ISO `YYYY-MM-DD`; `created`/`updated` are full ISO timestamps.

Edits rewrite the affected file's whole next text via `gt.applyDiff` against the live text; the
runtime turns that into a minimal CRDT diff, so only changed bytes move and it still merges.
Parsing skips blank/malformed lines, so one bad line from another tool never blanks a
collection.

## Templates (the domain registry)

`src/lib/templates.ts` is the whole domain system, a registry keyed by `domain`. Each
`Template` declares its tier labels (`Home/Room/Paint` vs `Project/Piece/Finish` …), which
core fields the editor shows (with datalists), any `partFields`/`extra` fields, whether `steps`
is emphasized, and which fields print on the chip footer. **Adding a domain is adding one entry
here; nothing else changes**, because the on-disk format is universal.

All six domains are defined so any file renders under any template. Two are buildable today
(`available: true`, **home paint** and **woodworking**); the rest (miniatures, scale models,
ceramics, automotive) are declared and shown in the new-project picker as a "Soon" hint; their
format is real and forward-compatible, so they light up with no data migration.

## Import / Export

Export writes the current data three ways (`src/lib/model.ts`): **CSV** (one flattened row per
entry, human-readable but lossy), structured **JSON** (`{version, projects, parts, entries}`),
and the canonical **JSONL** (the three collections under `# <name>.jsonl` headers). Import
(`parseImport` + `actions.importDataset`) accepts the two lossless formats (JSON and JSONL) and
**merges by `id`**: records whose id already exists are left untouched, the rest appended, so
re-importing a backup is idempotent. CSV is export-only (no ids/steps to reconstruct).

## Code map

- `src/lib/model.ts`: types (`Project`/`Part`/`Entry`/`Step`), JSONL (de)serialization, ids,
  and CSV/JSON/JSONL export + `parseImport`. No React, no I/O.
- `src/lib/templates.ts`: the domain registry described above.
- `src/lib/dev-seed.ts`: sample data for empty workspaces, two domains (home paint +
  woodworking) so the demo shows the generalization.
- `src/lib/demo-runtime.ts`: the local, sample-data stand-in for `window.gt` (strings in
  memory, mirrored to `localStorage`, no network).
- `src/hooks/use-swatchbook.ts`: the data layer, one subscribe/observe lifecycle across the
  three files, parsed into typed arrays, with actions that rewrite the affected file's whole
  next text (incl. cascade delete + merge-import).
- `src/hooks/use-theme.ts`: mirrors the shell's light/dark theme (own toggle only when
  standalone/demo).
- `src/components/`: `Sidebar` (projects; a slide-in drawer on mobile), `ChipCard` (the
  signature swatch-plus-footer), `ProjectDialog` / `PartDialog` / `EntryDialog` (template-driven
  editors), and `MissingRuntime` (the out-of-platform landing page).
- `src/App.tsx`: layout, selection state, dialog orchestration, header (import/export/theme),
  and the responsive shell (persistent rail on desktop, hamburger + drawer on mobile).

## Develop

```bash
pnpm install
pnpm dev        # vite dev server — runs standalone, no General Text server needed
pnpm build      # tsc + vite build → dist/ (static, installable)
pnpm preview    # serve the built app (this is what a visitor sees: landing + /demo)
```

Swatchbook talks to General Text through the platform-injected **`window.gt`** runtime: it
bundles no sync client and no yjs (see `src/gt.d.ts` for the typed surface it uses). In
production General Text injects the runtime; for `pnpm dev` a tiny vite plugin
(`vite.config.ts`) injects it from a General Text origin so the app runs standalone against a
**local in-browser workspace** (IndexedDB + cross-tab sync), no account or server needed. A
fresh local workspace is seeded from `src/lib/dev-seed.ts`, inert under a real host
(`window.gt.sync.isLocal` is false).

By default the dev runtime loads from `https://www.generaltext.org/__gt/runtime.js`. Running
General Text locally? Point at it: `GT_ORIGIN=http://localhost:5173 pnpm dev`.

Because `pnpm dev` injects the runtime, it drops you straight into the **app** (there's a
`window.gt`), not the landing page. To see the landing page + demo locally, use `pnpm build &&
pnpm preview` (no runtime injected). That's the real deployed-root experience:

- Opened outside General Text (the deployed URL, or `pnpm preview`), there's no `window.gt`, so
  the app renders a **landing page** (`src/components/MissingRuntime.tsx`) that explains the
  app, shows sample chips, and links to install. It does **not** drop straight into the demo.
- The **`/demo`** route (its own URL, linkable/refreshable) installs the local sample-data
  runtime so visitors can play with the real app; it shows a "Demo" badge. Routing is plain
  History API in `main.tsx`, no router dependency.

**Mobile.** The layout is responsive via CSS breakpoints (no `isMobile`/`isTouch` signal from
the runtime): a persistent projects rail on desktop becomes a slide-in drawer behind a
hamburger on phones, the header collapses to icons, the chip grid goes 2-up, and part tabs
scroll horizontally. Most people use this on a phone, so test at ~390px.

## Deploy (Cloudflare)

Pure static build (`dist/`), no backend, no secrets, no bindings. Either Cloudflare host works;
the repo is set up for **Workers static assets** (same as the other General Text apps).

**Workers (this repo's setup).** `wrangler.jsonc` defines an assets-only Worker (no `main`)
that serves `dist/`. Connect the repo in the Cloudflare dashboard under **Workers & Pages →
Create → Import a repository** with build command `pnpm build` and deploy command `npx wrangler
deploy` (or just run `npx wrangler deploy` locally after a build). SPA fallback for `/demo` is
**`assets.not_found_handling: "single-page-application"`** in `wrangler.jsonc`: any unmatched
path returns `index.html` (200). Do **not** add a `_redirects` `/*  /index.html  200` rule:
Workers Assets rejects it as an infinite loop (that's a Pages-only convention).

**Pages (alternative).** Create a **Pages** project (Connect to Git), preset None, build `pnpm
build`, output `dist`. Pages uses a `public/_redirects` `/*  /index.html  200` for SPA fallback
instead of the Wrangler setting; add that file if you go this route. No `wrangler.jsonc` or
deploy command needed.

**Custom domain:** add `swatchbook.generaltext.org` (matches `url` in `gt.json`) to the Worker
under **Settings → Domains & Routes → Add → Custom domain** (or the Pages project's Custom
domains). DNS is wired automatically since the zone is on Cloudflare.

## Manifest & storage notes

- **Manifest:** `public/gt.json` (served at the build root) is the single source of truth for
  the gallery listing: identity (`name`, `displayName`, `version`, `gtApi: ^1.0`) plus
  `blurb`, a tintable `currentColor` SVG `icon` (a fanned swatch deck), `tags`, and the
  `repository` URL. No `extensions` field: Swatchbook manages its own data under `data/` and
  doesn't open user files in the workspace root.
- **Two READMEs, two audiences.** This `README.md` (repo root) is the developer doc GitHub
  shows and is never served. `public/gt-readme.md` is the user-facing gallery README (what the
  app does, the file format, link to source). Vite copies `public/` to the build root, so it
  ends up next to `gt.json`; General Text fetches `<app-url>/gt-readme.md` on install (falling
  back to `README.md`) and renders it on the gallery detail page.
- **CORS:** `public/_headers` sets `Access-Control-Allow-Origin: *` so the General Text web app
  can fetch `gt.json` and assets cross-origin when installing by URL from the browser.
- **Demo seeding:** the gallery "Try it live" demo runs the real app against a throwaway
  in-memory workspace; `maybeSeed` (keyed off `gt.mode === 'demo'`, falling back to
  `gt.sync.isLocal`) seeds the two sample domains on first run so it never opens blank.
- **Installs are immutable per version.** To pick up rebuilt bytes, bump the `gt.json` version
  (or uninstall/reinstall): the workspace won't update an existing install in place. `dist/`
  is gitignored (built from source).
