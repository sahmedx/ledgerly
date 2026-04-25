'use client';

import { useEffect, useRef, useState } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';
import { DEFAULT_ASSUMPTIONS } from '@/lib/revenue/defaults';
import AssumptionsDrawer, { DrawerSection } from '@/components/shared/AssumptionsDrawer';
import DriverInput from '../shared/DriverInput';
import ConversionFunnel from '../self-serve/ConversionFunnel';
import CohortHeatmap from '../self-serve/CohortHeatmap';
import TierComposition from '../self-serve/TierComposition';
import UpgradeFlow from '../self-serve/UpgradeFlow';
import SeatExpansionChart from '../self-serve/SeatExpansionChart';

export default function SelfServeView() {
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

      <ConversionFunnel />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <TierComposition />
        <UpgradeFlow />
      </div>

      <SeatExpansionChart />

      <CohortHeatmap />

      <AssumptionsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Self-Serve assumptions"
        subtitle="Drivers update the model in real time (200ms debounce)"
        onReset={resetToDefaults}
      >
        <SelfServeDrivers />
      </AssumptionsDrawer>
    </div>
  );
}

function SelfServeDrivers() {
  const D = DEFAULT_ASSUMPTIONS.self_serve;

  return (
    <>
      <DrawerSection title="Funnel">
        <DriverInput
          path="self_serve.free_pool_monthly_growth"
          label="Free pool growth / mo"
          unit="%"
          min={0} max={5} step={0.05}
          defaultValue={D.free_pool_monthly_growth}
        />
        <DriverInput
          path="self_serve.free_to_paid_rate"
          label="Free → paid conversion / mo"
          unit="%"
          min={0} max={0.2} step={0.005} precision={3}
          defaultValue={D.free_to_paid_rate}
          hint="Notion's actual paid penetration is ~0.5% of free pool — small monthly rate"
        />
        <TierMixSlider defaultPlus={D.tier_mix_on_conversion.plus} />
      </DrawerSection>

      <DrawerSection title="Seat dynamics">
        <DriverInput
          path="self_serve.initial_seats_per_workspace.plus"
          label="Initial seats · Plus"
          unit="count"
          min={1} max={20} step={1}
          defaultValue={D.initial_seats_per_workspace.plus}
        />
        <DriverInput
          path="self_serve.initial_seats_per_workspace.business_small"
          label="Initial seats · Business"
          unit="count"
          min={1} max={50} step={1}
          defaultValue={D.initial_seats_per_workspace.business_small}
        />
        <DriverInput
          path="self_serve.monthly_seat_growth_rate.plus"
          label="Seat growth / mo · Plus"
          unit="%"
          min={0} max={5} step={0.05}
          defaultValue={D.monthly_seat_growth_rate.plus}
        />
        <DriverInput
          path="self_serve.monthly_seat_growth_rate.business_small"
          label="Seat growth / mo · Business"
          unit="%"
          min={0} max={5} step={0.05}
          defaultValue={D.monthly_seat_growth_rate.business_small}
        />
        <DriverInput
          path="self_serve.plus_to_business_upgrade_rate"
          label="Plus → Business upgrade / mo"
          unit="%"
          min={0} max={5} step={0.05}
          defaultValue={D.plus_to_business_upgrade_rate}
        />
        <DriverInput
          path="self_serve.graduation_seat_threshold"
          label="Graduation threshold (seats)"
          unit="count"
          min={20} max={200} step={5}
          defaultValue={D.graduation_seat_threshold}
        />
      </DrawerSection>

      <DrawerSection title="Retention curves">
        <DriverInput
          path="self_serve.retention.plus.floor"
          label="Plus retention floor"
          unit="%"
          min={20} max={90} step={1}
          defaultValue={D.retention.plus.floor}
        />
        <DriverInput
          path="self_serve.retention.plus.decay"
          label="Plus decay rate"
          unit=""
          min={0} max={0.6} step={0.01} precision={2}
          defaultValue={D.retention.plus.decay}
        />
        <DriverInput
          path="self_serve.retention.business_small.floor"
          label="Business retention floor"
          unit="%"
          min={40} max={95} step={1}
          defaultValue={D.retention.business_small.floor}
        />
        <DriverInput
          path="self_serve.retention.business_small.decay"
          label="Business decay rate"
          unit=""
          min={0} max={0.4} step={0.01} precision={2}
          defaultValue={D.retention.business_small.decay}
        />
      </DrawerSection>

      <DrawerSection title="Pricing & billing mix">
        <DriverInput
          path="self_serve.pricing.plus.annual"
          label="Plus seat / mo (annual plan)"
          unit="$"
          min={5} max={20} step={0.5}
          defaultValue={D.pricing.plus.annual}
        />
        <DriverInput
          path="self_serve.pricing.business_small.annual"
          label="Business seat / mo (annual plan)"
          unit="$"
          min={10} max={40} step={0.5}
          defaultValue={D.pricing.business_small.annual}
        />
        <DriverInput
          path="self_serve.annual_billing_mix.plus"
          label="Annual billing mix · Plus"
          unit="%"
          min={0} max={100} step={1}
          defaultValue={D.annual_billing_mix.plus}
        />
        <DriverInput
          path="self_serve.annual_billing_mix.business_small"
          label="Annual billing mix · Business"
          unit="%"
          min={0} max={100} step={1}
          defaultValue={D.annual_billing_mix.business_small}
        />
      </DrawerSection>
    </>
  );
}

function TierMixSlider({ defaultPlus }: { defaultPlus: number }) {
  const { assumptions, setAssumption } = useRevenue();
  const stored = assumptions.self_serve.tier_mix_on_conversion.plus;
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
      const plus = display / 100;
      lastStored.current = plus;
      setAssumption('self_serve.tier_mix_on_conversion.plus', plus);
      setAssumption('self_serve.tier_mix_on_conversion.business_small', 1 - plus);
    }, 200);
  };
  useEffect(() => () => { if (tRef.current) clearTimeout(tRef.current); }, []);

  const changed = Math.abs(stored - defaultPlus) > 1e-9;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>Tier mix on conversion</span>
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
        <span>Plus</span>
        <span style={{
          fontStyle: 'italic',
          textDecoration: changed ? 'line-through' : 'none',
        }}>
          default {(defaultPlus * 100).toFixed(0)}% / {((1 - defaultPlus) * 100).toFixed(0)}%
        </span>
        <span>Business</span>
      </div>
    </div>
  );
}
