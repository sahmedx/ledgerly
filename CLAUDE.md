# Ledgerly

FP&A vendor expense forecasting tool. Sketch-aesthetic React app with 4 switchable views (Grid, Split, Timeline, Variance). Built as a portfolio piece — no backend, all mock data, client-side only.

## Implementation plan

Read `plan.md` at the start of every session. It is the source of truth for phase status, file structure, component specs, and verification steps.

**Current phase: 1 (approved — Phase 2 next)**

Update this line when a phase is approved.

## Design source files

Wireframe prototypes live in `budget-tool/project/`. Reference these during implementation — do not render them in a browser, read the source directly.

| File | Purpose |
|------|---------|
| `wireframe-data.jsx` | VENDORS array, forecastFor(), fmtMoney(), MONTH_LABELS (18 months: Jan 26–Jun 27), QUARTERS (6) |
| `wireframe-parts.jsx` | Shared components: Sparkline, Sparkline2, FilterBar, VarianceBadge, Annot, WFSidebar |
| `wireframes.jsx` | All 4 view bodies + UnifiedApp (view switcher logic) |
| `Budget Tool Wireframes.html` | CSS variables and utility classes (.sketch-box, .pill, .btn, .cell-over, etc.) |

## Key architectural decisions

**State: two React contexts, no prop drilling.**
- `OverridesContext` — cell edits, backed by LocalStorage. All views read via `useOverrides()`.
- `TweaksContext` — density / varianceColor / showAnnotations / timeUnit. All views read via `useTweaks()`.
- Both providers live in `app/page.tsx`. Do not pass these as props through the component tree.

**Fonts: `next/font/google`, not a `<link>` tag.**
Caveat (headings), Architects_Daughter (UI labels), JetBrains_Mono (numbers). Applied as CSS variables (`--font-caveat`, etc.) on `<html>`.

**No Tailwind.** CSS Modules + CSS custom properties only. The sketch aesthetic requires too much custom styling for utility classes to be practical.

**Desktop-first. No responsive layout.** The sticky-column grid doesn't adapt to mobile and that's intentional for this tool.

**`"use client"` required** on any component using `useState`, `useContext`, or event handlers. `layout.tsx` is server-safe. `lib/storage.ts` uses `useState`/`useEffect` so it carries `'use client'` — it is the one lib file that is client-only.

---

## Phase build notes (read before starting any phase)

**Scaffold issue — `create-next-app` refuses non-empty dirs.**
Do not run it in-place. Scaffold to `/tmp/ledgerly-scaffold`, then `cp -r /tmp/ledgerly-scaffold/. .` to copy into the project root.

**Broken `.bin` symlinks after `cp -r` from `/tmp`.**
`cp -r` copies symlinks as regular files. After the copy, `node_modules/.bin/next` becomes a plain file with hardcoded `../server/require-hook` paths that resolve to nowhere — `npm run build` fails with `MODULE_NOT_FOUND`. Fix: `rm node_modules/.bin/next && ln -s ../next/dist/bin/next node_modules/.bin/next`. Running `npm install` after the copy does NOT fix this because npm sees the package as already installed.

**Write tool requires a prior Read on existing files.**
The scaffold creates `app/globals.css`, `app/layout.tsx`, `app/page.tsx`. Read each before overwriting or the Write tool will error.

**Dev server may not use port 3000.**
If something else holds 3000, Next.js auto-picks the next free port (e.g. 3002). Check the terminal output for the actual URL.

**`lib/contexts.ts` does not need `'use client'`.**
`createContext` is server-safe; `useContext` inside the exported hook functions is fine because those hooks are only ever called from client components. Do not add `'use client'` to `contexts.ts`.

**Style approach: inline styles, not CSS Modules.**
The wireframe components use inline styles almost exclusively. Matching this directly is faster than creating CSS Module files. Global utility classes (`.sketch-box`, `.pill`, `.btn`, etc.) live in `globals.css` and are used via `className`. Do not create per-component `.module.css` files unless unavoidable.
