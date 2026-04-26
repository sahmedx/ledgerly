/* Cost engine — S&M, R&D, G&A, CS, COGS, SBC, D&A per spec §3 + §6.3.
 *
 * Sub-line breakdown is exposed for the P&L view; aggregates recompose from sub-lines.
 * SBC is computed per function; D&A is a flat monthly placeholder added to G&A.
 * GAAP / non-GAAP / EBITDA / Adjusted EBITDA derived per spec §3.4-§3.5.
 * CS SBC follows the cs_in_cogs_pct split (locked decision #3): cash + SBC together
 * are split into COGS and opex portions.
 */

import type { Assumptions, MonthlyCosts, MonthlyHeadcount, HiringPlanEntry } from './types';

function cumulativeHires(plan: HiringPlanEntry[], starting: number, t: number): number {
  let count = starting;
  for (const entry of plan) if (entry.month <= t) count += entry.count;
  return count;
}

export interface CostsInput {
  total_revenue: number;
  self_serve_revenue: number;
  sales_led_revenue: number;
  business_small_arr: number;
  business_large_arr: number;
  enterprise_arr: number;
  business_large_logos: number;
  enterprise_logos: number;
  active_reps: number;
}

export function computeCosts(t: number, A: Assumptions, input: CostsInput): {
  costs: MonthlyCosts;
  headcount: MonthlyHeadcount;
} {
  const c = A.costs;
  const ss = c.sm;
  const sbc = c.sbc;

  // Headcount counts (round to whole people for display)
  const sales_reps = Math.round(input.active_reps);
  const sdrs       = Math.round(input.active_reps * ss.sdr_ratio);
  const ses        = Math.round(input.active_reps * ss.se_ratio);
  const sales_mgrs = Math.round(input.active_reps / ss.reps_per_manager);
  const marketing  = cumulativeHires(ss.marketing_hiring_plan, A.starting_state.marketing_headcount, t);
  const rd         = cumulativeHires(c.rd.hiring_plan, A.starting_state.rd_headcount, t);
  const ga         = cumulativeHires(c.ga.hiring_plan, A.starting_state.ga_headcount, t);

  // CS staffing — derived from logo counts
  const required_csms_raw =
      input.enterprise_logos     / c.cs.csm_per_enterprise_logos
    + input.business_large_logos / c.cs.csm_per_business_large_logos;
  const cs = Math.round(required_csms_raw);

  const total_headcount = sales_reps + sdrs + ses + sales_mgrs + marketing + rd + ga + cs;

  // ---------- S&M ----------
  const sm_cash_comp =
      sales_reps * ss.flc.rep / 12
    + sdrs       * ss.flc.sdr / 12
    + ses        * ss.flc.se / 12
    + sales_mgrs * ss.flc.manager / 12
    + marketing  * ss.flc.mktg / 12;
  const sm_sbc = sm_cash_comp * sbc.sm_sbc_pct;
  const sm_programs = input.total_revenue * ss.marketing_programs_pct_of_revenue;
  const sm_total = sm_cash_comp + sm_sbc + sm_programs;

  // ---------- R&D ----------
  const rd_cash_comp = rd * c.rd.flc_per_eng / 12;
  const rd_sbc = rd_cash_comp * sbc.rd_sbc_pct;
  const rd_tooling = input.total_revenue * c.rd.tooling_pct_of_revenue;
  const rd_total = rd_cash_comp + rd_sbc + rd_tooling;

  // ---------- G&A (D&A nests here per spec §3.3) ----------
  const ga_cash_comp = ga * c.ga.flc_per_ga / 12;
  const ga_sbc = ga_cash_comp * sbc.ga_sbc_pct;
  const ga_te = input.total_revenue * c.ga.te_pct_of_revenue;
  const da = c.da.monthly_da_amount;
  const ga_total = ga_cash_comp + ga_sbc + ga_te + da;

  // ---------- CS (split by cs_in_cogs_pct, applied to cash + SBC together) ----------
  const cs_cash_comp_full = cs * c.cs.flc_per_csm / 12;
  const cs_sbc_full = cs_cash_comp_full * sbc.cs_sbc_pct;
  const cs_total_with_sbc = cs_cash_comp_full + cs_sbc_full;
  const cogs_share = c.cs.cs_in_cogs_pct;
  const cs_in_cogs = cs_total_with_sbc * cogs_share;
  const cs_in_opex = cs_total_with_sbc * (1 - cogs_share);
  // Opex-side breakdown
  const cs_cash_comp = cs_cash_comp_full * (1 - cogs_share);
  const cs_sbc = cs_sbc_full * (1 - cogs_share);

  // ---------- Total SBC (full CS SBC, not just opex half — for non-GAAP add-back) ----------
  const total_sbc = rd_sbc + sm_sbc + ga_sbc + cs_sbc_full;

  // ---------- COGS sub-lines ----------
  const hosting = input.total_revenue * c.cogs.hosting_pct_of_revenue;
  const payment_processing_self_serve = input.self_serve_revenue * c.cogs.payment_processing_pct_self_serve;
  const payment_processing_sales_led = input.sales_led_revenue * c.cogs.payment_processing_pct_sales_led;
  // AI inference split by segment (direct attribution per spec §4):
  // business_small → self-serve; business_large + enterprise → sales-led
  const ai_pct = c.cogs.ai_inference_pct_of_business_enterprise_arr;
  const ai_inference_self_serve = (input.business_small_arr / 12) * ai_pct;
  const ai_inference_sales_led = ((input.business_large_arr + input.enterprise_arr) / 12) * ai_pct;
  const cogs_total =
      hosting
    + payment_processing_self_serve
    + payment_processing_sales_led
    + ai_inference_self_serve
    + ai_inference_sales_led
    + cs_in_cogs;

  // ---------- Aggregates ----------
  const gross_profit = input.total_revenue - cogs_total;
  const gross_margin_pct = input.total_revenue > 0 ? gross_profit / input.total_revenue : 0;

  const opex_total = sm_total + rd_total + ga_total + cs_in_opex;
  const operating_income_gaap = gross_profit - opex_total;
  const operating_margin_gaap_pct = input.total_revenue > 0 ? operating_income_gaap / input.total_revenue : 0;

  // Non-GAAP = GAAP + total SBC add-back
  const operating_income_non_gaap = operating_income_gaap + total_sbc;
  const operating_margin_non_gaap_pct = input.total_revenue > 0
    ? operating_income_non_gaap / input.total_revenue
    : 0;

  // EBITDA = GAAP operating income + D&A (still includes SBC as expense)
  const ebitda = operating_income_gaap + da;
  const ebitda_margin_pct = input.total_revenue > 0 ? ebitda / input.total_revenue : 0;

  // Adjusted EBITDA = EBITDA + SBC add-back
  const adjusted_ebitda = ebitda + total_sbc;
  const adjusted_ebitda_margin_pct = input.total_revenue > 0
    ? adjusted_ebitda / input.total_revenue
    : 0;

  // Back-compat: cs_total preserves the "full CS spend" semantic that existing call sites
  // (engine-kpis, validation) used. Older formula was cs_total - cs_cogs = cs_in_opex.
  const cs_total_full = cs_total_with_sbc;

  return {
    costs: {
      hosting,
      payment_processing_self_serve,
      payment_processing_sales_led,
      ai_inference_self_serve,
      ai_inference_sales_led,
      cs_in_cogs,
      cogs: cogs_total,

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
      cs_total: cs_total_full,

      total_sbc,

      opex_total,

      operating_income: operating_income_gaap,
      operating_margin_pct: operating_margin_gaap_pct,
      operating_income_gaap,
      operating_margin_gaap_pct,
      operating_income_non_gaap,
      operating_margin_non_gaap_pct,
      ebitda,
      ebitda_margin_pct,
      adjusted_ebitda,
      adjusted_ebitda_margin_pct,
    },
    headcount: {
      sales_reps,
      sdrs,
      ses,
      sales_mgrs,
      marketing,
      rd,
      ga,
      cs,
      total: total_headcount,
    },
  };
}
