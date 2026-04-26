/* Cost allocation between self-serve and sales-led per spec §4.
 *
 * Order: ALLOCATE PER-MONTH FIRST, then roll up by segment. Spec locked-decision:
 * never roll up the consolidated period, then split — self_serve_share[t] shifts
 * across the 24-month horizon as sales-led ramps, so period-first allocation yields
 * different (wrong) answers.
 *
 * Allocation rules (spec §4):
 *   Hosting                       — pro rata to revenue
 *   Payment processing (SS)       — 100% self-serve
 *   Payment processing (SL)       — 100% sales-led
 *   AI inference                  — direct: business_small → SS, business_large+ent → SL
 *   CS in COGS                    — pro rata to logos/workspaces (weighted by ARR)
 *   S&M sales comp (reps/SDR/SE/mgr) — 100% sales-led
 *   S&M marketing comp + SBC + programs — configurable split (default 70% SS / 30% SL)
 *   R&D cash + SBC + tooling      — configurable split (default 60% SS / 40% SL)
 *   G&A cash + SBC + T&E + D&A    — pro rata to revenue
 *   CS in opex                    — pro rata to logos/workspaces (weighted by ARR)
 */

import type { Assumptions, MonthlyResult, PeriodResult } from './types';

export type SegmentId = 'self_serve' | 'sales_led';

/** Sub-line dollar values allocated to one segment for one month. */
export interface AllocatedMonth {
  // Revenue
  self_serve_revenue_plus: number;
  self_serve_revenue_business_small: number;
  sales_led_revenue_business_large: number;
  sales_led_revenue_enterprise: number;

  // COGS sub-lines
  hosting: number;
  payment_processing_self_serve: number;
  payment_processing_sales_led: number;
  ai_inference_self_serve: number;
  ai_inference_sales_led: number;
  cs_in_cogs: number;
  cogs: number;

  // Opex sub-lines
  sm_sales_comp: number;          // 100% to sales-led when allocated
  sm_marketing_comp: number;      // configurable split
  sm_cash_comp: number;           // = sales + marketing
  sm_sbc: number;                 // = sales-comp SBC + marketing-comp SBC
  sm_sbc_sales: number;           // sales-side SBC (100% to sales-led)
  sm_sbc_marketing: number;       // marketing-side SBC (configurable split)
  sm_programs: number;            // configurable split
  sm_total: number;

  rd_cash_comp: number;
  rd_sbc: number;
  rd_tooling: number;
  rd_total: number;

  ga_cash_comp: number;
  ga_sbc: number;
  ga_te: number;
  da: number;
  ga_total: number;

  cs_cash_comp: number;
  cs_sbc: number;
  cs_in_opex: number;

  total_sbc: number;
  opex_total: number;
}

export interface AllocatedSegments {
  self_serve: AllocatedMonth[];   // length 24
  sales_led: AllocatedMonth[];    // length 24
}

/** Split S&M cash comp into "sales" (reps/SDRs/SEs/mgrs) and "marketing" (mktg headcount).
 *  Mirrors the formula in engine-costs.ts. */
function splitSmCashComp(m: MonthlyResult, A: Assumptions): { sales: number; marketing: number } {
  const flc = A.costs.sm.flc;
  const hc = m.headcount;
  const sales =
      hc.sales_reps * flc.rep / 12
    + hc.sdrs       * flc.sdr / 12
    + hc.ses        * flc.se / 12
    + hc.sales_mgrs * flc.manager / 12;
  const marketing = hc.marketing * flc.mktg / 12;
  return { sales, marketing };
}

/** Self-serve share of total revenue for the month. Used for pro-rata allocation. */
function selfServeRevenueShare(m: MonthlyResult): number {
  const ss_rev = m.self_serve.mrr.plus + m.self_serve.mrr.business_small;
  const total_rev = m.total.revenue;
  return total_rev > 0 ? ss_rev / total_rev : 0.5;
}

/** Self-serve share of "logo-weight" (workspaces + logos, weighted by ARR).
 *  Used for CS allocation. Heavily skewed sales-led in practice because sales-led
 *  ARR is concentrated across far fewer logos than self-serve workspaces. */
