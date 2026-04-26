# P&L View, 24-Month Horizon, and Stock-Based Compensation: Implementation Spec

## 1. Context

This is an additive spec to the Notion Revenue Forecast Model. The base model already computes revenue (by segment and tier), COGS (split by category), opex (by function), and operating income on a monthly basis over an 18-month horizon. This spec adds three coordinated changes:

1. **Forecast horizon extends from 18 to 24 months** (January 2026 through December 2027).
2. **A new top-level P&L view** with two tabs: consolidated company P&L and segment P&Ls (self-serve and sales-led shown separately).
3. **Stock-based compensation as a first-class line item** with full GAAP / non-GAAP treatment, including Adjusted EBITDA, the metric public SaaS investors actually use.

Together these changes turn the model from a revenue forecaster into a finance work product: GAAP P&L plus non-GAAP P&L plus segment P&L, over two complete fiscal years, with SBC modeled at the function level. This is the artifact a CFO would actually look at.

**The P&L is a new top-level module on the sidebar**, alongside Expenses and Revenue. It is not a tab inside the Revenue module. It reuses the Revenue engine's `Assumptions` and `Results` (same `RevenueContext`, lifted to wrap both modules), and adds its own assumption sub-blocks (`costs.sbc`, `costs.da`, `costs.allocation`) and its own derived outputs (P&L line items, quarterly/annual roll-ups, segment allocation).

## 1a. Locked Decisions

| # | Decision |
|---|---|
| 1 | **Phase split.** Build in two reviewable sub-phases: **6a** (horizon extension + cost-engine refactor for cash comp / SBC / D&A breakdown + GAAP/non-GAAP/EBITDA/Adjusted EBITDA + Rule of 40 update + Dashboard tile updates + new validation checks 7–9, 11–13) and **6b** (the P&L module itself: sidebar module, consolidated tab, by-segment tab, expand/collapse, hover tooltips, allocation logic, reconciliation panel, right drawer, validation check 10). Review gate after 6a confirms engine numbers before any P&L UI work. |
| 2 | **P&L is a sidebar module, not a Revenue tab.** Add `'pnl'` as a new `ModuleId`. New `PnlModule` component with its own view router (default view = Consolidated, second view = By Segment — surfaced as top-bar tabs inside the module, matching existing module pattern). `RevenueProvider` is lifted in `app/page.tsx` so it wraps both `RevenueModule` and `PnlModule`; both read the same `assumptions` + `results` state. |
| 3 | **CS SBC follows `cs_in_cogs_pct` split.** Cash comp and SBC are both headcount-driven, so SBC tracks cash comp into COGS vs. opex. Concretely: `cs_total_with_sbc = cs_cash_comp + cs_sbc`; then `cs_in_cogs = cs_total_with_sbc × cs_in_cogs_pct` and `cs_in_opex = cs_total_with_sbc × (1 − cs_in_cogs_pct)`. The P&L "Customer Success (COGS portion)" line therefore includes its share of CS SBC; the "Customer Success (opex portion)" CS SBC sub-line shows only the opex-side share. The §11 SBC calibration check sums total CS SBC (both halves). |
| 4 | **Actuals window stays at months 1–3.** Months 1–3 (Jan/Feb/Mar 26) remain `is_actual: true` — color-coded only (matches existing app convention). No roll-forward of the actuals cursor as wall-clock time advances. |
| 5 | **Hiring plans = linear extension.** Existing default plans (`{ length: 18 }, count: N` per month) extend to `length: 24` with the same monthly count. No trajectory tweaks. Sales reps, R&D, G&A, marketing all keep their current cadence through Dec 27. |
| 6 | **SBC calibration deferred.** Build with the spec's default SBC ratios. Run validation check 12 after wiring. If blended SBC at month 12 lands outside 25–35 % of revenue, surface the warning but do not pre-tune ratios. Tune only if the calibration check fails. |
| 7 | **Hover tooltips computed on demand, not threaded through the engine.** `MonthlyCosts` does not gain a `formula: string` field per line. Tooltip component receives `(line_id, month_index, results, assumptions)` and re-derives the formula string locally (e.g., `G&A cash comp = ga_headcount × flc.ga / 12 = 45 × $250k / 12 = $937.5k`). Keeps the engine output minimal and matches the existing engine-output-stability principle. |
| 8 | **Quarterly + annual roll-ups computed in the engine post-pass.** `engine.ts` returns `results.quarterly: QuarterlyResult[]` (length 8: Q1'26 → Q4'27) and `results.annual: AnnualResult[]` (length 2: FY26, FY27). Margin percentages re-derived at the period level, not averaged. ARR-based metrics (Ending ARR, NRR/GRR, total headcount) take the period's last-month value. Reusable for the future cash-flow view. |
| 9 | **Reconciliation panel built.** Cheap to derive (subtract segment values from consolidated values, flag if `|delta| / consolidated > 0.001`). Renders below the By-Segment tab. Validation check 10 also covers it but the visible panel is good interview surface area. |
| 10 | **Out-of-scope §13 locked as written.** No CSV export, no TTM P&L, no variance vs. prior period, no below-the-line items, no dilution / share count. Note in methodology footer. |
| 11 | **localStorage migration.** Existing `ledgerly-revenue-assumptions` saved state lacks the new `costs.sbc`, `costs.da`, `costs.allocation` keys (and the extended hiring-plan length). On load, deep-merge stored assumptions over `DEFAULT_ASSUMPTIONS` so missing keys fall back to defaults. No schema-version bump needed; merge handles the additive case. |
| 12 | **Module-level assumption split.** SBC ratios + D&A live under `costs` (already-revenue-engine territory) but are surfaced in the P&L module's right drawer, not the Revenue drawers. Cost allocation (`marketing_self_serve_pct`, `rd_self_serve_pct`) is P&L-specific and only edited from the P&L drawer. |

