'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled, fmtPlainPct } from '@/lib/revenue/format';
import LegendSwatch from '../shared/LegendSwatch';

const W = 580, H = 240;
const padL = 56, padR = 56, padT = 16, padB = 32;

export default function ExistingDynamics() {
  const { results, activeScenario } = useRevenue();
  const monthly = results[activeScenario].monthly;

  const expansion   = monthly.map(m => m.sales_led.expansion_arr);
  const contraction = monthly.map(m => -m.sales_led.contraction_arr);
  const churn       = monthly.map(m => -m.sales_led.churn_arr);
  const nrr         = monthly.map(m => m.kpis.nrr_ttm);

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxBar = Math.max(1, ...expansion, ...contraction.map(Math.abs), ...churn.map(Math.abs)) * 1.15;
  const minBar = -maxBar;

  const colW = innerW / monthly.length;
  const barW = colW * 0.72;
  const x = (i: number) => padL + i * colW + (colW - barW) / 2;
  const yBar = (v: number) => padT + innerH * (maxBar - v) / (maxBar - minBar);

  const yMid = yBar(0);

  // NRR line on right axis
  const nrrMin = 0.95;
  const nrrMax = Math.max(1.20, ...nrr.filter(Number.isFinite)) * 1.02;
  const yNrr = (v: number) => {
    if (!Number.isFinite(v)) return null;
    const cl = Math.max(nrrMin, Math.min(nrrMax, v));
    return padT + innerH - ((cl - nrrMin) / (nrrMax - nrrMin)) * innerH;
  };
  const nrrPath = nrr.map((v, i) => {
    const y = yNrr(v);
    return y == null ? null : `${i === 0 ? 'M' : 'L'} ${x(i) + barW / 2} ${y}`;
  }).filter(Boolean).join(' ');

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div className="hand" style={{ fontSize: 18 }}>Existing customer dynamics</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Expansion · contraction · churn (sales-led only) + NRR (TTM)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <LegendSwatch color="var(--accent-good)" label="Expansion" />
          <LegendSwatch color="var(--accent-warn)" label="Contraction" />
          <LegendSwatch color="#c44" label="Churn" />
          <LegendSwatch shape="line" color="var(--ink)" label="NRR (TTM)" />
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Bar y-axis ticks */}
        {[-1, -0.5, 0, 0.5, 1].map((t, i) => {
          const v = t * maxBar;
          return (
            <g key={i}>
              <line x1={padL} y1={yBar(v)} x2={W - padR} y2={yBar(v)}
                stroke={t === 0 ? 'var(--line)' : 'var(--line-softer)'} strokeWidth={t === 0 ? 1.2 : 1} />
              <text x={padL - 6} y={yBar(v) + 3} textAnchor="end"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
                {fmtMoneyScaled(v, { precision: 0 })}
              </text>
            </g>
          );
        })}

        {/* Right axis (NRR) ticks */}
        {[1.0, 1.10, 1.20].map((v, i) => {
          const y = yNrr(v);
          if (y == null) return null;
          return (
            <g key={i}>
              <text x={W - padR + 6} y={y + 3}
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
                {fmtPlainPct(v, 0)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {monthly.map((m, i) => {
          const ePos = expansion[i];
          const cNeg = contraction[i]; // already negative
          const chNeg = churn[i]; // already negative
          return (
            <g key={i}>
              {/* Expansion above zero */}
              {ePos > 0 && (
                <rect x={x(i)} width={barW}
                  y={yBar(ePos)} height={yMid - yBar(ePos)}
                  fill="var(--accent-good)" stroke="var(--ink)" strokeWidth={0.4} />
              )}
              {/* Contraction below zero, stacked first */}
              {cNeg < 0 && (
                <rect x={x(i)} width={barW}
                  y={yMid} height={yBar(cNeg) - yMid}
                  fill="var(--accent-warn)" stroke="var(--ink)" strokeWidth={0.4} />
              )}
              {/* Churn below zero, stacked under contraction */}
              {chNeg < 0 && (
                <rect x={x(i)} width={barW}
                  y={yBar(cNeg)} height={yBar(cNeg + chNeg) - yBar(cNeg)}
                  fill="#c44" stroke="var(--ink)" strokeWidth={0.4} />
              )}
              {(i % 3 === 0) && (
                <text x={x(i) + barW / 2} y={H - padB + 14} textAnchor="middle"
                  style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
                  {m.calendar_label}
                </text>
              )}
            </g>
          );
        })}

        {/* NRR line */}
        {nrrPath && (
          <path d={nrrPath} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
        )}

        {/* NRR endpoint annotation */}
        {(() => {
          const last = nrr[nrr.length - 1];
          const ly = yNrr(last);
          if (ly == null) return null;
          return (
            <text x={x(monthly.length - 1) + barW + 4} y={ly + 3}
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink)', fontWeight: 600 }}>
              NRR {fmtPlainPct(last, 0)}
            </text>
          );
        })()}
      </svg>
    </div>
  );
}

