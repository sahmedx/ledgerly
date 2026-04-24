# Ledgerly — FP&A Budget Tool: Implementation Plan

## Context

The user exported a Claude Design wireframe bundle for a vendor expense forecasting tool ("Ledgerly") aimed at FP&A teams. The prototype is a sketch-style React/HTML app with 4 views (Grid, Split, Timeline, Variance) living in `budget-tool/project/`. The goal is to implement this as a real Next.js application — keeping the sketch aesthetic but adding genuine interactivity (editable cells, LocalStorage persistence) and clean code suitable for a portfolio.

The project is built in **5 reviewable phases**. Phase 3 is split so each view gets its own review gate. The user reviews and approves each phase before the next begins.

**Scope note:** Desktop-first. No responsive/mobile layout is planned — this is a data-dense FP&A tool and the sticky-column grid is not worth adapting to mobile for a portfolio piece.

---

## Technical Decisions

- **Framework:** Next.js 15 (App Router), TypeScript
- **Styling:** CSS custom properties + CSS Modules — no Tailwind (the sketch aesthetic is too custom; inline styles + utility classes match the wireframe more directly)
- **Fonts:** `next/font/google` — Caveat (headings), Architects Daughter (UI labels), JetBrains Mono (numbers). Self-hosted via Next.js font system; no `<link>` tag to Google CDN.
- **Charts:** Custom SVG sparklines (matching wireframe exactly; no chart library needed)
- **Persistence:** LocalStorage for cell overrides — a custom `useLocalStorage` hook
- **State:** Two React contexts at the app root — `OverridesContext` (edits + persistence) and `TweaksContext` (density/varianceColor/annotations/timeUnit). No prop drilling between views.
- **No backend:** All data is mock; overrides are client-side only
- **Location:** Next.js app initializes in-place at `/Users/sakib/Documents/ledgerly/` (alongside `budget-tool/` and `plan.md`)

---

## Shared Design Tokens (globals.css)

```css
--paper: #fafaf7
--ink: #1f1f1c
--ink-2: #3d3a33
--ink-3: #6a655a
--ink-4: #a49e90
--line: #2b2a26
--line-soft: #c9c4b5
--line-softer: #e4e1d4
--accent-warn: oklch(0.62 0.14 30)   /* muted orange-red */
--accent-good: oklch(0.68 0.09 145)  /* soft green */
--highlight: #fff4b8
```

Utility classes: `.sketch-box`, `.sketch-box-soft`, `.pill`, `.pill-warn`, `.pill-good`, `.pill-neutral`, `.btn`, `.btn-primary`, `.btn-ghost`, `.cell-over`, `.cell-under`, `.note`

---

## File Structure

```
ledgerly/
├── app/
│   ├── layout.tsx          # Google Fonts, global CSS, metadata
│   ├── page.tsx            # Renders <UnifiedApp />
│   └── globals.css         # CSS variables + sketch utilities
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx    # Top bar + view switcher (4 tabs)
│   │   └── Sidebar.tsx     # Left nav (Overview/Vendors/Headcount/…)
│   ├── views/
│   │   ├── GridView.tsx    # V1 — Phase 2
│   │   ├── SplitView.tsx   # V2 — Phase 3
│   │   ├── TimelineView.tsx# V3 — Phase 3
│   │   └── VarianceView.tsx# V4 — Phase 4
│   ├── grid/
│   │   ├── VendorGrid.tsx  # The full table
│   │   ├── EditableCell.tsx# Click-to-edit cell with override state
│   │   └── ForecastPopover.tsx # Method picker popover
│   ├── split/
│   │   ├── VendorList.tsx
│   │   └── VendorDetail.tsx
│   ├── timeline/
│   │   ├── ScenarioRibbon.tsx
│   │   └── VendorTimeline.tsx
│   ├── variance/
│   │   ├── KpiTiles.tsx
│   │   ├── VarianceList.tsx
│   │   └── CategoryChart.tsx
│   └── shared/
│       ├── Sparkline.tsx       # SVG bar sparkline
│       ├── Sparkline2.tsx      # SVG line sparkline (actual+forecast)
│       ├── VarianceBadge.tsx   # ▲ over / ▼ under / ◦ flat pills
│       ├── FilterBar.tsx       # Search + filter chips row
│       └── TweaksPanel.tsx     # Floating tweaks panel
├── lib/
│   ├── data.ts             # VENDORS array, forecastFor(), fmtMoney(), fmtPct()
│   ├── types.ts            # Vendor, MonthPoint, Tweaks, OverridesMap interfaces + context types
│   ├── storage.ts          # useLocalStorage hook, loadOverrides/saveOverride
│   └── contexts.ts         # OverridesContext + TweaksContext (createContext + providers)
└── public/                 # (empty)
```

