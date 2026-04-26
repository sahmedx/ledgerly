'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';
import LegendSwatch from '../shared/LegendSwatch';

const W = 580, H = 220;
const padL = 56, padR = 16, padT = 14, padB = 32;

export default function NewArrBySource() {
  const { results, activeScenario, assumptions } = useRevenue();
  const monthly = results[activeScenario].monthly;
  const seam = assumptions.sales_led.pipeline_capacity_seam_month;

  const named  = monthly.map(m => m.sales_led.new_arr_named_pipeline);
  const cap    = monthly.map(m => m.sales_led.new_arr_capacity);
  const grad   = monthly.map(m => m.sales_led.new_arr_graduation);
  const totals = monthly.map((_, i) => named[i] + cap[i] + grad[i]);

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const colW = innerW / monthly.length;
  const barW = colW * 0.74;
  const x = (i: number) => padL + i * colW + (colW - barW) / 2;

  const maxV = Math.max(1, ...totals) * 1.1;
  const y = (v: number) => padT + innerH - (v / maxV) * innerH;
  const h = (v: number) => (v / maxV) * innerH;

  const seamX = padL + (seam - 1) * colW;

  const sumNamed  = named.reduce((a, b) => a + b, 0);
  const sumCap    = cap.reduce((a, b) => a + b, 0);
  const sumGrad   = grad.reduce((a, b) => a + b, 0);
  const sumTotal  = sumNamed + sumCap + sumGrad;

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div className="hand" style={{ fontSize: 18 }}>New sales-led ARR · by source</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Named pipeline (m1–6) · capacity (m7+) · graduation (all)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <LegendSwatch color="var(--accent-warn)" label="Named" />
          <LegendSwatch color="var(--accent-cool)" label="Capacity" />
          <LegendSwatch color="var(--accent-good)" label="Graduation" />
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1.0].map((t, i) => {
          const v = t * maxV;
          return (
            <g key={i}>
              <line x1={padL} y1={y(v)} x2={W - padR} y2={y(v)}
                stroke="var(--line-softer)" strokeWidth={1} />
              <text x={padL - 6} y={y(v) + 3} textAnchor="end"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
                {fmtMoneyScaled(v, { precision: 0 })}
              </text>
            </g>
          );
        })}

        {/* Seam line */}
        <line
          x1={seamX} y1={padT}
          x2={seamX} y2={padT + innerH}
          stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="4 3"
        />

        {monthly.map((m, i) => {
          const nH = h(named[i]);
          const cH = h(cap[i]);
          const gH = h(grad[i]);
          const yCursor = y(named[i]);
          return (
            <g key={i}>
              <rect x={x(i)} width={barW} y={yCursor} height={nH}
                fill="var(--accent-warn)" stroke="var(--ink)" strokeWidth={0.4} />
              <rect x={x(i)} width={barW} y={y(named[i] + cap[i])} height={cH}
                fill="var(--accent-cool)" stroke="var(--ink)" strokeWidth={0.4} />
              <rect x={x(i)} width={barW} y={y(named[i] + cap[i] + grad[i])} height={gH}
                fill="var(--accent-good)" stroke="var(--ink)" strokeWidth={0.4} />
              {(i % 3 === 0) && (
                <text x={x(i) + barW / 2} y={H - padB + 14} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
                  {m.calendar_label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>
        <span>Total new ARR (18mo): {fmtMoneyScaled(sumTotal)}</span>
        <span>
          Named {fmtMoneyScaled(sumNamed)} · Capacity {fmtMoneyScaled(sumCap)} · Grad {fmtMoneyScaled(sumGrad)}
        </span>
      </div>
    </div>
  );
}

