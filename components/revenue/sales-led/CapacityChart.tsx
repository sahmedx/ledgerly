'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled, fmtCount } from '@/lib/revenue/format';
import LegendSwatch from '../shared/LegendSwatch';

const W = 580, H = 240;
const padL = 56, padR = 56, padT = 16, padB = 32;

export default function CapacityChart() {
  const { results, activeScenario, assumptions } = useRevenue();
  const monthly = results[activeScenario].monthly;
  const seam = assumptions.sales_led.pipeline_capacity_seam_month;

  const reps = monthly.map(m => m.sales_led.active_reps);
  const cap = monthly.map(m => m.sales_led.productive_capacity_arr);
  // new_arr_capacity is per-month new ARR added; annualize to match productive_capacity_arr scale
  const newCapArr = monthly.map(m => m.sales_led.new_arr_capacity * 12);

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxArr  = Math.max(1, ...cap, ...newCapArr) * 1.1;
  const maxReps = Math.max(1, ...reps) * 1.15;

  const x = (i: number) => padL + (i / (monthly.length - 1)) * innerW;
  const yArr  = (v: number) => padT + innerH - (v / maxArr) * innerH;
  const yReps = (v: number) => padT + innerH - (v / maxReps) * innerH;

  const path = (arr: number[], y: (v: number) => number) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  const seamX = x(seam - 1);

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div className="hand" style={{ fontSize: 18 }}>Sales capacity build</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Reps · productive capacity ($ ARR/yr) · capacity-driven new ARR (annualised)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <LegendSwatch shape="line" color="var(--ink-3)" label="Active reps" dashed />
          <LegendSwatch shape="line" color="var(--accent-cool)" label="Capacity (ARR/yr)" />
          <LegendSwatch shape="line" color="var(--accent-good)" label="New ARR · annualised" />
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1.0].map((t, i) => {
          const v = t * maxArr;
          return (
            <g key={i}>
              <line x1={padL} y1={yArr(v)} x2={W - padR} y2={yArr(v)}
                stroke="var(--line-softer)" strokeWidth={1} />
              <text x={padL - 6} y={yArr(v) + 3} textAnchor="end"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
                {fmtMoneyScaled(v, { precision: 0 })}
              </text>
            </g>
          );
        })}

        {/* Right axis ticks (reps) */}
        {[0, 0.5, 1.0].map((t, i) => {
          const v = t * maxReps;
          return (
            <text key={i} x={W - padR + 6} y={yReps(v) + 3}
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
              {Math.round(v)}
            </text>
          );
        })}

        {/* Seam line at month 7 */}
        <line
          x1={seamX} y1={padT}
          x2={seamX} y2={padT + innerH}
          stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="4 3"
        />
        <text
          x={seamX + 4} y={padT + 11}
          style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}
        >
          ← named pipeline · capacity →
        </text>

        {/* Lines */}
        <path d={path(cap, yArr)} fill="none" stroke="var(--accent-cool)" strokeWidth={1.5} />
        <path d={path(newCapArr, yArr)} fill="none" stroke="var(--accent-good)" strokeWidth={1.5} />
        <path d={path(reps, yReps)} fill="none" stroke="var(--ink-3)" strokeWidth={1.2} strokeDasharray="3 2" />

        {/* Endpoint annotations */}
        <text
          x={x(monthly.length - 1) + 4} y={yArr(cap[cap.length - 1]) + 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--accent-cool)', fontWeight: 600 }}
        >
          {fmtMoneyScaled(cap[cap.length - 1])}
        </text>

        {/* Month axis */}
        {monthly.map((m, i) => (i % 3 === 0) && (
          <text key={i} x={x(i)} y={H - padB + 14} textAnchor="middle"
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
            {m.calendar_label}
          </text>
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>
        <span>Active reps end of period: {fmtCount(reps[reps.length - 1])}</span>
        <span>Capacity {fmtMoneyScaled(cap[cap.length - 1])} · New (m24) {fmtMoneyScaled(newCapArr[newCapArr.length - 1])}</span>
      </div>
    </div>
  );
}