## 2. Horizon Extension: 18 to 24 Months

### 2.1 Calculation Engine Changes

**Update the forecast horizon constant.**
```
FORECAST_HORIZON_MONTHS = 24  // was 18
```

The simulation loop and all results arrays scale automatically. Verify that:
- `results.monthly` array has length 24
- All time-series charts pull from this length
- Cohort tables extend through month 24

**Date labels.** Months 1 to 24 map to January 2026 through December 2027. The forecast covers two complete fiscal years.

**Hiring plans.** Extend default hiring plans for all functions through month 24. For V1, linear extension of the existing trajectory is fine. Specifically:
- Sales reps: continue the same monthly hiring cadence through 2027
- R&D, G&A, CS, Marketing: continue or slightly accelerate, per current plan logic

**Pipeline / capacity seam.** No change. Named pipeline still drives months 1 to 6; capacity drives months 7 to 24. Capacity now drives 18 months instead of 12; the productive-rep buildup compounds meaningfully over this window, which is part of the narrative.

**TTM calculations.** NRR and GRR can now be computed cleanly for months 13 through 24 (a full TTM window). Months 1 to 12 still use the annualized-from-available logic specced earlier.

### 2.2 Downstream View Updates from Horizon Extension

- **Dashboard.** Trend charts extend to 24 months. Add a new KPI tile showing FY27 vs. FY26 ARR growth %.
- **Self-Serve Engine view.** Cohort retention heatmap now has 24 acquisition month rows. Older cohorts show more visible retention decay.
- **Sales-Led Engine view.** New ARR by source chart shows 24 months. Named pipeline concentrates in months 1 to 6; capacity-driven and graduation-driven new ARR carry the rest.
- **Unit Economics view.** CAC payback curves have more time to show full payback even for late-acquired cohorts.
- **Scenarios view.** Tornado chart still shows ±10% impact on ending ARR; ending ARR is now month 24, not month 18. Numbers scale up.

## 3. New Calculations: D&A and SBC

### 3.1 Depreciation and Amortization (Placeholder)

Add a single new opex line: D&A, as a sub-line within G&A.

**Input (new assumption):**
```
costs.da: {
  monthly_da_amount: float,  // default $500k/month
}
```

Default approach: flat $500k/month. This is a placeholder for V1 and should be labeled as such in the assumptions panel ("D&A is modeled as a flat monthly placeholder. V2 will derive D&A from a capex schedule and intangibles amortization."). The dollar value scales such that D&A is roughly 0.5% to 1% of revenue at the model's scale, which is consistent with public SaaS comps.

**Calculation:**
```
da[t] = monthly_da_amount  // flat placeholder
```

### 3.2 Stock-Based Compensation

SBC is modeled per-function as a ratio applied to cash compensation. Each function has its own SBC ratio; the blended SBC across the company emerges from the function mix.

**New assumption block:**
```
costs.sbc: {
  rd_sbc_pct: 0.65,    // R&D SBC as % of R&D cash comp
  sm_sbc_pct: 0.35,    // S&M SBC as % of S&M cash comp (excl. programs/T&E)
  ga_sbc_pct: 0.50,    // G&A SBC as % of G&A cash comp
  cs_sbc_pct: 0.30,    // CS SBC as % of CS cash comp
}
```

**Rationale for defaults.** These produce a blended SBC of roughly 30% of revenue at model scale, consistent with late-stage pre-IPO SaaS companies (Snowflake ~40%, Datadog ~25%, MongoDB ~25%, Atlassian ~20%). The R&D ratio is highest because engineers receive the most equity-heavy compensation packages at this company stage. S&M is lowest among the major functions because quota reps are typically more cash-comped. G&A reflects senior finance/legal/people leaders receiving substantial equity. CS is the lowest equity tier.

The defaults are calibrated to hit ~30% SBC / revenue at month 12 of the forecast. Over the 24-month horizon, SBC as a percentage of revenue declines slightly (toward ~28-29% at month 24) due to natural operating leverage as revenue grows faster than headcount. This is the desired behavior; no explicit ratio decay over time is needed.

