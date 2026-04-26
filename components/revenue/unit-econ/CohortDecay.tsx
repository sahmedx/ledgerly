'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';
import {
  blendedSelfServeChurn,
  cappedLtv,
  LTV_HORIZON_MONTHS,
} from '@/lib/revenue/engine-kpis';
import LegendSwatch from '../shared/LegendSwatch';

const PANEL_W = 380, PANEL_H = 200;
const padL = 50, padR = 40, padT = 14, padB = 28;

interface PanelProps {
  title: string;
  arpa: number;
  gm: number;
  monthlyChurn: number;
  cac: number;
  accent: string;
}

function Panel({ title, arpa, gm, monthlyChurn, cac, accent }: PanelProps) {
  const innerW = PANEL_W - padL - padR;
  const innerH = PANEL_H - padT - padB;

  // Per-month surviving GP per logo, capped at 84mo.
  const horizon = LTV_HORIZON_MONTHS;
  const monthlyGp = arpa * gm / 12;
  const survival: number[] = [];
  const cumGp: number[] = [];
  let acc = 0;
  for (let a = 0; a < horizon; a++) {
    const s = Math.pow(1 - monthlyChurn, a);
    survival.push(monthlyGp * s);
    acc += monthlyGp * s;
    cumGp.push(acc);
  }
  const finalLtv = cumGp[cumGp.length - 1];
  const ltvAtCap = cappedLtv(arpa, gm, monthlyChurn);

  // Find payback month — first cumulative GP ≥ CAC.
  let paybackMo: number | null = null;
  for (let a = 0; a < cumGp.length; a++) {
    if (cumGp[a] >= cac) { paybackMo = a; break; }
  }

  const maxV = Math.max(0.01, ...survival);
  const x = (a: number) => padL + (a / (horizon - 1)) * innerW;
  const y = (v: number) => padT + innerH - (v / maxV) * innerH;

  const linePath = survival.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
  const areaPath = `${linePath} L ${x(horizon - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  return (
    <div className="sketch-box" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div>
          <div className="hand" style={{ fontSize: 16, color: accent }}>{title}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
            Monthly GP per logo × survival · area = LTV
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>
          {(monthlyChurn * 100).toFixed(2)}%/mo churn
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${PANEL_W} ${PANEL_H}`} style={{ display: 'block' }}>
        {[0, 0.5, 1.0].map((t, i) => {
          const v = t * maxV;
          return (
            <g key={i}>
              <line x1={padL} y1={y(v)} x2={PANEL_W - padR} y2={y(v)}
                stroke="var(--line-softer)" strokeWidth={1} />
              <text x={padL - 6} y={y(v) + 3} textAnchor="end"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}>
                {fmtMoneyScaled(v, { precision: 0 })}
              </text>
            </g>
          );
        })}

        {/* Filled area = LTV */}
        <path d={areaPath} fill={accent} opacity={0.18} />
        <path d={linePath} fill="none" stroke={accent} strokeWidth={1.5} />

        {/* Payback marker */}
        {paybackMo != null && paybackMo < horizon && (
          <g>
            <line
              x1={x(paybackMo)} x2={x(paybackMo)}
              y1={padT} y2={padT + innerH}
              stroke="var(--ink-3)" strokeWidth={1} strokeDasharray="3 3"
            />
            <text
              x={x(paybackMo) + 3} y={padT + 10}
              style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 9, fill: 'var(--ink-3)' }}
            >
              payback m{paybackMo}
            </text>
          </g>
        )}

        {/* Month axis */}
        {[0, 12, 24, 36, 48, 60, 72, 84].map(a => a < horizon && (
          <text key={a} x={x(a)} y={PANEL_H - padB + 13} textAnchor="middle"
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 9, fill: 'var(--ink-3)' }}>
            m{a}
          </text>
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>
        <span>CAC {fmtMoneyScaled(cac, { precision: 0 })} · GP/mo {fmtMoneyScaled(monthlyGp, { precision: 0 })}</span>
        <span>LTV {fmtMoneyScaled(ltvAtCap, { precision: 1 })} · uncapped {fmtMoneyScaled(finalLtv, { precision: 1 })}</span>
      </div>
    </div>
  );
}

export default function CohortDecay() {
  const { results, activeScenario, assumptions } = useRevenue();
  const last = results[activeScenario].monthly[results[activeScenario].monthly.length - 1];

  const gm = last.costs.gross_margin_pct;
  const ssArpa = last.kpis.arpa_self_serve;
  const slArpa = last.kpis.arpa_sales_led;
  const ssChurn = blendedSelfServeChurn(
    assumptions, last.self_serve.arr.plus, last.self_serve.arr.business_small,
  );
  const slChurn = (
    assumptions.sales_led.existing_customer_dynamics.business_large.gross_churn
    + assumptions.sales_led.existing_customer_dynamics.enterprise.gross_churn
  ) / 2;
  const ssCac = last.kpis.cac_payback_self_serve > 0
    ? last.kpis.cac_payback_self_serve * ssArpa * gm / 12
    : 0;
  const slCac = last.kpis.cac_payback_sales_led > 0
    ? last.kpis.cac_payback_sales_led * slArpa * gm / 12
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="hand" style={{ fontSize: 18 }}>Cohort decay · GP per logo</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <LegendSwatch shape="line" color="var(--ink-3)" label="payback" dashed />
          <LegendSwatch color="var(--accent-cool)" label="self-serve area = LTV" />
          <LegendSwatch color="var(--accent-good)" label="sales-led area = LTV" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Panel
          title="Self-serve cohort"
          arpa={ssArpa} gm={gm} monthlyChurn={ssChurn} cac={ssCac}
          accent="var(--accent-cool)"
        />
        <Panel
          title="Sales-led cohort"
          arpa={slArpa} gm={gm} monthlyChurn={slChurn} cac={slCac}
          accent="var(--accent-good)"
        />
      </div>
    </div>
  );
}
