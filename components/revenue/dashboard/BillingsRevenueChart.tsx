'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';

export default function BillingsRevenueChart() {
  const { results, activeScenario } = useRevenue();
  const r = results[activeScenario];

  const W = 560;
  const H = 220;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const months = r.monthly;
  const billings = months.map(m => m.total.billings);
  const revenue = months.map(m => m.total.revenue);

  const maxBars = Math.max(...billings, ...revenue);

  // Bars are grouped: billings + revenue side-by-side per month
  const groupW = innerW / months.length;
  const barW = (groupW - 4) / 2;

  const yBars = (v: number) => padT + innerH - (v / (maxBars * 1.1)) * innerH;

  // x positions for month centers
  const xCenter = (i: number) => padL + groupW * i + groupW / 2;
  const yBaseline = padT + innerH;

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <div className="hand" style={{ fontSize: 18 }}>
          Billings vs Revenue · monthly
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <Legend swatch={<span style={{
            display: 'inline-block', width: 10, height: 10,
            background: 'color-mix(in oklch, var(--accent-cool) 50%, white)',
            border: '1px solid var(--accent-cool)',
          }} />} label="Billings" />
          <Legend swatch={<span style={{
            display: 'inline-block', width: 10, height: 10,
            background: 'color-mix(in oklch, var(--ink) 18%, white)',
            border: '1px solid var(--ink)',
          }} />} label="Revenue" />
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* y-axis (left, bars) */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((t, i) => {
          const v = t * maxBars * 1.1;
          return (
            <g key={i}>
              <line x1={padL} y1={yBars(v)} x2={W - padR} y2={yBars(v)}
                stroke="var(--line-softer)" strokeWidth={1} />
              <text x={padL - 6} y={yBars(v) + 3} textAnchor="end"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
                {fmtMoneyScaled(v, { precision: 0 })}
              </text>
            </g>
          );
        })}
        {/* bars */}
        {months.map((m, i) => {
          const xb = xCenter(i) - barW - 1;
          const xr = xCenter(i) + 1;
          return (
            <g key={i}>
              <rect x={xb} y={yBars(billings[i])} width={barW}
                height={yBaseline - yBars(billings[i])}
                fill="color-mix(in oklch, var(--accent-cool) 50%, white)"
                stroke="var(--accent-cool)" strokeWidth={1} />
              <rect x={xr} y={yBars(revenue[i])} width={barW}
                height={yBaseline - yBars(revenue[i])}
                fill="color-mix(in oklch, var(--ink) 18%, white)"
                stroke="var(--ink)" strokeWidth={1} />
              {i % 3 === 0 && (
                <text x={xCenter(i)} y={H - padB + 14} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
                  {m.calendar_label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {swatch}
      <span>{label}</span>
    </span>
  );
}