**SBC by function (each month):**
```
rd_cash_comp[t] = rd_headcount[t] × flc.eng / 12
rd_sbc[t] = rd_cash_comp[t] × rd_sbc_pct

sm_cash_comp[t] = (sales_reps[t] × flc.rep + sdrs[t] × flc.sdr + ses[t] × flc.se 
                   + sales_mgrs[t] × flc.manager + marketing_headcount[t] × flc.mktg) / 12
sm_sbc[t] = sm_cash_comp[t] × sm_sbc_pct
// Note: SBC applies only to comp, not to programs spend

ga_cash_comp[t] = ga_headcount[t] × flc.ga / 12
ga_sbc[t] = ga_cash_comp[t] × ga_sbc_pct
// Note: SBC does NOT apply to T&E or D&A

cs_cash_comp[t] = required_csms[t] × flc.csm / 12
cs_sbc[t] = cs_cash_comp[t] × cs_sbc_pct
// Per locked decision #3: cs cash comp + cs SBC are split into COGS vs. opex
// using cs_in_cogs_pct (same split applied to both).
//   cs_total_with_sbc[t] = cs_cash_comp[t] + cs_sbc[t]
//   cs_in_cogs[t]        = cs_total_with_sbc[t] × cs_in_cogs_pct
//   cs_in_opex[t]        = cs_total_with_sbc[t] × (1 − cs_in_cogs_pct)
// total_sbc below sums the FULL CS SBC (both halves), since the SBC add-back
// on the GAAP→non-GAAP bridge applies to all SBC regardless of GAAP line.

total_sbc[t] = rd_sbc[t] + sm_sbc[t] + ga_sbc[t] + cs_sbc[t]
```

### 3.3 Updated Function Totals

Each function's total now includes SBC. D&A is added as a G&A sub-line:

```
sm_total[t] = sm_cash_comp[t] + sm_sbc[t] + sm_programs[t]
rd_total[t] = rd_cash_comp[t] + rd_sbc[t] + rd_tooling[t]
ga_total[t] = ga_cash_comp[t] + ga_sbc[t] + ga_te[t] + da[t]
cs_total[t] = cs_cash_comp[t] + cs_sbc[t]

opex_total[t] = sm_total[t] + rd_total[t] + ga_total[t] + (cs_total[t] - cs_cogs[t])
```

Note: This changes existing operating income in the model. Adding SBC and D&A as recognized expenses lowers GAAP operating income compared to the prior version. Verify that Dashboard and Unit Economics views update accordingly. The drop is real (operating income is lower because SBC and D&A are now recognized) and accounting-correct.

### 3.4 GAAP and Non-GAAP Operating Income

```
operating_income_gaap[t] = gross_profit[t] - opex_total[t]
operating_margin_gaap_pct[t] = operating_income_gaap[t] / revenue[t]

operating_income_non_gaap[t] = operating_income_gaap[t] + total_sbc[t]
operating_margin_non_gaap_pct[t] = operating_income_non_gaap[t] / revenue[t]
```

### 3.5 EBITDA Conventions (Two Metrics)

```
ebitda[t] = operating_income_gaap[t] + da[t]
// EBITDA = GAAP operating income + D&A. Still includes SBC as expense.

adjusted_ebitda[t] = ebitda[t] + total_sbc[t]
// Adjusted EBITDA = EBITDA + SBC add-back. The metric SaaS investors use.

ebitda_margin_pct[t] = ebitda[t] / revenue[t]
adjusted_ebitda_margin_pct[t] = adjusted_ebitda[t] / revenue[t]
```

### 3.6 Updated Rule of 40

Industry convention for Rule of 40 uses **non-GAAP operating margin** (excluding SBC) plus YoY ARR growth. Update the calculation accordingly:

```
yoy_arr_growth[t] = (arr[t] - arr[t-12]) / arr[t-12]   // requires t >= 13
rule_of_40[t] = (yoy_arr_growth[t] + operating_margin_non_gaap_pct[t]) × 100
```

Add a footnote on the Dashboard tile: "Rule of 40 uses non-GAAP operating margin (excl. SBC), per public SaaS convention."

## 4. Cost Allocation for Segment P&L

Each cost line must be allocated between self-serve and sales-led for the segment P&L. SBC follows the same allocation logic as the underlying cash comp.

| Cost Line | Allocation Method | Default Driver |
|---|---|---|
| Hosting COGS | Pro rata to segment revenue | Revenue split |
| Payment processing (self-serve) | 100% to self-serve | Direct attribution |
| Payment processing (sales-led) | 100% to sales-led | Direct attribution |
| AI inference COGS | Direct attribution | Business small to self-serve, Business large + Enterprise to sales-led |
| CS in COGS | Pro rata to logos / workspaces (weighted by ARR) | Mostly sales-led in practice |
| S&M cash comp (quota reps, SDRs, SEs, sales mgrs) | 100% to sales-led | Direct attribution |
| S&M SBC (quota-tier roles) | 100% to sales-led | Same as cash comp |
| S&M cash comp (marketing) | Configurable split, default 70% self-serve / 30% sales-led | Marketing serves both, weighted toward demand gen for PLG |
| S&M SBC (marketing) | Same split as marketing cash comp | Same logic |
| S&M programs | Same split as marketing cash comp | Same logic |
| R&D cash comp | Configurable split, default 60% self-serve / 40% sales-led | Product platform serves both; tilt toward consumer surface |
| R&D SBC | Same split as R&D cash comp | Same logic |
| R&D tooling | Same split as R&D cash comp | Same logic |
| G&A cash comp | Pro rata to revenue | Shared overhead |
| G&A SBC | Pro rata to revenue | Shared overhead |
| G&A T&E | Pro rata to revenue | Shared overhead |
| D&A | Pro rata to revenue | Shared overhead |
| CS in opex | Pro rata to logos / workspaces (weighted by ARR) | Same as CS in COGS |

