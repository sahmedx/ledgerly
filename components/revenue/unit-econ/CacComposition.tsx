'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';

const DONUT_R_OUTER = 56;
const DONUT_R_INNER = 32;
const DONUT_CX = 70;
const DONUT_CY = 70;
const DONUT_BOX = 140;

interface Slice {
  label: string;
  value: number;
  color: string;
}

function donutPath(cx: number, cy: number, rOut: number, rIn: number, startA: number, endA: number): string {
  const xs1 = cx + rOut * Math.cos(startA);
  const ys1 = cy + rOut * Math.sin(startA);
  const xe1 = cx + rOut * Math.cos(endA);
  const ye1 = cy + rOut * Math.sin(endA);
  const xs2 = cx + rIn * Math.cos(endA);
  const ys2 = cy + rIn * Math.sin(endA);
  const xe2 = cx + rIn * Math.cos(startA);
  const ye2 = cy + rIn * Math.sin(startA);
  const large = endA - startA > Math.PI ? 1 : 0;
  return `M ${xs1} ${ys1} A ${rOut} ${rOut} 0 ${large} 1 ${xe1} ${ye1} L ${xs2} ${ys2} A ${rIn} ${rIn} 0 ${large} 0 ${xe2} ${ye2} Z`;
}

interface SegmentProps {
  title: string;
  accent: string;
  cacPerLogo: number;
  monthlyGpPerLogo: number;
  paybackMonths: number;
  slices: Slice[];
}

function SegmentPanel({ title, accent, cacPerLogo, monthlyGpPerLogo, paybackMonths, slices }: SegmentProps) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  let cursor = -Math.PI / 2;
  const arcs = slices.map(s => {
    const angle = total > 0 ? (s.value / total) * Math.PI * 2 : 0;
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    return { slice: s, start, end };
  });

  // GP-back bar — show how many months of monthly GP are needed to recover CAC.
  // Bar segment 1 = paid-back months (up to cap 36), segment 2 = remainder (≤cap).
  const cap = 36;
  const paybackClamped = Math.min(cap, paybackMonths);

  return (
    <div className="sketch-box" style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div className="hand" style={{ fontSize: 16, color: accent }}>{title}</div>
        <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>per-logo CAC composition</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'center' }}>
        <svg width={DONUT_BOX} height={DONUT_BOX} viewBox={`0 0 ${DONUT_BOX} ${DONUT_BOX}`}>
          {arcs.map((a, i) => (
            <path
              key={i}
              d={donutPath(DONUT_CX, DONUT_CY, DONUT_R_OUTER, DONUT_R_INNER, a.start, a.end)}
              fill={a.slice.color}
              stroke="var(--ink)"
              strokeWidth={0.5}
            />
          ))}
          <text
            x={DONUT_CX} y={DONUT_CY - 4} textAnchor="middle"
            style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 9, fill: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
          >
            CAC
          </text>
          <text
            x={DONUT_CX} y={DONUT_CY + 11} textAnchor="middle"
            className="num"
            style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 13, fill: 'var(--ink)', fontWeight: 600 }}
          >
            {fmtMoneyScaled(cacPerLogo, { precision: 0 })}
          </text>
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {slices.map((s, i) => {
            const pct = total > 0 ? s.value / total : 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <span style={{ width: 9, height: 9, background: s.color, border: '1px solid var(--ink)', display: 'inline-block', flex: 'none' }} />
                <span style={{ flex: 1, color: 'var(--ink-2)' }}>{s.label}</span>
                <span style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--ink-3)',
                  minWidth: 56,
                  textAlign: 'right',
                }}>
                  {fmtMoneyScaled(s.value, { precision: 0 })} <span style={{ color: 'var(--ink-4)' }}>{(pct * 100).toFixed(0)}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--line-softer)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>
          <span>Monthly GP returned · {fmtMoneyScaled(monthlyGpPerLogo, { precision: 0 })}/mo</span>
          <span>Payback {paybackMonths.toFixed(1)} mo</span>
        </div>
        <svg width="100%" viewBox={`0 0 ${cap} 8`} preserveAspectRatio="none" style={{ display: 'block', height: 14 }}>
          <rect x={0} y={1} width={cap} height={6} fill="var(--line-softer)" />
          <rect
            x={0} y={1}
            width={paybackClamped}
            height={6}
            fill={accent}
            opacity={0.55}
          />
          <line x1={paybackClamped} x2={paybackClamped} y1={0} y2={8} stroke="var(--ink)" strokeWidth={0.5} />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--ink-4)' }}>
          <span>0 mo</span>
          <span>{cap} mo</span>
        </div>
      </div>
    </div>
  );
}

