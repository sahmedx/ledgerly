// Shared wireframe parts — header chrome, sidebar nav, sparklines, sticky notes

function WFShell({ title, subtitle, children, actions, t }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--paper)', display: 'flex', flexDirection: 'column', fontFamily: "'Architects Daughter', cursive" }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1.5px solid var(--line)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 14, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, border: '1.5px solid var(--line)', borderRadius: 4, display: 'grid', placeItems: 'center', fontFamily: "'Caveat', cursive", fontSize: 16, fontWeight: 700 }}>$</div>
          <span className="hand" style={{ fontSize: 20, fontWeight: 700 }}>Ledgerly</span>
          <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>FY26 Plan · Opex</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="sketch-box" style={{ padding: '3px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--accent-good)' }} />
            <span>Working draft</span>
            <span style={{ color: 'var(--ink-4)' }}>· v12</span>
          </div>
          <div className="btn">Share</div>
          <div className="btn btn-primary">Submit for review</div>
          <div style={{ width: 26, height: 26, border: '1.5px solid var(--line)', borderRadius: 13, display: 'grid', placeItems: 'center', fontSize: 12 }}>JL</div>
        </div>
      </div>

      {/* Page title + actions row */}
      {(title || actions) && (
        <div style={{ padding: '12px 18px 8px', display: 'flex', alignItems: 'flex-end', gap: 12, borderBottom: '1px solid var(--line-softer)' }}>
          <div>
            <div className="hand" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{subtitle}</div>}
          </div>
          <div style={{ flex: 1 }} />
          {actions}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>{children}</div>
    </div>
  );
}

function WFSidebar({ active = 'Vendors' }) {
  const items = [
    { label: 'Overview', icon: '◐' },
    { label: 'Vendors', icon: '▦' },
    { label: 'Headcount', icon: '◯' },
    { label: 'Revenue', icon: '◭' },
    { label: 'Scenarios', icon: '⌘' },
    { label: 'Actuals', icon: '⎚' },
    { label: 'Reports', icon: '⊟' },
  ];
  return (
    <div style={{ width: 160, borderRight: '1px solid var(--line-softer)', padding: '14px 8px', background: '#fcfbf7', flexShrink: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', padding: '4px 10px 8px' }}>Plan FY26</div>
      {items.map((it) => (
        <div key={it.label} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
          fontSize: 14, color: it.label === active ? 'var(--ink)' : 'var(--ink-3)',
          fontWeight: it.label === active ? 700 : 400,
          background: it.label === active ? '#fff4b8' : 'transparent',
          border: it.label === active ? '1.2px solid var(--line)' : '1.2px solid transparent',
          marginBottom: 2,
        }}>
          <span style={{ width: 14, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{it.icon}</span>
          <span>{it.label}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px dashed var(--line-soft)', margin: '14px 6px' }} />
      <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-4)', padding: '4px 10px 6px' }}>Views</div>
      {['By category', 'By owner', 'Renewals ≤ 90d', 'Over budget'].map((v) => (
        <div key={v} style={{ fontSize: 13, color: 'var(--ink-3)', padding: '4px 10px' }}>— {v}</div>
      ))}
    </div>
  );
}

// Sparkline (bars) — showActual styles actual months darker
function Sparkline({ series, width = 90, height = 18, highlightIdx = null }) {
  const max = Math.max(...series.map(s => s.value)) || 1;
  const bw = Math.max(2, (width - series.length) / series.length);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {series.map((s, i) => {
        const h = Math.max(1, (s.value / max) * (height - 2));
        const x = i * (bw + 1);
        const fill = i === highlightIdx ? 'var(--accent-warn)' : (s.isActual ? 'var(--ink)' : 'var(--ink-4)');
        return <rect key={i} x={x} y={height - h} width={bw} height={h} fill={fill} />;
      })}
    </svg>
  );
}

// A sparkline + forecast line (line style for v3)
function Sparkline2({ series, width = 240, height = 44 }) {
  const max = Math.max(...series.map(s => s.value)) || 1;
  const min = Math.min(...series.map(s => s.value));
  const pad = 2;
  const toXY = (v, i) => {
    const x = (i / (series.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2);
    return [x, y];
  };
  const path = series.map((s, i) => {
    const [x, y] = toXY(s.value, i);
    return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  // Actual part (solid) vs forecast (dashed). Find split.
  const splitIdx = series.findIndex(s => !s.isActual);
  const actualPath = series.slice(0, splitIdx + 1).map((s, i) => {
    const [x, y] = toXY(s.value, i);
    return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  const [sx, sy] = toXY(series[splitIdx].value, splitIdx);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={actualPath} stroke="var(--ink)" strokeWidth="1.5" fill="none" />
      <path d={path.replace(actualPath, '')} stroke="var(--ink-3)" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
      <line x1={sx} x2={sx} y1={0} y2={height} stroke="var(--line-soft)" strokeDasharray="1 2" />
      <circle cx={sx} cy={sy} r="2.5" fill="#fff" stroke="var(--ink)" strokeWidth="1.2" />
    </svg>
  );
}

// Post-it annotation conditional on tweak
function Annot({ t, children, ...rest }) {
  if (!t || !t.showAnnotations) return null;
  return <div className="note" style={rest}>{children}</div>;
}

function VarianceBadge({ variance }) {
  if (variance === 'over') return <span className="pill pill-warn">▲ over</span>;
  if (variance === 'good') return <span className="pill pill-good">▼ under</span>;
  return <span className="pill pill-neutral">◦ flat</span>;
}

// Tabs strip — used at the top of the grid-style wireframes
function TabsStrip({ tabs, active }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--line-softer)', padding: '0 18px' }}>
      {tabs.map(tb => (
        <div key={tb} style={{
          padding: '8px 14px', fontSize: 13,
          borderBottom: tb === active ? '2.5px solid var(--ink)' : '2.5px solid transparent',
          color: tb === active ? 'var(--ink)' : 'var(--ink-3)',
          fontWeight: tb === active ? 700 : 400,
        }}>{tb}</div>
      ))}
    </div>
  );
}

// Simple breadcrumb-ish filter chip bar
function FilterBar({ chips = [], right = null }) {
  return (
    <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, background: '#fcfbf7', borderBottom: '1px solid var(--line-softer)' }}>
      <div className="sketch-box" style={{ padding: '3px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--ink-4)' }}>🔍</span>
        <span style={{ color: 'var(--ink-4)' }}>Search vendors…</span>
      </div>
      {chips.map((c, i) => (
        <div key={i} style={{
          border: '1.2px solid var(--line-soft)', padding: '3px 8px', fontSize: 12,
          borderRadius: 3, background: c.active ? '#fff4b8' : '#fff',
          fontWeight: c.active ? 700 : 400,
        }}>{c.label}</div>
      ))}
      <div className="btn btn-ghost" style={{ fontSize: 12 }}>+ Add filter</div>
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}

Object.assign(window, { WFShell, WFSidebar, Sparkline, Sparkline2, Annot, VarianceBadge, TabsStrip, FilterBar });
