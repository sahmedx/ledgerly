'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { FY24_ENDING_ARR, FY25_MONTHLY } from '@/lib/revenue/historical';

const W = 580, H = 200;
const padL = 50, padR = 16, padT = 16, padB = 30;

const FY25_LABELS = [
  'Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25',
  'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25',
];

export default function BurnMultipleTrend() {
  const { results, activeScenario } = useRevenue();
  const monthly = results[activeScenario].monthly;

  // FY25 historical: burn = max(0, -GAAP op income) / net-new ARR (annualized).
  const histSeries = FY25_MONTHLY.map((p, i) => {
    const prevArr = i === 0 ? FY24_ENDING_ARR : FY25_MONTHLY[i - 1].ending_arr;
    const netNew = p.ending_arr - prevArr;
    const opLoss = Math.max(0, -p.operating_income_gaap);
    const value = netNew > 0 ? opLoss / netNew : null;
    return { label: FY25_LABELS[i], value, historical: true as const };
  });

  // Burn multiple is undefined when net new ARR <= 0; treat 0 as "n/a" → null
  const fcstSeries = monthly.map(m => ({
    label: m.calendar_label,
    value: m.kpis.burn_multiple > 0 ? m.kpis.burn_multiple : null,
    historical: false as const,
  }));

  const series: Array<{ label: string; value: number | null; historical: boolean }> = [
    ...histSeries,
    ...fcstSeries,
  ];
  const histLen = histSeries.length;

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
            max(0, −op income) ÷ net new ARR · FY25 actual + plan
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

        {/* Public-peer median (~0.8 for high-growth public SaaS) */}
        <line x1={padL} y1={y(0.80)} x2={W - padR} y2={y(0.80)}
          stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="1 3" opacity={0.55} />
        <text x={W - padR + 4} y={y(0.80) + 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-3)' }}>
          peer
        </text>

        {[0, maxV / 2, maxV].map((v, i) => (
          <text key={i} x={padL - 6} y={y(v) + 3} textAnchor="end"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
            {v.toFixed(1)}×
          </text>
        ))}

        {/* FY25 actual region — soft backdrop + divider */}
        {histLen > 0 && (() => {
          const dividerX = (x(histLen - 1) + x(histLen)) / 2;
          return (
            <g>
              <rect x={padL} y={padT} width={dividerX - padL} height={innerH}
                fill="var(--ink)" opacity={0.025} />
              <line x1={dividerX} y1={padT} x2={dividerX} y2={padT + innerH}
                stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="2 3" opacity={0.6} />
              <text x={dividerX - 4} y={padT + 10} textAnchor="end"
                style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 9, fill: 'var(--ink-3)' }}>
                actual
              </text>
              <text x={dividerX + 4} y={padT + 10} textAnchor="start"
                style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 9, fill: 'var(--ink-3)' }}>
                forecast
              </text>
            </g>
          );
        })()}

        <path d={path} fill="none" stroke="var(--ink)" strokeWidth={1.5} />

        {series.map((s, i) => s.value != null && (
          <circle key={i} cx={x(i)} cy={y(s.value)} r={2}
            fill={s.historical ? 'var(--ink-4)' : '#fff'}
            stroke="var(--ink)" strokeWidth={1} />
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
