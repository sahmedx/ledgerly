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
  // Headline snapshots are at end of FY26 (Dec 26 = monthly[11]). FY27 is outlook.
  const dec26 = r.monthly[11];

  const fy26EndingArr = r.annual[0].ending_arr;
  const fy27EndingArr = r.annual[1].ending_arr;

  // 3-year decel context (FY25 actual → FY27 plan)
  const fy25Yoy = (FY25_ENDING_ARR - FY24_ENDING_ARR) / FY24_ENDING_ARR;
  const fy26Yoy = (fy26EndingArr - FY25_ENDING_ARR) / FY25_ENDING_ARR;
  const fy27Yoy = fy26EndingArr > 0 ? (fy27EndingArr - fy26EndingArr) / fy26EndingArr : null;

  const tiles: TileProps[] = [
    {
      label: 'Total ARR',
      value: fmtMoneyScaled(fy26EndingArr, { precision: 1 }),
      sub: 'ending Dec 26',
    },
    {
      label: 'ARR YoY (FY26 / FY25)',
      value: fmtPlainPct(fy26Yoy, 1),
      sub: `FY25 ${fmtPlainPct(fy25Yoy, 0)} · FY26 ${fmtPlainPct(fy26Yoy, 0)} · FY27 ${fy27Yoy === null ? '—' : fmtPlainPct(fy27Yoy, 0)}`,
    },
    {
      label: 'NRR (TTM, sales-led)',
      value: fmtPlainPct(dec26.kpis.nrr_ttm, 1),
      sub: 'as of Dec 26 · SS excluded',
    },
    {
      label: 'GRR (TTM, sales-led)',
      value: fmtPlainPct(dec26.kpis.grr_ttm, 1),
      sub: 'as of Dec 26 · SS excluded',
    },
    {
      label: 'Gross margin',
      value: fmtPlainPct(dec26.costs.gross_margin_pct, 1),
      sub: 'Dec 26',
    },
    {
      label: 'EBITDA margin',
      value: fmtPlainPct(dec26.costs.ebitda_margin_pct, 1),
      sub: 'Dec 26 · GAAP, incl. SBC',
    },
    {
      label: 'Adj. EBITDA margin',
      value: fmtPlainPct(dec26.costs.adjusted_ebitda_margin_pct, 1),
      sub: 'Dec 26 · non-GAAP, ex-SBC',
    },
    {
      label: 'Rule of 40 (GAAP)',
      value: dec26.kpis.rule_of_40 === null ? '—' : dec26.kpis.rule_of_40.toFixed(1),
      sub: 'Dec 26 · ARR YoY + TTM GAAP OM',
    },
    {
      label: 'Total logos',
      value: fmtCount(dec26.kpis.total_logos),
      sub: 'Dec 26 · workspaces + SL',
    },
    {
      label: 'ARPA blended',
      value: fmtMoneyScaled(dec26.kpis.arpa_blended, { precision: 0 }),
      sub: `SS ${fmtMoneyScaled(dec26.kpis.arpa_self_serve, { precision: 0 })} · SL ${fmtMoneyScaled(dec26.kpis.arpa_sales_led, { precision: 0 })}`,
    },
    {
      label: 'AI-included ARR',
      value: fmtMoneyScaled(dec26.total.ai_influenced_arr, { precision: 1 }),
      sub: `${fmtPlainPct(dec26.total.ai_influenced_pct, 0)} on plans bundling AI · Dec 26`,
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
