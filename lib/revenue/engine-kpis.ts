/* KPIs computed in a post-pass over MonthlyResult[] per spec §6.5. */

import type { Assumptions, MonthlyResult } from './types';

/** 84-month (7-year) LTV horizon cap. Perpetuity LTV (= ARPA × GM / churn) produces
 *  $10M+ "lifetime" values for low-churn enterprise (1/0.0035 = 286 months implied life)
 *  that no FP&A team defends. Cap to a realistic planning window. */
export const LTV_HORIZON_MONTHS = 84;

function totalArrFromMonthly(m: MonthlyResult): number {
  return (
    m.self_serve.arr.plus + m.self_serve.arr.business_small +
    m.sales_led.ending_arr.business_large + m.sales_led.ending_arr.enterprise
  );
}

function salesLedArr(m: MonthlyResult): number {
  return m.sales_led.ending_arr.business_large + m.sales_led.ending_arr.enterprise;
}

/** Effective monthly churn implied by the 12-month retention point on the cohort curve.
 *  surviving_frac(a) = floor + (1 - floor) × exp(-decay × a). */
export function impliedMonthlyChurn(floor: number, decay: number): number {
  const retention_12mo = floor + (1 - floor) * Math.exp(-decay * 12);
  if (retention_12mo <= 0) return 1;
  return 1 - Math.pow(retention_12mo, 1 / 12);
}

/** Capped LTV: gross profit accumulated over min(84-mo, 1/churn). */
export function cappedLtv(arpa: number, gm: number, monthly_churn: number): number {
  if (arpa <= 0 || gm <= 0 || monthly_churn <= 0) return 0;
  const life_months = Math.min(LTV_HORIZON_MONTHS, 1 / monthly_churn);
  return arpa * gm * life_months / 12;
}

/** Blended self-serve monthly churn, weighted by ARR mix (Plus + Business-small). */
export function blendedSelfServeChurn(A: Assumptions, plus_arr: number, bs_arr: number): number {
  const churn_plus = impliedMonthlyChurn(A.self_serve.retention.plus.floor, A.self_serve.retention.plus.decay);
  const churn_bs   = impliedMonthlyChurn(A.self_serve.retention.business_small.floor, A.self_serve.retention.business_small.decay);
  const total = plus_arr + bs_arr;
  if (total <= 0) return (churn_plus + churn_bs) / 2;
  return (plus_arr * churn_plus + bs_arr * churn_bs) / total;
}

