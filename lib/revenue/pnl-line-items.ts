/* P&L line-item config — drives the Consolidated table from spec §7.1.
 *
 * Each row is rendered against a PeriodResult (quarter, annual, or month-as-period).
 * `accessor` returns a number or null; null cells render as en dash. `style` flags
 * drive visual treatment per spec §7.2.
 */

import type { PeriodResult } from './types';

export type LineStyle =
  | 'section'        // ALL CAPS gray header row, no values
  | 'subtotal'       // bold + top border
  | 'sub'            // regular weight, indented
  | 'subsub'         // deeper indent
  | 'margin'         // italic, smaller, gray (percentage row)
  | 'final'          // bold + top/bottom borders (GAAP/non-GAAP/EBITDA/Adj EBITDA)
  | 'final-emph'     // heavier emphasis (non-GAAP op income, Adj EBITDA)
  | 'addback'        // light italic line ("+ SBC add-back")
  | 'kpi-section'    // KEY METRICS header
  | 'kpi'            // ARR, NRR, etc.
;

export type CellKind = 'money' | 'pct' | 'count' | 'rule40' | 'label-only';

export interface LineItem {
  id: string;
  label: string;
  indent: 0 | 1 | 2 | 3;
  style: LineStyle;
  kind: CellKind;
  accessor?: (p: PeriodResult) => number | null;
  /** Color the negative value red — true for gross profit, op income, EBITDA, Adj EBITDA. */
  redIfNegative?: boolean;
  /** Tooltip formula factory. Returns a string given the period. */
  formula?: (p: PeriodResult) => string;
}

const dollar = (label: string, get: (p: PeriodResult) => number, redNeg = false): LineItem['accessor'] => get;