**New assumption block:**
```
costs.allocation: {
  marketing_self_serve_pct: 0.7,
  rd_self_serve_pct: 0.6,
  // hosting, G&A, D&A, CS use pro rata to revenue (computed, not input)
}
```

Surface these as editable inputs in the P&L view's right drawer. Cost allocation assumptions are themselves a strong interview talking point ("how did you decide to allocate R&D 60/40?") so make them visible and adjustable.

**Calculation pattern (for any pro rata line):**
```
self_serve_share[t] = self_serve_revenue[t] / total_revenue[t]
allocated_to_self_serve[t] = cost_line[t] × self_serve_share[t]
allocated_to_sales_led[t] = cost_line[t] × (1 - self_serve_share[t])
```

For configurable splits, just multiply by the configured percentage.

## 5. Quarterly and Annual Roll-Ups

The base model produces 24 monthly data points. For the P&L view, compute roll-ups:

**Quarterly:**
```
Q1 2026 = sum of months 1, 2, 3
Q2 2026 = sum of months 4, 5, 6
...
Q4 2027 = sum of months 22, 23, 24
```

Eight quarters total: Q1 2026 through Q4 2027. For each quarter, sum revenue, COGS, opex line items. Margin percentages should be recomputed at the quarter level (not averaged), since margin = quarter sum profit / quarter sum revenue.

**Annual:**
```
FY2026 = sum of months 1 through 12
FY2027 = sum of months 13 through 24
```

For ARR-based metrics displayed on the P&L (Ending ARR, NRR, GRR), use the **last month of the period** as the value, not a sum. So FY2026 Ending ARR is the ARR at month 12, FY2027 Ending ARR is the ARR at month 24, and Q1 2026 Ending ARR is the ARR at month 3.

**ARR YoY growth %.** With FY2026 and FY2027 both complete, this is now computable cleanly: (FY27 ending ARR - FY26 ending ARR) / FY26 ending ARR. This is a key SaaS metric and finally has the data to be displayed with confidence.

## 6. P&L View: Time Axis

Default view: 8 quarterly columns (Q1 2026 through Q4 2027) plus 2 annual columns (FY26 and FY27). Both annual columns are sticky-eligible.

Each quarterly column header is clickable. Clicking expands the quarter to show its three monthly sub-columns inline. Clicking again collapses. Multiple quarters can be expanded simultaneously. An "Expand all" / "Collapse all" toggle sits above the table.

Header layout when nothing is expanded:
```
| Line Item | Q1'26 | Q2'26 | Q3'26 | Q4'26 | FY26 | Q1'27 | Q2'27 | Q3'27 | Q4'27 | FY27 |
```

Header layout with Q4'26 expanded:
```
| Line Item | Q1'26 | Q2'26 | Q3'26 | Q4'26 [Oct'26 | Nov'26 | Dec'26] | FY26 | Q1'27 | Q2'27 | Q3'27 | Q4'27 | FY27 |
```

The annual FY26 and FY27 columns are sticky (always visible). Quarterly columns are also sticky-eligible if the user scrolls horizontally.

## 7. P&L View: Consolidated Tab Layout

The P&L view has two tabs at the top: **Consolidated** (default) and **By Segment**. Both use the same time axis and formatting.

### 7.1 Line Items (Consolidated Tab)

Display in standard SaaS P&L order. Each row has a label, optional indent (for sub-items), and values across all time columns. Margin/percentage rows are styled differently (italic, gray text) to distinguish from dollar rows.

