/* Quarterly + annual roll-ups over MonthlyResult[] for the P&L view (spec §5).
 *
 * - Dollar lines: summed across the period.
 * - Margin %s: recomputed at the period level (period sum profit / period sum revenue),
 *   never averaged across months.
 * - ARR-based metrics (Ending ARR, NRR/GRR TTM, headcount): take the period's last-month value.
 * - arr_yoy_growth / rule_of_40: take the last-month value, which is null for periods
 *   ending before month 13.
 *
 * Period boundaries are inclusive on both ends and identical to those used by the segment
 * roll-up in 6b (engine-allocation.ts), so reconciliation passes at month, quarter, and
 * annual grain.
 */

import type { MonthlyResult, PeriodResult } from './types';

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

function rollupPeriod(
  monthly: MonthlyResult[],
  label: string,
  start_month: number,
  end_month: number,
): PeriodResult {
  // Slice (1-indexed → 0-indexed)
  const slice = monthly.slice(start_month - 1, end_month);
  const last = slice[slice.length - 1];

  let self_serve_revenue_plus = 0;
  let self_serve_revenue_business_small = 0;
  let sales_led_revenue_business_large = 0;
  let sales_led_revenue_enterprise = 0;

  let hosting = 0;
  let payment_processing_self_serve = 0;
  let payment_processing_sales_led = 0;
  let ai_inference_self_serve = 0;
  let ai_inference_sales_led = 0;
  let cs_in_cogs = 0;

  let sm_cash_comp = 0, sm_sbc = 0, sm_programs = 0;
  let rd_cash_comp = 0, rd_sbc = 0, rd_tooling = 0;
  let ga_cash_comp = 0, ga_sbc = 0, ga_te = 0, da = 0;
  let cs_cash_comp = 0, cs_sbc = 0, cs_in_opex = 0;
  let total_sbc = 0;

  for (const m of slice) {
    self_serve_revenue_plus += m.self_serve.mrr.plus;
    self_serve_revenue_business_small += m.self_serve.mrr.business_small;
    // Sales-led revenue per segment uses the same proxy as engine-billings:
    // segment_revenue = segment_ending_arr / 12.
    sales_led_revenue_business_large += m.sales_led.ending_arr.business_large / 12;
    sales_led_revenue_enterprise     += m.sales_led.ending_arr.enterprise / 12;

    hosting                       += m.costs.hosting;
    payment_processing_self_serve += m.costs.payment_processing_self_serve;
    payment_processing_sales_led  += m.costs.payment_processing_sales_led;
    ai_inference_self_serve       += m.costs.ai_inference_self_serve;
    ai_inference_sales_led        += m.costs.ai_inference_sales_led;
    cs_in_cogs                    += m.costs.cs_in_cogs;

    sm_cash_comp += m.costs.sm_cash_comp;
    sm_sbc       += m.costs.sm_sbc;
    sm_programs  += m.costs.sm_programs;

    rd_cash_comp += m.costs.rd_cash_comp;
    rd_sbc       += m.costs.rd_sbc;
    rd_tooling   += m.costs.rd_tooling;

    ga_cash_comp += m.costs.ga_cash_comp;
    ga_sbc       += m.costs.ga_sbc;
    ga_te        += m.costs.ga_te;
    da           += m.costs.da;

    cs_cash_comp += m.costs.cs_cash_comp;
    cs_sbc       += m.costs.cs_sbc;
    cs_in_opex   += m.costs.cs_in_opex;
    total_sbc    += m.costs.total_sbc;
  }

  const self_serve_revenue = self_serve_revenue_plus + self_serve_revenue_business_small;
  const sales_led_revenue = sales_led_revenue_business_large + sales_led_revenue_enterprise;
  const total_revenue = self_serve_revenue + sales_led_revenue;

  const cogs =
      hosting
    + payment_processing_self_serve
    + payment_processing_sales_led
    + ai_inference_self_serve
    + ai_inference_sales_led
    + cs_in_cogs;
  const gross_profit = total_revenue - cogs;
  const gross_margin_pct = total_revenue > 0 ? gross_profit / total_revenue : 0;

  const sm_total = sm_cash_comp + sm_sbc + sm_programs;
  const rd_total = rd_cash_comp + rd_sbc + rd_tooling;
  const ga_total = ga_cash_comp + ga_sbc + ga_te + da;
  const opex_total = sm_total + rd_total + ga_total + cs_in_opex;

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

    ending_arr: last.total.arr,
    ending_total_headcount: last.headcount.total,
    ending_nrr_ttm: last.kpis.nrr_ttm,
    ending_grr_ttm: last.kpis.grr_ttm,
    arr_yoy_growth: last.kpis.arr_yoy_growth,
    rule_of_40: last.kpis.rule_of_40,
    rule_of_40_non_gaap: last.kpis.rule_of_40_non_gaap,
  };
}

export function buildQuarterly(monthly: MonthlyResult[]): PeriodResult[] {
  return QUARTERS.map(q => rollupPeriod(monthly, q.label, q.start, q.end));
}

export function buildAnnual(monthly: MonthlyResult[]): PeriodResult[] {
  return ANNUALS.map(a => rollupPeriod(monthly, a.label, a.start, a.end));
}

/** Wrap a single MonthlyResult as a one-month PeriodResult. Used by the P&L table
 *  when a quarter is expanded to show its three monthly sub-columns inline — every
 *  column in the table can then share the same PeriodResult accessor. */
export function monthAsPeriod(monthly: MonthlyResult[], monthIndex: number): PeriodResult {
  return rollupPeriod(monthly, monthly[monthIndex - 1].calendar_label, monthIndex, monthIndex);
}
