'use client';

import { useState } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';
import { DEFAULT_ASSUMPTIONS } from '@/lib/revenue/defaults';
import AssumptionsDrawer, { DrawerSection } from '@/components/shared/AssumptionsDrawer';
import DriverInput from '../shared/DriverInput';
import ScenarioSummaryColumns from '../scenarios/ScenarioSummaryColumns';
import SmallMultiplesArr from '../scenarios/SmallMultiplesArr';
import TornadoChart from '../scenarios/TornadoChart';

export default function ScenariosView() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { resetToDefaults } = useRevenue();

  return (
    <div style={{ padding: '16px 20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn"
          onClick={() => setDrawerOpen(true)}
          style={{ fontSize: 12 }}
        >
          ⚙ Scenario shocks
        </button>
      </div>

      <ScenarioSummaryColumns />
      <SmallMultiplesArr />
      <TornadoChart />

      <AssumptionsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Scenario shock multipliers"
        subtitle="Multipliers compound on base assumptions per spec §7"
        onReset={resetToDefaults}
      >
        <ShockDrivers scenario="upside" />
        <ShockDrivers scenario="downside" />
      </AssumptionsDrawer>
    </div>
  );
}

function ShockDrivers({ scenario }: { scenario: 'upside' | 'downside' }) {
  const D = DEFAULT_ASSUMPTIONS.scenarios[scenario];
  const labelTitle = scenario === 'upside' ? 'Upside multipliers' : 'Downside multipliers';
  return (
    <DrawerSection title={labelTitle}>
      <DriverInput path={`scenarios.${scenario}.free_pool_growth`}             label="Free pool growth"           unit="×" min={0.5} max={1.5} step={0.01} defaultValue={D.free_pool_growth} />
      <DriverInput path={`scenarios.${scenario}.free_to_paid_rate`}            label="Free → paid rate"           unit="×" min={0.5} max={1.5} step={0.01} defaultValue={D.free_to_paid_rate} />
      <DriverInput path={`scenarios.${scenario}.plus_to_business_upgrade_rate`} label="Plus → Business upgrade"   unit="×" min={0.5} max={1.5} step={0.01} defaultValue={D.plus_to_business_upgrade_rate} />
      <DriverInput path={`scenarios.${scenario}.attainment`}                   label="Rep attainment"             unit="×" min={0.5} max={1.5} step={0.01} defaultValue={D.attainment} />
      <DriverInput path={`scenarios.${scenario}.win_rate`}                     label="Win rate"                   unit="×" min={0.5} max={1.5} step={0.01} defaultValue={D.win_rate} />
      <DriverInput path={`scenarios.${scenario}.self_serve_churn`}             label="Self-serve churn"           unit="×" min={0.5} max={1.5} step={0.01} defaultValue={D.self_serve_churn} />
      <DriverInput path={`scenarios.${scenario}.sales_led_churn`}              label="Sales-led churn"            unit="×" min={0.5} max={1.5} step={0.01} defaultValue={D.sales_led_churn} />
      <DriverInput path={`scenarios.${scenario}.expansion_rate`}               label="Expansion rate"             unit="×" min={0.5} max={1.5} step={0.01} defaultValue={D.expansion_rate} />
    </DrawerSection>
  );
}