```
REVENUE
  Self-serve revenue
    Plus
    Business (small)
  Sales-led revenue
    Business (large)
    Enterprise
  Total revenue                                          [BOLD]

COST OF REVENUE
  Hosting & infrastructure
  Payment processing
  AI inference
  Customer success (COGS portion)
  Total COGS                                             [BOLD]

GROSS PROFIT                                             [BOLD]
  Gross margin %                                         [italic]

OPERATING EXPENSES
  Sales & Marketing
    S&M cash comp                                        [indent 2]
    S&M stock-based comp                                 [indent 2]
    S&M programs                                         [indent 2]
    Total S&M                                            [BOLD]
    S&M as % of revenue                                  [italic]
    S&M as % of revenue (excl. SBC)                      [italic]
  Research & Development
    R&D cash comp                                        [indent 2]
    R&D stock-based comp                                 [indent 2]
    R&D tooling                                          [indent 2]
    Total R&D                                            [BOLD]
    R&D as % of revenue                                  [italic]
    R&D as % of revenue (excl. SBC)                      [italic]
  General & Administrative
    G&A cash comp                                        [indent 2]
    G&A stock-based comp                                 [indent 2]
    G&A T&E                                              [indent 2]
    Depreciation & amortization                          [indent 2]
    Total G&A                                            [BOLD]
    G&A as % of revenue                                  [italic]
    G&A as % of revenue (excl. SBC)                      [italic]
  Customer Success (opex portion)
    CS cash comp                                         [indent 2]
    CS stock-based comp                                  [indent 2]
    Total CS opex                                        [BOLD]

  Total Operating Expenses                               [BOLD]
    of which: Stock-based compensation                   [indent 1, italic]

OPERATING INCOME (LOSS) - GAAP                           [BOLD]
  Operating margin % (GAAP)                              [italic]

  + Stock-based compensation (add-back)
OPERATING INCOME - NON-GAAP                              [BOLD, EMPHASIZED]
  Operating margin % (Non-GAAP)                          [italic]

  + Depreciation & amortization (add-back)
EBITDA                                                   [BOLD]
  EBITDA margin %                                        [italic]

  + Stock-based compensation (add-back)
ADJUSTED EBITDA                                          [BOLD, EMPHASIZED]
  Adjusted EBITDA margin %                               [italic]

KEY METRICS
  Ending ARR
  ARR YoY growth %
  Rule of 40 (Non-GAAP)
  NRR (TTM)
  GRR (TTM)
  Total headcount (period-end)
```

**Display priority.** Adjusted EBITDA and Non-GAAP Operating Income are the metrics SaaS investors lead with. Style these lines with slightly stronger emphasis (heavier border, larger font) than GAAP operating income. The GAAP line stays in the P&L because it's accounting-correct and required for any actual filing, but the non-GAAP line is the one that gets discussed.

### 7.2 Visual Design

**Number formatting.**
- Dollar amounts: $ millions with one decimal place, e.g., `$52.4M`, `$0.8M`
- Negative numbers: parentheses, e.g., `($3.2M)`. Color: red for negative operating income, EBITDA, and gross profit only. Other negatives (contraction, churn) display in black with parentheses.
- Percentages: one decimal place, e.g., `78.4%`
- Headcount: integer with thousands separator, e.g., `1,247`
- Empty / not applicable: en dash for not applicable cells (financial table convention)

**Row styling.**
- Section headers (REVENUE, COST OF REVENUE, etc.): all caps, bold, slightly larger font, gray background
- Subtotal rows (Total revenue, Total COGS, Gross Profit, etc.): bold, top border
- Sub-line items: regular weight, indented with left padding
- Margin rows: italic, smaller font, gray text
- Final lines (GAAP Operating Income, Non-GAAP Operating Income, EBITDA, Adjusted EBITDA): bold, larger font, top and bottom borders. Non-GAAP Operating Income and Adjusted EBITDA get slightly heavier emphasis.

**Column styling.**
- Quarterly columns: standard width
- Annual columns (FY26, FY27): bold header, slightly emphasized background tint
- Currently-expanded quarterly columns: subtle background highlight on the parent header to indicate which quarter the monthly sub-columns belong to
- Monthly sub-columns (when expanded): narrower width, lighter background, italic header

**Hover behavior.**
Hovering a cell shows a tooltip with: the underlying calculation (e.g., "G&A cash comp = headcount × FLC / 12 = 45 × $250k / 12 = $937.5k"), the cell's exact value (un-rounded), and any allocation logic if on the segment tab.

## 8. P&L View: By Segment Tab Layout

The Segment tab shows two P&Ls side by side: **Self-Serve** (left) and **Sales-Led** (right). Same line items, same time axis, narrower columns to fit both.

### 8.1 Layout

Two-column layout. Each column is a complete P&L for that segment, using the allocated cost lines from §4. The time axis is shared (same quarterly headers across both segments) and the expand/collapse behavior synchronizes between the two columns: expanding Q4 2026 expands it on both sides simultaneously.

Both segment P&Ls show GAAP and non-GAAP operating income, EBITDA, and Adjusted EBITDA. The segments may have different SBC profiles: sales-led carries more SBC-light functions (S&M quota reps, CS), while self-serve absorbs more R&D and marketing SBC. Segment non-GAAP margins may diverge from segment GAAP margins more than expected; this is one of the more interesting outputs of the segment view.

Below the two segment columns, add a third panel: **Reconciliation**. This panel shows that:
```
Self-serve revenue + Sales-led revenue = Total revenue (consolidated)
Self-serve COGS + Sales-led COGS = Total COGS (consolidated)
Self-serve SBC + Sales-led SBC = Total SBC (consolidated)
... etc.
```

