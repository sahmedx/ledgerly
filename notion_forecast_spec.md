# Notion Revenue Forecast Model: Implementation Spec

## 1. Context and Goals

This document specifies a revenue forecasting tool for Notion, designed as an FP&A portfolio piece. The model forecasts 18 months of revenue, costs, and unit economics across Notion's two go-to-market motions (self-serve PLG and sales-led enterprise) starting January 2026, when Notion is reportedly at ~$600M ARR with over 50% of customers paying for AI features.

The tool has five views: Dashboard, Self-Serve Engine, Sales-Led Engine, Unit Economics, and Scenarios & Sensitivity. Every output should be traceable back to a documented input assumption, and every assumption should be adjustable by the user.

The intended audience is FP&A practitioners and finance leadership at SaaS companies. The model should feel like something a CFO could actually use to plan, not a generic SaaS calculator. Notion-specific realism is preferred over generic abstraction.

## 2. Glossary and Conventions

**Time conventions.** All calculations are monthly. The forecast horizon is 18 months, January 2026 through June 2027. Month index `t` runs 1 to 18, with `t=0` representing the December 2025 starting state. Fiscal year aligns to calendar year.

**Currency.** All amounts in USD. Display as $ with appropriate scale formatting ($1.2M, $600.0M, $1.5B).

**Workspace vs. seat vs. logo.** A *workspace* is a billing entity in self-serve. A *seat* is a paid member license; one workspace has many seats. A *logo* is a single sales-led customer (synonym for "account"). For self-serve, logo count equals workspace count. ARPA on the self-serve side is workspace-level; on the sales-led side it is logo-level. Per-seat pricing is the underlying revenue mechanic for both engines.

**ARR vs. MRR.** ARR is annualized recurring revenue, calculated as MRR × 12. MRR is the sum of (active paid seats × monthly seat price) across all tiers and billing cadences.

**Billings vs. revenue.** Billings is the amount invoiced to customers in a period (cash-basis proxy). Revenue is recognized ratably over the service period per ASC 606. Annual prepay creates a gap: billings are lumpy at contract start and renewal; revenue is smooth.

**Deferred revenue.** The balance sheet account capturing the obligation to deliver service for which cash has been received. Formally a "contract liability" under ASC 606, but "Deferred Revenue" is the label used throughout this model.

**NRR and GRR.** Net Revenue Retention and Gross Revenue Retention, both computed on a trailing-12-month (TTM) basis at the cohort level for sales-led, blended for self-serve. Definitions in §6.5.

**Engines.** The model splits revenue into two engines. The *self-serve engine* covers Free, Plus, and small Business workspaces (under 50 seats). The *sales-led engine* covers large Business (50+ seats) and Enterprise. Workspaces flow from one to the other via *graduation*.

**AI-influenced ARR.** A derived metric, not a separate revenue line. Defined as the total ARR of customers on Business or Enterprise tiers (where AI is bundled), with attribution logic in §6.5.

## 3. Architecture Overview

The application has three layers:

**Assumptions layer.** A centralized object containing every model input, organized by category (self-serve drivers, sales-led drivers, cost drivers, scenario shocks). One source of truth. All views read from and (in some cases) write to this object.

**Calculation layer.** A pure function that takes the assumptions object, runs the 18-month simulation, and returns a results object. No side effects. Deterministic given inputs. The simulation iterates month by month, with each month depending only on prior months and current-month inputs.

**Presentation layer.** Five React views that render visualizations and tables from the results object. Each view also exposes the input panel for assumptions relevant to that view. Changing an input recalculates the entire model and re-renders all views.

The model recomputes for three scenarios in parallel (base, upside, downside) so that comparison views work without delay. Recompute is fast enough that a debounced re-run on every slider change is fine; no need for Web Workers in V1.

## 4. Data Model

### 4.1 Assumptions object (input)

