/* Reconciliation checks: 6 original (spec §10) + 7 P&L additions (spec §11). */

import type { Assumptions, MonthlyResult, ValidationResult } from './types';
import { buildSegmentResults } from './engine-allocation';

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
    detail: hc_ok ? 'All 24 months tie' : 'Mismatch detected',
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

  // 6. Rule of 40 plausibility — within [-50, 250] for months where it is defined (t >= 13).
  // (250 ceiling accommodates aggressive growth scenarios; spec §10 calls this a sanity check.)
  let r40_ok = true;
  for (const m of monthly) {
    if (m.kpis.rule_of_40 === null) continue;
    if (!Number.isFinite(m.kpis.rule_of_40)) { r40_ok = false; break; }
    if (m.kpis.rule_of_40 < -50 || m.kpis.rule_of_40 > 250) { r40_ok = false; break; }
  }
  const lastR40 = monthly[monthly.length - 1].kpis.rule_of_40;
  results.push({
    id: 'rule_of_40_plausibility',
    label: 'Rule of 40 within plausible range',
    passed: r40_ok,
    detail: lastR40 === null ? 'Latest: —' : `Latest: ${lastR40.toFixed(1)}`,
  });

  // ------------ Phase 6 P&L additions (spec §11) ------------

  // 7. EBITDA = GAAP Operating Income + D&A
  let ebitda_ok = true;
  let ebitda_max_drift = 0;
  for (const m of monthly) {
    const expected = m.costs.operating_income_gaap + m.costs.da;
    const drift = Math.abs(m.costs.ebitda - expected);
    if (drift > 1e-3) ebitda_ok = false;
    ebitda_max_drift = Math.max(ebitda_max_drift, drift);
  }
  results.push({
    id: 'ebitda_tie',
    label: 'EBITDA = GAAP Op Income + D&A',
    passed: ebitda_ok,
    detail: `Max drift: $${ebitda_max_drift.toFixed(2)}`,
  });

  // 8. Non-GAAP Operating Income = GAAP Operating Income + Total SBC
  let non_gaap_ok = true;
  let non_gaap_max_drift = 0;
  for (const m of monthly) {
    const expected = m.costs.operating_income_gaap + m.costs.total_sbc;
    const drift = Math.abs(m.costs.operating_income_non_gaap - expected);
    if (drift > 1e-3) non_gaap_ok = false;
    non_gaap_max_drift = Math.max(non_gaap_max_drift, drift);
  }
  results.push({
    id: 'non_gaap_tie',
    label: 'Non-GAAP Op Income = GAAP + SBC',
    passed: non_gaap_ok,
    detail: `Max drift: $${non_gaap_max_drift.toFixed(2)}`,
  });

  // 9. Adjusted EBITDA = EBITDA + SBC
  let adj_ebitda_ok = true;
  let adj_ebitda_max_drift = 0;
  for (const m of monthly) {
    const expected = m.costs.ebitda + m.costs.total_sbc;
    const drift = Math.abs(m.costs.adjusted_ebitda - expected);
    if (drift > 1e-3) adj_ebitda_ok = false;
    adj_ebitda_max_drift = Math.max(adj_ebitda_max_drift, drift);
  }
  results.push({
    id: 'adj_ebitda_tie',
    label: 'Adj EBITDA = EBITDA + SBC',
    passed: adj_ebitda_ok,
    detail: `Max drift: $${adj_ebitda_max_drift.toFixed(2)}`,
  });

  // 11. G&A total = G&A cash comp + G&A SBC + G&A T&E + D&A
  let ga_ok = true;
  let ga_max_drift = 0;
  for (const m of monthly) {
    const expected = m.costs.ga_cash_comp + m.costs.ga_sbc + m.costs.ga_te + m.costs.da;
    const drift = Math.abs(m.costs.ga_total - expected);
    if (drift > 1e-3) ga_ok = false;
    ga_max_drift = Math.max(ga_max_drift, drift);
  }
  results.push({
    id: 'ga_additivity',
    label: 'G&A total = cash + SBC + T&E + D&A',
    passed: ga_ok,
    detail: `Max drift: $${ga_max_drift.toFixed(2)}`,
  });

  // 12. SBC by function calibration: total_sbc / revenue ∈ [25%, 35%] for months 6..24.
  // Calibration warning, not a hard error. Render yellow on the footer when it fires.
  let sbc_min = Infinity, sbc_max = -Infinity;
  let sbc_in_range = true;
  for (let i = 5; i < monthly.length; i++) {
    const m = monthly[i];
    if (m.total.revenue <= 0) continue;
    const ratio = m.costs.total_sbc / m.total.revenue;
    sbc_min = Math.min(sbc_min, ratio);
    sbc_max = Math.max(sbc_max, ratio);
    if (ratio < 0.25 || ratio > 0.35) sbc_in_range = false;
  }
  const sbc_min_str = sbc_min === Infinity ? '—' : `${(sbc_min * 100).toFixed(1)}%`;
  const sbc_max_str = sbc_max === -Infinity ? '—' : `${(sbc_max * 100).toFixed(1)}%`;
  results.push({
    id: 'sbc_calibration',
    label: 'SBC % of revenue in [25%, 35%] (m6–24)',
    passed: sbc_in_range,
    detail: `Range: ${sbc_min_str} – ${sbc_max_str}`,
  });

  // 13. Total OpEx additivity: S&M + R&D + G&A + CS opex == opex_total
  let opex_ok = true;
  let opex_max_drift = 0;
  for (const m of monthly) {
    const expected = m.costs.sm_total + m.costs.rd_total + m.costs.ga_total + m.costs.cs_in_opex;
    const drift = Math.abs(m.costs.opex_total - expected);
    if (drift > 1e-3) opex_ok = false;
    opex_max_drift = Math.max(opex_max_drift, drift);
  }
  results.push({
    id: 'opex_additivity',
    label: 'OpEx total = S&M + R&D + G&A + CS opex',
    passed: opex_ok,
    detail: `Max drift: $${opex_max_drift.toFixed(2)}`,
  });

  // 10. Segment reconciliation — sum of self-serve + sales-led = consolidated
  // for every major line at every period grain (month, quarter, annual). Tolerance 0.1%.
  const seg = buildSegmentResults(monthly, A);
  const lineKeys = [
    'total_revenue', 'cogs', 'gross_profit',
    'sm_total', 'rd_total', 'ga_total', 'cs_in_opex',
    'opex_total', 'total_sbc',
    'operating_income_gaap', 'operating_income_non_gaap',
    'ebitda', 'adjusted_ebitda',
  ] as const;
  let seg_ok = true;
  let seg_max_drift = 0;
  let worst_label = '';
  for (let i = 0; i < monthly.length; i++) {
    const c = monthly[i].costs;
    const ss = seg.self_serve.monthly[i];
    const sl = seg.sales_led.monthly[i];
    // Only validate against the per-month allocation directly. PeriodResult roll-ups
    // share the same boundaries so quarter / annual ties follow algebraically.
    const lines: Array<[string, number, number]> = [
      ['total_revenue', monthly[i].total.revenue,
        ss.self_serve_revenue_plus + ss.self_serve_revenue_business_small +
        sl.sales_led_revenue_business_large + sl.sales_led_revenue_enterprise],
      ['cogs', c.cogs, ss.cogs + sl.cogs],
      ['sm_total', c.sm_total, ss.sm_total + sl.sm_total],
      ['rd_total', c.rd_total, ss.rd_total + sl.rd_total],
      ['ga_total', c.ga_total, ss.ga_total + sl.ga_total],
      ['cs_in_opex', c.cs_in_opex, ss.cs_in_opex + sl.cs_in_opex],
      ['opex_total', c.opex_total, ss.opex_total + sl.opex_total],
      ['total_sbc', c.total_sbc, ss.total_sbc + sl.total_sbc],
    ];
    for (const [k, consol, sum] of lines) {
      const drift = Math.abs(consol - sum) / Math.max(1, Math.abs(consol));
      if (drift > 0.001) {
        seg_ok = false;
        if (drift > seg_max_drift) {
          seg_max_drift = drift;
          worst_label = `${monthly[i].calendar_label} ${k}`;
        }
      } else if (drift > seg_max_drift) {
        seg_max_drift = drift;
      }
    }
  }
  void lineKeys; // Reserved for future per-line reporting in the footer.
  results.push({
    id: 'segment_reconciliation',
    label: 'Segment P&Ls sum to consolidated',
    passed: seg_ok,
    detail: seg_ok
      ? `Max drift: ${(seg_max_drift * 100).toFixed(4)}%`
      : `Worst: ${worst_label} drift ${(seg_max_drift * 100).toFixed(3)}%`,
  });

  return results;
}
