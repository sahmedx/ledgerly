'use client';

import { useEffect, useRef, useState } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';
import type { PipelineDeal, SalesLedSegmentId } from '@/lib/revenue/types';
import { fmtMoneyScaled, fmtPlainPct } from '@/lib/revenue/format';

const STAGES: { id: PipelineDeal['stage']; label: string; bg: string; fg: string }[] = [
  { id: 'qualified', label: 'Qualified', bg: 'color-mix(in oklch, var(--accent-warn) 18%, white)', fg: 'var(--ink)' },
  { id: 'discovery', label: 'Discovery', bg: 'color-mix(in oklch, var(--accent-cool) 18%, white)', fg: 'var(--ink)' },
  { id: 'proposal',  label: 'Proposal',  bg: 'color-mix(in oklch, var(--accent-cool) 36%, white)', fg: 'var(--ink)' },
  { id: 'commit',    label: 'Commit',    bg: 'color-mix(in oklch, var(--accent-good) 40%, white)', fg: 'var(--ink)' },
];

const SEGMENTS: { id: SalesLedSegmentId; label: string }[] = [
  { id: 'business_large', label: 'Biz · large' },
  { id: 'enterprise',     label: 'Enterprise' },
];

const MONTH_LABELS = ['Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26'];

function genId(): string {
  return 'd' + Math.random().toString(36).slice(2, 8);
}

export default function PipelineTable() {
  const { assumptions, setAssumption } = useRevenue();
  const deals = assumptions.sales_led.named_pipeline;
  const stageProb = assumptions.sales_led.stage_probability;

  const writeAll = (next: PipelineDeal[]) => {
    setAssumption('sales_led.named_pipeline', next);
  };

  const updateDeal = (id: string, patch: Partial<PipelineDeal>) => {
    writeAll(deals.map(d => d.id === id ? { ...d, ...patch } : d));
  };

  const deleteDeal = (id: string) => {
    writeAll(deals.filter(d => d.id !== id));
  };

  const addDeal = () => {
    const next: PipelineDeal = {
      id: genId(),
      company: 'New deal',
      stage: 'qualified',
      acv: 250_000,
      expected_close_month: 1,
      segment: 'business_large',
    };
    writeAll([...deals, next]);
  };

  const totalWeighted = deals.reduce((s, d) => s + d.acv * stageProb[d.stage], 0);
  const totalAcv = deals.reduce((s, d) => s + d.acv, 0);

  return (
    <div className="sketch-box" style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div className="hand" style={{ fontSize: 18 }}>Named pipeline · months 1–6</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          {deals.length} deals · {fmtMoneyScaled(totalAcv)} ACV · {fmtMoneyScaled(totalWeighted)} weighted
        </div>
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        fontSize: 12,
      }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid var(--line)' }}>
            <Th style={{ textAlign: 'left', width: '26%' }}>Company</Th>
            <Th>Segment</Th>
            <Th>Stage</Th>
            <Th style={{ textAlign: 'right' }}>ACV</Th>
            <Th>Close</Th>
            <Th style={{ textAlign: 'right' }}>Prob.</Th>
            <Th style={{ textAlign: 'right' }}>Weighted</Th>
            <Th style={{ width: 28 }}></Th>
          </tr>
        </thead>
        <tbody>
          {deals.map((d, i) => (
            <Row
              key={d.id}
              deal={d}
              probability={stageProb[d.stage]}
              striped={i % 2 === 1}
              onUpdate={patch => updateDeal(d.id, patch)}
              onDelete={() => deleteDeal(d.id)}
            />
          ))}
        </tbody>
      </table>

      <button
        onClick={addDeal}
        className="btn"
        style={{ marginTop: 10, fontSize: 12 }}
      >
        + Add deal
      </button>
    </div>
  );
}

function Th({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <th style={{
      fontFamily: 'var(--font-architects-daughter), cursive',
      fontSize: 10,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: 'var(--ink-4)',
      fontWeight: 500,
      padding: '5px 6px',
      textAlign: 'left',
      ...style,
    }}>{children}</th>
  );
}

interface RowProps {
  deal: PipelineDeal;
  probability: number;
  striped: boolean;
  onUpdate: (patch: Partial<PipelineDeal>) => void;
  onDelete: () => void;
}

