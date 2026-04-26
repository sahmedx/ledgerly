'use client';

import { useRevenue } from '@/lib/revenue/contexts';
import type { ScenarioId } from '@/lib/revenue/types';

const PILLS: { id: ScenarioId; label: string }[] = [
  { id: 'downside', label: 'Downside' },
  { id: 'base',     label: 'Base' },
  { id: 'upside',   label: 'Upside' },
];

export default function ScenarioToggle() {
  const { activeScenario, setActiveScenario } = useRevenue();
  return (
    <div style={{
      display: 'inline-flex',
      gap: 0,
      border: '1.5px solid var(--line)',
      padding: 2,
      background: '#fcfbf7',
      boxShadow: '1px 1px 0 var(--line)',
    }}>
      {PILLS.map(p => {
        const active = p.id === activeScenario;
        return (
          <button
            key={p.id}
            onClick={() => setActiveScenario(p.id)}
            title={`${p.label} scenario`}
            style={{
              appearance: 'none',
              border: 0,
              cursor: 'pointer',
              padding: '4px 12px',
              background: active
                ? (p.id === 'upside' ? 'var(--accent-good)'
                  : p.id === 'downside' ? 'var(--accent-warn)'
                  : 'var(--ink)')
                : 'transparent',
              color: active ? 'var(--paper)' : 'var(--ink-3)',
              fontFamily: 'var(--font-architects-daughter), cursive',
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              transition: 'background 120ms',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
