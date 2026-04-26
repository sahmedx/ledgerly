'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';
import type { Results, ScenarioId } from '@/lib/revenue/types';

const W = 240, H = 130;
const padL = 30, padR = 8, padT = 16, padB = 22;

const SCENARIOS: { id: ScenarioId; label: string; color: string }[] = [
  { id: 'downside', label: 'Downside', color: 'var(--accent-warn)' },
  { id: 'base',     label: 'Base',     color: 'var(--ink)' },
  { id: 'upside',   label: 'Upside',   color: 'var(--accent-good)' },
];

export default function SmallMultiplesArr() {
  const { results } = useRevenue();

  // Shared y-axis across all three so they're comparable
  const allArr = SCENARIOS.flatMap(s => results[s.id].monthly.map(m => m.total.arr));
  const maxV = Math.max(...allArr) * 1.05;
  const minV = Math.min(...allArr, results.base.starting_arr) * 0.95;

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div className="hand" style={{ fontSize: 18, marginBottom: 8 }}>ARR trajectory · scenario comparison</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {SCENARIOS.map(s => (
          <Mini
            key={s.id}
            label={s.label}
            color={s.color}
            data={results[s.id]}
            maxV={maxV}
            minV={minV}
          />
        ))}
      </div>
    </div>
  );
}

function Mini({ label, color, data, maxV, minV }: {
  label: string; color: string; data: Results; maxV: number; minV: number;
}) {
  const m = data.monthly;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i: number) => padL + (i / (m.length - 1)) * innerW;
  const y = (v: number) => padT + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const path = m.map((mm, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(mm.total.arr)}`).join(' ');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{
          fontFamily: 'var(--font-architects-daughter), cursive',
          fontSize: 12,
          fontWeight: 700,
          color,
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 11,
          color: 'var(--ink-2)',
          fontWeight: 600,
        }}>{fmtMoneyScaled(data.ending_arr, { precision: 1 })}</div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)}
              stroke="var(--line-softer)" strokeWidth={1} />
            <text x={padL - 4} y={y(v) + 3} textAnchor="end"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 8, fill: 'var(--ink-4)' }}>
              {fmtMoneyScaled(v, { precision: 0 })}
            </text>
          </g>
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth={1.6} />

        {[0, m.length - 1].map(i => (
          <text key={i} x={x(i)} y={H - padB + 12} textAnchor={i === 0 ? 'start' : 'end'}
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 9, fill: 'var(--ink-3)' }}>
            {m[i].calendar_label}
          </text>
        ))}
      </svg>
    </div>
  );
}
