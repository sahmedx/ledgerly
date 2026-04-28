'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { FY25_QUARTERLY } from '@/lib/revenue/historical';

const W = 580, H = 200;
const padL = 50, padR = 16, padT = 16, padB = 30;

interface Quarter {
  label: string;
  value: number;
  historical?: boolean;
}

export default function MagicNumberTrend() {
  const { results, activeScenario } = useRevenue();
  const monthly = results[activeScenario].monthly;

  // FY25 historical quarters: Q2'25, Q3'25, Q4'25 (Q1'25 needs Q4'24 ARR which we don't track)
  const histQuarters: Quarter[] = [];
  for (let q = 1; q < 4; q++) {
    const sm = FY25_QUARTERLY[q].sm_total;
    const arrDelta = FY25_QUARTERLY[q].ending_arr - FY25_QUARTERLY[q - 1].ending_arr;
    const value = sm > 0 ? arrDelta / sm : 0;
    const labels = ['Mar 25', 'Jun 25', 'Sep 25', 'Dec 25'];
    histQuarters.push({ label: labels[q], value, historical: true });
  }

  // Forecast quarters. Skip Q1'26 (Mar 26, i=2): needs 3 prior months of S&M which
  // don't exist before the model start — but FY25 Q4 covers it implicitly anyway.
  const fcstQuarters: Quarter[] = [6, 9, 12, 15, 18, 21, 24].map(t => ({
    label: monthly[t - 1].calendar_label,
    value: monthly[t - 1].kpis.magic_number,
  }));

  const quarters: Quarter[] = [...histQuarters, ...fcstQuarters];
  const histLen = histQuarters.length;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allVals = quarters.map(q => q.value).filter(Number.isFinite);
  const maxV = Math.max(1.4, ...allVals) * 1.1;
  const minV = Math.min(0, ...allVals) * 1.1;

  const x = (i: number) => padL + (i / (quarters.length - 1)) * innerW;
  const y = (v: number) => padT + innerH - ((v - minV) / (maxV - minV)) * innerH;

  const path = quarters.map((q, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(q.value)}`).join(' ');

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div className="hand" style={{ fontSize: 18 }}>Magic Number trend · quarterly</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            (ARR<sub>q</sub> − ARR<sub>q−1</sub>) × 4 ÷ S&M<sub>q−1</sub> · FY25 actual + plan
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          &gt; 1.0 = invest · &lt; 0.75 = pull back
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Reference bands */}
        <rect x={padL} y={y(maxV)} width={innerW} height={y(1.0) - y(maxV)}
          fill="var(--accent-good)" opacity={0.06} />
        <rect x={padL} y={y(0.75)} width={innerW} height={y(minV) - y(0.75)}
          fill="var(--accent-warn)" opacity={0.06} />

        {/* Reference lines */}
        <line x1={padL} y1={y(1.0)} x2={W - padR} y2={y(1.0)}
          stroke="var(--accent-good)" strokeWidth={1} strokeDasharray="3 2" opacity={0.7} />
        <line x1={padL} y1={y(0.75)} x2={W - padR} y2={y(0.75)}
          stroke="var(--accent-warn)" strokeWidth={1} strokeDasharray="3 2" opacity={0.7} />
        <text x={W - padR + 4} y={y(1.0) + 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--accent-good)' }}>
          1.0
        </text>
        <text x={W - padR + 4} y={y(0.75) + 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--accent-warn)' }}>
          0.75
        </text>

        {/* Public-peer median reference (~0.8 at $1B+ ARR scale) */}
        <line x1={padL} y1={y(0.80)} x2={W - padR} y2={y(0.80)}
          stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="1 3" opacity={0.55} />
        <text x={W - padR + 4} y={y(0.80) + 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-3)' }}>
          peer
        </text>

        {/* Y-axis labels */}
        {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
          <text key={i} x={padL - 6} y={y(v) + 3} textAnchor="end"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
            {v.toFixed(2)}×
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

        {quarters.map((q, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(q.value)} r={3}
              fill={q.historical ? 'var(--ink-4)' : '#fff'}
              stroke="var(--ink)" strokeWidth={1.2} />
            <text x={x(i)} y={y(q.value) - 7} textAnchor="middle"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9,
                fill: q.historical ? 'var(--ink-3)' : 'var(--ink)', fontWeight: 600 }}>
              {q.value.toFixed(2)}×
            </text>
            <text x={x(i)} y={H - padB + 14} textAnchor="middle"
              style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
              {q.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
