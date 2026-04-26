# Ledgerly — Revenue Module: Implementation Plan (Completed and built)

## Context

This plan extends Ledgerly with a Revenue forecasting module modeled after Notion (consumer self-serve + enterprise sales-led). The full business logic is specified in `notion_forecast_spec.md` — that document is the source of truth for calculation logic, glossary, defaults, and KPI definitions. This plan covers **how we build it** in our existing Next.js app: phase breakdown, file structure, architectural changes, and verification gates.

The Revenue module ships as **Phase 5**, split into 4 reviewable sub-phases (5a–5d). Each sub-phase has its own user review gate.

**Aesthetic:** Carry over the sketch aesthetic from the Expense module — Caveat headings, paper bg, JetBrains Mono numbers, `.sketch-box` utility classes, hand-drawn feel. Revenue module looks like the same product, not a different app.

---

## Locked Decisions

| # | Decision |
|---|---------|
| 1 | Sidebar becomes module switcher (Expenses / Revenue / …). Top tabs are views inside the active module. |
| 2 | Sketch aesthetic carried into Revenue module. |
| 3 | Per-view assumptions live in a right slide-in `<AssumptionsDrawer>` (sketch-themed). `TweaksPanel` stays for cross-cutting display tweaks. |
| 4 | Full cost layer (S&M / R&D / G&A / COGS / CS) built inside Revenue module per spec. Refactor into shared cost layer when a Headcount module lands later. |
| 5 | Current month = Apr 2026. Months 1–3 (Jan–Mar 26) flagged `isActual: true` — still computed by simulation, displayed with actual styling (no overrides allowed in those months, current-month highlight on Apr). |
| 6 | Pipeline ↔ capacity seam: hard cutoff at month 7. Months 1–6 use named pipeline. Months 7–18 use capacity model. Graduation inflow applies to all months. |
| 7 | Day-0 sales-led base renewal anniversary distribution: 70% renew in month 10 (Oct 26 — anniversary of Q4 25 start). Remaining 30% split evenly across months 1, 4, 7 (Q1/Q2/Q3 26 anniversaries). |
| 8 | New logos cannot churn in their acquisition month. Existing-base churn/expansion/contraction applies only to ARR present at start of month, excluding new ARR added in the same month. |
| 9 | Annual billing mix applied per-cohort fraction, locked at acquisition. Cohort splits into annual portion (lumpy bill at month 0 and every 12 months) and monthly portion (smooth). No per-workspace tracking. |
| 10 | Calc engine = pure `simulate(assumptions) → results` in `lib/revenue/engine.ts`. `RevenueContext` holds assumptions + memoized results. 200ms debounce on slider drags. Three scenarios run in parallel via three memoized `simulate()` calls. No web workers in V1. |
| 11 | Persistence: `localStorage` key `ledgerly-revenue-assumptions`. "Reset to defaults" button clears only this key. |
| 12 | Named pipeline editor: inline-edit table matching the vendor grid edit pattern (click cell → input → blur saves). Add/delete deal rows via row-level buttons. |
| 13 | Validation panel = collapsible footer strip on Dashboard view only. 6 check badges (pass/fail). Click expands to show deltas. |
| 14 | IPO valuation walk in scope for V1. Lives as a Dashboard subsection below the ARR waterfall. |
| 15 | Three-scenario parallel compute runs on main thread. Expected to be tens of ms; revisit if UI jank. |
| 16 | Scenario shocks **compound** (multiplied together) per spec §12 recommendation. Real downsides involve multiple things going wrong at once. |
| 17 | Test framework: **Vitest**, added in Phase 5a alongside engine. Single test file `lib/revenue/engine.test.ts` with hand-computed cases. No broader test harness for the existing app. |
| 18 | ARR waterfall TTM window = trailing 12 months ending at **t=18 (Jun 27)** — the final forecast month. Shows full 12-month forward picture. |
| 19 | Day-0 sales-led renewal at month 10 produces a ~$168M billings spike (70% × $240M sales-led ARR). This is **expected, not a bug** — note in methodology footer. Validation check 3 (billings/revenue tie) still passes. |

---

## Architectural changes to existing app

### 1. AppShell becomes module-aware

**Before:** `AppShell` holds `view` state (`'grid' | 'split' | 'timeline' | 'variance'`). Top bar renders 4 tabs.

**After:** `AppShell` holds `module` state (`'expenses' | 'revenue'`) AND `view` state. View options depend on active module.