function Row({ deal, probability, striped, onUpdate, onDelete }: RowProps) {
  const weighted = deal.acv * probability;
  const stageMeta = STAGES.find(s => s.id === deal.stage)!;

  return (
    <tr style={{
      background: striped ? '#fcfbf7' : 'transparent',
      borderBottom: '1px solid var(--line-softer)',
    }}>
      <Td><CompanyCell value={deal.company} onSave={v => onUpdate({ company: v })} /></Td>
      <Td>
        <select
          value={deal.segment}
          onChange={e => onUpdate({ segment: e.target.value as SalesLedSegmentId })}
          style={selectStyle}
        >
          {SEGMENTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </Td>
      <Td>
        <select
          value={deal.stage}
          onChange={e => onUpdate({ stage: e.target.value as PipelineDeal['stage'] })}
          style={{
            ...selectStyle,
            background: stageMeta.bg,
            color: stageMeta.fg,
            fontWeight: 600,
          }}
        >
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </Td>
      <Td style={{ textAlign: 'right' }}>
        <AcvCell value={deal.acv} onSave={v => onUpdate({ acv: v })} />
      </Td>
      <Td>
        <select
          value={deal.expected_close_month}
          onChange={e => onUpdate({ expected_close_month: Number(e.target.value) })}
          style={selectStyle}
        >
          {MONTH_LABELS.map((label, i) => (
            <option key={i + 1} value={i + 1}>{label}</option>
          ))}
        </select>
      </Td>
      <Td style={{ textAlign: 'right', color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
        {fmtPlainPct(probability, 0)}
      </Td>
      <Td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {fmtMoneyScaled(weighted)}
      </Td>
      <Td>
        <button
          onClick={onDelete}
          title="Delete deal"
          style={{
            appearance: 'none',
            border: '1px solid transparent',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--ink-4)',
            fontSize: 14,
            padding: '0 6px',
            lineHeight: 1.2,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-warn)'; e.currentTarget.style.borderColor = 'var(--line-softer)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-4)'; e.currentTarget.style.borderColor = 'transparent'; }}
        >×</button>
      </Td>
    </tr>
  );
}

function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{
      padding: '4px 6px',
      verticalAlign: 'middle',
      ...style,
    }}>{children}</td>
  );
}

const selectStyle: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid var(--line-softer)',
  background: '#fff',
  padding: '3px 6px',
  fontFamily: 'var(--font-architects-daughter), cursive',
  fontSize: 11,
  cursor: 'pointer',
  color: 'var(--ink)',
  borderRadius: 0,
  width: '100%',
};

function CompanyCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    const v = draft.trim();
    if (v && v !== value) onSave(v);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        style={{
          width: '100%',
          border: '1px solid var(--ink-3)',
          background: '#fff',
          padding: '3px 5px',
          fontFamily: 'var(--font-architects-daughter), cursive',
          fontSize: 12,
          outline: 'none',
        }}
      />
    );
  }
  return (
    <div
      onClick={() => setEditing(true)}
      style={{
        cursor: 'text',
        padding: '3px 5px',
        fontFamily: 'var(--font-architects-daughter), cursive',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--ink)',
        border: '1px solid transparent',
      }}
    >{value}</div>
  );
}

function AcvCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const cleaned = draft.replace(/[^0-9.kmKM]/g, '');
    let n = parseFloat(cleaned);
    if (/[kK]$/.test(cleaned)) n = n * 1_000;
    if (/[mM]$/.test(cleaned)) n = n * 1_000_000;
    if (Number.isFinite(n) && n > 0 && Math.round(n) !== Math.round(value)) {
      onSave(Math.round(n));
    } else {
      setDraft(String(value));
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
        }}
        style={{
          width: '100%',
          border: '1px solid var(--ink-3)',
          background: '#fff',
          padding: '3px 5px',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          fontSize: 12,
          textAlign: 'right',
          outline: 'none',
        }}
      />
    );
  }
  return (
    <div
      onClick={() => setEditing(true)}
      title="Click to edit · type 250k or 1.5m"
      style={{
        cursor: 'text',
        padding: '3px 5px',
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        border: '1px solid transparent',
      }}
    >{fmtMoneyScaled(value)}</div>
  );
}
