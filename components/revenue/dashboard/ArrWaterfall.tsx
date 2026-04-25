'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';

const END_IDX = 17;    // end of month 18 (Jun 27) — final forecast month

interface Step {
  label: string;
  value: number;     // signed; total bars are absolute values
  kind: 'total' | 'pos' | 'neg';
}

export default function ArrWaterfall() {
  const { results, activeScenario, assumptions } = useRevenue();
  const r = results[activeScenario];

  const endMonth = r.monthly[END_IDX];

  const day0Ss = assumptions.starting_state.self_serve_arr.plus
    + assumptions.starting_state.self_serve_arr.business_small;
  const endSs = endMonth.self_serve.arr.plus + endMonth.self_serve.arr.business_small;
  const dSs = endSs - day0Ss;

  let new_named = 0, new_capacity = 0, grad_in = 0, expansion = 0, contraction = 0, churn = 0;
  for (let i = 0; i <= END_IDX; i++) {
    const m = r.monthly[i];
    new_named    += m.sales_led.new_arr_named_pipeline;
    new_capacity += m.sales_led.new_arr_capacity;
    grad_in      += m.sales_led.new_arr_graduation;
    expansion    += m.sales_led.expansion_arr;
    contraction  += m.sales_led.contraction_arr;
    churn        += m.sales_led.churn_arr;
  }

  const starting = r.starting_arr;
  const ending = endMonth.total.arr;

  const steps: Step[] = [
    { label: 'Starting ARR · Dec 25',                       value: starting,     kind: 'total' },
    { label: 'Δ Self-Serve (net)',                          value: dSs,          kind: dSs >= 0 ? 'pos' : 'neg' },
    { label: 'New Sales-Led · named pipeline',              value: new_named,    kind: 'pos' },
    { label: 'New Sales-Led · capacity',                    value: new_capacity, kind: 'pos' },
    { label: 'Graduation transfer (in)',                    value: grad_in,      kind: 'pos' },
    { label: 'Expansion',                                   value: expansion,    kind: 'pos' },
    { label: 'Contraction',                                 value: -contraction, kind: 'neg' },
    { label: 'Churn',                                       value: -churn,       kind: 'neg' },
    { label: `Ending ARR · ${endMonth.calendar_label}`,     value: ending,       kind: 'total' },
  ];

  // Compute running totals for floating bar positions
  const positions: { start: number; end: number }[] = [];
  let running = 0;
  for (const step of steps) {
    if (step.kind === 'total') {
      positions.push({ start: 0, end: step.value });
      running = step.value;
    } else {
      const newRunning = running + step.value;
      positions.push({ start: Math.min(running, newRunning), end: Math.max(running, newRunning) });
      running = newRunning;
    }
  }

  const maxVal = Math.max(...positions.map(p => p.end));
  const labelW = 240;
  const valueW = 100;
  const chartW = 480;
  const totalW = labelW + chartW + valueW + 32;
  const rowH = 28;

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div className="hand" style={{ fontSize: 18, marginBottom: 8 }}>
        ARR Waterfall · Dec 25 → Jun 27
      </div>
      <svg width="100%" viewBox={`0 0 ${totalW} ${steps.length * rowH + 8}`} style={{ display: 'block' }}>
        {steps.map((step, i) => {
          const y = i * rowH + 4;
          const pos = positions[i];
          const x1 = labelW + 16 + (pos.start / maxVal) * chartW;
          const x2 = labelW + 16 + (pos.end / maxVal) * chartW;
          const fill = step.kind === 'total'
            ? 'var(--ink)'
            : step.kind === 'pos'
              ? 'color-mix(in oklch, var(--accent-good) 60%, white)'
              : 'color-mix(in oklch, var(--accent-warn) 60%, white)';
          const stroke = step.kind === 'total'
            ? 'var(--ink)'
            : step.kind === 'pos'
              ? 'var(--accent-good)'
              : 'var(--accent-warn)';
          return (
            <g key={step.label}>
              <text x={labelW} y={y + 14} textAnchor="end"
                style={{
                  fontFamily: 'var(--font-architects-daughter), cursive',
                  fontSize: 12,
                  fill: step.kind === 'total' ? 'var(--ink)' : 'var(--ink-2)',
                  fontWeight: step.kind === 'total' ? 700 : 400,
                }}>
                {step.label}
              </text>
              <rect
                x={x1}
                y={y + 4}
                width={Math.max(2, x2 - x1)}
                height={16}
                fill={fill}
                stroke={stroke}
                strokeWidth={1}
              />
              <text x={labelW + 16 + chartW + 8} y={y + 14}
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  fontSize: 11,
                  fill: step.kind === 'neg' ? 'var(--accent-warn)' : 'var(--ink)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                {step.kind === 'total'
                  ? fmtMoneyScaled(step.value, { precision: 1 })
                  : (step.value >= 0 ? '+' : '') + fmtMoneyScaled(step.value, { precision: 1 })}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
