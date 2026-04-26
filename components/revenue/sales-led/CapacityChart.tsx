'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled, fmtCount } from '@/lib/revenue/format';
import LegendSwatch from '../shared/LegendSwatch';

const W = 580, H = 240;
const padL = 56, padR = 56, padT = 16, padB = 32;

export default function CapacityChart() {
  const { results, activeScenario, assumptions } = useRevenue();
  const monthly = results[activeScenario].monthly;
  const taperStart = assumptions.sales_led.pipeline_taper_start_month;
  const taperEnd = assumptions.sales_led.pipeline_taper_end_month;

  const reps = monthly.map(m => m.sales_led.active_reps);
  const cap = monthly.map(m => m.sales_led.productive_capacity_arr);
  // Total new ARR (named + capacity + graduation) annualised, so the line stays
  // continuous across the pipeline-to-capacity taper.
  const newArr = monthly.map(m =>
    (m.sales_led.new_arr_named_pipeline + m.sales_led.new_arr_capacity + m.sales_led.new_arr_graduation) * 12,
  );

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxArr  = Math.max(1, ...cap, ...newArr) * 1.1;
  const maxReps = Math.max(1, ...reps) * 1.15;

  const x = (i: number) => padL + (i / (monthly.length - 1)) * innerW;
  const yArr  = (v: number) => padT + innerH - (v / maxArr) * innerH;
  const yReps = (v: number) => padT + innerH - (v / maxReps) * innerH;

  const path = (arr: number[], y: (v: number) => number) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  const taperStartX = x(Math.max(0, taperStart - 1));
  const taperEndX = x(Math.max(0, taperEnd - 1));

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div className="hand" style={{ fontSize: 18 }}>Sales capacity build</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Reps · productive capacity ($ ARR/yr) · total new ARR annualised (named + capacity + grad)
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

        {/* Pipeline taper band: pipeline weight 1.0 → 0.0 across [taperStart, taperEnd] */}
        <rect
          x={taperStartX}
          y={padT}
          width={Math.max(0, taperEndX - taperStartX)}
          height={innerH}
          fill="var(--accent-warn)"
          opacity={0.06}
        />
        <line
          x1={taperStartX} y1={padT}
          x2={taperStartX} y2={padT + innerH}
          stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="4 3"
        />
        <line
          x1={taperEndX} y1={padT}
          x2={taperEndX} y2={padT + innerH}
          stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="4 3"
        />
        <text
          x={(taperStartX + taperEndX) / 2} y={padT + 11} textAnchor="middle"
          style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}
        >
          pipeline → capacity taper
        </text>

        {/* Lines */}
        <path d={path(cap, yArr)} fill="none" stroke="var(--accent-cool)" strokeWidth={1.5} />
        <path d={path(newArr, yArr)} fill="none" stroke="var(--accent-good)" strokeWidth={1.5} />
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
        <span>Capacity {fmtMoneyScaled(cap[cap.length - 1])} · New (m24) {fmtMoneyScaled(newArr[newArr.length - 1])}</span>
      </div>
    </div>
  );
}

