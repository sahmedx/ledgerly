'use client';

import { usePnl } from '../PnlContext';

export default function ExpandToggle() {
  const { expandedQuarters, expandAll, collapseAll } = usePnl();
  const allExpanded = expandedQuarters.size === 8;
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
      <span style={{ color: 'var(--ink-3)' }}>Quarters:</span>
      <button
        className="btn"
        onClick={expandAll}
        disabled={allExpanded}
        style={{ fontSize: 11, padding: '2px 8px', opacity: allExpanded ? 0.5 : 1 }}
      >
        Expand all
      </button>
      <button
        className="btn"
        onClick={collapseAll}
        disabled={expandedQuarters.size === 0}
        style={{ fontSize: 11, padding: '2px 8px', opacity: expandedQuarters.size === 0 ? 0.5 : 1 }}
      >
        Collapse all
      </button>
      <span style={{ color: 'var(--ink-4)', fontSize: 11 }}>
        · click any quarter header to toggle
      </span>
    </div>
  );
}