function selfServeLogoWeightShare(m: MonthlyResult): number {
  const ss_arr = m.self_serve.arr.plus + m.self_serve.arr.business_small;
  const sl_arr = m.sales_led.ending_arr.business_large + m.sales_led.ending_arr.enterprise;
  const total = ss_arr + sl_arr;
  return total > 0 ? ss_arr / total : 0.5;
}

export function allocateMonthly(monthly: MonthlyResult[], A: Assumptions): AllocatedSegments {
  const ss_pct = A.costs.allocation.marketing_self_serve_pct;
  const rd_ss_pct = A.costs.allocation.rd_self_serve_pct;
  const cs_in_cogs_pct = A.costs.cs.cs_in_cogs_pct;

  const self_serve: AllocatedMonth[] = [];
  const sales_led: AllocatedMonth[] = [];

  for (const m of monthly) {
    const c = m.costs;
    const rev_ss = selfServeRevenueShare(m);
    const rev_sl = 1 - rev_ss;
    const cs_ss = selfServeLogoWeightShare(m);
    const cs_sl = 1 - cs_ss;

    // Recover full CS SBC from the bundled (cash + SBC) total. cs_total_with_sbc =
    // cs_in_cogs + cs_in_opex, and cs_sbc_full / cs_total_with_sbc = sbc_pct / (1 + sbc_pct).
    // This works at any cs_in_cogs_pct including 1.0 (full COGS).
    const cs_total_with_sbc = c.cs_in_cogs + c.cs_in_opex;
    const cs_sbc_pct_factor = A.costs.sbc.cs_sbc_pct / (1 + A.costs.sbc.cs_sbc_pct);
    const cs_sbc_full = cs_total_with_sbc * cs_sbc_pct_factor;
    const cs_sbc_cogs_half = cs_sbc_full * cs_in_cogs_pct;

    const sm_split = splitSmCashComp(m, A);
    // SBC on the sales side vs. marketing side, distributed in proportion to cash comp.
    const sm_cash_total = sm_split.sales + sm_split.marketing;
    const sm_sbc_sales_total =
      sm_cash_total > 0 ? c.sm_sbc * (sm_split.sales / sm_cash_total) : 0;
    const sm_sbc_mktg_total = c.sm_sbc - sm_sbc_sales_total;

    // CS SBC carried in COGS, distributed by the same logo-weight share used for cs_in_cogs
    const cs_sbc_cogs_share_ss = cs_sbc_cogs_half * cs_ss;
    const cs_sbc_cogs_share_sl = cs_sbc_cogs_half * cs_sl;

    // ----- Self-serve allocation -----
    const ss = buildAlloc({
      // Revenue
      ss_rev_plus: m.self_serve.mrr.plus,
      ss_rev_business_small: m.self_serve.mrr.business_small,
      sl_rev_bl: 0,
      sl_rev_ent: 0,

      // COGS
      hosting: c.hosting * rev_ss,
      pp_ss: c.payment_processing_self_serve,
      pp_sl: 0,
      ai_ss: c.ai_inference_self_serve,
      ai_sl: 0,
      cs_in_cogs: c.cs_in_cogs * cs_ss,

      // S&M
      sm_sales_comp: 0,                              // 100% sales-led
      sm_marketing_comp: sm_split.marketing * ss_pct,
      sm_sbc_sales: 0,
      sm_sbc_marketing: sm_sbc_mktg_total * ss_pct,
      sm_programs: c.sm_programs * ss_pct,

      // R&D
      rd_cash: c.rd_cash_comp * rd_ss_pct,
      rd_sbc: c.rd_sbc * rd_ss_pct,
      rd_tooling: c.rd_tooling * rd_ss_pct,

      // G&A — pro rata to revenue
      ga_cash: c.ga_cash_comp * rev_ss,
      ga_sbc: c.ga_sbc * rev_ss,
      ga_te: c.ga_te * rev_ss,
      da: c.da * rev_ss,

      // CS opex — pro rata to logo weight
      cs_cash: c.cs_cash_comp * cs_ss,
      cs_sbc_opex: c.cs_sbc * cs_ss,
      cs_sbc_cogs_half: cs_sbc_cogs_share_ss,
    });

    // ----- Sales-led allocation -----
    const sl = buildAlloc({
      ss_rev_plus: 0,
      ss_rev_business_small: 0,
      sl_rev_bl: m.sales_led.ending_arr.business_large / 12,
      sl_rev_ent: m.sales_led.ending_arr.enterprise / 12,

      hosting: c.hosting * rev_sl,
      pp_ss: 0,
      pp_sl: c.payment_processing_sales_led,
      ai_ss: 0,
      ai_sl: c.ai_inference_sales_led,
      cs_in_cogs: c.cs_in_cogs * cs_sl,

      sm_sales_comp: sm_split.sales,                 // 100% sales-led
      sm_marketing_comp: sm_split.marketing * (1 - ss_pct),
      sm_sbc_sales: sm_sbc_sales_total,
      sm_sbc_marketing: sm_sbc_mktg_total * (1 - ss_pct),
      sm_programs: c.sm_programs * (1 - ss_pct),

      rd_cash: c.rd_cash_comp * (1 - rd_ss_pct),
      rd_sbc: c.rd_sbc * (1 - rd_ss_pct),
      rd_tooling: c.rd_tooling * (1 - rd_ss_pct),

      ga_cash: c.ga_cash_comp * rev_sl,
      ga_sbc: c.ga_sbc * rev_sl,
      ga_te: c.ga_te * rev_sl,
      da: c.da * rev_sl,

      cs_cash: c.cs_cash_comp * cs_sl,
      cs_sbc_opex: c.cs_sbc * cs_sl,
      cs_sbc_cogs_half: cs_sbc_cogs_share_sl,
    });

    self_serve.push(ss);
    sales_led.push(sl);
  }

  return { self_serve, sales_led };
}

