'use client';

import { useState } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';
import type { MonthlyResult, PeriodResult } from '@/lib/revenue/types';
import { FY25_MONTHLY } from '@/lib/revenue/historical';

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

/** FY25 historical: ARR = ending_arr, MRR = ending_arr/12, Revenue = period total. */
function getHistValue(p: PeriodResult, metric: Metric): number {
  if (metric === 'arr') return p.ending_arr;
  if (metric === 'mrr') return p.ending_arr / 12;
  return p.total_revenue;
}

const FY25_LABELS = [
  'Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25',
  'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25',
];

export default function ArrTrendChart() {
  const { results, activeScenario } = useRevenue();
  const [metric, setMetric] = useState<Metric>('arr');

  // FY25 actual (12 months) — same across scenarios
  const histSeries = FY25_MONTHLY.map(p => getHistValue(p, metric));
  const baseSeries = results.base.monthly.map(m => getValue(m, metric));
  const upSeries = results.upside.monthly.map(m => getValue(m, metric));
  const downSeries = results.downside.monthly.map(m => getValue(m, metric));

  // Forecast lines anchor at the last FY25 point (Dec 25) so the line is continuous.
  const HIST_LEN = histSeries.length;        // 12
  const FCST_LEN = baseSeries.length;        // 24
  const TOTAL_LEN = HIST_LEN + FCST_LEN;     // 36
  const histAnchor = histSeries[HIST_LEN - 1];

  const W = 560;
  const H = 200;
  const padL = 40;
  const padR = 50;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const allValues = [...histSeries, ...baseSeries, ...upSeries, ...downSeries];
  const minVal = 0;
  const maxVal = Math.max(...allValues) * 1.05;

  const x = (i: number) => padL + (i / (TOTAL_LEN - 1)) * innerW;
  const y = (v: number) => padT + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  // Forecast series start at index HIST_LEN-1 with the hist anchor, then the 24 forecast points.
  const fcstX = (i: number) => x(HIST_LEN - 1 + i);
  const histPath = histSeries.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const fcstPath = (series: number[]) =>
    `M ${fcstX(0)} ${y(histAnchor)} ` +
    series.map((v, i) => `L ${fcstX(i + 1)} ${y(v)}`).join(' ');

  // Shaded band between upside and downside (forecast portion only, anchored at Dec 25)
  const bandPath =
    `M ${fcstX(0)} ${y(histAnchor)} `
    + upSeries.map((v, i) => `L ${fcstX(i + 1)} ${y(v)}`).join(' ')
    + ' '
    + downSeries.slice().reverse().map((v, i) => {
        const idx = downSeries.length - 1 - i;
        return `L ${fcstX(idx + 1)} ${y(v)}`;
      }).join(' ')
    + ` L ${fcstX(0)} ${y(histAnchor)} Z`;

  // y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1.0].map(t => minVal + t * (maxVal - minVal));
  // x-axis labels — every 3 months across full 36-month timeline
  const allLabels = [...FY25_LABELS, ...results.base.monthly.map(m => m.calendar_label)];

  const lineColor = (s: 'base' | 'up' | 'down') => {
    if (s === 'base') return 'var(--ink)';
    if (s === 'up')   return 'var(--accent-good)';
    return 'var(--accent-warn)';
  };

  // Vertical divider between FY25 actual and forecast, drawn just before Jan 26
  const dividerX = (x(HIST_LEN - 1) + x(HIST_LEN)) / 2;

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="hand" style={{ fontSize: 18 }}>
          36-month {metric.toUpperCase()} trend · FY25 actual + 3 scenarios
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
        {allLabels.map((label, i) => i % 3 === 0 && (
          <text key={i} x={x(i)} y={H - padB + 14} textAnchor="middle"
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
            {label}
          </text>
        ))}
        {/* FY25 actual region — soft backdrop */}
        <rect x={padL} y={padT} width={dividerX - padL} height={innerH}
          fill="var(--ink)" opacity={0.025} />
        {/* divider between actual and forecast */}
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
        {/* shaded band */}
        <path d={bandPath} fill="color-mix(in oklch, var(--accent-cool) 12%, white)"
              stroke="none" opacity={0.5} />
        {/* FY25 actual line */}
        <path d={histPath} fill="none" stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="2,2" />
        {/* forecast lines */}
        <path d={fcstPath(downSeries)} fill="none" stroke={lineColor('down')} strokeWidth={1.5} strokeDasharray="3,2" />
        <path d={fcstPath(upSeries)}   fill="none" stroke={lineColor('up')}   strokeWidth={1.5} strokeDasharray="3,2" />
        <path d={fcstPath(baseSeries)} fill="none" stroke={lineColor('base')} strokeWidth={2} />
        {/* highlight active scenario */}
        {activeScenario !== 'base' && (() => {
          const s = activeScenario === 'upside' ? upSeries : downSeries;
          return <path d={fcstPath(s)} fill="none" stroke={lineColor(activeScenario === 'upside' ? 'up' : 'down')} strokeWidth={2.5} />;
        })()}
      </svg>
      {/* legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 11, color: 'var(--ink-3)' }}>
        <Legend color="var(--ink-3)" label="FY25 actual" dashed />
        <Legend color={lineColor('up')} label="Upside" />
        <Legend color={lineColor('base')} label="Base" />
        <Legend color={lineColor('down')} label="Downside" />
      </div>
    </div>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 14, height: 2, display: 'inline-block',
        background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 3px, transparent 3px 6px)` : color,
      }} />
      <span>{label}</span>
    </div>
  );
}