- Sidebar lists modules (Expenses, Revenue, plus future Headcount/P&L). Click switches module and resets view to that module's default.
- Top bar renders the views for the active module.
- Each module owns its own provider tree wrapping its views.

```
<AppShell>
  <Sidebar modules={…} active={module} onSelect={setModule} />
  <TopBar views={views[module]} active={view} onSelect={setView} />
  {module === 'expenses' && <ExpenseModule view={view} />}
  {module === 'revenue' && <RevenueModule view={view} />}
</AppShell>
```

### 2. New shared component: `<AssumptionsDrawer>`

Right slide-in panel. 360px wide. Paper bg, sketch border. Header with view name + "Reset to defaults" button. Body is view-specific assumption controls (sliders, number inputs, selects). Open/close via toggle button in top-right of the view content area.

Lives in `components/shared/AssumptionsDrawer.tsx`. Generic — accepts `title` + `children`.

### 3. New context: `RevenueContext`

```ts
interface RevenueContextValue {
  assumptions: Assumptions;            // editable input object
  setAssumption: (path: string, value: unknown) => void;
  results: { base: Results; upside: Results; downside: Results };
  activeScenario: 'base' | 'upside' | 'downside';
  setActiveScenario: (s: 'base' | 'upside' | 'downside') => void;
  resetToDefaults: () => void;
}
```

Provider wraps the Revenue module's views. Persists `assumptions` and `activeScenario` to `localStorage`. Memoizes `results` against `assumptions` reference equality.

### 4. New file structure (added to existing tree)

```
ledgerly/
├── app/page.tsx                              # gains module state + RevenueProvider
├── components/
│   ├── shell/
│   │   └── Sidebar.tsx                       # MODIFIED — modules + nav
│   ├── shared/
│   │   └── AssumptionsDrawer.tsx             # NEW
│   ├── revenue/
│   │   ├── RevenueModule.tsx                 # router for revenue views
│   │   ├── views/
│   │   │   ├── DashboardView.tsx
│   │   │   ├── SelfServeView.tsx
│   │   │   ├── SalesLedView.tsx
│   │   │   ├── UnitEconView.tsx
│   │   │   └── ScenariosView.tsx
│   │   ├── dashboard/
│   │   │   ├── KpiTilesRow.tsx               # 8 tiles
│   │   │   ├── ArrWaterfall.tsx              # horizontal waterfall SVG
│   │   │   ├── ArrTrendChart.tsx             # 18-mo, base/up/down bands
│   │   │   ├── BillingsRevenueChart.tsx
│   │   │   ├── IpoValuationWalk.tsx          # ARR × multiple → implied valuation
│   │   │   └── ValidationFooter.tsx          # 6 collapsible checks
│   │   ├── self-serve/
│   │   │   ├── ConversionFunnel.tsx
│   │   │   ├── CohortHeatmap.tsx             # acquisition month × age
│   │   │   ├── TierComposition.tsx           # stacked area
│   │   │   ├── UpgradeFlow.tsx
│   │   │   └── SeatExpansionChart.tsx
│   │   ├── sales-led/
│   │   │   ├── PipelineTable.tsx             # inline-edit, vendor-grid pattern
│   │   │   ├── WeightedBookingsBar.tsx
│   │   │   ├── CapacityChart.tsx
│   │   │   ├── NewArrBySource.tsx
│   │   │   └── ExistingDynamics.tsx
│   │   ├── unit-econ/
│   │   │   ├── UeKpiTiles.tsx
│   │   │   ├── PaybackCurve.tsx
│   │   │   ├── MagicNumberTrend.tsx
│   │   │   └── BurnMultipleTrend.tsx
│   │   ├── scenarios/
│   │   │   ├── ScenarioSummaryColumns.tsx
│   │   │   ├── SmallMultiplesArr.tsx
│   │   │   └── TornadoChart.tsx
│   │   └── shared/
│   │       ├── ScenarioToggle.tsx            # base/upside/downside pills (top bar)
│   │       └── DriverInput.tsx               # labeled number/slider input
└── lib/
    └── revenue/
        ├── types.ts                          # Assumptions, Results interfaces
        ├── defaults.ts                       # default Assumptions object
        ├── starting-state.ts                 # Day-0 snapshot constants
        ├── engine.ts                         # simulate(assumptions) → Results
        ├── engine-self-serve.ts              # cohort math, retention curves
        ├── engine-sales-led.ts               # pipeline, capacity, base dynamics
        ├── engine-costs.ts                   # S&M / R&D / G&A / COGS / CS
        ├── engine-billings.ts                # billings + deferred revenue
        ├── engine-kpis.ts                    # NRR, GRR, CAC, LTV, magic number, etc.
        ├── scenarios.ts                      # apply shock multipliers
        └── validation.ts                     # 6 reconciliation checks
```