interface AllocInputs {
  ss_rev_plus: number; ss_rev_business_small: number;
  sl_rev_bl: number; sl_rev_ent: number;
  hosting: number; pp_ss: number; pp_sl: number;
  ai_ss: number; ai_sl: number; cs_in_cogs: number;
  sm_sales_comp: number; sm_marketing_comp: number;
  sm_sbc_sales: number; sm_sbc_marketing: number;
  sm_programs: number;
  rd_cash: number; rd_sbc: number; rd_tooling: number;
  ga_cash: number; ga_sbc: number; ga_te: number; da: number;
  cs_cash: number; cs_sbc_opex: number;
  /** CS SBC bundled inside cs_in_cogs for this segment. Excluded from opex line items
   *  but counted in total_sbc so segment non-GAAP add-back reconciles to consolidated. */
  cs_sbc_cogs_half: number;
}

function buildAlloc(x: AllocInputs): AllocatedMonth {
  const cogs =
      x.hosting + x.pp_ss + x.pp_sl + x.ai_ss + x.ai_sl + x.cs_in_cogs;
  const sm_cash = x.sm_sales_comp + x.sm_marketing_comp;
  const sm_sbc_total = x.sm_sbc_sales + x.sm_sbc_marketing;
  const sm_total = sm_cash + sm_sbc_total + x.sm_programs;
  const rd_total = x.rd_cash + x.rd_sbc + x.rd_tooling;
  const ga_total = x.ga_cash + x.ga_sbc + x.ga_te + x.da;
  const cs_in_opex = x.cs_cash + x.cs_sbc_opex;
  const opex_total = sm_total + rd_total + ga_total + cs_in_opex;
  // total_sbc per segment = full SBC attributable to this segment, including CS SBC
  // bundled in cs_in_cogs (carried in via cs_sbc_cogs_half so segment-level non-GAAP
  // add-back reconciles to consolidated total_sbc within tolerance).
  const total_sbc =
      x.sm_sbc_sales + x.sm_sbc_marketing
    + x.rd_sbc
    + x.ga_sbc
    + x.cs_sbc_opex
    + x.cs_sbc_cogs_half;

  return {
    self_serve_revenue_plus: x.ss_rev_plus,
    self_serve_revenue_business_small: x.ss_rev_business_small,
    sales_led_revenue_business_large: x.sl_rev_bl,
    sales_led_revenue_enterprise: x.sl_rev_ent,

    hosting: x.hosting,
    payment_processing_self_serve: x.pp_ss,
    payment_processing_sales_led: x.pp_sl,
    ai_inference_self_serve: x.ai_ss,
    ai_inference_sales_led: x.ai_sl,
    cs_in_cogs: x.cs_in_cogs,
    cogs,

    sm_sales_comp: x.sm_sales_comp,
    sm_marketing_comp: x.sm_marketing_comp,
    sm_cash_comp: sm_cash,
    sm_sbc: sm_sbc_total,
    sm_sbc_sales: x.sm_sbc_sales,
    sm_sbc_marketing: x.sm_sbc_marketing,
    sm_programs: x.sm_programs,
    sm_total,

    rd_cash_comp: x.rd_cash,
    rd_sbc: x.rd_sbc,
    rd_tooling: x.rd_tooling,
    rd_total,

    ga_cash_comp: x.ga_cash,
    ga_sbc: x.ga_sbc,
    ga_te: x.ga_te,
    da: x.da,
    ga_total,

    cs_cash_comp: x.cs_cash,
    cs_sbc: x.cs_sbc_opex,
    cs_in_opex,

    total_sbc,
    opex_total,
  };
}

