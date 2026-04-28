/* FY2025 historical actuals — hand-built to be consistent with the FY26 plan
 * the engine produces from DEFAULT_ASSUMPTIONS. These are static "actuals" for
 * the P&L (and selected Revenue tab references); they do not flow into the
 * forward simulation.
 *
 * Anchors (from engine probe of base scenario):
 *   - FY26 starting (Day-0 Dec 25) ARR = $600M
 *   - FY26 total revenue = $810M, GM 74.4%, GAAP OM −23.4%
 *
 * FY25 design:
 *   - Dec 24 ARR ≈ $340M → Dec 25 ARR = $600M (+76% YoY)
 *   - FY25 revenue ≈ $475M (avg-ARR × 1.01, the same revenue/avg-ARR ratio FY26 hits)
 *   - Margin profile slightly worse than FY26 (less scale efficiency):
 *     GM 73.0%, S&M 33.0%, R&D 45.9%, G&A 26.1%, Adj EBITDA −2.1%
 *
 * Quarterly distribution: revenue ramps Q1<Q2<Q3<Q4 (22.3% / 24.0% / 26.1% / 27.6%
 * of FY25), matching how high-growth SaaS recognizes revenue against ARR ramp.
 * Monthly = quarterly / 3 for flows; ARR / headcount / NRR / GRR are end-of-month
 * snapshots interpolated linearly within each quarter.
 */

import type { PeriodResult } from './types';

const M = 1_000_000;

// ---------- Quarterly raw figures (in $M) ----------

interface QFigs {
  // Revenue
  rev: number;
  ss: number; ss_plus: number; ss_biz: number;
  sl: number; sl_bl: number; sl_ent: number;
  // COGS
  hosting: number; pp: number; ai: number; cs_cogs: number;
  // OpEx
  sm_cash: number; sm_sbc: number; sm_programs: number;
  rd_cash: number; rd_sbc: number; rd_tooling: number;
  ga_cash: number; ga_sbc: number; ga_te: number; da: number;
  cs_sbc_half: number;   // CS SBC routed through COGS
  // End-of-period snapshots
  ending_arr: number;
  headcount: number;
  nrr: number;
  grr: number;
}

const Q1: QFigs = {
  rev: 106, ss: 61, ss_plus: 26, ss_biz: 35,
  sl: 45, sl_bl: 20, sl_ent: 25,
  hosting: 8.5, pp: 2.2, ai: 12.7, cs_cogs: 5.5,
  sm_cash: 13, sm_sbc: 5.0, sm_programs: 17,
  rd_cash: 28, rd_sbc: 18, rd_tooling: 3.5,
  ga_cash: 10, ga_sbc: 5.0, ga_te: 9.5, da: 2.8,
  cs_sbc_half: 1.0,
  ending_arr: 400, headcount: 950, nrr: 1.19, grr: 0.90,
};

const Q2: QFigs = {
  rev: 114, ss: 66, ss_plus: 28, ss_biz: 38,
  sl: 48, sl_bl: 22, sl_ent: 26,
  hosting: 9.1, pp: 2.4, ai: 13.7, cs_cogs: 5.7,
  sm_cash: 14, sm_sbc: 5.5, sm_programs: 18,
  rd_cash: 30, rd_sbc: 19, rd_tooling: 4.0,
  ga_cash: 11, ga_sbc: 6.0, ga_te: 10.0, da: 2.9,
  cs_sbc_half: 1.0,
  ending_arr: 460, headcount: 1010, nrr: 1.19, grr: 0.90,
};

const Q3: QFigs = {
  rev: 124, ss: 72, ss_plus: 30, ss_biz: 42,
  sl: 52, sl_bl: 23, sl_ent: 29,
  hosting: 9.9, pp: 2.6, ai: 14.9, cs_cogs: 5.9,
  sm_cash: 15, sm_sbc: 5.5, sm_programs: 20,
  rd_cash: 31, rd_sbc: 21, rd_tooling: 4.0,
  ga_cash: 12, ga_sbc: 6.0, ga_te: 11.0, da: 3.0,
  cs_sbc_half: 1.0,
  ending_arr: 525, headcount: 1060, nrr: 1.19, grr: 0.89,
};

const Q4: QFigs = {
  rev: 131, ss: 76, ss_plus: 31, ss_biz: 45,
  sl: 55, sl_bl: 25, sl_ent: 30,
  hosting: 10.5, pp: 2.8, ai: 15.7, cs_cogs: 5.9,
  sm_cash: 16, sm_sbc: 6.0, sm_programs: 22,
  rd_cash: 33, rd_sbc: 22, rd_tooling: 4.5,
  ga_cash: 13, ga_sbc: 7.0, ga_te: 11.5, da: 3.3,
  cs_sbc_half: 1.0,
  ending_arr: 600, headcount: 1100, nrr: 1.18, grr: 0.89,
};