---

## Phase 5a — Foundation: AppShell module pattern + Calc engine + Dashboard

**Delivers:** A running app where sidebar switches between Expenses and Revenue modules. Revenue module shows the Dashboard with all 8 KPI tiles, ARR waterfall, 18-month trend, billings/revenue chart, IPO walk, and validation footer — all driven by a working calculation engine with hardcoded base assumptions.

### Steps

1. **Refactor AppShell** to support modules. Sidebar lists modules; top bar renders module-specific views. Default module = `expenses` (preserves existing behavior). `revenue` module added as second option.
2. **Build calc engine, headless first.** Implement `lib/revenue/engine.ts` and supporting modules (`engine-self-serve`, `engine-sales-led`, `engine-costs`, `engine-billings`, `engine-kpis`). Implement defaults in `defaults.ts` and starting state in `starting-state.ts`. Add **Vitest** (`npm i -D vitest`) and write `lib/revenue/engine.test.ts` with ~6 hand-computed cases: month 1 self-serve conversion, month 1 sales-led pipeline close, month 7 capacity seam, month 10 renewal spike, month 18 ending ARR, all 6 validation checks pass on defaults. Run `npx vitest` and confirm green before wiring to UI. Keep engine code in pure `.ts` files with no React imports.
3. **`RevenueContext` + provider.** Holds assumptions + memoized base/upside/downside results + active scenario. Persist assumptions to localStorage. Initial wiring: hardcoded defaults, no editing yet.
4. **Dashboard view + 8 KPI tiles.** Build `DashboardView`, `KpiTilesRow`. Tiles consume `results[activeScenario].monthly[currentMonth]`. Use existing sketch styling (`.sketch-box`, Caveat font on labels, JetBrains Mono on numbers).
5. **ARR waterfall component.** SVG-based horizontal waterfall: starting → +new self-serve → +new sales-led (named) → +new sales-led (capacity) → ±graduation → +expansion → −contraction − churn → ending. TTM aggregation.
6. **18-month ARR trend.** Line chart with three lines (base/upside/downside) + shaded band between upside and downside. Toggle to switch between ARR / MRR / Revenue. Custom SVG, matching existing Sparkline2 style.
7. **Billings vs Revenue chart.** Stacked bars + deferred revenue line overlay.
8. **IPO valuation walk.** Subsection: ending ARR × public SaaS multiple (input, default 12×) → implied valuation. Show range (10× / 12× / 15×). Sketch box with hand-written feel.
9. **Validation footer.** 6 check badges: ARR walk, graduation neutrality, billings/revenue tie, headcount additivity, NRR ≥ GRR, Rule of 40 plausibility. Collapsible.
10. **Temp dev scenario toggle.** Until the real `ScenarioToggle` ships in 5c, add a small dev-only pill row in the Dashboard top-right (Base / Upside / Downside). Wired to `setActiveScenario`. Will be deleted in 5c when the top-bar `ScenarioToggle` lands.

**`"use client"` boundary:** All Revenue components use context/state — all client. Engine modules are server-safe pure functions.

**Verification:**
- Sidebar: click "Revenue" → top tabs swap, Dashboard renders.
- All 8 KPIs render plausible values for the Day-0 → Apr 26 simulated state.
- ARR waterfall components sum to ending ARR shown in tile (validation check 1 passes).
- Click temp dev scenario pill (Upside/Downside) → all Dashboard charts re-render with new scenario.
- Validation footer shows all 6 checks passing on default assumptions.
- `npx vitest` runs green; all 6 engine test cases pass.
- **Regression check:** all 4 existing Expense views (Grid / Split / Timeline / Variance) still render. Editable cells in Grid still persist overrides via localStorage. TweaksPanel still works. No visual regressions on Expense module.

---

## Phase 5b — Self-Serve Engine view + Assumptions Drawer infra

**Delivers:** Full Self-Serve view with funnel, cohort heatmap, tier composition, upgrade flow, seat expansion. Shared `AssumptionsDrawer` component live and wired to self-serve drivers — editing inputs recomputes the model and re-renders Dashboard + Self-Serve in real time.

