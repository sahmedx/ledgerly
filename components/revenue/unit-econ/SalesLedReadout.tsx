'use client';

export default function SalesLedReadout() {
  return (
    <div className="sketch-box" style={{ padding: '16px 20px', background: '#fcfbf4' }}>
      <div className="hand" style={{ fontSize: 16, marginBottom: 8 }}>
        Reading the sales-led numbers · CFO note
      </div>
      <div style={{
        fontSize: 12.5,
        lineHeight: 1.55,
        color: 'var(--ink-2)',
        fontFamily: 'var(--font-architects-daughter), cursive',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <p style={{ margin: 0 }}>
          <strong>Self-serve unit economics are healthy and improving.</strong> Payback under 12 months
          and LTV/CAC well above 5× reflect a working PLG funnel: marketing dollars convert organically,
          retention compounds, and gross margin clears the cost of acquisition quickly.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Sales-led metrics look weaker by design at this stage.</strong> CAC payback runs above
          the 12–18-month healthy band, and LTV/CAC sits near 3×. This is what an enterprise build-out
          looks like at $1B+ ARR before the motion matures — not a structural flaw in the business.
          Three drivers explain it:
        </p>
        <ol style={{ margin: 0, paddingLeft: 22 }}>
          <li>
            <strong>Sales-comp leverage hasn&apos;t kicked in yet.</strong> Sales comp scales with rep
            count, but new ARR scales with ramped, productive rep count. Reps hired in the past 6 months
            are 33–66% productive on the standard ramp curve. Until ramped capacity outweighs new hires,
            CAC per logo stays elevated.
          </li>
          <li>
            <strong>Quota and attainment are deliberately conservative.</strong> Plan-set quota is at
            5× OTE and attainment at 80% — both at industry-defensible ceilings, not stretch numbers.
            Pushing beyond would flatter unit economics on paper without changing what the field
            actually delivers.
          </li>
          <li>
            <strong>ENT ACV expansion takes time.</strong> Higher ACVs improve revenue per logo but
            also increase CAC per logo (fewer logos for the same booking target), so the ratio
            compresses before it expands. The expansion shows up in NRR and Year-2 cohort economics,
            not in the first-year payback window.
          </li>
        </ol>
        <p style={{ margin: 0 }}>
          <strong>What this implies.</strong> The sales-led motion is in investment mode. We expect
          payback to compress through FY27 as the ramped-rep cohort grows, win rates harden against
          better-qualified pipeline, and the ENT ACV mix lifts ARPA faster than logo count rises.
          The right benchmark for now is <em>direction of travel</em>, not absolute level — and on
          that basis, magic number, burn multiple, and the GAAP/non-GAAP Rule of 40 trend are all
          improving across the plan horizon.
        </p>
        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--ink-3)', fontSize: 11.5 }}>
          Caveat: if SL payback isn&apos;t inside the 12–18 band by end of FY27, the action items are
          on pricing (raise list ENT ACV), retention (extend sales-led NRR via CSM coverage), or
          motion mix (pull more graduations from PLG to lower per-logo CAC) — not on quota or
          attainment, which are already at honest ceilings.
        </p>
      </div>
    </div>
  );
}