---

## Phase 1 — Foundation: Scaffold + Design System + App Shell

**Delivers:** A running Next.js app at `localhost:3000` with the full shell visible — top bar, view switcher, sidebar — and placeholder panels for each view. No view content yet.

### Steps

1. From `/Users/sakib/Documents/ledgerly/`: `npx create-next-app@15 . --typescript --eslint --app --no-tailwind --no-src-dir --import-alias "@/*"` (initializes in-place; existing `budget-tool/` and `plan.md` are unaffected)
2. Delete boilerplate (`app/page.tsx`, default CSS, public SVGs)
3. `app/globals.css` — CSS variables, sketch utility classes (from wireframe's `<style>` block)
4. `app/layout.tsx` — Load fonts via `next/font/google`: `Caveat` (weights 500/700), `Architects_Daughter`, `JetBrains_Mono` (weights 400/500). Apply as CSS variables (`--font-caveat`, etc.) on `<html>`. No `<link>` tag.
5. `lib/types.ts` — `Vendor`, `MonthPoint`, `VendorSeries`, `OverridesMap` (`Record<string, Record<number, number>>`), `Tweaks` (`{ density: 'compact'|'regular'|'comfy', varianceColor: boolean, showAnnotations: boolean, timeUnit: 'monthly'|'quarterly' }`) interfaces
6. `lib/contexts.ts` — `OverridesContext` (`{ overrides: OverridesMap, setOverride: (vendor, monthIdx, value) => void }`), `TweaksContext` (`{ tweaks: Tweaks, setTweaks: (patch: Partial<Tweaks>) => void }`). Both exported as context + typed `useOverrides()` / `useTweaks()` hooks. Providers live in `app/page.tsx`.
7. `lib/data.ts` — Port `VENDORS`, `MONTH_LABELS` (18 entries: Jan 26–Jun 27), `QUARTERS` (6 entries), `ACTUAL_THROUGH` (index), `forecastFor()`, `fmtMoney()`, `fmtPct()` from `wireframe-data.jsx`
8. `lib/storage.ts` — `useLocalStorage<T>` hook; `loadOverrides()` / `saveOverride(vendorName, monthIdx, value)` helpers
9. `components/shared/VarianceBadge.tsx` — pill with ▲/▼/◦
10. `components/shell/Sidebar.tsx` — 160px left nav matching wireframe
11. `components/shell/AppShell.tsx` — Top bar (logo, view switcher, status pill, share/submit/avatar), page title row, sidebar + content slot
12. `app/page.tsx` — Wraps app in `OverridesContext.Provider` + `TweaksContext.Provider`; renders `<AppShell>` with `useState('grid')` for active view and placeholder `<div>` for each view body
13. `components/shared/TweaksPanel.tsx` — Floating panel consuming `TweaksContext` via `useTweaks()`

**`"use client"` boundary:** Any component using `useState`, `useContext`, or event handlers must have `"use client"` at the top. In Phase 1 that means: `AppShell`, `Sidebar`, `TweaksPanel`, and `app/page.tsx` (the providers). `layout.tsx`, `globals.css`, and all `lib/` files are server-safe.

**Verification:** `npm run dev` → see top bar, tabs cycle between 4 views (placeholder content), sidebar highlights match active view, tweaks panel opens.

---

## Phase 2 — V1: Grid View (Editable, Persistent)

**Delivers:** The full vendors × months grid with editable cells and LocalStorage persistence. This is the core of the product and the primary portfolio interaction.

### Steps

1. `components/grid/EditableCell.tsx`
   - Displays formatted value normally
   - On click: switches to `<input>` pre-filled with raw number
   - On blur/Enter: calls `saveOverride(vendor, monthIdx, value)`, updates local state
   - Shows a `●` dot indicator when value is an override
   - Applies `.cell-over` / `.cell-under` class based on variance + tweaks
2. `components/grid/ForecastPopover.tsx`
   - Absolute-positioned panel on method cell click
   - Lists 5 methods; selected one highlighted in yellow
   - Growth rate input field, Cancel + Apply buttons (Apply closes popover; method change is display-only for PoC)
3. `components/grid/VendorGrid.tsx`
   - `<table>` with `borderCollapse: separate`
   - Frozen columns: Vendor (260px, sticky left:0), GL (88px, sticky left:260), Method (82px, sticky left:348)
   - Month columns: 62px each; current month (index 3) highlighted `#fff4b8`
   - Header row sticky top; ACTUAL/FCST sub-label per column
   - Rows: density-aware height (compact=22, regular=28, comfy=34)
   - Totals row at bottom
   - Status bar: vendor count, unsaved edits count, last-synced note
   - Quarterly mode: aggregate 3 months → 6 quarters
4. `components/views/GridView.tsx` — FilterBar + VendorGrid + Annot notes

**State flow:** `OverridesContext` (initialized from `useLocalStorage('ledgerly-overrides', {})` in `page.tsx`) → all components consume via `useOverrides()`. No prop drilling. `EditableCell` calls `setOverride(vendor, monthIdx, value)` which updates both the context and LocalStorage.

**Verification:**
- Click any forecast cell → input appears, type a value, blur → value persists, `●` indicator shows
- Refresh page → override still there
- Toggle density in tweaks → row heights change
- Toggle variance color → cell tints appear/disappear
- Toggle monthly/quarterly → columns collapse to 6 quarters

---

## Phase 3a — V2: Split View

**Delivers:** Vendor list + drill-down detail view wired into the view switcher.

### Steps

1. `components/split/VendorList.tsx`
   - 320px left panel, search box, filter chips (All 25 / Over N / Renew N)
   - Vendor rows: name + variance badge + category/GL + monthly value + sparkline
   - Active vendor highlighted yellow with left border
   - `useState` for selected vendor (default: index 2, Datadog)
2. `components/split/VendorDetail.tsx`
   - Large vendor name (Caveat font), metadata row, action buttons
   - 4 KPI tiles: FY26 total, YTD actuals, Variance to budget, Contract end
   - Forecast chart (`<Sparkline2>` — solid actual + dashed forecast line)
   - Monthly override strip: **18 cells** (Jan 26–Jun 27, matching `MONTH_LABELS`), ACT/FCST label, current month highlighted
   - Activity feed: 3 hardcoded entries (avatar initials, name, time, message)
3. `components/views/SplitView.tsx` — composes VendorList + VendorDetail

**`"use client"`:** `VendorList` (selected vendor state), `VendorDetail` (consumes `useOverrides`).

**Verification:**
- Switch to Vendor tab → list + detail visible; click different vendors → detail updates
- Tweaks affect the view (variance color, annotations)

---

## Phase 3b — V3: Timeline / Forecast Canvas

**Delivers:** Scenario ribbon + vendor timeline view wired into the view switcher.

### Steps

1. `components/timeline/ScenarioRibbon.tsx`
   - 3 scenario cards (Base / Belt-tight / Growth), one active (yellow)
   - Each card: scenario name, total spend, note, sparkline
   - `useState` for active scenario
2. `components/timeline/VendorTimeline.tsx`
   - Timeline month header row (18 columns matching `MONTH_LABELS`)
   - Vendors grouped by category (Cloud / SaaS / Marketing / Facilities)
   - Each vendor row: name+method (240px) + 18-column value grid
   - Variance tinting per cell
   - Sticky annotation note for AWS
3. `components/views/TimelineView.tsx` — composes ScenarioRibbon + VendorTimeline

**`"use client"`:** `ScenarioRibbon` (scenario state), `VendorTimeline` (consumes `useOverrides`, `useTweaks`).

**Verification:**
- Switch to Timeline tab → scenario ribbon clickable, active card highlights
- Tweaks affect the view (variance color, annotations, monthly/quarterly toggle)

---

## Phase 4 — V4: Variance Dashboard (Highest Polish)

**Delivers:** The dashboard view — reactive to overrides from the grid.

### Steps

1. `components/variance/KpiTiles.tsx`
   - 4 tiles: MTD Actual, YTD Actual, FY26 Forecast, Runway impact
   - Numbers computed from `VENDOR_SERIES` + current overrides
   - Sub-label colored with `--accent-warn` when over plan and variance coloring is on
2. `components/variance/VarianceList.tsx`
   - "Over plan" panel + "Under plan" panel, side by side
   - Each row: vendor name + category/owner, sparkline, current month value, variance pill
   - Pill colored warn/good/neutral based on tweaks
3. `components/variance/CategoryChart.tsx`
   - Horizontal bar chart for 6 categories (Cloud, SaaS, Marketing, Facilities, Data, HR/Payroll)
   - Each bar: label (140px) + bar track + actual/budget values
   - Actual bar fills proportionally; vertical budget line overlay
   - Bars tinted orange when over budget + variance coloring on
   - Sticky annotation: "vertical line = plan"
4. `components/views/VarianceView.tsx` — composes all three, passes overrides-aware totals

**Reactivity:** KPI tiles and category totals recalculate when overrides change (override values replace computed forecast values before summing).

**Verification:**
- Override a cell in Grid view (e.g. AWS May value) → switch to Variance → MTD/FY26 totals reflect the change
- Toggle variance coloring → tints and pill colors appear/disappear
- Toggle annotations → sticky note appears/disappears
- Category bars render correctly at different window widths

---

## Delivery Order

| Phase | What ships | Review gate |
|-------|-----------|-------------|
| 1 | Scaffold + shell + design system + contexts | User sees the skeleton app running |
| 2 | Grid view + editable cells + LocalStorage | User tests editing and persistence |
| 3a | Split view (vendor list + detail) | User reviews list/drill-down interaction |
| 3b | Timeline view (scenario ribbon + grid) | User reviews scenario switching |
| 4 | Variance dashboard | Final review — portfolio-ready |

---

## Key Source Files to Port From

| Wireframe file | What to extract |
|---------------|-----------------|
| `budget-tool/project/wireframe-data.jsx` | VENDORS, forecastFor(), fmtMoney(), fmtPct(), MONTH_LABELS (18), QUARTERS (6), ACTUAL_THROUGH |
| `budget-tool/project/wireframe-parts.jsx` | WFSidebar nav items/styles, Sparkline SVG logic, Sparkline2, FilterBar, VarianceBadge, Annot |
| `budget-tool/project/wireframes.jsx` | V1Body (grid table), V2Detail (KPI tiles, monthly strip, activity), V3 (scenario ribbon, timeline grid), V4 (KPI tiles, VarianceList, category chart), UnifiedApp (view switcher logic) |
| `budget-tool/project/Budget Tool Wireframes.html` | CSS variables, utility classes (.sketch-box, .pill, .btn, .cell-over, .cell-under, .note) |