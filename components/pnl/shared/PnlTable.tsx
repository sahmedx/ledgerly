'use client';

import type { LineItem } from '@/lib/revenue/pnl-line-items';
import { fmtPnlMoney, fmtPnlPct, fmtPnlCount, isNegativeProfit } from '@/lib/revenue/pnl-format';
import { usePnl } from '../PnlContext';
import type { Column } from './columns';

interface Props {
  columns: Column[];
  lines: LineItem[];
  /** Optional row title prefix (e.g. "Self-Serve" or "Sales-Led" for segment tables). */
  segmentLabel?: string;
}

const LINE_COL_WIDTH = 280;
const Q_WIDTH = 78;
const M_WIDTH = 60;
const A_WIDTH = 86;

function colWidth(col: Column): number {
  if (col.kind === 'quarter') return Q_WIDTH;
  if (col.kind === 'month') return M_WIDTH;
  return A_WIDTH;
}

function formatCell(line: LineItem, value: number | null): string {
  if (value === null) return '—';
  switch (line.kind) {
    case 'money': return fmtPnlMoney(value);
    case 'pct':   return fmtPnlPct(value);
    case 'count': return fmtPnlCount(value);
    case 'rule40': return value.toFixed(1);
    default: return '';
  }
}

function rowStyleFor(style: LineItem['style']): React.CSSProperties {
  switch (style) {
    case 'section':
      return {
        background: '#f4f1e8',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: '0.06em',
        color: 'var(--ink-2)',
      };
    case 'subtotal':
      return {
        fontWeight: 700,
        borderTop: '1px solid var(--line-soft)',
        background: '#fbf8ee',
      };
    case 'final':
      return {
        fontWeight: 700,
        borderTop: '1.5px solid var(--line)',
        borderBottom: '1px solid var(--line-soft)',
        fontSize: 13,
        background: '#fbf8ee',
      };
    case 'final-emph':
      return {
        fontWeight: 800,
        borderTop: '2px solid var(--line)',
        borderBottom: '2px solid var(--line)',
        fontSize: 14,
        background: '#fff4b8',
      };
    case 'addback':
      return {
        fontStyle: 'italic',
        fontSize: 11,
        color: 'var(--ink-3)',
      };
    case 'margin':
      return {
        fontStyle: 'italic',
        fontSize: 11,
        color: 'var(--ink-3)',
      };
    case 'kpi-section':
      return {
        background: '#f4f1e8',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: '0.06em',
        marginTop: 4,
        color: 'var(--ink-2)',
      };
    case 'kpi':
      return {
        fontSize: 12,
      };
    case 'sub':
    case 'subsub':
    default:
      return { fontSize: 12 };
  }
}

function isLabelOnly(line: LineItem): boolean {
  return line.kind === 'label-only';
}

export default function PnlTable({ columns, lines, segmentLabel }: Props) {
  const { expandedQuarters, toggleQuarter } = usePnl();

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--line-soft)', background: '#fff' }}>
      <table style={{
        borderCollapse: 'separate',
        borderSpacing: 0,
        fontFamily: 'var(--font-jetbrains-mono), monospace',
        width: 'max-content',
        minWidth: '100%',
      }}>
        <thead>
          <tr>
            <th style={{
              width: LINE_COL_WIDTH,
              minWidth: LINE_COL_WIDTH,
              position: 'sticky',
              left: 0,
              background: '#fff',
              borderBottom: '1.5px solid var(--line)',
              borderRight: '1.5px solid var(--line)',
              padding: '8px 10px',
              textAlign: 'left',
              fontFamily: 'var(--font-architects-daughter), cursive',
              fontSize: 12,
              fontWeight: 700,
              zIndex: 2,
            }}>
              {segmentLabel ?? 'Line item'}
            </th>
            {columns.map(col => {
              const isExpanded = col.qIndex !== undefined && expandedQuarters.has(col.qIndex);
              const headerBg = col.kind === 'annual'
                ? '#fbf6e0'
                : col.kind === 'month'
                  ? '#fbfaf3'
                  : isExpanded
                    ? '#fff4b8'
                    : '#fff';
              const onClick = col.qIndex !== undefined
                ? () => toggleQuarter(col.qIndex!)
                : undefined;
              const labelStyle: React.CSSProperties = {
                fontFamily: 'var(--font-architects-daughter), cursive',
                fontSize: col.kind === 'month' ? 10 : 12,
                fontStyle: col.kind === 'month' ? 'italic' : 'normal',
                fontWeight: col.kind === 'annual' ? 700 : 600,
              };
              return (
                <th
                  key={col.key}
                  style={{
                    width: colWidth(col),
                    minWidth: colWidth(col),
                    background: headerBg,
                    borderBottom: '1.5px solid var(--line)',
                    borderRight: '1px solid var(--line-softer)',
                    padding: '6px 6px',
                    textAlign: 'right',
                    cursor: onClick ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={onClick}
                  title={onClick ? (isExpanded ? 'Collapse quarter' : 'Expand quarter') : undefined}
                >
                  <div style={labelStyle}>
                    {col.label}
                    {col.qIndex !== undefined && (
                      <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--ink-4)' }}>
                        {isExpanded ? '−' : '+'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {lines.map(line => {
            const rowStyle = rowStyleFor(line.style);
            return (
              <tr key={line.id} style={rowStyle}>
                <td style={{
                  position: 'sticky',
                  left: 0,
                  background: rowStyle.background ?? '#fff',
                  borderRight: '1.5px solid var(--line)',
                  padding: `${line.style === 'section' || line.style === 'kpi-section' ? '6px' : '4px'} 10px 4px ${10 + line.indent * 12}px`,
                  whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-architects-daughter), cursive',
                  zIndex: 1,
                }}>
                  {line.label}
                </td>
                {columns.map(col => {
                  if (isLabelOnly(line)) {
                    return (
                      <td key={col.key} style={{
                        borderRight: '1px solid var(--line-softer)',
                        padding: '4px 6px',
                      }} />
                    );
                  }
                  const v = line.accessor ? line.accessor(col.period) : null;
                  const text = formatCell(line, v);
                  const isRedNeg = line.redIfNegative && isNegativeProfit(v);
                  const tooltip = line.formula
                    ? `${line.formula(col.period)}\nValue: ${v ?? '—'}`
                    : v != null ? `Value: ${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : undefined;
                  return (
                    <td
                      key={col.key}
                      title={tooltip}
                      style={{
                        borderRight: '1px solid var(--line-softer)',
                        padding: '4px 6px',
                        textAlign: 'right',
                        color: isRedNeg ? 'var(--accent-warn)' : undefined,
                        fontVariantNumeric: 'tabular-nums',
                        background: col.kind === 'annual'
                          ? 'color-mix(in oklch, #fbf6e0 50%, transparent)'
                          : undefined,
                      }}
                    >
                      {text}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