```
assumptions = {
  starting_state: { ... },         // §5
  self_serve: {
    free_pool_start: int,
    free_pool_monthly_growth: float,
    free_to_paid_rate: float,       // monthly
    tier_mix_on_conversion: {       // sums to 1.0
      plus: float,
      business: float,
    },
    initial_seats_per_workspace: { plus: int, business: int },
    monthly_seat_growth_rate: { plus: float, business: float },
    plus_to_business_upgrade_rate: float,  // monthly
    retention_curve: {
      plus: { floor: float, decay: float },
      business: { floor: float, decay: float },
    },
    pricing: {
      plus: { annual: 10, monthly: 12 },
      business: { annual: 20, monthly: 24 },
    },
    annual_billing_mix: { plus: float, business: float },
    graduation_seat_threshold: int,  // default 50
  },
  sales_led: {
    starting_arr: { business_large: float, enterprise: float },
    starting_logos: { business_large: int, enterprise: int },
    average_seats_per_logo: { business_large: int, enterprise: int },
    blended_seat_price: { business_large: float, enterprise: float },
    named_pipeline: [
      { id, company, stage, acv, expected_close_month }, ...
    ],
    stage_probability: { qualified: 0.10, discovery: 0.25, ... },
    sales_capacity: {
      starting_reps: int,
      hiring_plan: [{month, count}, ...],
      ramp_curve: [0, 0, 0, 0.33, 0.33, 0.33, 0.66, 0.66, 0.66, 1.0, ...],
      fully_ramped_quota_annual: float,
      attainment: float,
      monthly_attrition_rate: float,
      replacement_lag_months: int,
    },
    win_rate: float,
    existing_customer_dynamics: {
      monthly_gross_churn_rate: float,
      monthly_contraction_rate: float,
      monthly_expansion_rate: float,
    },
    pipeline_capacity_seam_month: 7,  // pipeline drives months 1-6, capacity drives 7+
  },
  costs: {
    sm: {
      sdr_ratio: float,             // SDRs per quota rep
      se_ratio: float,
      manager_ratio: float,         // 1 manager per N reps
      flc_per_role: { rep: float, sdr: float, se: float, manager: float, mktg: float },
      marketing_programs_pct_of_revenue: float,
      marketing_headcount_start: int,
      marketing_hiring_plan: [...],
    },
    rd: { headcount_start: int, hiring_plan: [...], flc_per_eng: float, tooling_pct_of_revenue: float },
    ga: { headcount_start: int, hiring_plan: [...], flc_per_ga: float, te_pct_of_revenue: float },
    cs: { csm_per_enterprise_logos: int, csm_per_business_large_logos: int, flc_per_csm: float },
    cogs: {
      hosting_pct_of_revenue: float,
      payment_processing_pct_self_serve: float,
      payment_processing_pct_sales_led: float,
      ai_inference_pct_of_business_enterprise_arr: float,
    },
  },
  scenarios: {
    base: {},                       // no shocks
    upside: { /* shock multipliers */ },
    downside: { /* shock multipliers */ },
  },
}
```

### 4.2 Results object (output)

```
results = {
  monthly: [                       // length 18
    {
      month_index: 1,
      calendar_date: "2026-01",
      self_serve: {
        free_users: int,
        new_paid_workspaces: int,
        active_workspaces: { plus: int, business_small: int },
        active_seats: { plus: int, business_small: int },
        mrr: { plus: float, business_small: float },
        arr: { plus: float, business_small: float },
        plus_to_business_upgrades: int,
        graduations_to_sales_led: int,
        graduated_arr: float,
      },
      sales_led: {
        active_logos: { business_large: int, enterprise: int },
        new_arr_named_pipeline: float,
        new_arr_capacity: float,
        new_arr_graduation: float,
        expansion_arr: float,
        contraction_arr: float,
        churn_arr: float,
        ending_arr: { business_large: float, enterprise: float },
        active_reps: int,
        productive_capacity_arr: float,
      },
      total: {
        arr: float,
        mrr: float,
        revenue: float,             // monthly revenue, GAAP
        billings: float,
        deferred_revenue_balance: float,
        ai_influenced_arr: float,
      },
      costs: {
        cogs: float,
        gross_profit: float,
        gross_margin_pct: float,
        sm_total: float,
        rd_total: float,
        ga_total: float,
        cs_total: float,
        opex_total: float,
        operating_income: float,
        operating_margin_pct: float,
      },
      headcount: {
        sales_reps: int, sdrs: int, ses: int, sales_mgrs: int,
        marketing: int, rd: int, ga: int, cs: int, total: int,
      },
      kpis: {
        nrr_ttm: float, grr_ttm: float,
        magic_number: float, burn_multiple: float, rule_of_40: float,
        cac_payback_self_serve: float, cac_payback_sales_led: float,
        ltv_cac_self_serve: float, ltv_cac_sales_led: float,
        arpa_self_serve: float, arpa_sales_led: float,
      },
    },
    ... (17 more)
  ],
  cohorts_self_serve: [             // for cohort grid view
    { acquisition_month: 1, tier: "plus", initial_workspaces: int, retention_by_age: [...], seats_by_age: [...] },
    ...
  ],
  pipeline_resolved: [              // for pipeline view
    { ...deal, weighted_arr, recognized_in_month },
    ...
  ],
  scenarios_compared: {
    base: { arr_trend: [...], opex_trend: [...] },
    upside: { ... },
    downside: { ... },
  },
}
```