/** Period boundaries identical to engine-rollups so consolidated and segment
 *  reconcile at month, quarter, and annual grain. */
const QUARTERS: Array<{ label: string; start: number; end: number }> = [
  { label: "Q1 '26", start: 1,  end: 3  },
  { label: "Q2 '26", start: 4,  end: 6  },
  { label: "Q3 '26", start: 7,  end: 9  },
  { label: "Q4 '26", start: 10, end: 12 },
  { label: "Q1 '27", start: 13, end: 15 },
  { label: "Q2 '27", start: 16, end: 18 },
  { label: "Q3 '27", start: 19, end: 21 },
  { label: "Q4 '27", start: 22, end: 24 },
];

const ANNUALS: Array<{ label: string; start: number; end: number }> = [
  { label: 'FY 2026', start: 1,  end: 12 },
  { label: 'FY 2027', start: 13, end: 24 },
];

function rollupSegmentPeriod(
  monthly: MonthlyResult[],
  alloc: AllocatedMonth[],
  label: string,
  start_month: number,
  end_month: number,
): PeriodResult {
  const slice = alloc.slice(start_month - 1, end_month);
  const last = monthly[end_month - 1];

  const sum = (k: keyof AllocatedMonth) => slice.reduce((s, a) => s + (a[k] as number), 0);

  const self_serve_revenue_plus = sum('self_serve_revenue_plus');
  const self_serve_revenue_business_small = sum('self_serve_revenue_business_small');
  const sales_led_revenue_business_large = sum('sales_led_revenue_business_large');
  const sales_led_revenue_enterprise = sum('sales_led_revenue_enterprise');
  const self_serve_revenue = self_serve_revenue_plus + self_serve_revenue_business_small;
  const sales_led_revenue = sales_led_revenue_business_large + sales_led_revenue_enterprise;
  const total_revenue = self_serve_revenue + sales_led_revenue;

  const hosting = sum('hosting');
  const payment_processing_self_serve = sum('payment_processing_self_serve');
  const payment_processing_sales_led = sum('payment_processing_sales_led');
  const ai_inference_self_serve = sum('ai_inference_self_serve');
  const ai_inference_sales_led = sum('ai_inference_sales_led');
  const cs_in_cogs = sum('cs_in_cogs');
  const cogs = sum('cogs');

  const sm_cash_comp = sum('sm_cash_comp');
  const sm_sbc = sum('sm_sbc');
  const sm_programs = sum('sm_programs');
  const sm_total = sum('sm_total');
  const rd_cash_comp = sum('rd_cash_comp');
  const rd_sbc = sum('rd_sbc');
  const rd_tooling = sum('rd_tooling');
  const rd_total = sum('rd_total');
  const ga_cash_comp = sum('ga_cash_comp');
  const ga_sbc = sum('ga_sbc');
  const ga_te = sum('ga_te');
  const da = sum('da');
  const ga_total = sum('ga_total');
  const cs_cash_comp = sum('cs_cash_comp');
  const cs_sbc = sum('cs_sbc');
  const cs_in_opex = sum('cs_in_opex');
  const total_sbc = sum('total_sbc');
  const opex_total = sum('opex_total');

  const gross_profit = total_revenue - cogs;
  const gross_margin_pct = total_revenue > 0 ? gross_profit / total_revenue : 0;
  const operating_income_gaap = gross_profit - opex_total;
  const operating_margin_gaap_pct = total_revenue > 0 ? operating_income_gaap / total_revenue : 0;
  const operating_income_non_gaap = operating_income_gaap + total_sbc;
  const operating_margin_non_gaap_pct = total_revenue > 0 ? operating_income_non_gaap / total_revenue : 0;
  const ebitda = operating_income_gaap + da;
  const ebitda_margin_pct = total_revenue > 0 ? ebitda / total_revenue : 0;
  const adjusted_ebitda = ebitda + total_sbc;
  const adjusted_ebitda_margin_pct = total_revenue > 0 ? adjusted_ebitda / total_revenue : 0;

  // Segment-specific period-end ARR
  const ending_arr_segment = isSelfServe(slice)
    ? last.self_serve.arr.plus + last.self_serve.arr.business_small
    : last.sales_led.ending_arr.business_large + last.sales_led.ending_arr.enterprise;

  return {
    label,
    start_month,
    end_month,

    self_serve_revenue,
    self_serve_revenue_plus,
    self_serve_revenue_business_small,
    sales_led_revenue,
    sales_led_revenue_business_large,
    sales_led_revenue_enterprise,
    total_revenue,

    hosting,
    payment_processing_self_serve,
    payment_processing_sales_led,
    ai_inference_self_serve,
    ai_inference_sales_led,
    cs_in_cogs,
    cogs,

    gross_profit,
    gross_margin_pct,

    sm_cash_comp,
    sm_sbc,
    sm_programs,
    sm_total,
    rd_cash_comp,
    rd_sbc,
    rd_tooling,
    rd_total,
    ga_cash_comp,
    ga_sbc,
    ga_te,
    da,
    ga_total,
    cs_cash_comp,
    cs_sbc,
    cs_in_opex,
    total_sbc,
    opex_total,

    operating_income_gaap,
    operating_margin_gaap_pct,
    operating_income_non_gaap,
    operating_margin_non_gaap_pct,
    ebitda,
    ebitda_margin_pct,
    adjusted_ebitda,
    adjusted_ebitda_margin_pct,

    ending_arr: ending_arr_segment,
    ending_total_headcount: last.headcount.total,
    ending_nrr_ttm: last.kpis.nrr_ttm,
    ending_grr_ttm: last.kpis.grr_ttm,
    arr_yoy_growth: last.kpis.arr_yoy_growth,
    rule_of_40: last.kpis.rule_of_40,
  };
}

