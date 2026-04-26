'use client';

import { useRevenue } from '@/lib/revenue/contexts';

const W = 580, H = 200;
const padL = 50, padR = 16, padT = 16, padB = 30;

export default function BurnMultipleTrend() {
  const { results, activeScenario } = useRevenue();
  const monthly = results[activeScenario].monthly;

  // Burn multiple is undefined when net new ARR <= 0; treat 0 as "n/a" → null
  const series = monthly.map(m => ({
    label: m.calendar_label,
    value: m.kpis.burn_multiple > 0 ? m.kpis.burn_multiple : null,
  }));

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const vals = series.map(s => s.value).filter((v): v is number => v != null);
  const maxV = Math.max(2.5, ...vals) * 1.1;

  const x = (i: number) => padL + (i / (series.length - 1)) * innerW;
  const y = (v: number) => padT + innerH - (v / maxV) * innerH;

  // Build path skipping null segments
  let path = '';
  let lastValid = false;
  series.forEach((s, i) => {
    if (s.value == null) {
      lastValid = false;
      return;
    }
    const cmd = !lastValid ? 'M' : 'L';
    path += `${cmd} ${x(i)} ${y(s.value)} `;
    lastValid = true;
  });

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div className="hand" style={{ fontSize: 18 }}>Burn multiple trend · monthly</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            max(0, −op income) ÷ net new ARR
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          &lt; 1.0 = efficient · &gt; 2.0 = inefficient
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Reference bands */}
        <rect x={padL} y={y(maxV)} width={innerW} height={y(1.0) - y(maxV)}
          fill="var(--accent-good)" opacity={0.06} />
        <rect x={padL} y={y(2.0)} width={innerW} height={y(0) - y(2.0)}
          fill="var(--accent-warn)" opacity={0.08} />

        <line x1={padL} y1={y(1.0)} x2={W - padR} y2={y(1.0)}
          stroke="var(--accent-good)" strokeWidth={1} strokeDasharray="3 2" opacity={0.7} />
        <line x1={padL} y1={y(2.0)} x2={W - padR} y2={y(2.0)}
          stroke="var(--accent-warn)" strokeWidth={1} strokeDasharray="3 2" opacity={0.7} />
        <text x={W - padR + 4} y={y(1.0) + 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--accent-good)' }}>
          1.0
        </text>
        <text x={W - padR + 4} y={y(2.0) + 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--accent-warn)' }}>
          2.0
        </text>

        {[0, maxV / 2, maxV].map((v, i) => (
          <text key={i} x={padL - 6} y={y(v) + 3} textAnchor="end"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
            {v.toFixed(1)}×
          </text>
        ))}

        <path d={path} fill="none" stroke="var(--ink)" strokeWidth={1.5} />

        {series.map((s, i) => s.value != null && (
          <circle key={i} cx={x(i)} cy={y(s.value)} r={2} fill="#fff" stroke="var(--ink)" strokeWidth={1} />
        ))}

        {series.map((s, i) => (i % 3 === 0) && (
          <text key={i} x={x(i)} y={H - padB + 14} textAnchor="middle"
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
            {s.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
