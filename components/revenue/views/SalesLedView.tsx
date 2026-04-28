'use client';

import { useEffect, useRef, useState } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';
import { DEFAULT_ASSUMPTIONS } from '@/lib/revenue/defaults';
import AssumptionsDrawer, { DrawerSection } from '@/components/shared/AssumptionsDrawer';
import DriverInput from '../shared/DriverInput';
import PipelineTable from '../sales-led/PipelineTable';
import WeightedBookingsBar from '../sales-led/WeightedBookingsBar';
import CapacityChart from '../sales-led/CapacityChart';
import NewArrBySource from '../sales-led/NewArrBySource';
import ExistingDynamics from '../sales-led/ExistingDynamics';

export default function SalesLedView() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { resetToDefaults } = useRevenue();

  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn"
          onClick={() => setDrawerOpen(true)}
          style={{ fontSize: 12 }}
        >
          ⚙ Assumptions
        </button>
      </div>

      <PipelineTable />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <WeightedBookingsBar />
        <CapacityChart />
      </div>

      <NewArrBySource />
      <ExistingDynamics />

      <AssumptionsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Sales-Led assumptions"
        subtitle="Drivers update the model in real time (200ms debounce)"
        onReset={resetToDefaults}
      >
        <SalesLedDrivers />
      </AssumptionsDrawer>
    </div>
  );
}

function SalesLedDrivers() {
  const D = DEFAULT_ASSUMPTIONS.sales_led;

  return (
    <>
      <DrawerSection title="Segment economics">
        <DriverInput
          path="sales_led.avg_seats_per_logo.business_large"
          label="Avg seats · Biz large"
          unit="count"
          min={20} max={300} step={5}
          defaultValue={D.avg_seats_per_logo.business_large}
        />
        <DriverInput
          path="sales_led.avg_seats_per_logo.enterprise"
          label="Avg seats · Enterprise"
          unit="count"
          min={100} max={2000} step={25}
          defaultValue={D.avg_seats_per_logo.enterprise}
        />
        <DriverInput
          path="sales_led.blended_seat_price.business_large"
          label="Seat price / mo · Biz large"
          unit="$"
          min={10} max={40} step={0.5}
          defaultValue={D.blended_seat_price.business_large}
        />
        <DriverInput
          path="sales_led.blended_seat_price.enterprise"
          label="Seat price / mo · Enterprise"
          unit="$"
          min={15} max={50} step={0.5}
          defaultValue={D.blended_seat_price.enterprise}
        />
        <DriverInput
          path="sales_led.enterprise_avg_acv"
          label="Avg ACV · Enterprise"
          unit="$"
          min={50_000} max={500_000} step={5_000}
          defaultValue={D.enterprise_avg_acv}
        />
      </DrawerSection>

      <DrawerSection title="Pipeline & win rate">
        <DriverInput
          path="sales_led.win_rate"
          label="Capacity win rate"
          unit="%"
          min={10} max={60} step={1}
          defaultValue={D.win_rate}
        />
        <DriverInput
          path="sales_led.stage_probability.qualified"
          label="Stage prob · Qualified"
          unit="%"
          min={0} max={50} step={1}
          defaultValue={D.stage_probability.qualified}
        />
        <DriverInput
          path="sales_led.stage_probability.discovery"
          label="Stage prob · Discovery"
          unit="%"
          min={5} max={60} step={1}
          defaultValue={D.stage_probability.discovery}
        />
        <DriverInput
          path="sales_led.stage_probability.proposal"
          label="Stage prob · Proposal"
          unit="%"
          min={20} max={80} step={1}
          defaultValue={D.stage_probability.proposal}
        />
        <DriverInput
          path="sales_led.stage_probability.commit"
          label="Stage prob · Commit"
          unit="%"
          min={50} max={95} step={1}
          defaultValue={D.stage_probability.commit}
        />
        <SegmentSplitSlider defaultBl={D.capacity_segment_split.business_large} />
      </DrawerSection>

      <DrawerSection title="Sales capacity">
        <DriverInput
          path="sales_led.sales_capacity.fully_ramped_quota_annual"
          label="Fully-ramped quota / yr"
          unit="$"
          min={400_000} max={2_000_000} step={50_000}
          defaultValue={D.sales_capacity.fully_ramped_quota_annual}
        />
        <DriverInput
          path="sales_led.sales_capacity.attainment"
          label="Attainment"
          unit="%"
          min={40} max={120} step={1}
          defaultValue={D.sales_capacity.attainment}
        />
        <DriverInput
          path="sales_led.sales_capacity.monthly_attrition_rate"
          label="Monthly attrition"
          unit="%"
          min={0} max={5} step={0.1} precision={1}
          defaultValue={D.sales_capacity.monthly_attrition_rate}
        />
        <DriverInput
          path="sales_led.sales_capacity.replacement_lag_months"
          label="Replacement lag"
          unit="mo"
          min={0} max={6} step={1}
          defaultValue={D.sales_capacity.replacement_lag_months}
        />
      </DrawerSection>

      <DrawerSection title="CAC attribution">
        <DriverInput
          path="costs.sm.sl_marketing_attribution_pct"
          label="Marketing share → sales-led CAC"
          unit="%"
          min={0} max={100} step={1}
          defaultValue={0.30}
          hint="Default 30% — PLG-heavy: most marketing spend funds self-serve. Remainder flows to SS CAC."
        />
      </DrawerSection>

      <DrawerSection title="Existing dynamics · Biz large">
        <DriverInput
          path="sales_led.existing_customer_dynamics.business_large.gross_churn"
          label="Gross churn / mo"
          unit="%"
          min={0} max={3} step={0.05} precision={2}
          defaultValue={D.existing_customer_dynamics.business_large.gross_churn}
        />
        <DriverInput
          path="sales_led.existing_customer_dynamics.business_large.contraction"
          label="Contraction / mo"
          unit="%"
          min={0} max={3} step={0.05} precision={2}
          defaultValue={D.existing_customer_dynamics.business_large.contraction}
        />
        <DriverInput
          path="sales_led.existing_customer_dynamics.business_large.expansion"
          label="Expansion / mo"
          unit="%"
          min={0} max={5} step={0.05} precision={2}
          defaultValue={D.existing_customer_dynamics.business_large.expansion}
        />
      </DrawerSection>

      <DrawerSection title="Existing dynamics · Enterprise">
        <DriverInput
          path="sales_led.existing_customer_dynamics.enterprise.gross_churn"
          label="Gross churn / mo"
          unit="%"
          min={0} max={3} step={0.05} precision={2}
          defaultValue={D.existing_customer_dynamics.enterprise.gross_churn}
        />
        <DriverInput
          path="sales_led.existing_customer_dynamics.enterprise.contraction"
          label="Contraction / mo"
          unit="%"
          min={0} max={3} step={0.05} precision={2}
          defaultValue={D.existing_customer_dynamics.enterprise.contraction}
        />
        <DriverInput
          path="sales_led.existing_customer_dynamics.enterprise.expansion"
          label="Expansion / mo"
          unit="%"
          min={0} max={5} step={0.05} precision={2}
          defaultValue={D.existing_customer_dynamics.enterprise.expansion}
        />
      </DrawerSection>
    </>
  );
}