export function computeKpisInPlace(monthly: MonthlyResult[], A: Assumptions): void {
  // Sales-led blended gross churn (BL + ENT average). Self-serve churn varies with
  // tier mix month-by-month, so it is derived inside the loop.
  const sl_churn_monthly = (
    A.sales_led.existing_customer_dynamics.business_large.gross_churn
    + A.sales_led.existing_customer_dynamics.enterprise.gross_churn
  ) / 2;

  const day0_sl_arr =
      A.starting_state.sales_led_arr.business_large
    + A.starting_state.sales_led_arr.enterprise;
  const day0_total_arr =
      A.starting_state.self_serve_arr.plus
    + A.starting_state.self_serve_arr.business_small
    + day0_sl_arr;

  // Blended new-logos estimate: use avg ARR per logo weighted by capacity split
  const bl_avg_arr_per_logo = A.sales_led.avg_seats_per_logo.business_large
    * A.sales_led.blended_seat_price.business_large * 12;
  const ent_avg_arr_per_logo = A.sales_led.enterprise_avg_acv;
  const split = A.sales_led.capacity_segment_split;
  const blended_arr_per_sl_logo = bl_avg_arr_per_logo * split.business_large
    + ent_avg_arr_per_logo * split.enterprise;

  for (let i = 0; i < monthly.length; i++) {
    const m = monthly[i];

    const ss_arr = m.self_serve.arr.plus + m.self_serve.arr.business_small;
    const sl_arr = salesLedArr(m);
    const total_arr = ss_arr + sl_arr;

    const ss_workspaces = m.self_serve.active_workspaces.plus + m.self_serve.active_workspaces.business_small;
    const sl_logos = m.sales_led.active_logos.business_large + m.sales_led.active_logos.enterprise;
    const total_logos = ss_workspaces + sl_logos;

    const arpa_ss = ss_workspaces > 0 ? ss_arr / ss_workspaces : 0;
    const arpa_sl = sl_logos > 0 ? sl_arr / sl_logos : 0;
    const arpa_blended = total_logos > 0 ? total_arr / total_logos : 0;

    // NRR / GRR (TTM, sales-led)
    let nrr_ttm = 0, grr_ttm = 0;
    if (i >= 12) {
      const arr_12mo = salesLedArr(monthly[i - 12]);
      let exp_sum = 0, cont_sum = 0, churn_sum = 0;
      for (let k = i - 11; k <= i; k++) {
        exp_sum   += monthly[k].sales_led.expansion_arr;
        cont_sum  += monthly[k].sales_led.contraction_arr;
        churn_sum += monthly[k].sales_led.churn_arr;
      }
      if (arr_12mo > 0) {
        nrr_ttm = (arr_12mo + exp_sum - cont_sum - churn_sum) / arr_12mo;
        grr_ttm = (arr_12mo - cont_sum - churn_sum) / arr_12mo;
      }
    } else {
      // Annualize from available months
      let exp_sum = 0, cont_sum = 0, churn_sum = 0;
      for (let k = 0; k <= i; k++) {
        exp_sum   += monthly[k].sales_led.expansion_arr;
        cont_sum  += monthly[k].sales_led.contraction_arr;
        churn_sum += monthly[k].sales_led.churn_arr;
      }
      const factor = 12 / (i + 1);
      if (day0_sl_arr > 0) {
        nrr_ttm = (day0_sl_arr + exp_sum * factor - cont_sum * factor - churn_sum * factor) / day0_sl_arr;
        grr_ttm = (day0_sl_arr - cont_sum * factor - churn_sum * factor) / day0_sl_arr;
      }
    }

    // Magic Number (quarterly): (ARR[t] - ARR[t-3]) × 4 / sum(S&M[t-3..t-1])
    // Magic Number (ARR-based, GAAP S&M): ARR is already annualized, so the
    // 3-mo ARR delta divided by quarterly GAAP S&M (cash + SBC + non-HC).
    // Earlier formula multiplied by 4, which double-annualized.
    let magic_number = 0;
    if (i >= 3) {
      const arr_t3 = totalArrFromMonthly(monthly[i - 3]);
      const sm_3mo =
          monthly[i - 3].costs.sm_total
        + monthly[i - 2].costs.sm_total
        + monthly[i - 1].costs.sm_total;
      if (sm_3mo > 0) magic_number = (total_arr - arr_t3) / sm_3mo;
    }

    // Burn multiple
    let burn_multiple = 0;
    if (i >= 1) {
      const arr_prev = totalArrFromMonthly(monthly[i - 1]);
      const net_new = total_arr - arr_prev;
      const op_loss = Math.max(0, -m.costs.operating_income);
      if (net_new > 0) burn_multiple = op_loss / net_new;
    }

    // ARR YoY growth + Rule of 40 (GAAP, TTM).
    // ARR YoY: t-12 comparator when available; otherwise annualize Day-0 → current.
    // OM: TTM (sum of last 12 months of op income / total revenue) for i >= 11;
    // otherwise YTD-annualized so early FY26 is not blank.
    let arr_yoy_growth: number | null = null;
    let rule_of_40: number | null = null;
    let rule_of_40_non_gaap: number | null = null;
    let om_ttm_gaap: number | null = null;
    let om_ttm_non_gaap: number | null = null;
    {
      const start = i >= 11 ? i - 11 : 0;
      let oi_sum = 0, oi_ng_sum = 0, sbc_sum = 0, rev_sum = 0;
      for (let k = start; k <= i; k++) {
        const c = monthly[k].costs;
        oi_sum  += c.operating_income;
        sbc_sum += c.total_sbc;
        rev_sum += monthly[k].total.revenue;
      }
      oi_ng_sum = oi_sum + sbc_sum;
      if (rev_sum > 0) {
        om_ttm_gaap = oi_sum / rev_sum;
        om_ttm_non_gaap = oi_ng_sum / rev_sum;
      }
    }

    if (i >= 12) {
      const arr_yoy = totalArrFromMonthly(monthly[i - 12]);
      if (arr_yoy > 0) {
        arr_yoy_growth = (total_arr - arr_yoy) / arr_yoy;
      }
    } else if (day0_total_arr > 0) {
      const months_elapsed = i + 1; // 1..12
      arr_yoy_growth = Math.pow(total_arr / day0_total_arr, 12 / months_elapsed) - 1;
    }

    if (arr_yoy_growth !== null && om_ttm_gaap !== null) {
      rule_of_40 = (arr_yoy_growth + om_ttm_gaap) * 100;
    }
    if (arr_yoy_growth !== null && om_ttm_non_gaap !== null) {
      rule_of_40_non_gaap = (arr_yoy_growth + om_ttm_non_gaap) * 100;
    }

    // CAC by segment
    const flc = A.costs.sm.flc;
    const sales_comp =
        m.headcount.sales_reps * flc.rep / 12
      + m.headcount.sdrs       * flc.sdr / 12
      + m.headcount.ses        * flc.se / 12
      + m.headcount.sales_mgrs * flc.manager / 12;
    const marketing_comp = m.headcount.marketing * flc.mktg / 12;
    const marketing_programs = Math.max(0, m.costs.sm_total - sales_comp - marketing_comp);

    // Marketing programs + marketing comp split between segments. Default 70/30
    // (PLG-heavy company); tunable per A.costs.sm.sl_marketing_attribution_pct.
    const sl_mktg_share = A.costs.sm.sl_marketing_attribution_pct;
    const ss_mktg_share = 1 - sl_mktg_share;
    const ss_attributable_sm = (marketing_programs + marketing_comp) * ss_mktg_share;
    const sl_attributable_sm = sales_comp + (marketing_programs + marketing_comp) * sl_mktg_share;

    const new_ss_logos = m.self_serve.new_paid_workspaces;
    const total_new_sl_arr =
        m.sales_led.new_arr_named_pipeline
      + m.sales_led.new_arr_capacity
      + m.sales_led.new_arr_graduation;
    const new_sl_logos = blended_arr_per_sl_logo > 0
      ? total_new_sl_arr / blended_arr_per_sl_logo
      : 0;

    const ss_cac = new_ss_logos > 0 ? ss_attributable_sm / new_ss_logos : 0;
    const sl_cac = new_sl_logos > 0 ? sl_attributable_sm / new_sl_logos : 0;

    // LTV — 84-month horizon cap, finite-life GP (industry-standard SaaS practice).
    const gm = m.costs.gross_margin_pct;
    const ss_churn_monthly = blendedSelfServeChurn(A, m.self_serve.arr.plus, m.self_serve.arr.business_small);
    const ss_ltv = cappedLtv(arpa_ss, gm, ss_churn_monthly);
    const sl_ltv = cappedLtv(arpa_sl, gm, sl_churn_monthly);

    const ss_ltv_cac = ss_cac > 0 ? ss_ltv / ss_cac : 0;
    const sl_ltv_cac = sl_cac > 0 ? sl_ltv / sl_cac : 0;

    const ss_payback = arpa_ss > 0 && gm > 0 ? ss_cac / (arpa_ss * gm / 12) : 0;
    const sl_payback = arpa_sl > 0 && gm > 0 ? sl_cac / (arpa_sl * gm / 12) : 0;

    m.kpis = {
      nrr_ttm,
      grr_ttm,
      magic_number,
      burn_multiple,
      rule_of_40,
      rule_of_40_non_gaap,
      arr_yoy_growth,
      cac_payback_self_serve: ss_payback,
      cac_payback_sales_led: sl_payback,
      ltv_cac_self_serve: ss_ltv_cac,
      ltv_cac_sales_led: sl_ltv_cac,
      arpa_self_serve: arpa_ss,
      arpa_sales_led: arpa_sl,
      arpa_blended,
      total_logos,
    };
  }
}
