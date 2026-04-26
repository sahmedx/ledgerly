'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';
import LegendSwatch from '../shared/LegendSwatch';

const W = 560, H = 200;
const padL = 56, padR = 16, padT = 14, padB = 36;
const MONTH_LABELS = ['Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26'];

interface MonthBucket {
  month: number;
  total: number;
  business_large: number;
  enterprise: number;
  count: number;
}

export default function WeightedBookingsBar() {
  const { assumptions, results, activeScenario } = useRevenue();
  const sl = assumptions.sales_led;
  const r = results[activeScenario];

  // V2: engine consumes the scalar `named_pipeline_weighted_acv` and splits by
  // capacity_segment_split. Bars below visualize the engine-recognised path.
  const split = sl.capacity_segment_split;
  const buckets: MonthBucket[] = r.monthly.slice(0, 6).map((m, i) => {
    const total = m.sales_led.new_arr_named_pipeline;
    const dealCount = sl.named_pipeline.filter(d => d.expected_close_month === i + 1).length;
    return {
      month: i + 1,
      total,
      business_large: total * split.business_large,
      enterprise: total * split.enterprise,
      count: dealCount,
    };
  });

  // Deal-list weighted aggregate (illustrative) for the side-by-side caveat.
  const dealListWeighted = sl.named_pipeline.reduce((s, d) => {
    if (d.expected_close_month < 1 || d.expected_close_month > 6) return s;
    return s + d.acv * sl.stage_probability[d.stage];
  }, 0);

  const enginePerMonth = r.monthly.slice(0, 6).map(m => m.sales_led.new_arr_named_pipeline);

  const maxV = Math.max(1, ...buckets.map(b => b.total)) * 1.1;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const colW = innerW / buckets.length;
  const barW = colW * 0.6;
  const x = (i: number) => padL + i * colW + (colW - barW) / 2;
  const y = (v: number) => padT + innerH - (v / maxV) * innerH;
  const h = (v: number) => (v / maxV) * innerH;

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div className="hand" style={{ fontSize: 18 }}>Weighted bookings · pipeline close</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Engine-recognised new ARR by month · scalar `named_pipeline_weighted_acv` × capacity split
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--ink-3)' }}>
          <LegendSwatch color="var(--accent-cool)" label="Biz · large" />
          <LegendSwatch color="var(--accent-good)" label="Enterprise" />
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

        {buckets.map((b, i) => {
          const blH = h(b.business_large);
          const entH = h(b.enterprise);
          return (
            <g key={i}>
              {/* Biz large bottom */}
              <rect
                x={x(i)} width={barW}
                y={y(b.business_large)} height={blH}
                fill="var(--accent-cool)"
                stroke="var(--ink)"
                strokeWidth={0.5}
              />
              {/* Enterprise on top */}
              <rect
                x={x(i)} width={barW}
                y={y(b.business_large + b.enterprise)} height={entH}
                fill="var(--accent-good)"
                stroke="var(--ink)"
                strokeWidth={0.5}
              />
              {/* Total label */}
              {b.total > 0 && (
                <text
                  x={x(i) + barW / 2}
                  y={y(b.total) - 4}
                  textAnchor="middle"
                  style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-2)', fontWeight: 600 }}
                >
                  {fmtMoneyScaled(b.total, { precision: 1 })}
                </text>
              )}
              <text
                x={x(i) + barW / 2}
                y={H - padB + 14}
                textAnchor="middle"
                style={{ fontFamily: 'var(--font-architects-daughter), cursive', fontSize: 10, fill: 'var(--ink-3)' }}
              >
                {MONTH_LABELS[i]}
              </text>
              <text
                x={x(i) + barW / 2}
                y={H - padB + 26}
                textAnchor="middle"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 9, fill: 'var(--ink-4)' }}
              >
                {b.count} {b.count === 1 ? 'deal' : 'deals'}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
        <span>Engine total m1–6: {fmtMoneyScaled(enginePerMonth.reduce((a, b) => a + b, 0))}</span>
        <span>Deal-list aggregate (illustrative): {fmtMoneyScaled(dealListWeighted)}</span>
      </div>
    </div>
  );
}

