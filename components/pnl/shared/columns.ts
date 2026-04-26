/* Column-model builder for the P&L table.
 *
 * Given the engine's quarterly + annual + monthly results and the set of expanded
 * quarter indices, produce the flat list of columns to render. Quarters expand
 * inline to show their three monthly sub-cols; annual columns appear after each
 * fiscal year's Q4 (or expanded Q4-monthly group). */

import type { MonthlyResult, PeriodResult } from '@/lib/revenue/types';
import { monthAsPeriod } from '@/lib/revenue/engine-rollups';

export type ColKind = 'quarter' | 'month' | 'annual';

export interface Column {
  key: string;
  label: string;
  kind: ColKind;
  period: PeriodResult;
  /** For 'quarter' columns: index 0..7 — used by header click-to-expand. */
  qIndex?: number;
  /** For 'month' columns: parent quarter index — used to highlight parent header. */
  parentQ?: number;
}

const QUARTER_LABELS = [
  "Q1 '26", "Q2 '26", "Q3 '26", "Q4 '26",
  "Q1 '27", "Q2 '27", "Q3 '27", "Q4 '27",
];

const ANNUAL_LABELS = ["FY26", "FY27"];

export function buildColumns(
  quarterly: PeriodResult[],
  annual: PeriodResult[],
  monthly: MonthlyResult[],
  expanded: Set<number>,
): Column[] {
  const cols: Column[] = [];
  for (let q = 0; q < 8; q++) {
    const quarter = quarterly[q];
    cols.push({
      key: `q${q}`,
      label: QUARTER_LABELS[q],
      kind: 'quarter',
      period: quarter,
      qIndex: q,
    });
    if (expanded.has(q)) {
      for (let m = quarter.start_month; m <= quarter.end_month; m++) {
        const period = monthAsPeriod(monthly, m);
        cols.push({
          key: `m${m}`,
          label: monthly[m - 1].calendar_label,
          kind: 'month',
          period,
          parentQ: q,
        });
      }
    }
    // After Q4 of each fiscal year, insert the annual column
    if (q === 3) {
      cols.push({ key: 'fy26', label: ANNUAL_LABELS[0], kind: 'annual', period: annual[0] });
    } else if (q === 7) {
      cols.push({ key: 'fy27', label: ANNUAL_LABELS[1], kind: 'annual', period: annual[1] });
    }
  }
  return cols;
}