## 5. Starting State (January 2026)

These are the Day 0 (December 2025) values that seed the simulation. Where Notion's actual figures are public, use them; where not, anchor to defensible estimates and document.

| Metric | Value | Source / Rationale |
|---|---|---|
| Total ARR | $600M | Reported "$600M+ by end of 2025" |
| Self-serve ARR | $360M (60%) | Estimate; PLG-led company |
| Sales-led ARR | $240M (40%) | Estimate |
| Plus ARR | $200M | Subset of self-serve |
| Business (small, self-serve) ARR | $160M | Subset of self-serve |
| Business (large, sales-led) ARR | $100M | Subset of sales-led |
| Enterprise ARR | $140M | Subset of sales-led |
| Total registered users | 100M | Public reporting |
| Free user pool | 90M | Total minus paid |
| Plus workspaces | 417k | $200M / ($10 × 12 × 4 seats) |
| Business (small) workspaces | 55k | $160M / ($20 × 12 × 12 seats) |
| Business (large) logos | 4,200 | $100M / ($20 × 12 × 100 seats) |
| Enterprise logos | 933 | $140M / $150k ACV |
| AI-influenced ARR | ~$300M (50%) | Reported "more than 50% of ARR from AI-enabled customers" |
| Quota-carrying reps | 50 | Estimate |
| Total headcount | 800 | Estimate |

These values populate the assumptions object's `starting_state` field and the December 2025 column of the results. The simulation begins from this snapshot.

## 6. Calculation Logic

The simulation runs month by month. Within each month, the order of operations matters; follow the sequence below to avoid timing artifacts.

### 6.1 Self-Serve Engine

**Step A: Free user pool.**
```
free_users[t] = free_users[t-1] × (1 + monthly_growth_rate) - new_paid_conversions[t]
```
Where `new_paid_conversions[t] = free_users[t-1] × free_to_paid_rate`. Free churn is implicit in the growth rate (i.e., the growth rate is net of free churn).

**Step B: Route conversions to tiers.**
```
new_plus_workspaces[t] = new_paid_conversions[t] × tier_mix.plus
new_business_workspaces[t] = new_paid_conversions[t] × tier_mix.business
```
Default mix: 80% Plus, 20% Business (small). Rationale: most self-serve conversions land on the cheaper tier first.

