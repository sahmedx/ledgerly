'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled, fmtPlainPct, fmtCount } from '@/lib/revenue/format';
import { FY24_ENDING_ARR, FY25_ENDING_ARR } from '@/lib/revenue/historical';

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

  // FY27 vs FY26 ARR growth — both fiscal years are complete in a 24-month sim.
  const fy26EndingArr = r.annual[0].ending_arr;
  const fy27EndingArr = r.annual[1].ending_arr;
  const fyArrGrowth = fy26EndingArr > 0 ? (fy27EndingArr - fy26EndingArr) / fy26EndingArr : null;

  // 3-year decel context (FY25 actual → FY27 plan)
  const fy25Yoy = (FY25_ENDING_ARR - FY24_ENDING_ARR) / FY24_ENDING_ARR;
  const fy26Yoy = (fy26EndingArr - FY25_ENDING_ARR) / FY25_ENDING_ARR;

  const tiles: TileProps[] = [
    {
      label: 'Total ARR',
      value: fmtMoneyScaled(r.ending_arr, { precision: 1 }),
      sub: 'ending Dec 27',
    },
    {
      label: 'ARR YoY (FY27 / FY26)',
      value: fyArrGrowth === null ? '—' : fmtPlainPct(fyArrGrowth, 1),
      sub: `FY25 ${fmtPlainPct(fy25Yoy, 0)} · FY26 ${fmtPlainPct(fy26Yoy, 0)} · FY27 ${fyArrGrowth === null ? '—' : fmtPlainPct(fyArrGrowth, 0)}`,
    },
    {
      label: 'NRR (TTM, sales-led)',
      value: fmtPlainPct(last.kpis.nrr_ttm, 1),
      sub: 'self-serve excluded',
    },
    {
      label: 'GRR (TTM, sales-led)',
      value: fmtPlainPct(last.kpis.grr_ttm, 1),
      sub: 'self-serve excluded',
    },
    {
      label: 'Gross margin',
      value: fmtPlainPct(last.costs.gross_margin_pct, 1),
    },
    {
      label: 'EBITDA margin',
      value: fmtPlainPct(last.costs.ebitda_margin_pct, 1),
      sub: 'GAAP, incl. SBC',
    },
    {
      label: 'Adj. EBITDA margin',
      value: fmtPlainPct(last.costs.adjusted_ebitda_margin_pct, 1),
      sub: 'non-GAAP, ex-SBC',
    },
    {
      label: 'Rule of 40 (GAAP)',
      value: last.kpis.rule_of_40 === null ? '—' : last.kpis.rule_of_40.toFixed(1),
      sub: 'ARR YoY + GAAP op margin (TTM)',
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
      label: 'AI-included ARR',
      value: fmtMoneyScaled(last.total.ai_influenced_arr, { precision: 1 }),
      sub: `${fmtPlainPct(last.total.ai_influenced_pct, 0)} on plans bundling AI`,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
      gap: 10,
    }}>
      {tiles.map(t => (
        <Tile key={t.label} {...t} />
      ))}
    </div>
  );
}
