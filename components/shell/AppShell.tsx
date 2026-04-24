'use client';

import Sidebar from './Sidebar';

type ViewId = 'grid' | 'vendor' | 'timeline' | 'variance';

interface Props {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  children: React.ReactNode;
}

const VIEWS: { id: ViewId; label: string; sub: string; icon: string }[] = [
  { id: 'grid',     label: 'Grid',     sub: 'edit',      icon: '▦' },
  { id: 'vendor',   label: 'Vendor',   sub: 'drill-in',  icon: '◧' },
  { id: 'timeline', label: 'Timeline', sub: 'scenarios', icon: '⎯' },
  { id: 'variance', label: 'Variance', sub: 'dashboard', icon: '◭' },
];

const VIEW_META: Record<ViewId, { title: string; subtitle: string; sidebarActive: string }> = {
  grid:     { title: 'Vendor Opex · FY26 + FY27 H1', subtitle: '25 vendors · $1.42M annualized',              sidebarActive: 'Vendors' },
  vendor:   { title: 'Vendors',                       subtitle: '$1.42M annualized · 25 active',               sidebarActive: 'Vendors' },
  timeline: { title: 'Forecast Canvas',               subtitle: 'Drag cards between scenarios · $1.42M base',  sidebarActive: 'Scenarios' },
  variance: { title: 'FY26 Variance',                 subtitle: "Apr '26 close · $11.4k over plan MTD",        sidebarActive: 'Overview' },
};

const VIEW_ACTIONS: Record<ViewId, React.ReactNode> = {
  grid:     <><button className="btn">⤓ Export</button><button className="btn">⚙ Columns</button><button className="btn btn-primary">+ Vendor</button></>,
  vendor:   <><button className="btn">⤓ Export</button><button className="btn btn-primary">+ Vendor</button></>,
  timeline: <><button className="btn">+ Scenario</button><button className="btn btn-primary">Commit plan</button></>,
  variance: <><button className="btn">⤓ Board pack</button><button className="btn btn-primary">Reforecast</button></>,
};

export default function AppShell({ activeView, onViewChange, children }: Props) {
  const meta = VIEW_META[activeView];

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      background: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        borderBottom: '1.5px solid var(--line)',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: '#fff',
        flexShrink: 0,
      }}>
        {/* Logo + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 22,
            height: 22,
            border: '1.5px solid var(--line)',
            borderRadius: 4,
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 16,
            fontWeight: 700,
          }}>$</div>
          <span className="hand" style={{ fontSize: 20, fontWeight: 700 }}>Ledgerly</span>
          <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>FY26 Plan · Opex</span>
        </div>

        {/* View switcher */}
        <div style={{
          marginLeft: 28,
          display: 'flex',
          gap: 4,
          border: '1.5px solid var(--line)',
          padding: 3,
          background: '#fcfbf7',
          boxShadow: '1px 1px 0 var(--line)',
        }}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => onViewChange(v.id)}
              style={{
                appearance: 'none',
                border: 0,
                cursor: 'pointer',
                padding: '5px 14px',
                background: activeView === v.id ? 'var(--ink)' : 'transparent',
                color: activeView === v.id ? 'var(--paper)' : 'var(--ink-2)',
                fontFamily: 'var(--font-architects-daughter), cursive',
                fontSize: 13,
                fontWeight: activeView === v.id ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 12, opacity: 0.7 }}>
                {v.icon}
              </span>
              <span>{v.label}</span>
              <span style={{ fontSize: 10, opacity: 0.55, fontWeight: 400 }}>· {v.sub}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Right actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="sketch-box" style={{ padding: '3px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent-good)' }} />
            <span>Working draft</span>
            <span style={{ color: 'var(--ink-4)' }}>· v12</span>
          </div>
          <button className="btn">Share</button>
          <button className="btn btn-primary">Submit for review</button>
          <div style={{
            width: 26,
            height: 26,
            border: '1.5px solid var(--line)',
            borderRadius: 13,
            display: 'grid',
            placeItems: 'center',
            fontSize: 12,
          }}>JL</div>
        </div>
      </div>

      {/* Page title row */}
      <div style={{
        padding: '12px 18px 8px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 12,
        borderBottom: '1px solid var(--line-softer)',
        flexShrink: 0,
      }}>
        <div>
          <div className="hand" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{meta.title}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{meta.subtitle}</div>
        </div>
        <div style={{ flex: 1 }} />
        {VIEW_ACTIONS[activeView]}
      </div>

      {/* Body: sidebar + content */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Sidebar active={meta.sidebarActive} />
        <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