export const CONSOLIDATED_LINES: LineItem[] = [
  // ---------- REVENUE ----------
  { id: 'rev_section', label: 'REVENUE', indent: 0, style: 'section', kind: 'label-only' },
  { id: 'ss_rev', label: 'Self-serve revenue', indent: 1, style: 'sub', kind: 'money',
    accessor: p => p.self_serve_revenue },
  { id: 'ss_plus', label: 'Plus', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.self_serve_revenue_plus },
  { id: 'ss_biz', label: 'Business (small)', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.self_serve_revenue_business_small },
  { id: 'sl_rev', label: 'Sales-led revenue', indent: 1, style: 'sub', kind: 'money',
    accessor: p => p.sales_led_revenue },
  { id: 'sl_bl', label: 'Business (large)', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.sales_led_revenue_business_large },
  { id: 'sl_ent', label: 'Enterprise', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.sales_led_revenue_enterprise },
  { id: 'rev_total', label: 'Total revenue', indent: 0, style: 'subtotal', kind: 'money',
    accessor: p => p.total_revenue },

  // ---------- COST OF REVENUE ----------
  { id: 'cogs_section', label: 'COST OF REVENUE', indent: 0, style: 'section', kind: 'label-only' },
  { id: 'hosting', label: 'Hosting & infrastructure', indent: 1, style: 'sub', kind: 'money',
    accessor: p => p.hosting,
    formula: p => `Hosting = total_revenue × hosting_pct = ${fmtMillions(p.total_revenue)} × pct` },
  { id: 'pp', label: 'Payment processing', indent: 1, style: 'sub', kind: 'money',
    accessor: p => p.payment_processing_self_serve + p.payment_processing_sales_led },
  { id: 'ai', label: 'AI inference', indent: 1, style: 'sub', kind: 'money',
    accessor: p => p.ai_inference_self_serve + p.ai_inference_sales_led },
  { id: 'cs_cogs', label: 'Customer success (COGS portion)', indent: 1, style: 'sub', kind: 'money',
    accessor: p => p.cs_in_cogs },
  { id: 'cogs_total', label: 'Total COGS', indent: 0, style: 'subtotal', kind: 'money',
    accessor: p => p.cogs },

  // ---------- GROSS PROFIT ----------
  { id: 'gross_profit', label: 'GROSS PROFIT', indent: 0, style: 'final', kind: 'money',
    accessor: p => p.gross_profit, redIfNegative: true },
  { id: 'gross_margin', label: 'Gross margin %', indent: 1, style: 'margin', kind: 'pct',
    accessor: p => p.gross_margin_pct },

  // ---------- OPERATING EXPENSES ----------
  { id: 'opex_section', label: 'OPERATING EXPENSES', indent: 0, style: 'section', kind: 'label-only' },

  // S&M
  { id: 'sm', label: 'Sales & Marketing', indent: 1, style: 'sub', kind: 'label-only' },
  { id: 'sm_cash', label: 'S&M cash comp', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.sm_cash_comp },
  { id: 'sm_sbc', label: 'S&M stock-based comp', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.sm_sbc },
  { id: 'sm_programs', label: 'S&M non-HC expense', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.sm_programs },
  { id: 'sm_total', label: 'Total S&M', indent: 1, style: 'subtotal', kind: 'money',
    accessor: p => p.sm_total },
  { id: 'sm_pct', label: 'S&M as % of revenue', indent: 2, style: 'margin', kind: 'pct',
    accessor: p => p.total_revenue > 0 ? p.sm_total / p.total_revenue : null },
  { id: 'sm_pct_excl', label: 'S&M as % of revenue (excl. SBC)', indent: 2, style: 'margin', kind: 'pct',
    accessor: p => p.total_revenue > 0 ? (p.sm_total - p.sm_sbc) / p.total_revenue : null },

  // R&D
  { id: 'rd', label: 'Research & Development', indent: 1, style: 'sub', kind: 'label-only' },
  { id: 'rd_cash', label: 'R&D cash comp', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.rd_cash_comp },
  { id: 'rd_sbc', label: 'R&D stock-based comp', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.rd_sbc },
  { id: 'rd_tooling', label: 'R&D non-HC expense', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.rd_tooling },
  { id: 'rd_total', label: 'Total R&D', indent: 1, style: 'subtotal', kind: 'money',
    accessor: p => p.rd_total },
  { id: 'rd_pct', label: 'R&D as % of revenue', indent: 2, style: 'margin', kind: 'pct',
    accessor: p => p.total_revenue > 0 ? p.rd_total / p.total_revenue : null },
  { id: 'rd_pct_excl', label: 'R&D as % of revenue (excl. SBC)', indent: 2, style: 'margin', kind: 'pct',
    accessor: p => p.total_revenue > 0 ? (p.rd_total - p.rd_sbc) / p.total_revenue : null },

  // G&A
  { id: 'ga', label: 'General & Administrative', indent: 1, style: 'sub', kind: 'label-only' },
  { id: 'ga_cash', label: 'G&A cash comp', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.ga_cash_comp },
  { id: 'ga_sbc', label: 'G&A stock-based comp', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.ga_sbc },
  { id: 'ga_te', label: 'G&A non-HC expense', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.ga_te },
  { id: 'da', label: 'Depreciation & amortization', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.da },
  { id: 'ga_total', label: 'Total G&A', indent: 1, style: 'subtotal', kind: 'money',
    accessor: p => p.ga_total },
  { id: 'ga_pct', label: 'G&A as % of revenue', indent: 2, style: 'margin', kind: 'pct',
    accessor: p => p.total_revenue > 0 ? p.ga_total / p.total_revenue : null },
  { id: 'ga_pct_excl', label: 'G&A as % of revenue (excl. SBC)', indent: 2, style: 'margin', kind: 'pct',
    accessor: p => p.total_revenue > 0 ? (p.ga_total - p.ga_sbc) / p.total_revenue : null },

  // CS opex
  { id: 'cs', label: 'Customer Success (opex portion)', indent: 1, style: 'sub', kind: 'label-only' },
  { id: 'cs_cash', label: 'CS cash comp', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.cs_cash_comp },
  { id: 'cs_sbc', label: 'CS stock-based comp', indent: 2, style: 'subsub', kind: 'money',
    accessor: p => p.cs_sbc },
  { id: 'cs_total', label: 'Total CS opex', indent: 1, style: 'subtotal', kind: 'money',
    accessor: p => p.cs_in_opex },

  // OpEx total
  { id: 'opex_total', label: 'Total Operating Expenses', indent: 0, style: 'subtotal', kind: 'money',
    accessor: p => p.opex_total },
  { id: 'sbc_of_which', label: 'of which: Stock-based compensation', indent: 1, style: 'margin', kind: 'money',
    accessor: p => p.total_sbc },

  // ---------- OP INCOME / EBITDA stack ----------
  { id: 'op_gaap', label: 'OPERATING INCOME (LOSS) — GAAP', indent: 0, style: 'final', kind: 'money',
    accessor: p => p.operating_income_gaap, redIfNegative: true },
  { id: 'op_gaap_pct', label: 'Operating margin % (GAAP)', indent: 1, style: 'margin', kind: 'pct',
    accessor: p => p.operating_margin_gaap_pct },

  { id: 'sbc_addback', label: '+ Stock-based compensation (add-back)', indent: 0, style: 'addback', kind: 'money',
    accessor: p => p.total_sbc },
  { id: 'op_non_gaap', label: 'OPERATING INCOME — NON-GAAP', indent: 0, style: 'final-emph', kind: 'money',
    accessor: p => p.operating_income_non_gaap, redIfNegative: true },
  { id: 'op_non_gaap_pct', label: 'Operating margin % (Non-GAAP)', indent: 1, style: 'margin', kind: 'pct',
    accessor: p => p.operating_margin_non_gaap_pct },

  { id: 'da_addback', label: '+ Depreciation & amortization (add-back)', indent: 0, style: 'addback', kind: 'money',
    accessor: p => p.da },
  { id: 'ebitda', label: 'EBITDA', indent: 0, style: 'final', kind: 'money',
    accessor: p => p.ebitda, redIfNegative: true },
  { id: 'ebitda_pct', label: 'EBITDA margin %', indent: 1, style: 'margin', kind: 'pct',
    accessor: p => p.ebitda_margin_pct },

  { id: 'sbc_addback_2', label: '+ Stock-based compensation (add-back)', indent: 0, style: 'addback', kind: 'money',
    accessor: p => p.total_sbc },
  { id: 'adj_ebitda', label: 'ADJUSTED EBITDA', indent: 0, style: 'final-emph', kind: 'money',
    accessor: p => p.adjusted_ebitda, redIfNegative: true },
  { id: 'adj_ebitda_pct', label: 'Adjusted EBITDA margin %', indent: 1, style: 'margin', kind: 'pct',
    accessor: p => p.adjusted_ebitda_margin_pct },

  // ---------- KEY METRICS ----------
  { id: 'kpis', label: 'KEY METRICS', indent: 0, style: 'kpi-section', kind: 'label-only' },
  { id: 'ending_arr', label: 'Ending ARR', indent: 1, style: 'kpi', kind: 'money',
    accessor: p => p.ending_arr },
  { id: 'arr_yoy', label: 'ARR YoY growth %', indent: 1, style: 'kpi', kind: 'pct',
    accessor: p => p.arr_yoy_growth },
  { id: 'rule_40', label: 'Rule of 40 (Non-GAAP)', indent: 1, style: 'kpi', kind: 'rule40',
    accessor: p => p.rule_of_40 },
  { id: 'nrr', label: 'NRR (TTM)', indent: 1, style: 'kpi', kind: 'pct',
    accessor: p => p.ending_nrr_ttm },
  { id: 'grr', label: 'GRR (TTM)', indent: 1, style: 'kpi', kind: 'pct',
    accessor: p => p.ending_grr_ttm },
  { id: 'headcount', label: 'Total headcount (period-end)', indent: 1, style: 'kpi', kind: 'count',
    accessor: p => p.ending_total_headcount },
];

// Avoid unused-import warning while keeping the helper available for future formulas.
void dollar;

function fmtMillions(v: number): string {
  return `$${(v / 1_000_000).toFixed(1)}M`;
}
