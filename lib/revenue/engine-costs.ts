/* Cost engine — S&M, R&D, G&A, CS, COGS per spec §6.3. */

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

  // S&M
  const sm_comp =
      sales_reps * ss.flc.rep / 12
    + sdrs       * ss.flc.sdr / 12
    + ses        * ss.flc.se / 12
    + sales_mgrs * ss.flc.manager / 12
    + marketing  * ss.flc.mktg / 12;
  const sm_programs = input.total_revenue * ss.marketing_programs_pct_of_revenue;
  const sm_total = sm_comp + sm_programs;

  // R&D
  const rd_comp = rd * c.rd.flc_per_eng / 12;
  const rd_tooling = input.total_revenue * c.rd.tooling_pct_of_revenue;
  const rd_total = rd_comp + rd_tooling;

  // G&A
  const ga_comp = ga * c.ga.flc_per_ga / 12;
  const ga_te = input.total_revenue * c.ga.te_pct_of_revenue;
  const ga_total = ga_comp + ga_te;

  // CS
  const cs_total = cs * c.cs.flc_per_csm / 12;
  const cs_in_cogs = cs_total * c.cs.cs_in_cogs_pct;
  const cs_in_opex = cs_total - cs_in_cogs;

  // COGS
  const hosting = input.total_revenue * c.cogs.hosting_pct_of_revenue;
  const payment_ss = input.self_serve_revenue * c.cogs.payment_processing_pct_self_serve;
  const payment_sl = input.sales_led_revenue * c.cogs.payment_processing_pct_sales_led;
  const ai_arr_pool = input.business_small_arr + input.business_large_arr + input.enterprise_arr;
  const ai_inference = (ai_arr_pool / 12) * c.cogs.ai_inference_pct_of_business_enterprise_arr;
  const cogs_total = hosting + payment_ss + payment_sl + ai_inference + cs_in_cogs;

  const gross_profit = input.total_revenue - cogs_total;
  const gross_margin_pct = input.total_revenue > 0 ? gross_profit / input.total_revenue : 0;

  const opex_total = sm_total + rd_total + ga_total + cs_in_opex;
  const operating_income = gross_profit - opex_total;
  const operating_margin_pct = input.total_revenue > 0 ? operating_income / input.total_revenue : 0;

  return {
    costs: {
      cogs: cogs_total,
      gross_profit,
      gross_margin_pct,
      sm_total,
      rd_total,
      ga_total,
      cs_total,
      opex_total,
      operating_income,
      operating_margin_pct,
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
