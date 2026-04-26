'use client';

import { useState } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';
import type { MonthlyResult } from '@/lib/revenue/types';

type Metric = 'arr' | 'mrr' | 'revenue';

const METRICS: { id: Metric; label: string }[] = [
  { id: 'arr',     label: 'ARR' },
  { id: 'mrr',     label: 'MRR' },
  { id: 'revenue', label: 'Revenue' },
];

function getValue(m: MonthlyResult, metric: Metric): number {
  if (metric === 'arr') return m.total.arr;
  if (metric === 'mrr') return m.total.mrr;
  return m.total.revenue;
}

export default function ArrTrendChart() {
  const { results, activeScenario } = useRevenue();
  const [metric, setMetric] = useState<Metric>('arr');

  const baseSeries = results.base.monthly.map(m => getValue(m, metric));
  const upSeries = results.upside.monthly.map(m => getValue(m, metric));
  const downSeries = results.downside.monthly.map(m => getValue(m, metric));

  const W = 560;
  const H = 200;
  const padL = 40;
  const padR = 50;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allValues = [...baseSeries, ...upSeries, ...downSeries];
  const minVal = 0;
  const maxVal = Math.max(...allValues) * 1.05;

  const x = (i: number) => padL + (i / (baseSeries.length - 1)) * innerW;
  const y = (v: number) => padT + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  const path = (series: number[]) =>
    series.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  // Shaded band between upside and downside
  const bandPath =
    upSeries.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ')
    + ' '
    + downSeries.slice().reverse().map((v, i) => {
        const idx = downSeries.length - 1 - i;
        return `L ${x(idx)} ${y(v)}`;
      }).join(' ')
    + ' Z';

  // y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1.0].map(t => minVal + t * (maxVal - minVal));
  // x-axis labels — every 3 months
  const monthLabels = results.base.monthly.map(m => m.calendar_label);

  const lineColor = (s: 'base' | 'up' | 'down') => {
    if (s === 'base') return 'var(--ink)';
    if (s === 'up')   return 'var(--accent-good)';
    return 'var(--accent-warn)';
  };

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="hand" style={{ fontSize: 18 }}>
          24-month {metric.toUpperCase()} trend · 3 scenarios
        </div>
        <div style={{ display: 'inline-flex', gap: 0, border: '1.2px solid var(--line-soft)', padding: 2, background: '#fcfbf7' }}>
          {METRICS.map(m => (
            <button key={m.id} onClick={() => setMetric(m.id)}
              style={{
                appearance: 'none', border: 0, cursor: 'pointer',
                padding: '3px 10px',
                fontSize: 11,
                fontFamily: 'var(--font-architects-daughter), cursive',
                background: metric === m.id ? 'var(--ink)' : 'transparent',
                color: metric === m.id ? 'var(--paper)' : 'var(--ink-3)',
                fontWeight: metric === m.id ? 700 : 400,
              }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* y-grid */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={y(t)} x2={W - padR} y2={y(t)}
              stroke="var(--line-softer)" strokeWidth={1} />
            <text x={padL - 6} y={y(t) + 3} textAnchor="end"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
              {fmtMoneyScaled(t, { precision: 0 })}
            </text>
          </g>
        ))}
        {/* x-axis labels (every 3) */}
        {monthLabels.map((label, i) => i % 3 === 0 && (
          <text key={i} x={x(i)} y={H - padB + 14} textAnchor="middle"
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
            {label}
          </text>
        ))}
        {/* shaded band */}
        <path d={bandPath} fill="color-mix(in oklch, var(--accent-cool) 12%, white)"
              stroke="none" opacity={0.5} />
        {/* lines */}
        <path d={path(downSeries)} fill="none" stroke={lineColor('down')} strokeWidth={1.5} strokeDasharray="3,2" />
        <path d={path(upSeries)}   fill="none" stroke={lineColor('up')}   strokeWidth={1.5} strokeDasharray="3,2" />
        <path d={path(baseSeries)} fill="none" stroke={lineColor('base')} strokeWidth={2} />
        {/* highlight active scenario */}
        {activeScenario !== 'base' && (() => {
          const s = activeScenario === 'upside' ? upSeries : downSeries;
          return <path d={path(s)} fill="none" stroke={lineColor(activeScenario === 'upside' ? 'up' : 'down')} strokeWidth={2.5} />;
        })()}
      </svg>
      {/* legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 11, color: 'var(--ink-3)' }}>
        <Legend color={lineColor('up')} label="Upside" />
        <Legend color={lineColor('base')} label="Base" />
        <Legend color={lineColor('down')} label="Downside" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 14, height: 2, background: color, display: 'inline-block' }} />
      <span>{label}</span>
    </div>
  );
}
