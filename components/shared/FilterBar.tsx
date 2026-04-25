'use client';

interface Chip {
  label: string;
  active: boolean;
}

interface Props {
  chips?: Chip[];
  right?: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function FilterBar({ chips = [], right, searchQuery = '', onSearchChange }: Props) {
  return (
    <div style={{
      padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8,
      background: '#fcfbf7', borderBottom: '1px solid var(--line-softer)', flexShrink: 0,
    }}>
      <div className="sketch-box" style={{ padding: '3px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--ink-4)' }}>🔍</span>
        <input
          type="text"
          placeholder="Search vendors…"
          value={searchQuery}
          onChange={e => onSearchChange?.(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-architects-daughter), cursive',
            fontSize: 12,
            color: 'var(--ink)',
            width: 140,
          }}
        />
      </div>
      {chips.map((c, i) => (
        <div key={i} style={{
          border: '1.2px solid var(--line-soft)', padding: '3px 8px', fontSize: 12,
          borderRadius: 3, background: c.active ? '#fff4b8' : '#fff',
          fontWeight: c.active ? 700 : 400,
        }}>
          {c.label}
        </div>
      ))}
      <div className="btn btn-ghost" style={{ fontSize: 12 }}>+ Add filter</div>
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}