### Steps

1. **`AssumptionsDrawer` component.** Right slide-in, 360px, paper bg, sketch border. Generic shell accepting `title`, `onReset`, `children`. Toggle button (top-right of view content area) opens/closes.
2. **`DriverInput` component.** Labeled number input or slider (configurable). Shows current value, default value (italic, struck-through if changed), unit (%, $, count). Calls `setAssumption(path, value)` on change.
3. **Wire `setAssumption` with debounce.** Path-based setter (e.g., `setAssumption('self_serve.free_to_paid_rate', 0.012)`). Internal 200ms debounce before triggering recompute. Optimistic UI on input value (no debounce on display), debounce only on the recompute trigger.
4. **`ConversionFunnel`.** Visual funnel: free pool → monthly conversions → workspaces by tier → seat count. Stepped widths, sketch borders, value labels.
5. **`CohortHeatmap`.** Two stacked grids (Plus, Business small). Rows = acquisition month, columns = age (0–17), cells colored by retention %. Hover shows exact value. Use existing accent palette (oklch warn/good). **Day-0 legacy cohort gets its own row at the top** (labeled "Legacy") with the legacy retention params (Plus floor 0.65 / decay 0.08; Business floor 0.85 / decay 0.05) — visually distinct from new acquisition cohorts which use the steeper retention params.
6. **`TierComposition`.** Stacked area chart of workspace counts over 18 months, secondary axis for ARR. SVG.
7. **`UpgradeFlow`.** Line chart of monthly Plus→Business upgrade count + resulting Business cohort size buildup.
8. **`SeatExpansionChart`.** Average seats per workspace by cohort age, separated by tier.
9. **Wire Self-Serve drawer.** All self-serve drivers from spec §4.1: free pool params, conversion rate, tier mix, initial seats, seat growth, upgrade rate, retention curves, pricing, annual mix, graduation threshold.

**Verification:**
- Open Self-Serve view → funnel, heatmap, all 4 charts render.
- Open assumptions drawer → drivers visible, current values shown.
- Edit free-to-paid rate → after 200ms, funnel updates, heatmap shifts, Dashboard KPIs (workspace count, MRR) update.
- Reset to defaults → all assumptions snap back, charts re-render.
- Reload page → edited assumptions persist via localStorage.

---

## Phase 5c — Sales-Led Engine view + Pipeline editor + Scenario toggle

**Delivers:** Full Sales-Led view with editable pipeline table, weighted bookings chart, capacity chart with seam line, new ARR by source, existing customer dynamics. Top-bar scenario toggle (Base/Upside/Downside) pills active across all views.

### Steps

1. **`ScenarioToggle` in top bar.** Three pills (Base / Upside / Downside), active one highlighted yellow. Calls `setActiveScenario`. Visible on every Revenue module view.
2. **`PipelineTable`.** Inline-edit table matching vendor grid pattern. Columns: Company, Stage (badge dropdown), ACV, Expected close month (1–6), Probability (display, derived from stage), Weighted ARR (display). Cells click → input → blur saves to `assumptions.sales_led.named_pipeline`. Add row button at bottom; delete row via row-level "×" button. Stage badges color-coded.
3. **`WeightedBookingsBar`.** Bar chart of probability-weighted ARR closing in months 1–6.
4. **`CapacityChart`.** Multi-line: active reps, productive capacity ($ ARR), capacity-driven new ARR. Vertical seam line at month 7 (dashed, labeled "named pipeline / capacity seam").
5. **`NewArrBySource`.** Stacked bar across 18 months: named pipeline / capacity / graduation inflow. Months 1–6 dominated by named, 7+ dominated by capacity, graduation present throughout (small).
6. **`ExistingDynamics`.** Stacked bar of monthly expansion / contraction / churn for the existing sales-led base. NRR (TTM) line overlaid on secondary axis.
7. **Wire Sales-Led drawer.** Starting ARR/logos by segment, average seats, blended seat price, sales capacity (starting reps, hiring plan, ramp curve, quota, attainment, attrition, replacement lag), win rate, existing dynamics rates, segment split, plus the editable pipeline (lives in the table itself, not the drawer).

**Verification:**
- Switch to Sales-Led view → all 5 charts + pipeline table render.
- Edit a deal's ACV in pipeline table → weighted bookings chart updates, Dashboard ARR waterfall reflects.
- Add a new deal → appears in table, recompute fires, charts update.
- Delete a deal → removed, charts update.
- Click Upside in scenario toggle → all charts shift, KPI tiles update across Dashboard + Self-Serve + Sales-Led.
- Capacity chart seam line clearly visible at month 7.

