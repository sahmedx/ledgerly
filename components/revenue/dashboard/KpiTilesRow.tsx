'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled, fmtPlainPct, fmtCount, fmtNumberX } from '@/lib/revenue/format';

interface TileProps {
  label: string;
  value: string;
  sub?: string;
  delta?: { value: string; positive: boolean };
}

function Tile({ label, value, sub, delta }: TileProps) {
  return (
    <div className="sketch-box" style={{ padding: '10px 12px', minWidth: 0 }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-4)',
        fontFamily: 'var(--font-architects-daughter), cursive',
      }}>{label}</div>
      <div className="num" style={{
        fontSize: 22,
        fontWeight: 500,
        marginTop: 4,
        color: 'var(--ink)',
      }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
      )}
      {delta && (
        <div className="num" style={{
          fontSize: 11,
          marginTop: 2,
          color: delta.positive ? 'var(--accent-good)' : 'var(--accent-warn)',
        }}>
          {delta.value}
        </div>
      )}
    </div>
  );
}

export default function KpiTilesRow() {
  const { results, activeScenario } = useRevenue();
  const r = results[activeScenario];
  const last = r.monthly[r.monthly.length - 1];

  const tiles: TileProps[] = [
    {
      label: 'Total ARR',
      value: fmtMoneyScaled(r.ending_arr, { precision: 1 }),
    },
    {
      label: 'NRR (TTM)',
      value: fmtPlainPct(last.kpis.nrr_ttm, 1),
    },
    {
      label: 'GRR (TTM)',
      value: fmtPlainPct(last.kpis.grr_ttm, 1),
    },
    {
      label: 'Total logos',
      value: fmtCount(last.kpis.total_logos),
      sub: 'workspaces + sales-led',
    },
    {
      label: 'ARPA blended',
      value: fmtMoneyScaled(last.kpis.arpa_blended, { precision: 0 }),
      sub: `SS ${fmtMoneyScaled(last.kpis.arpa_self_serve, { precision: 0 })} · SL ${fmtMoneyScaled(last.kpis.arpa_sales_led, { precision: 0 })}`,
    },
    {
      label: 'AI-influenced ARR',
      value: fmtMoneyScaled(last.total.ai_influenced_arr, { precision: 1 }),
      sub: `${fmtPlainPct(last.total.ai_influenced_pct, 0)} of total`,
    },
    {
      label: 'Gross margin',
      value: fmtPlainPct(last.costs.gross_margin_pct, 1),
    },
    {
      label: 'Rule of 40',
      value: last.kpis.rule_of_40.toFixed(1),
      sub: `growth + op margin`,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
      gap: 10,
    }}>
      {tiles.map(t => (
        <Tile key={t.label} {...t} />
      ))}
    </div>
  );
}

void fmtNumberX; // imported for future tile use
