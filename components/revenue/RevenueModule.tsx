'use client';

import AppShell, { type ViewTab, type AppShellMeta } from '@/components/shell/AppShell';
import { type ModuleId } from '@/components/shell/Sidebar';
import { useRevenue } from '@/lib/revenue/contexts';
import { fmtMoneyScaled } from '@/lib/revenue/format';
import DashboardView from './views/DashboardView';
import SelfServeView from './views/SelfServeView';

const VIEWS: ViewTab[] = [
  { id: 'dashboard',  label: 'Dashboard',  sub: 'overview',    icon: '◐' },
  { id: 'self-serve', label: 'Self-Serve', sub: 'PLG',         icon: '◧' },
  { id: 'sales-led',  label: 'Sales-Led',  sub: 'pipeline',    icon: '⎯' },
  { id: 'unit-econ',  label: 'Unit Econ',  sub: 'CAC/LTV',     icon: '⊕' },
  { id: 'scenarios',  label: 'Scenarios',  sub: 'sensitivity', icon: '⌘' },
];

const VIEW_TITLES: Record<string, string> = {
  'dashboard':  'Revenue · FY26 + FY27 H1',
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
    subtitle: `Ending ARR ${fmtMoneyScaled(r.ending_arr, { precision: 1 })} · ${activeScenario} scenario`,
    actions: <><button className="btn">⤓ Export</button><button className="btn btn-primary">Commit plan</button></>,
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
      {activeView === 'dashboard'  && <DashboardView />}
      {activeView === 'self-serve' && <SelfServeView />}
      {activeView !== 'dashboard' && activeView !== 'self-serve' && <PlaceholderView name={VIEW_TITLES[activeView]} />}
    </AppShell>
  );
}

function PlaceholderView({ name }: { name: string }) {
  return (
    <div style={{ padding: 32 }}>
      <div className="sketch-box" style={{ padding: 24, maxWidth: 560 }}>
        <div className="hand" style={{ fontSize: 22 }}>{name}</div>
        <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-3)' }}>
          Coming in a later sub-phase. Dashboard available now — switch via the top tabs.
        </div>
      </div>
    </div>
  );
}