For each line, show the two segment values, the consolidated value, and a check mark or red flag indicating whether they reconcile. They should always reconcile (it's the same numbers, just sliced); the panel is a sanity check that allocation logic preserves totals.

### 8.2 Segment-Specific Metrics

Each segment shows its own KPIs at the bottom:

**Self-serve segment KPIs:**
- Self-serve ending ARR
- Self-serve ARR growth
- Self-serve workspace count
- Self-serve ARPA
- Self-serve gross margin %
- Self-serve operating margin % (GAAP)
- Self-serve operating margin % (Non-GAAP)
- Self-serve contribution margin %

**Sales-led segment KPIs:**
- Sales-led ending ARR
- Sales-led ARR growth
- Sales-led logo count
- Sales-led ARPA
- Sales-led NRR (TTM)
- Sales-led GRR (TTM)
- Sales-led gross margin %
- Sales-led operating margin % (GAAP)
- Sales-led operating margin % (Non-GAAP)
- Sales-led contribution margin %

**Contribution margin calculation:**
```
contribution_margin[t] = revenue[t] - cogs[t] - direct_opex[t]
```

Where `direct_opex` excludes allocated overhead (G&A, D&A, allocated R&D, allocated marketing). Direct opex includes:
- Self-serve direct: 100% of self-serve payment processing, marketing comp/SBC/programs allocated to self-serve, R&D cash comp/SBC allocated to self-serve, hosting allocated to self-serve, AI inference for Business small, CS allocated to self-serve
- Sales-led direct: 100% of sales-led payment processing, S&M cash comp/SBC for quota reps + SDRs + SEs + managers, marketing allocated to sales-led, R&D allocated to sales-led, hosting allocated to sales-led, AI inference for Business large + Enterprise, CS allocated to sales-led

Contribution margin answers "is each segment profitable on its own merits, before corporate overhead?" Worth displaying prominently.

## 9. Dashboard Updates

**Add KPI tiles:**
- **EBITDA Margin** (the GAAP-style metric, includes SBC as expense). Position next to Gross Margin.
- **Adjusted EBITDA Margin** (the SaaS investor metric). Position next to or replacing Operating Margin.
- **ARR YoY growth** (FY27 vs. FY26 once both years are complete).

**Update Rule of 40 calculation.** Use **non-GAAP operating margin** (excluding SBC) plus YoY ARR growth. Footnote: "Rule of 40 uses non-GAAP operating margin (excl. SBC), per public SaaS convention." Note that this is a real change to the existing tile: with SBC at ~30% of revenue, GAAP and non-GAAP margins differ by ~30 percentage points. A company that looks marginally profitable on GAAP looks healthy on non-GAAP.

**Optional:** Add a "GAAP / Non-GAAP" toggle on the Dashboard that switches all margin tiles between the two views. Useful but not required for V1. If skipped, default to displaying non-GAAP for Operating Margin and Rule of 40, and add the GAAP versions as small subtext.

## 10. Right Drawer: Assumptions

The P&L view's right drawer exposes:

**D&A assumption.**
- Monthly D&A amount (default $500k)

**SBC ratios.**
- R&D SBC % of cash comp (default 65%)
- S&M SBC % of cash comp (default 35%)
- G&A SBC % of cash comp (default 50%)
- CS SBC % of cash comp (default 30%)

**Cost allocation assumptions.**
- Marketing self-serve % (default 70%)
- R&D self-serve % (default 60%)
- Note: hosting, G&A, D&A, CS use pro rata to revenue (not user-editable, computed)

A short methodology note at the top of the drawer:
> "Costs are allocated between self-serve and sales-led to produce segment P&Ls. Direct costs (e.g., quota rep comp, payment processing) are attributed 100% to the relevant segment. Shared costs (e.g., G&A, hosting) are allocated pro rata to revenue. Strategic costs (marketing, R&D) use configurable splits since their value to each segment is judgment-driven. SBC follows the same allocation as cash comp by function. Public SaaS investors typically focus on non-GAAP profitability (excluding SBC); both GAAP and non-GAAP figures are displayed."

## 11. Validation Checks (Add to Existing Validation Footer)

Add seven new checks:

7. **EBITDA = GAAP Operating Income + D&A.** Always holds; if not, sign error.
8. **Non-GAAP Operating Income = GAAP Operating Income + Total SBC.** Always holds.
9. **Adjusted EBITDA = EBITDA + SBC.** Always holds.
10. **Segment P&Ls consolidate to total.** Sum of self-serve and sales-led for every line item equals the consolidated value. Allow ±0.1% tolerance for rounding.
11. **D&A flows through G&A correctly.** G&A total in the P&L equals G&A cash comp + G&A SBC + G&A T&E + D&A.
12. **SBC by function calibration.** Total SBC as % of revenue should be between 25% and 35% for months 6 through 24. If outside, surface a warning. This is a calibration check, not a hard error; it catches drift if the user adjusts headcount or SBC ratios in ways that produce unrealistic numbers.
13. **Total operating expenses additivity.** Sum of S&M + R&D + G&A + CS opex portion equals Total Operating Expenses.

## 12. Build Order

Two reviewable sub-phases per locked decision #1. **Phase 6a is the review gate before any P&L UI work.**

### Phase 6a — Engine, calibration, Dashboard updates

1. **Extend horizon to 24 months.**
   - `engine.ts`: `MONTHS = 24`.
   - `starting-state.ts`: extend `MONTH_LABELS_REVENUE` from 18 → 24 entries (Jan 26 → Dec 27).
   - `defaults.ts`: extend every `Array.from({ length: 18 }, …)` hiring plan to length 24, same per-month count (sales reps, marketing, R&D, G&A — locked decision #5).
   - `engine-kpis.ts`: NRR/GRR can compute clean TTM for months 13–24; months 1–12 keep annualized-from-available logic.
   - Verify: all existing Revenue views render through month 24; cohort heatmap has 24 acquisition rows; tornado now keys off month-24 ARR.
2. **Refactor `engine-costs.ts` to expose sub-lines.** Extend `MonthlyCosts` interface with: `rd_cash_comp, rd_sbc, rd_tooling, sm_cash_comp, sm_sbc, sm_programs, ga_cash_comp, ga_sbc, ga_te, da, cs_cash_comp, cs_sbc, cs_in_cogs, cs_in_opex, total_sbc, hosting, payment_processing_self_serve, payment_processing_sales_led, ai_inference_self_serve, ai_inference_sales_led`. Existing aggregate fields (`sm_total`, `cogs`, `opex_total`, etc.) stay — they recompose from the sub-lines.
3. **AI inference COGS split by segment.** Currently `ai_inference = (business_small_arr + business_large_arr + enterprise_arr) / 12 × pct`. Split into `ai_inference_self_serve = business_small_arr / 12 × pct` and `ai_inference_sales_led = (business_large_arr + enterprise_arr) / 12 × pct`. Sum equals previous total. Needed for direct-attribution allocation in 6b.
4. **Add `costs.sbc` and `costs.da` assumption blocks** in `types.ts` + `defaults.ts`. Compute `total_sbc` and `da` per spec §3.2/§3.1. Apply CS SBC split per locked decision #3.
5. **GAAP / non-GAAP / EBITDA / Adjusted EBITDA** in `MonthlyCosts`: add `operating_income_gaap, operating_margin_gaap_pct, operating_income_non_gaap, operating_margin_non_gaap_pct, ebitda, ebitda_margin_pct, adjusted_ebitda, adjusted_ebitda_margin_pct`. The existing `operating_income` becomes the GAAP value (lower than before because SBC + D&A are now expensed). Update `engine-kpis.ts` Rule of 40 to use non-GAAP margin per spec §3.6. **Months 1–12 have no `t-12` ARR**, so `MonthlyKpis.arr_yoy_growth` and `MonthlyKpis.rule_of_40` are typed as `number | null` and assigned `null` for `t < 13`. Tiles and table cells render `—` (en dash) when the value is `null`; never call `.toFixed()` on it.
6. **localStorage merge** (locked decision #11). On load, deep-merge stored assumptions over `DEFAULT_ASSUMPTIONS` so old saved state without `costs.sbc / costs.da / costs.allocation` keys still loads.
7. **Quarterly + annual roll-ups in engine post-pass** (locked decision #8). Add `results.quarterly: QuarterlyResult[]` (length 8) and `results.annual: AnnualResult[]` (length 2). Each carries summed dollar lines, period-end ARR, recomputed margin %, period-end headcount.
8. **Validation checks 7, 8, 9, 11, 12, 13** added to `validation.ts`. Check 10 (segment reconciliation) deferred to 6b once allocation logic exists.
9. **Update Vitest engine tests** for the new horizon, cost sub-lines, GAAP/non-GAAP, and EBITDA pair. Add hand-computed cases for SBC by function and Adjusted EBITDA bridge.
10. **Dashboard updates** (spec §9). New tiles: `EBITDA Margin`, `Adjusted EBITDA Margin`, `ARR YoY growth (FY27 vs. FY26)`. Update Rule of 40 tile with non-GAAP footnote. Skip the GAAP/non-GAAP toggle (spec calls it optional). Verify Unit Econ view still renders sensibly with the lower GAAP operating income.

**Phase 6a verification gate (review before 6b):**
- `npx vitest` green.
- Validation footer shows checks 1–9 + 11–13 passing on defaults (check 10 deferred).
- SBC at month 12 ≈ 25–35 % of revenue (calibration check 12 passes). If outside, surface but do not block — locked decision #6.
- GAAP operating margin lower by roughly the SBC + D&A drag; non-GAAP solidly positive at month 24.
- Existing Revenue views (Dashboard, Self-Serve, Sales-Led, Unit Econ, Scenarios) all render through month 24 with no layout breaks.

### Phase 6b — P&L module

11. **Sidebar wiring** (locked decision #2). Add `'pnl'` to `ModuleId` in `Sidebar.tsx`. Lift `RevenueProvider` in `app/page.tsx` to wrap both `RevenueModule` and the new `PnlModule`. Persist `module` selection alongside `view`. **Update the default-view-per-module mapping** in `app/page.tsx` (the existing per-Phase-5a mapping that resets `view` when the user switches modules) — add `pnl: 'consolidated'` so clicking the P&L sidebar entry lands on the Consolidated tab. Without this entry, the module switch will reset to a stale value and the P&L module will render no view.
12. **`PnlModule` component** (`components/pnl/PnlModule.tsx`) with a top-tab view router: `consolidated` (default) and `by-segment`. Mirror `RevenueModule` shell pattern (`AppShell` + `views` array + `meta`).
13. **Time-axis component** (`components/pnl/shared/TimeAxis.tsx`). 8 quarterly + 2 annual columns. `expandedQuarters: Set<number>` state in `PnlModule` (shared between both tabs so the seg-tab sync per spec §8.1 is automatic). `Expand all` / `Collapse all` toggle above the table.
14. **Consolidated tab** (`components/pnl/consolidated/ConsolidatedPnl.tsx`). Render the line-item structure from §7.1 driven by a `LINE_ITEMS` config array (label, indent, accessor: `(period: QuarterlyResult | AnnualResult) => number | null`, style flags `bold | italic | section | emphasis`). Margin rows recompute from numerator/denominator at the period level.
15. **Hover tooltips** (`components/pnl/shared/CellTooltip.tsx`). Per locked decision #7, derive the formula string locally from `(line_id, period_index, results, assumptions)`. Table cell wraps in tooltip trigger; tooltip shows formula, raw value, and (on segment tab) the allocation rule.
16. **Cost allocation engine** (`lib/revenue/engine-allocation.ts`). Pure helper: takes a `MonthlyResult` + `costs.allocation` block, returns `{ self_serve: AllocatedCosts, sales_led: AllocatedCosts }`. Allocation table per spec §4. Called from the segment-tab component, not from `simulate()` — keeps the engine output focused on what every consumer needs. **Allocation order: allocate per-month, then roll up per-segment to quarterly / annual.** Never roll up the consolidated period first and then split — pro-rata `self_serve_share[t]` shifts across the 24-mo horizon as sales-led ramps, so period-level allocation produces different (wrong) results. Build a `segmentRollups(monthly_allocated, period)` helper alongside the consolidated `engine.ts` post-pass roll-ups, using identical period boundaries. Reconciliation panel and validation check 10 must pass at month, quarter, and annual grain.
17. **By-Segment tab** (`components/pnl/segment/SegmentPnl.tsx`). Two columns side by side using the same `LINE_ITEMS` config but reading from the allocated views. Shared time axis with the consolidated tab.
18. **Reconciliation panel** (`components/pnl/segment/ReconciliationPanel.tsx`). For each major line, render `self_serve + sales_led ?= consolidated` with a check / flag. Tolerance 0.1 % per spec §11.
19. **Validation check 10** (segment-reconciliation) added to `validation.ts`. Computes allocation across all 24 months and verifies sum == consolidated within tolerance.
20. **P&L right drawer** (`components/pnl/shared/PnlAssumptionsDrawer.tsx`). Reuses existing `AssumptionsDrawer` shell. Surfaces `monthly_da_amount`, the four SBC ratios, and the two allocation %s. Methodology note at top per spec §10.
21. **Methodology footer addendum.** Document SBC modeling, GAAP vs. non-GAAP convention, allocation methodology, and the locked-decision §13 out-of-scope list.

**Phase 6b verification gate:**
- P&L sidebar entry switches to the P&L module; both tabs render.
- Quarter expand → 3 monthly sub-columns inline; collapse restores; multiple quarters expandable simultaneously; sync works across both segment columns.
- Hover any cell → tooltip with formula + raw value (+ allocation note on seg tab).
- Edit SBC ratio in P&L drawer → consolidated and segment numbers update; revenue-module Dashboard non-GAAP tiles also update (single shared engine).
- Reconciliation panel all green; validation check 10 passes.
- Reset to defaults restores all P&L assumption blocks.

**Estimated build time:** Phase 6a ≈ 4–6 hours. Phase 6b ≈ 8–10 hours. Full spec ≈ 12–16 hours.

## 13. Out of Scope for V1

The following are explicitly out of scope. Note them in the methodology footer:

- Real D&A from a capex schedule (V2: drive D&A from capex assumptions and intangibles amortization)
- SBC for new hires vs. existing employees (V2 could model grant cohorts; V1 uses a flat percentage)
- SBC seasonality (V2; real SBC has timing lumpiness from annual refresh grants)
- Dilution and share count (V2: derive shares from SBC and a stock price assumption)
- ASC 718 graded vesting treatment (V1 uses period expensing as a simplification)
- Below-the-line items (interest income, interest expense, other income/expense, taxes, net income)
- Non-GAAP reconciliations beyond what's shown (e.g., normalized operating income excluding restructuring)
- Statement of cash flows (next spec)
- Trailing twelve months (TTM) view of the P&L
- Variance analysis vs. prior period
- Export to CSV or Excel (deferred per user decision)

## 14. What This Sets Up for the Next Spec (Cash Flow)

With SBC now in the model, the cash flow view becomes substantially more interesting. The cash flow statement will show SBC as the largest non-cash add-back in operating cash flow, and the gap between GAAP operating income and OCF will be one of the most important numbers in the model. FCF margin will be meaningfully different from GAAP operating margin. Worth flagging as the next build after this spec lands.
