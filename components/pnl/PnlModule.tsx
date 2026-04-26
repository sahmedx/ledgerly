'use client';

import AppShell, { type ViewTab, type AppShellMeta } from '@/components/shell/AppShell';
import { type ModuleId } from '@/components/shell/Sidebar';
import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled, fmtPlainPct } from '@/lib/revenue/format';
import ScenarioToggle from '@/components/revenue/shared/ScenarioToggle';
import MethodologyFooter from '@/components/revenue/shared/MethodologyFooter';
import { PnlProvider, usePnl } from './PnlContext';
import ConsolidatedView from './views/ConsolidatedView';
import PnlAssumptionsDrawer from './shared/PnlAssumptionsDrawer';

const VIEWS: ViewTab[] = [
  { id: 'consolidated', label: 'Consolidated', sub: 'company P&L', icon: '⊟' },
];

const VIEW_TITLES: Record<string, string> = {
  'consolidated': 'P&L · Consolidated',
};

interface Props {
  module: ModuleId;
  onModuleChange: (m: ModuleId) => void;
  activeView: string;
  onViewChange: (v: string) => void;
}

export default function PnlModule(props: Props) {
  return (
    <PnlProvider>
      <PnlInner {...props} />
    </PnlProvider>
  );
}

function PnlInner({ module, onModuleChange, activeView, onViewChange }: Props) {
  const { results, activeScenario } = useRevenue();
  const { setDrawerOpen } = usePnl();
  const r = results[activeScenario];

  // Headline subtitle: FY27 ending ARR + non-GAAP op margin
  const fy27 = r.annual[1];
  const subtitle = `FY27 ARR ${fmtMoneyScaled(fy27.ending_arr, { precision: 1 })} · Non-GAAP OM ${fmtPlainPct(fy27.operating_margin_non_gaap_pct, 1)} · ${activeScenario}`;

  const meta: AppShellMeta = {
    breadcrumbSuffix: 'FY26 + FY27 Plan · P&L',
    title: VIEW_TITLES[activeView] ?? 'P&L',
    subtitle,
    actions: (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ScenarioToggle />
        <button className="btn" onClick={() => setDrawerOpen(true)}>⚙ Assumptions</button>
        <button className="btn btn-primary">Commit plan</button>
      </div>
    ),
  };

  return (
    <AppShell
      module={module}
      onModuleChange={onModuleChange}
      activeView={activeView}
      onViewChange={onViewChange}
      views={VIEWS}
      meta={meta}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <div style={{ flex: 1 }}>
          {activeView === 'consolidated' && <ConsolidatedView />}
        </div>
        <MethodologyFooter />
      </div>
      <PnlAssumptionsDrawer />
    </AppShell>
  );
}
