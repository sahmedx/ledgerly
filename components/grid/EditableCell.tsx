'use client';

import { useState, useRef, useEffect } from 'react';
import { fmtMoney } from '@/lib/data';

interface Props {
  value: number;
  isOverride: boolean;
  isActual: boolean;
  isCurrent: boolean;
  variance: 'over' | 'good' | 'flat';
  varianceColor: boolean;
  onSave: (value: number) => void;
}

export default function EditableCell({
  value, isOverride, isActual, isCurrent, variance, varianceColor, onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const tintClass = !isActual && varianceColor
    ? (variance === 'over' ? 'cell-over' : variance === 'good' ? 'cell-under' : '')
    : '';

  const cellStyle: React.CSSProperties = {
    background: isCurrent ? '#fff4b8' : undefined,
    color: isActual ? 'var(--ink)' : 'var(--ink-2)',
    fontWeight: isActual ? 600 : 400,
    position: 'relative',
    padding: '4px 8px',
    textAlign: 'right',
    borderBottom: '1px solid var(--line-softer)',
    borderRight: '1px solid var(--line-softer)',
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 12,
    cursor: isActual ? 'default' : 'text',
  };

  const commit = () => {
    const n = parseFloat(draft.replace(/[^0-9.-]/g, ''));
    if (!isNaN(n)) onSave(Math.round(n));
    setEditing(false);
  };

  if (editing) {
    return (
      <td className={tintClass || ''} style={cellStyle}>
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 12,
            textAlign: 'right',
            outline: 'none',
            color: 'inherit',
          }}
        />
      </td>
    );
  }

  return (
    <td
      className={tintClass || ''}
      style={cellStyle}
      onClick={() => {
        if (isActual) return;
        setDraft(String(value));
        setEditing(true);
      }}
    >
      {fmtMoney(value, { compact: true })}
      {isOverride && (
        <span style={{ position: 'absolute', top: 2, left: 3, fontSize: 7, color: 'var(--ink-3)', lineHeight: 1 }}>
          ●
        </span>
      )}
    </td>
  );
}
