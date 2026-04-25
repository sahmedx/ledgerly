'use client';

import { useRevenue } from '@/lib/revenue/contexts';

const W = 560, H = 220;
const padL = 44, padR = 16, padT = 16, padB = 28;
const AGES = 18;

export default function SeatExpansionChart() {
  const { assumptions: A } = useRevenue();
  const ss = A.self_serve;

  const plusInit = ss.initial_seats_per_workspace.plus;
  const bizInit  = ss.initial_seats_per_workspace.business_small;
  const plusG = ss.monthly_seat_growth_rate.plus;
  const bizG  = ss.monthly_seat_growth_rate.business_small;
  const threshold = ss.graduation_seat_threshold;

  const plus = Array.from({ length: AGES }, (_, a) => plusInit * Math.pow(1 + plusG, a));
  const biz  = Array.from({ length: AGES }, (_, a) => bizInit  * Math.pow(1 + bizG,  a));

  const maxV = Math.max(...plus, ...biz, threshold) * 1.1;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (a: number) => padL + (a / (AGES - 1)) * innerW;
  const y = (v: number) => padT + innerH - (v / maxV) * innerH;

  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div className="hand" style={{ fontSize: 18 }}>Seat expansion · per workspace by age</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <Sw color="var(--accent-cool)" label="Plus" />
          <Sw color="var(--accent-good)" label="Business (small)" />
          <Sw color="var(--ink-4)" label={`Graduation · ${threshold} seats`} dashed />
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
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}
        {/* Graduation threshold */}
        <line
          x1={padL} y1={y(threshold)}
          x2={W - padR} y2={y(threshold)}
          stroke="var(--ink-4)" strokeWidth={1} strokeDasharray="4 3"
        />
        <path d={path(plus)} fill="none" stroke="var(--accent-cool)" strokeWidth={1.5} />
        <path d={path(biz)}  fill="none" stroke="var(--accent-good)" strokeWidth={1.5} />
        {Array.from({ length: AGES }, (_, a) => a % 3 === 0 && (
          <text key={a} x={x(a)} y={H - padB + 14} textAnchor="middle"
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
            age {a}
          </text>
        ))}
      </svg>
      <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>
        Curves derived from <code>initial_seats × (1 + growth)<sup>age</sup></code>. Edit drivers in the assumptions panel.
      </div>
    </div>
  );
}

function Sw({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        display: 'inline-block',
        width: 14, height: 0,
        borderTop: `2px ${dashed ? 'dashed' : 'solid'} ${color}`,
      }} />
      <span>{label}</span>
    </span>
  );
}
