'use client';

import AppShell, { type ViewTab, type AppShellMeta } from '@/components/shell/AppShell';
import { type ModuleId } from '@/components/shell/Sidebar';
import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';
import DashboardView from './views/DashboardView';
import SelfServeView from './views/SelfServeView';
import SalesLedView from './views/SalesLedView';
import UnitEconView from './views/UnitEconView';
import ScenariosView from './views/ScenariosView';
import ScenarioToggle from './shared/ScenarioToggle';
import MethodologyFooter from './shared/MethodologyFooter';

const VIEWS: ViewTab[] = [
  { id: 'dashboard',  label: 'Dashboard',  sub: 'overview',    icon: '◐' },
  { id: 'self-serve', label: 'Self-Serve', sub: 'PLG',         icon: '◧' },
  { id: 'sales-led',  label: 'Sales-Led',  sub: 'pipeline',    icon: '⎯' },
  { id: 'unit-econ',  label: 'Unit Econ',  sub: 'CAC/LTV',     icon: '⊕' },
  { id: 'scenarios',  label: 'Scenarios',  sub: 'sensitivity', icon: '⌘' },
];

const VIEW_TITLES: Record<string, string> = {
  'dashboard':  'Revenue · FY26 plan + FY27 outlook',
  'self-serve': 'Self-Serve Engine',
  'sales-led':  'Sales-Led Engine',
  'unit-econ':  'Unit Economics',
  'scenarios':  'Scenarios & Sensitivity',
};

interface Props {
  module: ModuleId;
  onModuleChange: (m: ModuleId) => void;
  activeView: string;
  onViewChange: (v: string) => void;
}

export default function RevenueModule({ module, onModuleChange, activeView, onViewChange }: Props) {
  const { results, activeScenario } = useRevenue();
  const r = results[activeScenario];

  const meta: AppShellMeta = {
    breadcrumbSuffix: 'FY26 Plan · Revenue',
    title: VIEW_TITLES[activeView] ?? 'Revenue',
    subtitle: `FY26 ending ARR ${fmtMoneyScaled(r.annual[0].ending_arr, { precision: 1 })} · ${activeScenario} scenario`,
    actions: (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <ScenarioToggle />
        <button className="btn">⤓ Export</button>
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
          {activeView === 'dashboard'  && <DashboardView />}
          {activeView === 'self-serve' && <SelfServeView />}
          {activeView === 'sales-led'  && <SalesLedView />}
          {activeView === 'unit-econ'  && <UnitEconView />}
          {activeView === 'scenarios'  && <ScenariosView />}
        </div>
        <MethodologyFooter />
      </div>
    </AppShell>
  );
}
