'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtCount, fmtMoneyScaled } from '@/lib/revenue/format';

const W = 560, H = 240;
const padL = 48, padR = 56, padT = 16, padB = 28;

export default function TierComposition() {
  const { results, activeScenario } = useRevenue();
  const r = results[activeScenario];
  const m = r.monthly;

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const plus = m.map(x => x.self_serve.active_workspaces.plus);
  const biz  = m.map(x => x.self_serve.active_workspaces.business_small);
  const totalWs = plus.map((p, i) => p + biz[i]);
  const arr = m.map(x => x.self_serve.arr.plus + x.self_serve.arr.business_small);

  const maxWs = Math.max(...totalWs);
  const maxArr = Math.max(...arr);

  const x = (i: number) => padL + (i / (m.length - 1)) * innerW;
  const yWs = (v: number) => padT + innerH - (v / (maxWs * 1.05)) * innerH;
  const yArr = (v: number) => padT + innerH - (v / (maxArr * 1.05)) * innerH;

  // Build stacked area paths
  const plusPathTop = plus.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${yWs(v)}`).join(' ');
  const plusBase = `L ${x(m.length - 1)} ${yWs(0)} L ${x(0)} ${yWs(0)} Z`;
  const stackTop = totalWs.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${yWs(v)}`).join(' ');
  // For Business band (between plus and total), trace top forward then plus reverse
  const bizBand = stackTop +
    ' ' + [...plus].reverse().map((v, i) => `L ${x(plus.length - 1 - i)} ${yWs(v)}`).join(' ') + ' Z';

  const arrPath = arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${yArr(v)}`).join(' ');

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div className="hand" style={{ fontSize: 18 }}>Tier composition · workspaces & ARR</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <Sw color="color-mix(in oklch, var(--accent-cool) 35%, white)" border="var(--accent-cool)" label="Plus ws" />
          <Sw color="color-mix(in oklch, var(--accent-good) 35%, white)" border="var(--accent-good)" label="Business ws" />
          <Sw color="var(--ink)" border="var(--ink)" label="Self-serve ARR" line />
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* y-axis (left) gridlines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((t, i) => {
          const v = t * maxWs * 1.05;
          return (
            <g key={i}>
              <line x1={padL} y1={yWs(v)} x2={W - padR} y2={yWs(v)}
                stroke="var(--line-softer)" strokeWidth={1} />
              <text x={padL - 6} y={yWs(v) + 3} textAnchor="end"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
                {fmtCount(v)}
              </text>
            </g>
          );
        })}
        {/* Plus area */}
        <path d={plusPathTop + ' ' + plusBase}
          fill="color-mix(in oklch, var(--accent-cool) 35%, white)"
          stroke="var(--accent-cool)" strokeWidth={1} />
        {/* Business band */}
        <path d={bizBand}
          fill="color-mix(in oklch, var(--accent-good) 35%, white)"
          stroke="var(--accent-good)" strokeWidth={1} />
        {/* ARR line on secondary axis */}
        <path d={arrPath} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
        {/* Right axis labels */}
        {[0, 0.5, 1.0].map((t, i) => {
          const v = t * maxArr * 1.05;
          return (
            <text key={i} x={W - padR + 6} y={yArr(v) + 3}
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
              {fmtMoneyScaled(v, { precision: 0 })}
            </text>
          );
        })}
        {/* x-axis labels every 3 months */}
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

function Sw({ color, border, label, line }: { color: string; border: string; label: string; line?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{
        display: 'inline-block',
        width: line ? 14 : 10,
        height: line ? 2 : 10,
        background: color,
        border: line ? 'none' : `1px solid ${border}`,
      }} />
      <span>{label}</span>
    </span>
  );
}