function isSelfServe(slice: AllocatedMonth[]): boolean {
  // Self-serve has zero sales-led revenue components; sales-led has zero self-serve revenue.
  // Use this as a sentinel — cheap and deterministic.
  return slice.length > 0 && slice[0].sales_led_revenue_business_large === 0
    && slice[0].sales_led_revenue_enterprise === 0;
}

export interface SegmentRollups {
  monthly: AllocatedMonth[];
  quarterly: PeriodResult[];
  annual: PeriodResult[];
}

export interface SegmentResults {
  self_serve: SegmentRollups;
  sales_led: SegmentRollups;
}

export function buildSegmentResults(monthly: MonthlyResult[], A: Assumptions): SegmentResults {
  const alloc = allocateMonthly(monthly, A);

  const ss_quarterly = QUARTERS.map(q => rollupSegmentPeriod(monthly, alloc.self_serve, q.label, q.start, q.end));
  const ss_annual    = ANNUALS.map(a  => rollupSegmentPeriod(monthly, alloc.self_serve, a.label, a.start, a.end));
  const sl_quarterly = QUARTERS.map(q => rollupSegmentPeriod(monthly, alloc.sales_led,  q.label, q.start, q.end));
  const sl_annual    = ANNUALS.map(a  => rollupSegmentPeriod(monthly, alloc.sales_led,  a.label, a.start, a.end));

  return {
    self_serve: { monthly: alloc.self_serve, quarterly: ss_quarterly, annual: ss_annual },
    sales_led:  { monthly: alloc.sales_led,  quarterly: sl_quarterly, annual: sl_annual  },
  };
}
