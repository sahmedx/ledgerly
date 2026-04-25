'use client';

import { useEffect, useRef, useState } from 'react';
import { useRevenue } from '@/lib/revenue/contexts';

type Unit = '%' | '$' | 'count' | 'mo' | '×' | '';

interface Props {
  path: string;
  label: string;
  hint?: string;
  unit?: Unit;
  /** Display precision (decimals). Default: 2 for %, 0 for $, 3 for ×. */
  precision?: number;
  /** Slider min/max in DISPLAY units (e.g., 0..100 for %, not 0..1). */
  min: number;
  max: number;
  step?: number;
  /** When unit==='%', value is stored as 0..1 fraction; display 0..100. */
  defaultValue: number;
  /** Debounce ms before triggering recompute. Default 200. */
  debounceMs?: number;
}

const DEBOUNCE_MS = 200;

export default function DriverInput({
  path, label, hint, unit = '', precision, min, max, step, defaultValue, debounceMs = DEBOUNCE_MS,
}: Props) {
  const { assumptions, setAssumption } = useRevenue();
  const stored = readPath(assumptions, path) as number;

  const isPct = unit === '%';
  const toDisplay = (stored: number) => isPct ? stored * 100 : stored;
  const fromDisplay = (display: number) => isPct ? display / 100 : display;

  const [display, setDisplay] = useState<number>(toDisplay(stored));
  const lastStored = useRef(stored);

  // External changes (reset, scenario edit elsewhere) → resync
  useEffect(() => {
    if (stored !== lastStored.current) {
      lastStored.current = stored;
      setDisplay(toDisplay(stored));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored]);

  // Debounced upstream commit
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commit = (v: number) => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => {
      const next = fromDisplay(v);
      lastStored.current = next;
      setAssumption(path, next);
    }, debounceMs);
  };
  useEffect(() => () => { if (tRef.current) clearTimeout(tRef.current); }, []);

  const decs = precision ?? (unit === '%' ? 2 : unit === '×' ? 2 : unit === '$' ? 0 : 2);
  const sliderStep = step ?? Math.max((max - min) / 200, 0.001);
  const changed = Math.abs(stored - defaultValue) > 1e-9;

  const fmt = (v: number) => {
    const n = v.toFixed(decs);
    if (unit === '%') return `${n}%`;
    if (unit === '$') return `$${formatCommas(v, decs)}`;
    if (unit === '×') return `${n}×`;
    if (unit === 'mo') return `${Math.round(v)} mo`;
    if (unit === 'count') return formatCommas(v, 0);
    return n;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>{label}</span>
        <span className="num" style={{
          fontSize: 12,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--ink)',
          fontWeight: 600,
        }}>{fmt(display)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={sliderStep}
        value={display}
        onChange={(e) => {
          const v = Number(e.target.value);
          setDisplay(v);
          commit(v);
        }}
        style={{
          width: '100%',
          accentColor: 'var(--ink)',
          height: 18,
          margin: 0,
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 9,
        color: 'var(--ink-4)',
        marginTop: 1,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
      }}>
        <span>{fmt(min)}</span>
        <span style={{
          fontStyle: 'italic',
          textDecoration: changed ? 'line-through' : 'none',
        }}>
          default {fmt(toDisplay(defaultValue))}
        </span>
        <span>{fmt(max)}</span>
      </div>
      {hint && (
        <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2 }}>{hint}</div>
      )}
    </div>
  );
}

function readPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const k of path.split('.')) {
    if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[k];
    else return undefined;
  }
  return cur;
}

function formatCommas(v: number, decs: number): string {
  return v.toLocaleString('en-US', { minimumFractionDigits: decs, maximumFractionDigits: decs });
}
