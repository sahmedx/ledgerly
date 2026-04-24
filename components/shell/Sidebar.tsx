'use client';

interface Props {
  active?: string;
}

const NAV_ITEMS = [
  { label: 'Overview',   icon: '◐' },
  { label: 'Vendors',    icon: '▦' },
  { label: 'Headcount',  icon: '◯' },
  { label: 'Revenue',    icon: '◭' },
  { label: 'Scenarios',  icon: '⌘' },
  { label: 'Actuals',    icon: '⎚' },
  { label: 'Reports',    icon: '⊟' },
];

const QUICK_VIEWS = ['By category', 'By owner', 'Renewals ≤ 90d', 'Over budget'];

export default function Sidebar({ active = 'Vendors' }: Props) {
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

      {NAV_ITEMS.map((item) => {
        const isActive = item.label === active;
        return (
          <div key={item.label} style={{
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
          }}>
            <span style={{
              width: 14,
              textAlign: 'center',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </div>
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
        Views
      </div>

      {QUICK_VIEWS.map((v) => (
        <div key={v} style={{ fontSize: 13, color: 'var(--ink-3)', padding: '4px 10px' }}>
          — {v}
        </div>
      ))}
    </div>
  );
}
