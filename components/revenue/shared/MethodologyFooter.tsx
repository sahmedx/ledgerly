'use client';

import { useState } from 'react';
import MethodologyModal from './MethodologyModal';

export default function MethodologyFooter() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div style={{
        marginTop: 8,
        padding: '10px 16px',
        borderTop: '1px dashed var(--line-softer)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11,
        color: 'var(--ink-4)',
      }}>
        <span>Notion-style revenue forecast · 18-month horizon · client-side compute</span>
        <button
          onClick={() => setOpen(true)}
          style={{
            appearance: 'none',
            border: 0,
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--ink-3)',
            fontFamily: 'var(--font-architects-daughter), cursive',
            fontSize: 12,
            textDecoration: 'underline',
            textDecorationStyle: 'dashed',
            textUnderlineOffset: 2,
          }}
        >
          Methodology · 11 simplifying assumptions
        </button>
      </div>
      <MethodologyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
