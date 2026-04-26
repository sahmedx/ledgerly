/* Top-level revenue model simulation. Pure function. */

import type {
  Assumptions, Results, MonthlyResult, ResolvedDeal, ScenarioId,
} from './types';
import { MONTH_LABELS_REVENUE, ACTUALS_THROUGH } from './starting-state';
import { applyScenario } from './scenarios';
import { initSelfServeState, stepSelfServe } from './engine-self-serve';
import { initSalesLedState, stepSalesLed } from './engine-sales-led';
import { initBillingsState, computeBillings } from './engine-billings';
import { computeCosts } from './engine-costs';
import { computeKpisInPlace } from './engine-kpis';
import { buildQuarterly, buildAnnual } from './engine-rollups';
import { runValidations } from './validation';

const MONTHS = 24;
const ZERO_KPIS = {
  nrr_ttm: 0, grr_ttm: 0, magic_number: 0, burn_multiple: 0,
  rule_of_40: null as number | null,
  arr_yoy_growth: null as number | null,
  cac_payback_self_serve: 0, cac_payback_sales_led: 0,
  ltv_cac_self_serve: 0, ltv_cac_sales_led: 0,
  arpa_self_serve: 0, arpa_sales_led: 0, arpa_blended: 0, total_logos: 0,
};

export function simulate(assumptionsRaw: Assumptions, scenario: ScenarioId = 'base'): Results {
  const A = applyScenario(assumptionsRaw, scenario);

  const ss_state = initSelfServeState(A);
  const sl_state = initSalesLedState(A);
  const bill_state = initBillingsState();

  const monthly: MonthlyResult[] = [];

  for (let t = 1; t <= MONTHS; t++) {
    const ss = stepSelfServe(ss_state, t, A);
    const sl = stepSalesLed(sl_state, t, A, ss.graduated_arr);

    const ss_arr_total = ss.arr.plus + ss.arr.business_small;
    const sl_arr_total = sl.ending_arr.business_large + sl.ending_arr.enterprise;
    const total_arr = ss_arr_total + sl_arr_total;
    const total_mrr = total_arr / 12;

    const ss_revenue = ss.mrr.plus + ss.mrr.business_small;

    const billings = computeBillings(t, A, bill_state, {
      ss_state, sl_state, ss_revenue, sl_arr: sl_arr_total,
    });

    const { costs, headcount } = computeCosts(t, A, {
      total_revenue: billings.total_revenue,
      self_serve_revenue: ss_revenue,
      sales_led_revenue: billings.sl_revenue,
      business_small_arr: ss.arr.business_small,
      business_large_arr: sl.ending_arr.business_large,
      enterprise_arr: sl.ending_arr.enterprise,
      business_large_logos: sl.active_logos.business_large,
      enterprise_logos: sl.active_logos.enterprise,
      active_reps: sl.active_reps,
    });

    // AI-influenced ARR = Business (small + large) + Enterprise
    const ai_influenced_arr =
        ss.arr.business_small
      + sl.ending_arr.business_large
      + sl.ending_arr.enterprise;

    monthly.push({
      month_index: t,
      calendar_label: MONTH_LABELS_REVENUE[t - 1],
      is_actual: t <= ACTUALS_THROUGH,
      self_serve: ss,
      sales_led: sl,
      total: {
        arr: total_arr,
        mrr: total_mrr,
        revenue: billings.total_revenue,
        billings: billings.total_billings,
        deferred_revenue_balance: billings.deferred_revenue_balance,
        ai_influenced_arr,
        ai_influenced_pct: total_arr > 0 ? ai_influenced_arr / total_arr : 0,
      },
      costs,
      headcount,
      kpis: { ...ZERO_KPIS },
    });
  }

  // Post-pass KPIs
  computeKpisInPlace(monthly, A);

  // Pipeline resolution (for the Sales-Led view in 5c, but compute it here for completeness)
  const pipeline_resolved: ResolvedDeal[] = A.sales_led.named_pipeline.map(deal => {
    const prob = A.sales_led.stage_probability[deal.stage];
    const recognized = deal.expected_close_month < A.sales_led.pipeline_capacity_seam_month
      ? deal.expected_close_month
      : null;
    return {
      ...deal,
      weighted_arr: deal.acv * prob,
      recognized_in_month: recognized,
    };
  });

  // Period roll-ups for the P&L view
  const quarterly = buildQuarterly(monthly);
  const annual = buildAnnual(monthly);

  // Validations
  const validations = runValidations(monthly, A);

  const day0_total_arr =
      A.starting_state.self_serve_arr.plus
    + A.starting_state.self_serve_arr.business_small
    + A.starting_state.sales_led_arr.business_large
    + A.starting_state.sales_led_arr.enterprise;

  return {
    monthly,
    quarterly,
    annual,
    pipeline_resolved,
    validations,
    starting_arr: day0_total_arr,
    ending_arr: monthly[monthly.length - 1].total.arr,
  };
}
