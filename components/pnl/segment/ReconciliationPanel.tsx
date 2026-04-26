'use client';

import { useMemo } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';
import { buildSegmentResults } from '@/lib/revenue/engine-allocation';
import { fmtPnlMoney } from '@/lib/revenue/pnl-format';

interface Row {
  label: string;
  consol: number;
  ss: number;
  sl: number;
}

const TOL = 0.001; // 0.1% per spec §11

function rows(consol: { [k: string]: number }, ss: { [k: string]: number }, sl: { [k: string]: number }, keys: Array<[string, string]>): Row[] {
  return keys.map(([k, label]) => ({
    label,
    consol: consol[k],
    ss: ss[k],
    sl: sl[k],
  }));
}

export default function ReconciliationPanel() {
  const { results, activeScenario, assumptions } = useRevenue();
  const r = results[activeScenario];

  const seg = useMemo(
    () => buildSegmentResults(r.monthly, assumptions),
    [r.monthly, assumptions],
  );

  // Reconcile at the FY27 level — most aggressive single-period sum.
  const fy = r.annual[1];
  const ssFy = seg.self_serve.annual[1];
  const slFy = seg.sales_led.annual[1];

  const rowKeys: Array<[string, string]> = [
    ['total_revenue', 'Total revenue'],
    ['cogs', 'Total COGS'],
    ['gross_profit', 'Gross profit'],
    ['sm_total', 'Total S&M'],
    ['rd_total', 'Total R&D'],
    ['ga_total', 'Total G&A'],
    ['cs_in_opex', 'Total CS opex'],
    ['opex_total', 'Total OpEx'],
    ['total_sbc', 'Total SBC'],
    ['operating_income_gaap', 'Op income (GAAP)'],
    ['ebitda', 'EBITDA'],
    ['adjusted_ebitda', 'Adj. EBITDA'],
  ];

  const items = rows(
    fy as unknown as Record<string, number>,
    ssFy as unknown as Record<string, number>,
    slFy as unknown as Record<string, number>,
    rowKeys,
  );

  return (
    <div className="sketch-box" style={{ padding: '12px 16px' }}>
      <div className="hand" style={{ fontSize: 14, marginBottom: 6 }}>
        Reconciliation · FY27
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
        Self-serve + Sales-led must equal Consolidated for every line (±0.1%).
      </div>
      <table style={{
        width: '100%',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 11,
        borderCollapse: 'collapse',
      }}>
        <thead>
          <tr style={{
            fontFamily: 'var(--font-architects-daughter), cursive',
            color: 'var(--ink-3)',
            borderBottom: '1px solid var(--line-soft)',
          }}>
            <th style={{ textAlign: 'left', padding: '4px 8px' }}>Line</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Self-serve</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Sales-led</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Sum</th>
            <th style={{ textAlign: 'right', padding: '4px 8px' }}>Consolidated</th>
            <th style={{ textAlign: 'center', padding: '4px 8px' }}>Tie</th>
          </tr>
        </thead>
        <tbody>
          {items.map(row => {
            const sum = row.ss + row.sl;
            const drift = Math.abs(sum - row.consol) / Math.max(1, Math.abs(row.consol));
            const ok = drift <= TOL;
            return (
              <tr key={row.label} style={{ borderBottom: '1px dashed var(--line-softer)' }}>
                <td style={{ padding: '3px 8px', fontFamily: 'var(--font-architects-daughter), cursive' }}>{row.label}</td>
                <td style={{ padding: '3px 8px', textAlign: 'right' }}>{fmtPnlMoney(row.ss)}</td>
                <td style={{ padding: '3px 8px', textAlign: 'right' }}>{fmtPnlMoney(row.sl)}</td>
                <td style={{ padding: '3px 8px', textAlign: 'right' }}>{fmtPnlMoney(sum)}</td>
                <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 600 }}>{fmtPnlMoney(row.consol)}</td>
                <td style={{ padding: '3px 8px', textAlign: 'center' }}>
                  <span style={{
                    color: ok ? 'var(--accent-good)' : 'var(--accent-warn)',
                    fontWeight: 700,
                  }}>
                    {ok ? '✓' : '✗'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
