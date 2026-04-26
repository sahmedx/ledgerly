'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';
import LegendSwatch from '../shared/LegendSwatch';

const W = 580, H = 220;
const padL = 56, padR = 16, padT = 16, padB = 30;
const HORIZON = 36; // months since acquisition
const SS_CHURN_MONTHLY = 0.04;

function deriveCac(payback_months: number, arpa: number, gm: number): number {
  if (payback_months <= 0 || arpa <= 0 || gm <= 0) return 0;
  return payback_months * arpa * gm / 12;
}

function cumGpCurve(arpa: number, gm: number, churnMonthly: number): number[] {
  // Cumulative gross profit per logo over months since acquisition.
  // Month a contributes: arpa * gm / 12 * survival(a) where survival = (1-churn)^a.
  const out: number[] = [];
  let cum = 0;
  const monthlyGp = arpa * gm / 12;
  for (let a = 0; a < HORIZON; a++) {
    const survival = Math.pow(1 - churnMonthly, a);
    cum += monthlyGp * survival;
    out.push(cum);
  }
  return out;
}

function payback(curve: number[], cac: number): number | null {
  if (cac <= 0) return null;
  for (let a = 0; a < curve.length; a++) {
    if (curve[a] >= cac) return a;
  }
  return null;
}

export default function PaybackCurve() {
  const { results, activeScenario, assumptions } = useRevenue();
  const r = results[activeScenario];
  const last = r.monthly[r.monthly.length - 1];
  const sl_churn_monthly = (
    assumptions.sales_led.existing_customer_dynamics.business_large.gross_churn
    + assumptions.sales_led.existing_customer_dynamics.enterprise.gross_churn
  ) / 2;

  const gm = last.costs.gross_margin_pct;
  const ssArpa = last.kpis.arpa_self_serve;
  const slArpa = last.kpis.arpa_sales_led;
  const ssCac = deriveCac(last.kpis.cac_payback_self_serve, ssArpa, gm);
  const slCac = deriveCac(last.kpis.cac_payback_sales_led, slArpa, gm);

  const ssCurve = cumGpCurve(ssArpa, gm, SS_CHURN_MONTHLY);
  const slCurve = cumGpCurve(slArpa, gm, sl_churn_monthly);
  const ssPayback = payback(ssCurve, ssCac);
  const slPayback = payback(slCurve, slCac);

  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxV = Math.max(ssCurve[ssCurve.length - 1], slCurve[slCurve.length - 1], ssCac, slCac) * 1.1;
  const x = (a: number) => padL + (a / (HORIZON - 1)) * innerW;
  const y = (v: number) => padT + innerH - (v / maxV) * innerH;

  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div className="hand" style={{ fontSize: 18 }}>CAC payback curves</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Cumulative GP per logo, months since acquisition. Crosses CAC = payback.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <LegendSwatch shape="line" color="var(--accent-cool)" label="Self-serve" />
          <LegendSwatch shape="line" color="var(--accent-good)" label="Sales-led" />
          <LegendSwatch shape="line" color="var(--ink-3)" label="CAC" dashed />
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

        {/* CAC reference lines */}
        <line x1={padL} y1={y(ssCac)} x2={W - padR} y2={y(ssCac)}
          stroke="var(--accent-cool)" strokeWidth={1} strokeDasharray="3 2" opacity={0.6} />
        <line x1={padL} y1={y(slCac)} x2={W - padR} y2={y(slCac)}
          stroke="var(--accent-good)" strokeWidth={1} strokeDasharray="3 2" opacity={0.6} />

        <text x={W - padR + 4} y={y(ssCac) + 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--accent-cool)' }}>
          CAC SS
        </text>
        <text x={W - padR + 4} y={y(slCac) + 3}
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--accent-good)' }}>
          CAC SL
        </text>

        {/* Curves */}
        <path d={path(ssCurve)} fill="none" stroke="var(--accent-cool)" strokeWidth={1.5} />
        <path d={path(slCurve)} fill="none" stroke="var(--accent-good)" strokeWidth={1.5} />

        {/* Payback markers */}
        {ssPayback != null && (
          <g>
            <line x1={x(ssPayback)} y1={y(ssCac)} x2={x(ssPayback)} y2={padT + innerH}
              stroke="var(--accent-cool)" strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
            <circle cx={x(ssPayback)} cy={y(ssCac)} r={3.5} fill="var(--accent-cool)" stroke="var(--ink)" strokeWidth={0.5} />
          </g>
        )}
        {slPayback != null && (
          <g>
            <line x1={x(slPayback)} y1={y(slCac)} x2={x(slPayback)} y2={padT + innerH}
              stroke="var(--accent-good)" strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
            <circle cx={x(slPayback)} cy={y(slCac)} r={3.5} fill="var(--accent-good)" stroke="var(--ink)" strokeWidth={0.5} />
          </g>
        )}

        {[0, 6, 12, 18, 24, 30].map(a => (
          <text key={a} x={x(a)} y={H - padB + 14} textAnchor="middle"
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}>
            mo {a}
          </text>
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-4)', marginTop: 4 }}>
        <span>SS payback: {ssPayback == null ? '> 36 mo' : `${ssPayback} mo`} (CAC {fmtMoneyScaled(ssCac, { precision: 0 })})</span>
        <span>SL payback: {slPayback == null ? '> 36 mo' : `${slPayback} mo`} (CAC {fmtMoneyScaled(slCac, { precision: 0 })})</span>
      </div>
    </div>
  );
}

