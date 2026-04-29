'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled, fmtNumberX } from '@/lib/revenue/format';
import { blendedSelfServeChurn, cappedLtv, LTV_HORIZON_MONTHS } from '@/lib/revenue/engine-kpis';
import type { MonthlyResult } from '@/lib/revenue/types';

/** Back out CAC from kpis.cac_payback × ARPA × GM / 12. */
function deriveCac(payback_months: number, arpa: number, gm: number): number {
  if (payback_months <= 0 || arpa <= 0 || gm <= 0) return 0;
  return payback_months * arpa * gm / 12;
}

interface TileProps {
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'good' | 'warn';
}

function Tile({ label, value, sub, tone = 'neutral' }: TileProps) {
  const valueColor =
    tone === 'good' ? 'var(--accent-good)' :
    tone === 'warn' ? 'var(--accent-warn)' :
    'var(--ink)';
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
        color: valueColor,
      }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

function paybackTone(months: number): TileProps['tone'] {
  if (months <= 0) return 'neutral';
  if (months <= 18) return 'good';
  if (months <= 36) return 'neutral';
  return 'warn';
}

function ltvCacTone(x: number): TileProps['tone'] {
  if (x <= 0) return 'neutral';
  if (x >= 3) return 'good';
  if (x >= 1) return 'neutral';
  return 'warn';
}

export default function UeKpiTiles() {
  const { results, activeScenario, assumptions } = useRevenue();
  const r = results[activeScenario];
  // Snapshot at end of FY26 (Dec 26). FY27 is outlook; the trend charts below cover the full horizon.
  const dec26: MonthlyResult = r.monthly[11];

  const sl_churn_monthly = (
    assumptions.sales_led.existing_customer_dynamics.business_large.gross_churn
    + assumptions.sales_led.existing_customer_dynamics.enterprise.gross_churn
  ) / 2;
  const ss_churn_monthly = blendedSelfServeChurn(
    assumptions, dec26.self_serve.arr.plus, dec26.self_serve.arr.business_small,
  );

  const gm = dec26.costs.gross_margin_pct;
  const ssArpa = dec26.kpis.arpa_self_serve;
  const slArpa = dec26.kpis.arpa_sales_led;

  const ssCac = deriveCac(dec26.kpis.cac_payback_self_serve, ssArpa, gm);
  const slCac = deriveCac(dec26.kpis.cac_payback_sales_led, slArpa, gm);
  const ssLtv = cappedLtv(ssArpa, gm, ss_churn_monthly);
  const slLtv = cappedLtv(slArpa, gm, sl_churn_monthly);

  const ltvSub = (churn_monthly: number) => {
    const life = Math.min(LTV_HORIZON_MONTHS, 1 / churn_monthly);
    const churnPct = (churn_monthly * 100).toFixed(2);
    return `${churnPct}% mo. churn · ${life.toFixed(0)}mo cap`;
  };

  const slMktgPct = assumptions.costs.sm.sl_marketing_attribution_pct;
  const ssMktgPct = 1 - slMktgPct;
  const tiles: TileProps[] = [
    { label: 'CAC · self-serve',  value: fmtMoneyScaled(ssCac, { precision: 0 }), sub: `Dec 26 · ${(ssMktgPct*100).toFixed(0)}% of mktg` },
    { label: 'CAC · sales-led',   value: fmtMoneyScaled(slCac, { precision: 0 }), sub: `Dec 26 · sales + ${(slMktgPct*100).toFixed(0)}% mktg` },
    { label: 'LTV · self-serve',  value: fmtMoneyScaled(ssLtv, { precision: 0 }), sub: ltvSub(ss_churn_monthly) },
    { label: 'LTV · sales-led',   value: fmtMoneyScaled(slLtv, { precision: 0 }), sub: ltvSub(sl_churn_monthly) },
    { label: 'LTV/CAC · SS',      value: fmtNumberX(dec26.kpis.ltv_cac_self_serve, 1), tone: ltvCacTone(dec26.kpis.ltv_cac_self_serve), sub: 'Dec 26' },
    { label: 'LTV/CAC · SL',      value: fmtNumberX(dec26.kpis.ltv_cac_sales_led, 1),  tone: ltvCacTone(dec26.kpis.ltv_cac_sales_led), sub: 'Dec 26' },
    { label: 'Payback · SS',      value: `${dec26.kpis.cac_payback_self_serve.toFixed(1)} mo`, tone: paybackTone(dec26.kpis.cac_payback_self_serve), sub: 'Dec 26' },
    { label: 'Payback · SL',      value: `${dec26.kpis.cac_payback_sales_led.toFixed(1)} mo`,  tone: paybackTone(dec26.kpis.cac_payback_sales_led), sub: 'Dec 26' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
      gap: 10,
    }}>
      {tiles.map(t => <Tile key={t.label} {...t} />)}
    </div>
  );
}