/** Coupled slider for capacity_segment_split (sum-to-1). */
function SegmentSplitSlider({ defaultBl }: { defaultBl: number }) {
  const { assumptions, setAssumption } = useRevenue();
  const stored = assumptions.sales_led.capacity_segment_split.business_large;
  const [pct, setPct] = useState(stored * 100);
  const lastStored = useRef(stored);

  useEffect(() => {
    if (Math.abs(stored - lastStored.current) > 1e-9) {
      lastStored.current = stored;
      setPct(stored * 100);
    }
  }, [stored]);

  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commit = (display: number) => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      const bl = display / 100;
      lastStored.current = bl;
      setAssumption('sales_led.capacity_segment_split.business_large', bl);
      setAssumption('sales_led.capacity_segment_split.enterprise', 1 - bl);
    }, 200);
  };
  useEffect(() => () => { if (tRef.current) clearTimeout(tRef.current); }, []);

  const changed = Math.abs(stored - defaultBl) > 1e-9;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>Capacity segment split</span>
        <span className="num" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {pct.toFixed(0)}% / {(100 - pct).toFixed(0)}%
        </span>
      </div>
      <input
        type="range"
        min={0} max={100} step={1}
        value={pct}
        onChange={(e) => { const v = Number(e.target.value); setPct(v); commit(v); }}
        style={{ width: '100%', accentColor: 'var(--ink)', height: 18, margin: 0 }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 9,
        color: 'var(--ink-4)',
        marginTop: 1,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
      }}>
        <span>Biz large</span>
        <span style={{ fontStyle: 'italic', textDecoration: changed ? 'line-through' : 'none' }}>
          default {(defaultBl * 100).toFixed(0)}% / {((1 - defaultBl) * 100).toFixed(0)}%
        </span>
        <span>Enterprise</span>
      </div>
    </div>
  );
}