export default function CacComposition() {
  const { results, activeScenario, assumptions } = useRevenue();
  const last = results[activeScenario].monthly[results[activeScenario].monthly.length - 1];

  const gm = last.costs.gross_margin_pct;
  const ssArpa = last.kpis.arpa_self_serve;
  const slArpa = last.kpis.arpa_sales_led;

  const flc = assumptions.costs.sm.flc;
  const hc = last.headcount;
  const sales_comp = hc.sales_reps * flc.rep / 12 + hc.sdrs * flc.sdr / 12 + hc.ses * flc.se / 12 + hc.sales_mgrs * flc.manager / 12;
  const marketing_comp = hc.marketing * flc.mktg / 12;
  const marketing_programs = Math.max(0, last.costs.sm_total - sales_comp - marketing_comp);

  // Per-logo new acquisitions
  const new_ss_logos = last.self_serve.new_paid_workspaces;
  const total_new_sl_arr =
      last.sales_led.new_arr_named_pipeline
    + last.sales_led.new_arr_capacity
    + last.sales_led.new_arr_graduation;
  const sl = assumptions.sales_led;
  const split = sl.capacity_segment_split;
  const bl_avg_arr = sl.avg_seats_per_logo.business_large * sl.blended_seat_price.business_large * 12;
  const ent_avg_arr = sl.enterprise_avg_acv;
  const blended_arr_per_sl_logo = bl_avg_arr * split.business_large + ent_avg_arr * split.enterprise;
  const new_sl_logos = blended_arr_per_sl_logo > 0 ? total_new_sl_arr / blended_arr_per_sl_logo : 0;

  // Per-logo CAC components
  const ss_mp_per   = new_ss_logos > 0 ? marketing_programs / new_ss_logos : 0;
  const ss_mc_per   = new_ss_logos > 0 ? marketing_comp     / new_ss_logos : 0;

  const sl_rep_per  = new_sl_logos > 0 ? hc.sales_reps * flc.rep     / 12 / new_sl_logos : 0;
  const sl_sdr_per  = new_sl_logos > 0 ? hc.sdrs       * flc.sdr     / 12 / new_sl_logos : 0;
  const sl_se_per   = new_sl_logos > 0 ? hc.ses        * flc.se      / 12 / new_sl_logos : 0;
  const sl_mgr_per  = new_sl_logos > 0 ? hc.sales_mgrs * flc.manager / 12 / new_sl_logos : 0;
  const sl_mp_per   = new_sl_logos > 0 ? marketing_programs * 0.30   / new_sl_logos : 0;

  const ssCac = ss_mp_per + ss_mc_per;
  const slCac = sl_rep_per + sl_sdr_per + sl_se_per + sl_mgr_per + sl_mp_per;

  const ssMonthlyGp = ssArpa * gm / 12;
  const slMonthlyGp = slArpa * gm / 12;

  const ssSlices: Slice[] = [
    { label: 'Marketing programs', value: ss_mp_per, color: 'color-mix(in oklch, var(--accent-cool) 65%, white)' },
    { label: 'Marketing comp',     value: ss_mc_per, color: 'color-mix(in oklch, var(--accent-cool) 35%, white)' },
  ];
  const slSlices: Slice[] = [
    { label: 'Reps',         value: sl_rep_per, color: 'color-mix(in oklch, var(--accent-good) 75%, white)' },
    { label: 'SDRs',         value: sl_sdr_per, color: 'color-mix(in oklch, var(--accent-good) 55%, white)' },
    { label: 'SEs',          value: sl_se_per,  color: 'color-mix(in oklch, var(--accent-good) 40%, white)' },
    { label: 'Managers',     value: sl_mgr_per, color: 'color-mix(in oklch, var(--accent-good) 25%, white)' },
    { label: 'Mktg programs (30%)', value: sl_mp_per, color: 'color-mix(in oklch, var(--accent-warn) 50%, white)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <SegmentPanel
        title="Self-serve · CAC build"
        accent="var(--accent-cool)"
        cacPerLogo={ssCac}
        monthlyGpPerLogo={ssMonthlyGp}
        paybackMonths={last.kpis.cac_payback_self_serve}
        slices={ssSlices}
      />
      <SegmentPanel
        title="Sales-led · CAC build"
        accent="var(--accent-good)"
        cacPerLogo={slCac}
        monthlyGpPerLogo={slMonthlyGp}
        paybackMonths={last.kpis.cac_payback_sales_led}
        slices={slSlices}
      />
    </div>
  );
}
