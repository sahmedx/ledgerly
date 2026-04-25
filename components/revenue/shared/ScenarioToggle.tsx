'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import type { ScenarioId } from '@/lib/revenue/types';

const PILLS: { id: ScenarioId; label: string }[] = [
  { id: 'downside', label: 'Downside' },
  { id: 'base',     label: 'Base' },
  { id: 'upside',   label: 'Upside' },
];

/**
 * Temp dev scenario toggle for Phase 5a — replaced by top-bar ScenarioToggle in 5c.
 */
export default function ScenarioToggle() {
  const { activeScenario, setActiveScenario } = useRevenue();
  return (
    <div style={{
      display: 'inline-flex',
      gap: 0,
      border: '1.5px dashed var(--line-soft)',
      padding: 3,
      background: '#fcfbf7',
    }}>
      {PILLS.map(p => {
        const active = p.id === activeScenario;
        return (
          <button
            key={p.id}
            onClick={() => setActiveScenario(p.id)}
            style={{
              appearance: 'none',
              border: 0,
              cursor: 'pointer',
              padding: '4px 12px',
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--paper)' : 'var(--ink-3)',
              fontFamily: 'var(--font-architects-daughter), cursive',
              fontSize: 12,
              fontWeight: active ? 700 : 400,
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
