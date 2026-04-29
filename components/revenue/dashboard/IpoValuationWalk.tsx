'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';

export default function IpoValuationWalk() {
  const { results, activeScenario, assumptions } = useRevenue();
  const r = results[activeScenario];
  // FY26 ending ARR (Dec 26) — the planning-horizon endpoint.
  const ending = r.annual[0].ending_arr;
  const m = assumptions.ipo_multiples;

  const tiers = [
    { label: 'Conservative', mult: m.low,  pillBg: '#f4f1e3' },
    { label: 'Mid',          mult: m.mid,  pillBg: '#fff4b8' },
    { label: 'Bull',         mult: m.high, pillBg: 'color-mix(in oklch, var(--accent-good) 18%, white)' },
  ];

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div className="hand" style={{ fontSize: 18, marginBottom: 8 }}>
        Implied IPO valuation · {fmtMoneyScaled(ending, { precision: 1 })} ARR
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
        FY26 ending ARR × public-SaaS multiple. Public peer comparables run roughly 8–18×.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {tiers.map(t => (
          <div key={t.label} style={{
            border: '1.5px solid var(--line)',
            background: t.pillBg,
            padding: '10px 12px',
            boxShadow: '1px 1px 0 var(--line)',
          }}>
            <div style={{
              fontSize: 11,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              fontFamily: 'var(--font-architects-daughter), cursive',
            }}>{t.label} · {t.mult}×</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 500, marginTop: 4 }}>
              {fmtMoneyScaled(ending * t.mult, { precision: 1 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