const QUARTERS: QFigs[] = [Q1, Q2, Q3, Q4];

// ---------- Builder: QFigs → PeriodResult ----------

function periodFromFigs(
  label: string,
  start_month: number,
  end_month: number,
  q: QFigs,
  scale: number,    // 1.0 for quarter, 1/3 for month, 4 for annual… computed via summed Qs not scaled
  arr_yoy_growth: number | null,
  rule_of_40: number | null,
): PeriodResult {
  const total_revenue           = q.rev * scale * M;
  const self_serve_revenue      = q.ss * scale * M;
  const self_serve_revenue_plus = q.ss_plus * scale * M;
  const self_serve_revenue_business_small = q.ss_biz * scale * M;
  const sales_led_revenue       = q.sl * scale * M;
  const sales_led_revenue_business_large  = q.sl_bl * scale * M;
  const sales_led_revenue_enterprise      = q.sl_ent * scale * M;

  const hosting   = q.hosting * scale * M;
  const pp_total  = q.pp * scale * M;
  const ai_total  = q.ai * scale * M;
  const cs_in_cogs = q.cs_cogs * scale * M;
  const cogs = hosting + pp_total + ai_total + cs_in_cogs;

  const gross_profit = total_revenue - cogs;
  const gross_margin_pct = total_revenue > 0 ? gross_profit / total_revenue : 0;

  const sm_cash_comp = q.sm_cash * scale * M;
  const sm_sbc       = q.sm_sbc * scale * M;
  const sm_programs  = q.sm_programs * scale * M;
  const sm_total     = sm_cash_comp + sm_sbc + sm_programs;

  const rd_cash_comp = q.rd_cash * scale * M;
  const rd_sbc       = q.rd_sbc * scale * M;
  const rd_tooling   = q.rd_tooling * scale * M;
  const rd_total     = rd_cash_comp + rd_sbc + rd_tooling;

  const ga_cash_comp = q.ga_cash * scale * M;
  const ga_sbc       = q.ga_sbc * scale * M;
  const ga_te        = q.ga_te * scale * M;
  const da           = q.da * scale * M;
  const ga_total     = ga_cash_comp + ga_sbc + ga_te + da;

  const cs_sbc_half = q.cs_sbc_half * scale * M;
  const total_sbc   = sm_sbc + rd_sbc + ga_sbc + cs_sbc_half;
  const opex_total  = sm_total + rd_total + ga_total;

  const operating_income_gaap = gross_profit - opex_total;
  const operating_margin_gaap_pct = total_revenue > 0 ? operating_income_gaap / total_revenue : 0;
  const operating_income_non_gaap = operating_income_gaap + total_sbc;
  const operating_margin_non_gaap_pct = total_revenue > 0 ? operating_income_non_gaap / total_revenue : 0;
  const ebitda = operating_income_gaap + da;
  const ebitda_margin_pct = total_revenue > 0 ? ebitda / total_revenue : 0;
  const adjusted_ebitda = ebitda + total_sbc;
  const adjusted_ebitda_margin_pct = total_revenue > 0 ? adjusted_ebitda / total_revenue : 0;

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
    payment_processing_self_serve: pp_total * 0.62,   // mix mirrors FY26 (~62/38 SS/SL)
    payment_processing_sales_led:  pp_total * 0.38,
    ai_inference_self_serve:       ai_total * 0.55,
    ai_inference_sales_led:        ai_total * 0.45,
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
    cs_cash_comp: 0,
    cs_sbc: 0,
    cs_in_opex: 0,
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
    ending_arr: q.ending_arr * M,
    ending_total_headcount: q.headcount,
    ending_nrr_ttm: q.nrr,
    ending_grr_ttm: q.grr,
    arr_yoy_growth,
    rule_of_40,
  };
}

// ---------- Quarterly: 4 PeriodResults ----------

const QLABEL = ["Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25"];

export const FY25_QUARTERLY: PeriodResult[] = QUARTERS.map((q, i) =>
  periodFromFigs(QLABEL[i], -11 + i * 3, -9 + i * 3, q, 1, null, null),
);

// ---------- Monthly: 12 PeriodResults (each = quarter / 3, with snapshot interp) ----------

const MONTH_LABEL_25 = [
  'Jan 25', 'Feb 25', 'Mar 25',
  'Apr 25', 'May 25', 'Jun 25',
  'Jul 25', 'Aug 25', 'Sep 25',
  'Oct 25', 'Nov 25', 'Dec 25',
];

// ARR rises smoothly across each quarter — interpolate using prior quarter's
// ending ARR as the start of the next.
const ARR_START = 340;   // Dec 24
const HC_START = 870;    // implied Dec 24 headcount (1100 EOQ4 − Q4 add)