---

## Phase 5d — Unit Economics + Scenarios & Sensitivity + Polish

**Delivers:** Final two views (Unit Econ, Scenarios), tornado chart, polish pass on aesthetic consistency, methodology footer link, and a portfolio-ready overall feel.

### Steps

1. **`UeKpiTiles`.** Top of Unit Econ view: 8 tiles (CAC self-serve, CAC sales-led, LTV both, LTV/CAC both, Payback both).
2. **`PaybackCurve`.** Two curves (self-serve, sales-led) — cumulative gross profit per logo over months since acquisition, with horizontal CAC line overlaid. Crossing point = payback month.
3. **`MagicNumberTrend`.** Quarterly resolution line, reference lines at 0.75 and 1.0.
4. **`BurnMultipleTrend`.** Monthly line. Reference lines at 1.0 (efficient) and 2.0 (inefficient).
5. **`ScenarioSummaryColumns`.** Three columns side by side (Downside / Base / Upside), each showing endpoint metrics: Ending ARR, Cumulative Revenue, Ending GM%, Ending OM%, Total OpEx, Ending Headcount.
6. **`SmallMultiplesArr`.** Three small ARR trend charts side by side, one per scenario.
7. **`TornadoChart`.** ±10% shock per individual driver, ranked by absolute impact on ending ARR. Bars shaded by direction. Implements §7 sensitivity. **Driver list (12):** free user growth rate, free→paid conversion, Plus→Business upgrade rate, sales rep attainment, win rate, self-serve churn, sales-led churn, expansion rate, seat growth rate (Business), retention decay (Plus), fully-ramped quota, marketing programs % of revenue.
8. **Scenario shock editor.** Drawer on Scenarios view exposes the shock multipliers from spec §7 — user can tune Upside / Downside intensity.
9. **Methodology link.** Footer link on every Revenue view → modal listing the 10 simplifying assumptions from spec §9. **Add an 11th note:** Day-0 sales-led renewal anniversary distribution (70% Oct 26, 10% each Jan/Apr/Jul 26) creates a large billings spike in Oct 26 that is expected, not a bug.
10. **Polish pass.** Color consistency across all charts (use design tokens). Hover states. Loading shimmer for first-paint compute. Number formatting consistency ($1.2M / $600.0M / $1.5B). Cross-view density check.

**Verification:**
- Unit Econ: all 8 tiles + 4 charts render with sensible values.
- Scenarios: side-by-side scenario columns reflect shock multipliers; tornado ranks drivers correctly (e.g., free→paid rate near top).
- Edit a shock multiplier → scenario column updates.
- Methodology modal opens, lists all 10 assumptions.
- Aesthetic check: Revenue module visually consistent with Expense module; same fonts, paper bg, sketch borders, color palette.
- All 6 validation checks pass with default assumptions.

---

## Delivery Order

| Phase | What ships | Review gate |
|-------|-----------|-------------|
| 5a | AppShell module pattern + headless engine + Dashboard + IPO walk + validation footer | User sees Dashboard with real numbers driven by working engine; sidebar module switching works |
| 5b | Self-Serve view + AssumptionsDrawer infra + drawer-driven recompute | User edits a self-serve driver, watches all charts update |
| 5c | Sales-Led view + inline-edit pipeline table + scenario toggle | User edits a deal, switches scenarios, sees full propagation |
| 5d | Unit Econ + Scenarios + Tornado + Methodology + polish | Portfolio-ready; final review |

---

## Key References

| Source | Use |
|--------|-----|
| `notion_forecast_spec.md` | Source of truth for all calculation logic, defaults, KPI definitions, view specs |
| `plan.md` | Architectural patterns from Phases 1–4 — context/provider pattern, sketch utility classes, font system, "use client" rules |
| Existing `components/grid/EditableCell.tsx` | Pattern for inline-edit pipeline table cells |
| Existing `components/shared/Sparkline2.tsx` | Pattern for line charts (extend for multi-line + bands) |
| Existing `components/shared/TweaksPanel.tsx` | Pattern for slide-in panel — but `AssumptionsDrawer` is per-view, larger, and editable |
| Existing `lib/storage.ts` | `useLocalStorage` hook reused for `ledgerly-revenue-assumptions` key |
