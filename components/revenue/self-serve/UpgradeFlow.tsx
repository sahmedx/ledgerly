'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtCount } from '@/lib/revenue/format';
import LegendSwatch from '../shared/LegendSwatch';

const W = 560, H = 220;
const padL = 48, padR = 56, padT = 16, padB = 28;

export default function UpgradeFlow() {
  const { results, activeScenario } = useRevenue();
  const r = results[activeScenario];
  const m = r.monthly;

  const upgrades = m.map(x => x.self_serve.plus_to_business_upgrades);
  // Buildup = cumulative upgraded workspaces (decay-free proxy for upgrade-driven Business cohort growth)
  const cumulative: number[] = [];
  let acc = 0;
  for (const u of upgrades) { acc += u; cumulative.push(acc); }

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxBars = Math.max(...upgrades, 1);
  const maxLine = Math.max(...cumulative, 1);

  const barW = Math.max(2, (innerW / m.length) - 4);
  const x = (i: number) => padL + (i + 0.5) * (innerW / m.length);
  const yBars = (v: number) => padT + innerH - (v / (maxBars * 1.1)) * innerH;
  const yLine = (v: number) => padT + innerH - (v / (maxLine * 1.05)) * innerH;
  const yBaseline = padT + innerH;

  const linePath = cumulative.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${yLine(v)}`).join(' ');

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div className="hand" style={{ fontSize: 18 }}>Plus → Business upgrades</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <LegendSwatch color="color-mix(in oklch, var(--accent-good) 50%, white)" border="var(--accent-good)" label="Upgrades / mo" />
          <LegendSwatch shape="line" color="var(--ink)" label="Cumulative" />
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1.0].map((t, i) => {
          const v = t * maxBars * 1.1;
          return (
            <g key={i}>
              <line x1={padL} y1={yBars(v)} x2={W - padR} y2={yBars(v)}
                stroke="var(--line-softer)" strokeWidth={1} />
              <text x={padL - 6} y={yBars(v) + 3} textAnchor="end"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
                {fmtCount(v)}
              </text>
            </g>
          );
        })}
        {m.map((mo, i) => (
          <rect
            key={i}
            x={x(i) - barW / 2}
            y={yBars(upgrades[i])}
            width={barW}
            height={yBaseline - yBars(upgrades[i])}
            fill="color-mix(in oklch, var(--accent-good) 50%, white)"
            stroke="var(--accent-good)"
            strokeWidth={1}
          >
            <title>{`${mo.calendar_label}: ${fmtCount(upgrades[i])} upgrades`}</title>
          </rect>
        ))}
        <path d={linePath} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
        {[0, 0.5, 1.0].map((t, i) => {
          const v = t * maxLine * 1.05;
          return (
            <text key={i} x={W - padR + 6} y={yLine(v) + 3}
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
              {fmtCount(v)}
            </text>
          );
        })}
        {m.map((mo, i) => i % 3 === 0 && (
          <text key={i} x={x(i)} y={H - padB + 14} textAnchor="middle"
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
            {mo.calendar_label}
          </text>
        ))}
      </svg>
    </div>
  );
}