function interp(start: number, end: number, fraction: number): number {
  return start + (end - start) * fraction;
}

export const FY25_MONTHLY: PeriodResult[] = (() => {
  const out: PeriodResult[] = [];
  for (let qi = 0; qi < 4; qi++) {
    const q = QUARTERS[qi];
    const prevArr  = qi === 0 ? ARR_START : QUARTERS[qi - 1].ending_arr;
    const prevHc   = qi === 0 ? HC_START  : QUARTERS[qi - 1].headcount;
    const prevNrr  = qi === 0 ? q.nrr     : QUARTERS[qi - 1].nrr;
    const prevGrr  = qi === 0 ? q.grr     : QUARTERS[qi - 1].grr;

    for (let mi = 0; mi < 3; mi++) {
      const monthIdx = qi * 3 + mi;
      const fraction = (mi + 1) / 3;
      const interpQ: QFigs = {
        ...q,
        ending_arr: interp(prevArr, q.ending_arr, fraction),
        headcount:  Math.round(interp(prevHc, q.headcount, fraction)),
        nrr:        interp(prevNrr, q.nrr, fraction),
        grr:        interp(prevGrr, q.grr, fraction),
      };
      out.push(periodFromFigs(
        MONTH_LABEL_25[monthIdx],
        -11 + monthIdx,
        -11 + monthIdx,
        interpQ,
        1 / 3,
        null,
        null,
      ));
    }
  }
  return out;
})();

// ---------- Annual: sum of quarters ----------

export const FY25_ANNUAL: PeriodResult = (() => {
  // Sum quarterly figures into an annual QFigs, then build with scale=1.
  const sum: QFigs = {
    rev: 0, ss: 0, ss_plus: 0, ss_biz: 0, sl: 0, sl_bl: 0, sl_ent: 0,
    hosting: 0, pp: 0, ai: 0, cs_cogs: 0,
    sm_cash: 0, sm_sbc: 0, sm_programs: 0,
    rd_cash: 0, rd_sbc: 0, rd_tooling: 0,
    ga_cash: 0, ga_sbc: 0, ga_te: 0, da: 0,
    cs_sbc_half: 0,
    ending_arr: Q4.ending_arr,
    headcount: Q4.headcount,
    nrr: Q4.nrr,
    grr: Q4.grr,
  };
  const flowKeys: (keyof QFigs)[] = [
    'rev', 'ss', 'ss_plus', 'ss_biz', 'sl', 'sl_bl', 'sl_ent',
    'hosting', 'pp', 'ai', 'cs_cogs',
    'sm_cash', 'sm_sbc', 'sm_programs',
    'rd_cash', 'rd_sbc', 'rd_tooling',
    'ga_cash', 'ga_sbc', 'ga_te', 'da',
    'cs_sbc_half',
  ];
  for (const q of QUARTERS) {
    for (const k of flowKeys) (sum as unknown as Record<string, number>)[k] += q[k];
  }
  // ARR YoY for FY25 vs Dec 24 day-0 ARR
  const arr_yoy = (Q4.ending_arr - ARR_START) / ARR_START;
  // Rule of 40: ARR YoY + Non-GAAP OM (computed here for tooltip-display)
  const fy25_revenue_M = sum.rev;
  const sm_total_M  = sum.sm_cash + sum.sm_sbc + sum.sm_programs;
  const rd_total_M  = sum.rd_cash + sum.rd_sbc + sum.rd_tooling;
  const ga_total_M  = sum.ga_cash + sum.ga_sbc + sum.ga_te + sum.da;
  const opex_M      = sm_total_M + rd_total_M + ga_total_M;
  const cogs_M      = sum.hosting + sum.pp + sum.ai + sum.cs_cogs;
  const gp_M        = fy25_revenue_M - cogs_M;
  const opi_gaap_M  = gp_M - opex_M;
  const total_sbc_M = sum.sm_sbc + sum.rd_sbc + sum.ga_sbc + sum.cs_sbc_half;
  const opi_ng_M    = opi_gaap_M + total_sbc_M;
  const opi_ng_pct  = opi_ng_M / fy25_revenue_M;
  const rule_40     = arr_yoy + opi_ng_pct;

  return periodFromFigs('FY 2025', -11, 0, sum, 1, arr_yoy, rule_40);
})();

// ---------- Convenience exports ----------

/** End-of-FY25 ARR (Dec 25) — matches engine starting state. */
export const FY25_ENDING_ARR = Q4.ending_arr * M;

/** End-of-FY24 ARR (Dec 24) — synthesized for ARR YoY / trend chart prior point. */
export const FY24_ENDING_ARR = ARR_START * M;
