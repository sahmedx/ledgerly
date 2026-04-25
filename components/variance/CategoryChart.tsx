'use client';

import { VENDOR_SERIES } from '@/lib/data';
import { useOverrides, useTweaks } from '@/lib/contexts';

const CHART_CATS: Array<{ label: string; match: (cat: string) => boolean }> = [
  { label: 'Cloud',      match: c => c === 'Cloud' || c === 'Infra' },
  { label: 'SaaS',       match: c => c === 'SaaS' || c === 'Observability' || c === 'Security' },
  { label: 'Marketing',  match: c => c === 'Marketing' },
  { label: 'Facilities', match: c => c === 'Facilities' },
  { label: 'Data',       match: c => c === 'Data' || c === 'Analytics' },
  { label: 'HR/Payroll', match: c => c === 'HR' || c === 'Payroll' || c === 'Legal/Fin' || c === 'Pmt proc.' },
];

export default function CategoryChart() {
  const { overrides } = useOverrides();
  const { tweaks } = useTweaks();

  const chartData = CHART_CATS.map(({ label, match }) => {
    const vendors = VENDOR_SERIES.filter(v => match(v.cat));
    let actual = 0, budget = 0;
    for (const v of vendors) {
      for (let i = 0; i < 12; i++) {
        actual += overrides[v.name]?.[i] !== undefined ? overrides[v.name][i] : v.series[i].value;
        budget += v.series[i].budget;
      }
    }
    return {
      label,
      actual: Math.round(actual / 1000),
      budget: Math.round(budget / 1000),
      isOver: actual > budget,
    };
  });

  const maxVal = Math.max(...chartData.map(d => Math.max(d.actual, d.budget)));

  return (
    <div className="sketch-box" style={{ marginTop: 14, background: '#fff', padding: '12px 14px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 18, fontWeight: 700 }}>
          By category · FY26 forecast
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>click a bar to drill in</div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {chartData.map(({ label, actual, budget, isOver }) => {
          const actualPct = (actual / maxVal) * 92;
          const budgetPct = (budget / maxVal) * 92;
          return (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px', alignItems: 'center', gap: 10, fontSize: 12 }}>
              <div>{label}</div>
              <div style={{ height: 18, background: '#f3f0e3', position: 'relative', border: '1px solid var(--line-softer)' }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${actualPct}%`,
                  background: isOver && tweaks.varianceColor
                    ? 'color-mix(in oklch, var(--accent-warn) 40%, white)'
                    : '#e4e1d4',
                }} />
                <div style={{
                  position: 'absolute',
                  top: -2,
                  bottom: -2,
                  left: `${budgetPct}%`,
                  width: 2,
                  background: 'var(--ink)',
                }} title="budget line" />
              </div>
              <div className="num" style={{ textAlign: 'right' }}>
                ${actual}k <span style={{ color: 'var(--ink-4)' }}>/ ${budget}k</span>
              </div>
            </div>
          );
        })}
      </div>
      {tweaks.showAnnotations && (
        <div className="note" style={{ position: 'absolute', top: 70, right: 30, width: 130, transform: 'rotate(2deg)' }}>
          vertical line =<br />plan
        </div>
      )}
    </div>
  );
}
