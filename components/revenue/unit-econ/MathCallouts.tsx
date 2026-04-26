'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled, fmtNumberX } from '@/lib/revenue/format';
import {
  blendedSelfServeChurn,
  cappedLtv,
  LTV_HORIZON_MONTHS,
} from '@/lib/revenue/engine-kpis';

interface CalloutProps {
  title: string;
  formula: string;
  result: string;
  note: string;
  accent: string;
}

function Callout({ title, formula, result, note, accent }: CalloutProps) {
  return (
    <div className="sketch-box" style={{ padding: '10px 12px', minWidth: 0 }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--ink-4)',
        fontFamily: 'var(--font-architects-daughter), cursive',
        marginBottom: 4,
      }}>{title}</div>
      <div style={{
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 10,
        color: 'var(--ink-3)',
        lineHeight: 1.4,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      }}>{formula}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <div className="num" style={{ fontSize: 20, fontWeight: 500, color: accent }}>{result}</div>
        <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{note}</div>
      </div>
    </div>
  );
}

export default function MathCallouts() {
  const { results, activeScenario, assumptions } = useRevenue();
  const last = results[activeScenario].monthly[results[activeScenario].monthly.length - 1];

  const gm = last.costs.gross_margin_pct;
  const ssArpa = last.kpis.arpa_self_serve;
  const slArpa = last.kpis.arpa_sales_led;

  const ssChurn = blendedSelfServeChurn(
    assumptions, last.self_serve.arr.plus, last.self_serve.arr.business_small,
  );
  const slChurn = (
    assumptions.sales_led.existing_customer_dynamics.business_large.gross_churn
    + assumptions.sales_led.existing_customer_dynamics.enterprise.gross_churn
  ) / 2;

  const ssLifeRaw = 1 / ssChurn;
  const slLifeRaw = 1 / slChurn;
  const ssLife = Math.min(LTV_HORIZON_MONTHS, ssLifeRaw);
  const slLife = Math.min(LTV_HORIZON_MONTHS, slLifeRaw);

  const ssLtv = cappedLtv(ssArpa, gm, ssChurn);
  const slLtv = cappedLtv(slArpa, gm, slChurn);

  const ssCac = last.kpis.cac_payback_self_serve > 0
    ? last.kpis.cac_payback_self_serve * ssArpa * gm / 12
    : 0;
  const slCac = last.kpis.cac_payback_sales_led > 0
    ? last.kpis.cac_payback_sales_led * slArpa * gm / 12
    : 0;

  const ssRatio = ssCac > 0 ? ssLtv / ssCac : 0;
  const slRatio = slCac > 0 ? slLtv / slCac : 0;

  const items: CalloutProps[] = [
    {
      title: 'LTV · self-serve',
      formula: `ARPA ${fmtMoneyScaled(ssArpa, { precision: 0 })} × GM ${(gm * 100).toFixed(0)}% × min(${LTV_HORIZON_MONTHS}, ${ssLifeRaw.toFixed(0)}) mo ÷ 12`,
      result: fmtMoneyScaled(ssLtv, { precision: 1 }),
      note: ssLifeRaw < LTV_HORIZON_MONTHS
        ? `life ${ssLifeRaw.toFixed(0)}mo binds`
        : `cap ${LTV_HORIZON_MONTHS}mo binds`,
      accent: 'var(--accent-cool)',
    },
    {
      title: 'LTV · sales-led',
      formula: `ARPA ${fmtMoneyScaled(slArpa, { precision: 0 })} × GM ${(gm * 100).toFixed(0)}% × min(${LTV_HORIZON_MONTHS}, ${slLifeRaw.toFixed(0)}) mo ÷ 12`,
      result: fmtMoneyScaled(slLtv, { precision: 1 }),
      note: slLifeRaw < LTV_HORIZON_MONTHS
        ? `life ${slLifeRaw.toFixed(0)}mo binds`
        : `cap ${LTV_HORIZON_MONTHS}mo binds`,
      accent: 'var(--accent-good)',
    },
    {
      title: 'LTV / CAC · SS',
      formula: `${fmtMoneyScaled(ssLtv, { precision: 1 })} ÷ ${fmtMoneyScaled(ssCac, { precision: 0 })} CAC`,
      result: fmtNumberX(ssRatio, 1),
      note: `effective life ${ssLife.toFixed(0)}mo`,
      accent: 'var(--accent-cool)',
    },
    {
      title: 'LTV / CAC · SL',
      formula: `${fmtMoneyScaled(slLtv, { precision: 1 })} ÷ ${fmtMoneyScaled(slCac, { precision: 0 })} CAC`,
      result: fmtNumberX(slRatio, 1),
      note: `effective life ${slLife.toFixed(0)}mo`,
      accent: 'var(--accent-good)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
      gap: 10,
    }}>
      {items.map(it => <Callout key={it.title} {...it} />)}
    </div>
  );
}
