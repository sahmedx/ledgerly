'use client';

import { useEffect } from 'react';

const ASSUMPTIONS = [
  { id: 1,  text: 'All sales-led contracts are 1-year annual prepay. Multi-year deals with discounts and escalators not modeled.' },
  { id: 2,  text: 'Plus → Business upgrades reset retention age to zero. Real upgraded customers retain better than fresh acquisitions.' },
  { id: 3,  text: 'Free user growth rate is net of free churn. No separate free-churn parameter.' },
  { id: 4,  text: 'Named pipeline drives bookings months 1–6; sales capacity drives bookings months 7–24. No overlap.' },
  { id: 5,  text: 'Graduation ARR transfers at face value in the month of graduation. No price uplift modeled.' },
  { id: 6,  text: 'AI inference cost = flat % of Business + Enterprise ARR. Real cost scales with per-customer usage.' },
  { id: 7,  text: 'CSM staffing modeled as ratio to logos. Real staffing also depends on segment, deal size, complexity.' },
  { id: 8,  text: 'No seasonality. Real SaaS bookings are heavily Q4-weighted, Q1-light.' },
  { id: 9,  text: 'No FX, no taxes. Operating income is pre-tax. SBC IS modeled (Phase 6 addition).' },
  { id: 10, text: 'No working capital model beyond deferred revenue. AR / AP / prepaids not modeled.' },
  { id: 11, text: 'Day-0 sales-led renewal anniversary distribution puts 70% in Oct 26, 10% each in Jan / Apr / Jul. The Oct 26 billings spike (~$168M) is expected, not a bug. Validation check 3 (billings/revenue tie) still passes.' },
  { id: 12, text: 'SBC modeled as ratio of cash comp by function (R&D 65%, S&M 35%, G&A 50%, CS 30%). CS SBC follows the cs_in_cogs_pct split. No grant-cohort modeling, no seasonality, no ASC 718 graded vesting. V2 could refine these.' },
  { id: 13, text: 'GAAP and Non-GAAP both shown. Non-GAAP excludes SBC, per public SaaS convention. Adjusted EBITDA = EBITDA + SBC add-back is the metric investors lead with. Rule of 40 uses GAAP operating margin (reported, not SBC-adjusted).' },
  { id: 14, text: 'D&A is a flat $500k/month placeholder. V2 will derive D&A from a capex schedule + intangibles amortization.' },
  { id: 15, text: 'Segment P&Ls: direct costs (quota rep comp, payment processing, AI inference by tier) attribute 100% to segment. Shared costs (G&A, hosting) split pro rata to revenue. Strategic costs (marketing, R&D) use configurable splits (default 70/30 marketing, 60/40 R&D toward self-serve).' },
  { id: 16, text: 'Out of scope (V2): below-the-line items (interest, other inc/exp, taxes, net income), dilution / share count, statement of cash flows, TTM P&L view, variance vs. prior period, CSV / Excel export.' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MethodologyModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.18)',
        zIndex: 9100,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="sketch-box"
        style={{
          background: 'var(--paper)',
          padding: '20px 26px 24px',
          maxWidth: 720,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div className="hand" style={{ fontSize: 22, fontWeight: 700 }}>Methodology · simplifying assumptions</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
              Forecast model concessions for V1 buildability. See <code>notion_forecast_spec.md</code> §9 for full discussion.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              appearance: 'none',
              border: 0,
              background: 'transparent',
              fontSize: 18,
              color: 'var(--ink-3)',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >✕</button>
        </div>

        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ASSUMPTIONS.map(a => (
            <li key={a.id} style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
              {a.text}
            </li>
          ))}
        </ol>

        <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--line-softer)' }}>
          Engine logic: <code>lib/revenue/engine.ts</code>. Validation checks live in <code>lib/revenue/validation.ts</code>.
        </div>
      </div>
    </div>
  );
}
