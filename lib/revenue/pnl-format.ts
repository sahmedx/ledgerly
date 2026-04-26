/* P&L number formatting per spec §7.2.
 * - Dollars: $ millions, one decimal. Negatives in parentheses.
 * - Percentages: one decimal.
 * - Headcount: integer with thousands separator.
 * - Empty / N/A: en dash. */

export function fmtPnlMoney(v: number | null | undefined, precision = 1): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  const m = (abs / 1_000_000).toFixed(precision);
  return v < 0 ? `($${m}M)` : `$${m}M`;
}

export function fmtPnlPct(v: number | null | undefined, precision = 1): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${(v * 100).toFixed(precision)}%`;
}

export function fmtPnlCount(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return Math.round(v).toLocaleString('en-US');
}

/** Negative values that should render red (gross profit, op income, EBITDA, Adj EBITDA). */
export function isNegativeProfit(v: number | null | undefined): boolean {
  return v != null && Number.isFinite(v) && v < 0;
}