**Step C: Cohort retention.**
Each (acquisition_month, tier) pair is a cohort. For a cohort acquired at month `m`, the count of active workspaces at month `t` (where age `a = t - m`) is:
```
retention(a) = floor + (1 - floor) × exp(-decay × a)
workspaces_remaining(m, t) = initial_workspaces × retention(a)
```
Default parameters: Plus floor 0.45 / decay 0.20; Business small floor 0.70 / decay 0.10. The Day 0 base book of 417k Plus and 55k Business workspaces is treated as a single "legacy cohort" with its own retention parameters (slightly better, since they've already self-selected through early churn): Plus legacy floor 0.65 / decay 0.08; Business legacy floor 0.85 / decay 0.05.

**Step D: Seat expansion within cohorts.**
For each surviving workspace in a cohort of age `a`:
```
seats_per_workspace(a) = initial_seats × (1 + monthly_seat_growth_rate)^a
```
Default initial seats: Plus 4, Business small 12. Default seat growth: Plus 0.5%/month, Business 1.0%/month.

**Step E: Plus to Business upgrades.**
At each month, a fraction of active Plus workspaces upgrade to Business:
```
upgrades[t] = active_plus_workspaces[t] × plus_to_business_upgrade_rate
```
Default: 0.8% per month. Upgraded workspaces leave the Plus cohort and enter a *new* Business cohort dated at month `t`, carrying their current seat count. Their age in the Business cohort resets to 0 for retention purposes (this is a simplification; in reality these are tenured customers and would retain better). Document as a known limitation.

This is also the lever for "AI-driven upgrades." Upside scenario applies a multiplier to this rate to model accelerated AI adoption.

**Step F: Graduations to sales-led.**
At each month, identify Business (small) cohorts whose average seats per workspace has crossed the graduation threshold:
```
if seats_per_workspace(a) >= graduation_seat_threshold (default 50):
  graduate the entire cohort
```
Graduation moves the cohort's workspaces and ARR out of the self-serve engine. Quantities to track:
- `graduations_count[t]` (logos moving over)
- `graduated_arr[t]` (their ARR at the time of graduation)

These feed the sales-led engine in §6.2 as a `new_arr_graduation` source. The transfer is ARR-neutral at the company level (subtracted from self-serve, added to sales-led), but it shows up in the ARR waterfall as a "transfer" line.

**Step G: Aggregate self-serve revenue.**
```
plus_active_seats[t] = sum across all Plus cohorts of (workspaces × seats_per_workspace)
plus_mrr[t] = plus_active_seats[t] × (annual_mix × $10 + monthly_mix × $12)
business_small_active_seats[t] = same logic
business_small_mrr[t] = business_small_active_seats[t] × (annual_mix × $20 + monthly_mix × $24)
self_serve_mrr[t] = plus_mrr[t] + business_small_mrr[t]
self_serve_arr[t] = self_serve_mrr[t] × 12
```

### 6.2 Sales-Led Engine

**Step A: Existing customer base dynamics.**
For Business (large) and Enterprise separately:
```
churn_arr[t] = existing_arr_start[t] × monthly_gross_churn_rate
contraction_arr[t] = existing_arr_start[t] × monthly_contraction_rate
expansion_arr[t] = existing_arr_start[t] × monthly_expansion_rate
```
Default rates (monthly, applied to entire base):
- Business large: gross churn 0.5%, contraction 0.3%, expansion 1.5%
- Enterprise: gross churn 0.2%, contraction 0.4%, expansion 2.0%

These produce annualized GRR ~94% (Business large), ~98% (Enterprise) and NRR ~108% (Business large), ~117% (Enterprise) at steady state.

**Step B: Active reps and capacity.**
```
active_reps[t] = active_reps[t-1] + new_hires[t] - attrited_reps[t] + replacements[t]
attrited_reps[t] = active_reps[t-1] × monthly_attrition_rate
replacements[t] = attrited_reps[t - replacement_lag_months]
```
Default attrition 1.5%/month (~17% annualized). Default replacement lag: 2 months.

For each active rep, productive capacity at month `t` depends on months since hire:
```
ramp_curve = [0, 0, 0, 0.33, 0.33, 0.33, 0.66, 0.66, 0.66, 1.0, 1.0, 1.0, ...]
rep_capacity_arr[t] = sum across active reps of (
  ramp_curve[months_since_hire] × fully_ramped_monthly_quota × attainment
)
```
Default fully ramped annual quota: $1.2M ARR. Default attainment: 80%. Monthly quota = $100k × 80% = $80k for a fully ramped rep at full attainment.

**Step C: New ARR sources, with the seam rule.**
Three sources, mixed by month:
- Months 1 to 6: named pipeline closes per the deal list, weighted by stage probability. Capacity-driven new ARR is suppressed (assumed to be already counted in the pipeline).
- Months 7 to 18: capacity-driven new ARR is the primary source. No named pipeline (any deals in named pipeline closing past month 6 should be re-classified as capacity output for clarity).
- All months: graduation inflow from §6.1 Step F.

```
new_arr_named[t] = (t <= 6) ? sum(deal.acv × stage_prob[deal.stage] for deals closing at t) : 0
new_arr_capacity[t] = (t >= 7) ? rep_capacity_arr[t] × win_rate : 0
new_arr_graduation[t] = graduated_arr[t]   // from self-serve §6.1.F
new_arr_total[t] = new_arr_named[t] + new_arr_capacity[t] + new_arr_graduation[t]
```

Allocate `new_arr_capacity` and `new_arr_graduation` between Business large and Enterprise per a configurable split (default 60% Business large, 40% Enterprise). Pipeline deals carry their own segment tag.

**Step D: Update ending ARR.**
```
business_large_arr_end[t] = business_large_arr_start[t] + business_large_new_arr[t]
                           + expansion - contraction - churn
enterprise_arr_end[t] = same logic for Enterprise
sales_led_arr[t] = business_large_arr_end[t] + enterprise_arr_end[t]
```

**Step E: Aggregate logos.**
```
business_large_new_logos[t] = business_large_new_arr[t] / (avg_seats × seat_price × 12)
enterprise_new_logos[t] = enterprise_new_arr[t] / avg_acv
business_large_churned_logos[t] = derived from gross churn and avg ARR per logo
... (same for enterprise)
business_large_active_logos[t] = active[t-1] + new - churned
```

### 6.3 Cost Layer

**S&M.**
```
sales_reps[t] = active_reps[t]   // from §6.2
sdrs[t] = round(sales_reps[t] × sdr_ratio)        // default 0.5
ses[t] = round(sales_reps[t] × se_ratio)          // default 0.3
sales_mgrs[t] = round(sales_reps[t] / 8)
sm_comp[t] = sales_reps[t] × flc.rep/12
          + sdrs[t] × flc.sdr/12
          + ses[t] × flc.se/12
          + sales_mgrs[t] × flc.manager/12
          + marketing_headcount[t] × flc.mktg/12
sm_programs[t] = total_revenue[t] × marketing_programs_pct
sm_total[t] = sm_comp[t] + sm_programs[t]
```
Defaults: rep FLC $300k, SDR $150k, SE $250k, manager $400k, marketing IC $250k, programs 8% of revenue.

**R&D.**
```
rd_comp[t] = rd_headcount[t] × flc.eng/12
rd_tooling[t] = total_revenue[t] × tooling_pct
rd_total[t] = rd_comp[t] + rd_tooling[t]
```
Defaults: eng FLC $400k, tooling 2% of revenue.

**G&A.**
```
ga_comp[t] = ga_headcount[t] × flc.ga/12
ga_te[t] = total_revenue[t] × te_pct
ga_total[t] = ga_comp[t] + ga_te[t]
```
Defaults: G&A FLC $250k, T&E 1.5% of revenue.

**CS.**
```
required_csms[t] = enterprise_logos[t] / csm_per_enterprise_ratio
                + business_large_logos[t] / csm_per_business_large_ratio
cs_total[t] = required_csms[t] × flc.csm/12
```
Defaults: 1 CSM per 25 Enterprise logos, 1 CSM per 100 Business large logos, CSM FLC $200k.

**COGS.**
```
hosting_cogs[t] = total_revenue[t] × hosting_pct                // default 8%
payment_self_serve[t] = self_serve_revenue[t] × pp_pct_ss       // default 3%
payment_sales_led[t] = sales_led_revenue[t] × pp_pct_sl         // default 1%
ai_inference[t] = (business_arr[t] + enterprise_arr[t])/12 × ai_inference_pct  // default 6%
cs_cogs[t] = cs_total[t] × cs_in_cogs_pct                       // default 70% (rest in opex)
cogs_total[t] = hosting + payment_self_serve + payment_sales_led + ai_inference + cs_cogs
```

**Gross profit and operating income.**
```
gross_profit[t] = total_revenue[t] - cogs_total[t]
gross_margin_pct[t] = gross_profit[t] / total_revenue[t]
opex_total[t] = sm_total[t] + rd_total[t] + ga_total[t] + (cs_total[t] - cs_cogs[t])
operating_income[t] = gross_profit[t] - opex_total[t]
operating_margin_pct[t] = operating_income[t] / total_revenue[t]
```

### 6.4 Billings and Deferred Revenue

**Billings logic.** Two tracks: self-serve (mixed annual/monthly) and sales-led (100% annual prepay per simplifying assumption).

For self-serve, treat workspaces as making their initial billing in the month they convert, and renewing on their anniversary:
```
self_serve_billings_annual[t] = sum across annual workspaces billing this month of (
  active_seats × annual_seat_price
)
self_serve_billings_monthly[t] = sum across monthly workspaces of (active_seats × monthly_seat_price)
self_serve_billings[t] = annual_portion + monthly_portion
```

For sales-led:
```
sales_led_billings[t] = new_arr_total[t] (excluding graduation, since graduation ARR was already billed when on Plus/Business)
                     + renewals_due[t]
                     + expansion_arr[t]   // assume billed in-month at expansion
                     - contraction_credits   // assume net of contraction
```
Renewals due: any sales-led customer hits an anniversary 12 months after their start date (or graduation date), at which point their full ARR re-bills.

**Revenue recognition.**
Annual billings recognize 1/12 per month for 12 months. Monthly billings recognize 100% in month of billing.

**Deferred revenue.**
```
deferred_revenue[t] = deferred_revenue[t-1] + billings[t] - revenue[t]
```
All current (next 12 months), since all contracts are annual or shorter.

**Validation.** Sum of billings over the forecast should equal sum of revenue plus the change in deferred revenue. This is a useful sanity check.

### 6.5 Unit Economics and KPIs

**ARPA.**
- Self-serve ARPA = self_serve_arr[t] / total_self_serve_workspaces[t]
- Sales-led ARPA = sales_led_arr[t] / total_sales_led_logos[t]

**NRR (TTM).**
For each month `t >= 13`:
```
existing_arr_12mo_ago = sales_led_arr[t-12] (sales-led customers existing at t-12)
expansion_12mo = sum of expansion_arr from t-11 to t for that cohort
contraction_12mo = sum of contraction_arr
churn_12mo = sum of churn_arr
nrr_ttm = (existing_arr_12mo_ago + expansion_12mo - contraction_12mo - churn_12mo) / existing_arr_12mo_ago
```
For `t < 13`, annualize from available months. Mirror logic for self-serve, applied to workspace ARR.

**GRR (TTM).** Same as NRR but excludes expansion.

**CAC by segment.**
```
self_serve_cac[t] = (self_serve_attributable_sm[t]) / new_self_serve_logos[t]
sales_led_cac[t] = (sales_led_attributable_sm[t]) / new_sales_led_logos[t]
```
Self-serve attributable S&M = marketing programs + marketing headcount comp (no quota reps). Sales-led attributable S&M = quota reps + SDRs + SEs + sales managers, plus a portion of marketing (default 30% of programs).

**LTV by segment.**
```
self_serve_ltv = self_serve_arpa × gross_margin_pct / monthly_gross_churn_rate_self_serve
sales_led_ltv = sales_led_arpa × gross_margin_pct / monthly_gross_churn_rate_sales_led
```

**Payback.**
```
self_serve_cac_payback_months = self_serve_cac / (self_serve_arpa × gross_margin_pct / 12)
sales_led_cac_payback_months = sales_led_cac / (sales_led_arpa × gross_margin_pct / 12)
```

**Magic Number.**
```
magic_number[t] = (arr[t] - arr[t-3]) × 4 / sm_total[t-3 to t-1]
```
Quarterly metric, computed for months `t >= 6`.

**Burn Multiple.**
```
burn_multiple[t] = max(0, -operating_income[t]) / (arr[t] - arr[t-1])
```
Defined only when net new ARR > 0.

**Rule of 40.**
```
yoy_arr_growth[t] = (arr[t] - arr[t-12]) / arr[t-12]   // requires t >= 13; for t < 13 use annualized monthly growth
operating_margin = operating_income[t] / revenue[t]
rule_of_40[t] = (yoy_arr_growth[t] + operating_margin) × 100
```

**AI-influenced ARR.**
```
ai_influenced_arr[t] = business_small_arr[t] + business_large_arr[t] + enterprise_arr[t]
```
That is, all tiers where AI is bundled. Display this as a percentage of total ARR alongside the absolute value. The starting state target is ~50%, consistent with reported figures. Ratio drift over the forecast tells the story of AI-led tier mix shift.

## 7. Scenario Engine

Three scenarios run in parallel: Base, Upside, Downside. Each is a set of multiplicative shocks applied to selected drivers in the assumptions object before simulation runs.

| Driver | Base | Upside | Downside |
|---|---|---|---|
| Free user growth rate | 1.0× | 1.20× | 0.80× |
| Free → paid conversion | 1.0× | 1.20× | 0.80× |
| Plus → Business upgrade rate | 1.0× | 1.30× | 0.70× |
| Sales rep attainment | 1.0× | 1.15× | 0.85× |
| Win rate | 1.0× | 1.10× | 0.90× |
| Self-serve churn | 1.0× | 0.75× | 1.25× |
| Sales-led churn | 1.0× | 0.80× | 1.20× |
| Expansion rate | 1.0× | 1.20× | 0.80× |

The shock multipliers are themselves user-editable (each scenario exposes a panel where shocks can be tuned). The user can select which scenario is "active" on the Dashboard via a toggle. The Scenarios view always shows all three side by side.

## 8. View Specifications

All views share a left sidebar with view navigation and a top bar with the active scenario toggle and a "Reset to defaults" button. The model assumptions panel lives in a collapsible right drawer, scoped to the current view.

### 8.1 Dashboard

**Purpose:** One-screen executive summary.

**Top KPI tiles (row of 8):**
- Total ARR (with delta vs. starting state)
- NRR (TTM)
- GRR (TTM)
- Total logos
- ARPA (blended, with sub-line showing self-serve and sales-led)
- AI-influenced ARR (with % of total)
- Gross Margin %
- Rule of 40

**Center: ARR waterfall.**
A horizontal waterfall chart showing, for the trailing 12 months ending at the latest month:
```
Starting ARR
+ New self-serve ARR
+ New sales-led ARR (named pipeline)
+ New sales-led ARR (capacity)
+ Graduation transfer (zero net, shown as offsetting bars)
+ Expansion ARR
- Contraction ARR
- Churn ARR
= Ending ARR
```

**Bottom left: 18-month ARR trend.**
Line chart with three lines (base, upside, downside) and a shaded band between upside and downside. Toggle to switch between ARR, MRR, and Revenue.

**Bottom right: Billings vs. Revenue.**
Stacked bar chart showing monthly billings vs. revenue, with deferred revenue balance overlaid as a line.

### 8.2 Self-Serve Engine

**Top: Funnel.**
Visual funnel showing free pool → monthly conversions → workspaces by tier → seat count.

**Middle left: Cohort retention heatmap.**
Rows = acquisition month, columns = age (months since acquisition), cells colored by retention %. Two grids stacked: Plus and Business small.

**Middle right: Tier composition over time.**
Stacked area chart: Plus workspaces (count), Business small workspaces (count), with a secondary axis for ARR.

**Bottom left: Plus to Business upgrade flow.**
Line chart of monthly upgrade count and the resulting Business cohort size buildup.

**Bottom right: Seat expansion curves.**
Line chart showing average seats per workspace by cohort age, by tier.

**Right drawer (assumptions):** All self-serve drivers from §4.1.

### 8.3 Sales-Led Engine

**Top: Pipeline table.**
Columns: Company, Stage (badge), ACV, Expected close month, Probability, Weighted ARR. Sortable. Stage badges color-coded.

**Middle left: Probability-weighted bookings by month.**
Bar chart showing weighted ARR closing in each of months 1 to 6.

**Middle right: Sales capacity.**
Multi-line chart: active reps, productive capacity (in $ ARR), capacity-driven new ARR. Vertical line marking the named pipeline / capacity seam at month 7.

**Bottom left: New ARR by source (months 1-18).**
Stacked bar: named pipeline, capacity-driven, graduation inflow.

**Bottom right: Existing customer dynamics.**
Stacked bar showing monthly expansion, contraction, churn for the existing sales-led base. NRR line overlaid.

**Right drawer:** All sales-led drivers, including the editable named pipeline table.

### 8.4 Unit Economics

**Top KPI tiles:** CAC self-serve, CAC sales-led, LTV self-serve, LTV sales-led, LTV/CAC self-serve, LTV/CAC sales-led, Payback self-serve, Payback sales-led.

**Middle: CAC Payback curves.**
For each segment, a curve showing cumulative gross profit per logo over months since acquisition, with the CAC line overlaid (where the curve crosses CAC is the payback point).

**Bottom left: Magic Number trend.**
Line chart, quarterly resolution, with reference lines at 0.75 and 1.0.

**Bottom right: Burn Multiple trend.**
Line chart, monthly. Reference lines at 1.0 (efficient) and 2.0 (inefficient).

### 8.5 Scenarios and Sensitivity

**Top: Side-by-side scenario summary.**
Three columns (Downside, Base, Upside), each showing key endpoint metrics: Ending ARR, Cumulative Revenue, Ending Gross Margin %, Ending Operating Margin %, Total OpEx, Headcount.

**Middle: Side-by-side ARR trends.**
Three small multiples, one per scenario.

**Bottom: Tornado chart.**
Sensitivity of ending ARR to ±10% shock in each individual driver. Drivers ranked by absolute impact. Bars shaded by direction.

**Right drawer:** Scenario shock multipliers, editable per scenario.

## 9. Simplifying Assumptions

Document the following explicitly in the model UI (a "Methodology" tab or footer link):

1. All sales-led contracts are one-year annual prepay. Real Notion contracts include 2-3 year terms with discounts and renewal escalators; modeling all as annual.
2. Plus to Business upgrades reset retention age to zero in the new cohort. Real upgraded customers retain better than fresh acquisitions.
3. Free user growth rate is net of free churn (no separate free churn parameter).
4. Named pipeline drives bookings in months 1 to 6; sales capacity drives bookings in months 7 to 18. No overlap (avoids double-counting).
5. Graduation ARR transfers at face value in the month of graduation. Real graduations involve a renegotiation and often a price uplift; not modeled.
6. AI inference cost modeled as flat percentage of Business + Enterprise ARR. Real cost scales with usage, which varies by customer.
7. CSM staffing modeled by ratio to logos. Real staffing also depends on segment, deal size, and complexity.
8. No seasonality. Real SaaS bookings are heavily Q4-weighted and Q1-light. V2 enhancement.
9. No FX, no taxes, no stock-based compensation broken out. Operating income is pre-SBC, pre-tax.
10. No working capital model beyond deferred revenue. AR, AP, prepaid expenses not modeled.

## 10. Validation Checks

The model should display these reconciliation checks in a "Validation" footer or dev panel:

1. **ARR walk reconciles.** For each month, starting ARR + all sources of change = ending ARR.
2. **Graduation transfer is ARR-neutral.** Sum of self-serve graduation outflows equals sum of sales-led graduation inflows.
3. **Billings to revenue tie.** Cumulative billings = cumulative revenue + ending deferred revenue.
4. **Headcount additivity.** Sum of departmental headcounts = total headcount.
5. **NRR and GRR sanity.** NRR >= GRR always. Both within plausible ranges (NRR 100% to 130%, GRR 85% to 99%).
6. **Rule of 40 plausibility.** Plotted alongside Notion's reported peer companies for context.

If any check fails, surface a warning. This is itself a portfolio signal: it shows you think about model integrity.

## 11. V2 Stretch Goals (Out of Scope for V1)

Defer the following to keep V1 buildable in a reasonable timeframe:
- Multi-year enterprise contracts with renewal escalators
- Seasonality (Q4 weighting, summer slowdown)
- Currency / FX exposure (Notion has substantial international revenue)
- Stock-based compensation as a separate line
- Working capital cycle (AR, AP, prepaid expenses)
- Cash flow statement and cash runway
- Free cash flow margin (vs. operating margin)
- Rep-level pipeline view (drill into named pipeline by rep)
- Cohort-level CAC payback (today is segment-level)
- Customer concentration risk (what % of ARR from top 10 logos)
- IPO valuation walk (apply public SaaS multiple to ending ARR)

The valuation walk may be worth building even in V1 given Notion's IPO trajectory; it's a 30-minute add and a strong interview talking point.

## 12. Open Questions

A few things worth flagging to the spec reader (or to discuss before build):
- Should the user be able to upload a custom pipeline CSV, or is in-app editing sufficient for V1? (Answer: in-app editing.)
- Should the model persist user changes across sessions (localStorage), or reset on reload? (Answer: localStorage, with a "reset to defaults" button.)
- Should scenarios be additive (each shock applied independently) or compound (shocks compound on each other)? (Recommend: compound, since real downside scenarios involve multiple things going wrong at once.)
- Is the IPO valuation walk in scope? (Recommend: yes, as a Dashboard subsection.)


## Appendix B: Suggested Build Order

1. Calculation engine first, headless. Validate against hand-computed test cases for one month, three months, twelve months.
2. Dashboard view second, with hard-coded assumptions. This proves the calculation pipeline end to end.
3. Self-Serve Engine view, with editable assumptions. This proves the input → recompute → re-render loop.
4. Sales-Led Engine view, including the named pipeline editor.
5. Unit Economics view (mostly derived from existing calculations).
6. Scenarios & Sensitivity view (requires running calculations three times in parallel).
7. Validation checks and methodology footer.
8. Polish: formatting, color palette, responsive layout, loading states.


