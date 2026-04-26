'use client';

export type ModuleId = 'expenses' | 'revenue' | 'pnl';

interface Props {
  activeModule: ModuleId;
  onModuleChange: (m: ModuleId) => void;
}

const MODULES: { id: ModuleId; label: string; icon: string }[] = [
  { id: 'expenses', label: 'Expenses', icon: '▦' },
  { id: 'revenue',  label: 'Revenue',  icon: '◭' },
  { id: 'pnl',      label: 'P&L',      icon: '⊟' },
];

const COMING_SOON = [
  { label: 'Headcount',  icon: '◯' },
  { label: 'Scenarios',  icon: '⌘' },
  { label: 'Reports',    icon: '⎚' },
];

export default function Sidebar({ activeModule, onModuleChange }: Props) {
  return (
    <div style={{
      width: 160,
      borderRight: '1px solid var(--line-softer)',
      padding: '14px 8px',
      background: '#fcfbf7',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-4)',
        padding: '4px 10px 8px',
      }}>
        Plan FY26
      </div>

      {MODULES.map((m) => {
        const isActive = m.id === activeModule;
        return (
          <button
            key={m.id}
            onClick={() => onModuleChange(m.id)}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              fontSize: 14,
              color: isActive ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: isActive ? 700 : 400,
              background: isActive ? '#fff4b8' : 'transparent',
              border: isActive ? '1.2px solid var(--line)' : '1.2px solid transparent',
              marginBottom: 2,
              fontFamily: 'var(--font-architects-daughter), cursive',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span style={{
              width: 14,
              textAlign: 'center',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}>
              {m.icon}
            </span>
            <span>{m.label}</span>
          </button>
        );
      })}

      <div style={{ borderTop: '1px dashed var(--line-soft)', margin: '14px 6px' }} />

      <div style={{
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-4)',
        padding: '4px 10px 6px',
      }}>
        Coming soon
      </div>

      {COMING_SOON.map((v) => (
        <div key={v.label} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px',
          fontSize: 13,
          color: 'var(--ink-4)',
          opacity: 0.6,
        }}>
          <span style={{
            width: 14,
            textAlign: 'center',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
          }}>
            {v.icon}
          </span>
          <span>{v.label}</span>
        </div>
      ))}
    </div>
  );
}
