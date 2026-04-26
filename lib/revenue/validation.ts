/* 6 reconciliation checks per spec §10. */

import type { Assumptions, MonthlyResult, ValidationResult } from './types';

export function runValidations(monthly: MonthlyResult[], A: Assumptions): ValidationResult[] {
  const results: ValidationResult[] = [];

  // 1. Sales-led ARR walk: ending = starting + new_total + expansion - contraction - churn
  const day0_sl =
      A.starting_state.sales_led_arr.business_large
    + A.starting_state.sales_led_arr.enterprise;
  let walk_ok = true;
  let max_drift = 0;
  for (let i = 0; i < monthly.length; i++) {
    const m = monthly[i];
    const sl_end = m.sales_led.ending_arr.business_large + m.sales_led.ending_arr.enterprise;
    const sl_start = i === 0
      ? day0_sl
      : monthly[i - 1].sales_led.ending_arr.business_large + monthly[i - 1].sales_led.ending_arr.enterprise;
    const expected = sl_start
      + m.sales_led.new_arr_named_pipeline
      + m.sales_led.new_arr_capacity
      + m.sales_led.new_arr_graduation
      + m.sales_led.expansion_arr
      - m.sales_led.contraction_arr
      - m.sales_led.churn_arr;
    const drift = Math.abs(sl_end - expected) / Math.max(1, Math.abs(sl_end));
    if (drift > 1e-6) walk_ok = false;
    max_drift = Math.max(max_drift, drift);
  }
  results.push({
    id: 'arr_walk',
    label: 'ARR walk reconciles',
    passed: walk_ok,
    detail: `Max drift: ${(max_drift * 100).toFixed(4)}%`,
  });

  // 2. Graduation neutrality
  let grad_outflow = 0;
  let grad_inflow = 0;
  for (const m of monthly) {
    grad_outflow += m.self_serve.graduated_arr;
    grad_inflow += m.sales_led.new_arr_graduation;
  }
  const grad_diff = Math.abs(grad_outflow - grad_inflow);
  const grad_ok = grad_diff < Math.max(1, 0.001 * Math.max(grad_outflow, grad_inflow));
  results.push({
    id: 'graduation_neutral',
    label: 'Graduation transfer ARR-neutral',
    passed: grad_ok,
    detail: `Outflow $${(grad_outflow / 1e6).toFixed(1)}M, inflow $${(grad_inflow / 1e6).toFixed(1)}M`,
  });

  // 3. Billings → Revenue + Δ Deferred Revenue
  let cum_billings = 0;
  let cum_revenue = 0;
  for (const m of monthly) {
    cum_billings += m.total.billings;
    cum_revenue  += m.total.revenue;
  }
  const ending_deferred = monthly[monthly.length - 1].total.deferred_revenue_balance;
  const tie_diff = cum_billings - (cum_revenue + ending_deferred);
  const tie_ok = Math.abs(tie_diff) / Math.max(1, cum_billings) < 1e-6;
  results.push({
    id: 'billings_revenue_tie',
    label: 'Cumulative billings = Revenue + Δ Deferred',
    passed: tie_ok,
    detail: `Δ = $${(tie_diff / 1e6).toFixed(3)}M`,
  });

  // 4. Headcount additivity
  let hc_ok = true;
  for (const m of monthly) {
    const sum = m.headcount.sales_reps + m.headcount.sdrs + m.headcount.ses + m.headcount.sales_mgrs
      + m.headcount.marketing + m.headcount.rd + m.headcount.ga + m.headcount.cs;
    if (sum !== m.headcount.total) {
      hc_ok = false;
      break;
    }
  }
  results.push({
    id: 'headcount_additive',
    label: 'Headcount components sum to total',
    passed: hc_ok,
    detail: hc_ok ? 'All 18 months tie' : 'Mismatch detected',
  });

  // 5. NRR ≥ GRR (only meaningful where both > 0)
  let nrr_ge_grr = true;
  for (const m of monthly) {
    if (m.kpis.nrr_ttm > 0 && m.kpis.grr_ttm > 0 && m.kpis.nrr_ttm < m.kpis.grr_ttm - 1e-9) {
      nrr_ge_grr = false;
      break;
    }
  }
  const lastNrr = monthly[monthly.length - 1].kpis.nrr_ttm;
  const lastGrr = monthly[monthly.length - 1].kpis.grr_ttm;
  results.push({
    id: 'nrr_ge_grr',
    label: 'NRR ≥ GRR in all months',
    passed: nrr_ge_grr,
    detail: `Latest: NRR ${(lastNrr * 100).toFixed(1)}% / GRR ${(lastGrr * 100).toFixed(1)}%`,
  });

  // 6. Rule of 40 plausibility — within [-50, 250]
  // (250 ceiling accommodates aggressive growth scenarios; spec §10 calls this a sanity check)
  let r40_ok = true;
  for (const m of monthly) {
    if (!Number.isFinite(m.kpis.rule_of_40)) { r40_ok = false; break; }
    if (m.kpis.rule_of_40 < -50 || m.kpis.rule_of_40 > 250) { r40_ok = false; break; }
  }
  results.push({
    id: 'rule_of_40_plausibility',
    label: 'Rule of 40 within plausible range',
    passed: r40_ok,
    detail: `Latest: ${monthly[monthly.length - 1].kpis.rule_of_40.toFixed(1)}`,
  });

  return results;
}
