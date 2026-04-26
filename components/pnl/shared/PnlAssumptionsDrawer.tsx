'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import AssumptionsDrawer, { DrawerSection } from '@/components/shared/AssumptionsDrawer';
import DriverInput from '@/components/revenue/shared/DriverInput';
import { DEFAULT_ASSUMPTIONS } from '@/lib/revenue/defaults';
import { usePnl } from '../PnlContext';

export default function PnlAssumptionsDrawer() {
  const { resetToDefaults } = useRevenue();
  const { drawerOpen, setDrawerOpen } = usePnl();
  const D = DEFAULT_ASSUMPTIONS.costs;

  return (
    <AssumptionsDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      title="P&L assumptions"
      subtitle="SBC ratios, D&A placeholder, segment cost allocation"
      onReset={resetToDefaults}
    >
      <div style={{
        fontSize: 11, color: 'var(--ink-3)', marginBottom: 14,
        padding: '8px 10px', background: '#fbf8ee', border: '1px dashed var(--line-soft)',
      }}>
        Costs allocate self-serve vs. sales-led to produce segment P&Ls. Direct costs
        (quota rep comp, payment processing) attribute 100% to a segment. Shared costs
        (G&A, hosting) split pro rata to revenue. Strategic costs (marketing, R&D) use
        configurable splits — judgment-driven and worth tuning. SBC follows cash comp
        by function. Public SaaS investors focus on non-GAAP profitability (excl. SBC);
        both views are displayed.
      </div>

      <DrawerSection title="Stock-based compensation (% of cash comp)">
        <DriverInput path="costs.sbc.rd_sbc_pct" label="R&D SBC %" unit="%"
          min={0} max={120} step={1} defaultValue={D.sbc.rd_sbc_pct}
          hint="Engineers carry the heaviest equity weight at this stage." />
        <DriverInput path="costs.sbc.sm_sbc_pct" label="S&M SBC %" unit="%"
          min={0} max={80} step={1} defaultValue={D.sbc.sm_sbc_pct}
          hint="Quota reps are mostly cash-comped → lowest equity tier of major functions." />
        <DriverInput path="costs.sbc.ga_sbc_pct" label="G&A SBC %" unit="%"
          min={0} max={100} step={1} defaultValue={D.sbc.ga_sbc_pct}
          hint="Senior finance/legal/people leaders earn substantial equity." />
        <DriverInput path="costs.sbc.cs_sbc_pct" label="CS SBC %" unit="%"
          min={0} max={80} step={1} defaultValue={D.sbc.cs_sbc_pct}
          hint="CS is the lowest equity tier." />
      </DrawerSection>

      <DrawerSection title="Depreciation & amortization">
        <DriverInput path="costs.da.monthly_da_amount" label="Monthly D&A" unit="$"
          min={0} max={2_000_000} step={50_000} defaultValue={D.da.monthly_da_amount}
          hint="V1 placeholder. V2 will derive D&A from a capex schedule and intangibles amortization." />
      </DrawerSection>

      <DrawerSection title="Cost allocation (segment splits)">
        <DriverInput path="costs.allocation.marketing_self_serve_pct" label="Marketing → self-serve" unit="%"
          min={0} max={100} step={1} defaultValue={D.allocation.marketing_self_serve_pct}
          hint="Default 70 / 30. Marketing serves both motions; PLG demand-gen tilts toward self-serve." />
        <DriverInput path="costs.allocation.rd_self_serve_pct" label="R&D → self-serve" unit="%"
          min={0} max={100} step={1} defaultValue={D.allocation.rd_self_serve_pct}
          hint="Default 60 / 40. Product platform serves both; consumer surface area carries more weight." />
        <div style={{
          fontSize: 10, color: 'var(--ink-4)', fontStyle: 'italic',
          padding: '6px 0',
        }}>
          Hosting, G&A, D&A, CS allocate pro rata to revenue (computed, not editable).
          Payment processing + AI inference are direct attribution by tier.
        </div>
      </DrawerSection>
    </AssumptionsDrawer>
  );
}
