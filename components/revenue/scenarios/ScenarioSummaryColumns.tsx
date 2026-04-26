'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled, fmtPlainPct, fmtCount } from '@/lib/revenue/format';
import type { Results, ScenarioId } from '@/lib/revenue/types';

const SCENARIOS: { id: ScenarioId; label: string; tone: string }[] = [
  { id: 'downside', label: 'Downside', tone: 'var(--accent-warn)' },
  { id: 'base',     label: 'Base',     tone: 'var(--ink)' },
  { id: 'upside',   label: 'Upside',   tone: 'var(--accent-good)' },
];

interface RowSpec {
  label: string;
  fn: (r: Results) => string;
}

const ROWS: RowSpec[] = [
  { label: 'Ending ARR',         fn: r => fmtMoneyScaled(r.ending_arr, { precision: 1 }) },
  { label: 'Cumulative revenue', fn: r => fmtMoneyScaled(r.monthly.reduce((s, m) => s + m.total.revenue, 0), { precision: 1 }) },
  { label: 'Ending GM',          fn: r => fmtPlainPct(last(r).costs.gross_margin_pct, 1) },
  { label: 'Ending OM',          fn: r => fmtPlainPct(last(r).costs.operating_margin_pct, 1) },
  { label: 'Total OpEx',         fn: r => fmtMoneyScaled(r.monthly.reduce((s, m) => s + m.costs.opex_total, 0), { precision: 1 }) },
  { label: 'Ending headcount',   fn: r => fmtCount(last(r).headcount.total) },
  { label: 'Ending NRR (TTM)',   fn: r => fmtPlainPct(last(r).kpis.nrr_ttm, 1) },
  { label: 'Rule of 40',         fn: r => {
    const v = last(r).kpis.rule_of_40;
    return v === null ? '—' : v.toFixed(1);
  } },
];

function last(r: Results) {
  return r.monthly[r.monthly.length - 1];
}

export default function ScenarioSummaryColumns() {
  const { results, activeScenario, setActiveScenario } = useRevenue();

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div className="hand" style={{ fontSize: 18, marginBottom: 8 }}>Scenario summary · endpoint metrics</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px repeat(3, 1fr)',
        gap: 0,
      }}>
        {/* Header row */}
        <div />
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveScenario(s.id)}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              border: '1.5px solid var(--line)',
              borderBottom: 0,
              padding: '6px 10px',
              background: s.id === activeScenario ? s.tone : '#fcfbf7',
              color: s.id === activeScenario ? 'var(--paper)' : 'var(--ink-2)',
              fontFamily: 'var(--font-architects-daughter), cursive',
              fontWeight: 700,
              fontSize: 13,
              textAlign: 'center',
              marginRight: -1.5,
            }}
          >{s.label}</button>
        ))}

        {/* Body rows */}
        {ROWS.map((row, ri) => (
          <RowFragment
            key={row.label}
            label={row.label}
            cells={SCENARIOS.map(s => ({ id: s.id, val: row.fn(results[s.id]) }))}
            active={activeScenario}
            striped={ri % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}

function RowFragment({
  label, cells, active, striped,
}: {
  label: string;
  cells: { id: ScenarioId; val: string }[];
  active: ScenarioId;
  striped: boolean;
}) {
  return (
    <>
      <div style={{
        padding: '7px 10px',
        fontFamily: 'var(--font-architects-daughter), cursive',
        fontSize: 12,
        color: 'var(--ink-2)',
        background: striped ? '#fcfbf7' : 'transparent',
        borderBottom: '1px solid var(--line-softer)',
      }}>{label}</div>
      {cells.map(c => (
        <div key={c.id} style={{
          padding: '7px 10px',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: c.id === active ? 700 : 500,
          color: 'var(--ink)',
          textAlign: 'right',
          background: striped ? '#fcfbf7' : '#fff',
          border: '1px solid var(--line-softer)',
          borderTop: 0,
          marginRight: -1,
          marginBottom: -1,
        }}>{c.val}</div>
      ))}
    </>
  );
}
