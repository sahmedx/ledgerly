/* Column-model builder for the P&L table.
 *
 * Given the engine's quarterly + annual + monthly results and the set of expanded
 * quarter indices, produce the flat list of columns to render. Quarters expand
 * inline to show their three monthly sub-cols; annual columns appear after each
 * fiscal year's Q4 (or expanded Q4-monthly group). */

import type { MonthlyResult, PeriodResult } from '@/lib/revenue/types';
import { monthAsPeriod } from '@/lib/revenue/engine-rollups';
import { FY25_QUARTERLY, FY25_MONTHLY, FY25_ANNUAL } from '@/lib/revenue/historical';

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

// FY25 historical: qIndex 100..103 (namespace separated from FY26/27 0..7)
const FY25_QLABEL = ["Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25"];
const FY25_MLABEL = [
  'Jan 25', 'Feb 25', 'Mar 25',
  'Apr 25', 'May 25', 'Jun 25',
  'Jul 25', 'Aug 25', 'Sep 25',
  'Oct 25', 'Nov 25', 'Dec 25',
];

export function buildColumns(
  quarterly: PeriodResult[],
  annual: PeriodResult[],
  monthly: MonthlyResult[],
  expanded: Set<number>,
): Column[] {
  const cols: Column[] = [];

  // ---------- FY25 historical (prepended) ----------
  for (let q = 0; q < 4; q++) {
    const qIdx = 100 + q;
    cols.push({
      key: `q25_${q}`,
      label: FY25_QLABEL[q],
      kind: 'quarter',
      period: FY25_QUARTERLY[q],
      qIndex: qIdx,
    });
    if (expanded.has(qIdx)) {
      for (let m = 0; m < 3; m++) {
        const mIdx = q * 3 + m;
        cols.push({
          key: `m25_${mIdx}`,
          label: FY25_MLABEL[mIdx],
          kind: 'month',
          period: FY25_MONTHLY[mIdx],
          parentQ: qIdx,
        });
      }
    }
  }
  cols.push({ key: 'fy25', label: 'FY25', kind: 'annual', period: FY25_ANNUAL });

  // ---------- FY26 + FY27 (engine output) ----------
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
